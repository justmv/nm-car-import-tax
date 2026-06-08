/**
 * North Macedonia car-import tax engine.
 *
 * The calculation is a CASCADE — each layer's base includes the layers under it:
 *
 *   1. Customs value (CIF) = vehicle price + freight/insurance to the NM border
 *   2. Customs duty        = customs value x duty rate            (5% / 1% EU)
 *   3. ВМВ (ДМВ base)      = customs value + customs duty         (law, чл.9 ст.1)
 *   4. ДМВ (excise)        = (ВМВ x пВВ) x FX  +  CO2 x кCO2      (Уредба 277/19 + 220/23)
 *   5. VAT base            = customs value + customs duty + ДМВ
 *   6. VAT (ДДВ 18%)       = VAT base x 0.18
 *
 * Transport/logistics that are NOT part of the customs value (domestic delivery,
 * registration, broker, etc.) are tracked separately and never taxed.
 *
 * All amounts are computed in EUR; the CO2 component is defined by law in denari
 * (MKD) and converted to EUR via the NBRM rate so everything is comparable.
 */

import {
  CO2_BRACKETS,
  DEFAULT_FX_MKD_PER_EUR,
  OLDTIMER_MIN_AGE_YEARS,
  UNKNOWN_CO2_GKM,
  VALUE_BRACKETS,
  VAT_RATE,
  type Co2Standard,
  type FuelType,
} from './taxData';

export interface CalcInput {
  /** Vehicle purchase / customs base price, EUR. */
  vehiclePriceEur: number;
  /** Freight + insurance to the NM border, EUR. */
  shippingToBorderEur: number;
  /** If true, shipping-to-border is added to the customs value (legally correct). */
  shippingIsTaxable: boolean;
  /** Customs duty rate as a fraction, e.g. 0.01, 0.05, or a custom value. */
  dutyRate: number;
  fuel: FuelType;
  co2Standard: Co2Standard;
  /** Combined CO2 in g/km, or null if unknown (→ legal 400 g/km assumption). */
  co2Gkm: number | null;
  /** Age of the vehicle in years (drives the oldtimer exemption). */
  vehicleAgeYears: number;
  /** NBRM mid-rate, MKD per EUR. */
  fxMkdPerEur: number;
  // ---- non-taxed logistics (shown separately in the UI) ----
  domesticTransportEur: number;
  registrationEur: number;
  brokerEur: number;
  otherLogisticsEur: number;
}

export type DmvExemption = 'none' | 'electric' | 'oldtimer';

export interface CalcResult {
  customsValueEur: number;
  dutyEur: number;
  /** ВМВ — the ДМВ value base (customs value + duty), EUR. */
  vmvEur: number;
  valuePct: number;
  dmvValueComponentEur: number;
  co2Coefficient: number;
  dmvCo2ComponentEur: number;
  dmvEur: number;
  vatBaseEur: number;
  vatEur: number;
  /** Sum of all state charges: duty + ДМВ + VAT. */
  taxesTotalEur: number;
  /** Sum of all transport/logistics costs (incl. shipping-to-border). */
  logisticsTotalEur: number;
  /** vehicle price + taxes + logistics. */
  grandTotalEur: number;
  // diagnostics
  effectiveCo2: number;
  co2WasAssumed: boolean;
  dmvExemption: DmvExemption;
  fxMkdPerEur: number;
}

/** Table 1 lookup: pick the value-component % for a given ВМВ (EUR). */
export function pickValuePct(vmvEur: number): number {
  for (const b of VALUE_BRACKETS) {
    if (b.upTo === null || vmvEur <= b.upTo) return b.pct;
  }
  return VALUE_BRACKETS[VALUE_BRACKETS.length - 1].pct;
}

/** Table 2 lookup: pick the кCO2 coefficient (den/g) for CO2, method and fuel. */
export function pickCo2Coefficient(
  co2Gkm: number,
  standard: Co2Standard,
  fuel: FuelType,
): number {
  // The law has two columns: "Бензин, ТНГ, КПГ" (incl. petrol-hybrids) and "Дизел".
  const useDieselColumn = fuel === 'diesel';
  for (const b of CO2_BRACKETS) {
    const upper = standard === 'WLTP' ? b.wltpUpTo : b.nedcUpTo;
    if (upper === null || co2Gkm <= upper) {
      return useDieselColumn ? b.diesel : b.petrol;
    }
  }
  const last = CO2_BRACKETS[CO2_BRACKETS.length - 1];
  return useDieselColumn ? last.diesel : last.petrol;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculate(input: CalcInput): CalcResult {
  const fx = input.fxMkdPerEur > 0 ? input.fxMkdPerEur : DEFAULT_FX_MKD_PER_EUR;

  // 1. Customs value (CIF at the NM border)
  const customsValueEur =
    input.vehiclePriceEur + (input.shippingIsTaxable ? input.shippingToBorderEur : 0);

  // 2. Customs duty
  const dutyEur = customsValueEur * input.dutyRate;

  // 3. ВМВ — the ДМВ value base
  const vmvEur = customsValueEur + dutyEur;

  // 4. ДМВ (motor vehicle tax) — value component + CO2 component
  const isElectric = input.fuel === 'electric';
  const isOldtimer = input.vehicleAgeYears >= OLDTIMER_MIN_AGE_YEARS;
  const dmvExemption: DmvExemption = isElectric
    ? 'electric'
    : isOldtimer
      ? 'oldtimer'
      : 'none';

  const effectiveCo2 = input.co2Gkm ?? UNKNOWN_CO2_GKM;
  const co2WasAssumed = input.co2Gkm == null;

  const valuePct = pickValuePct(vmvEur);
  let dmvValueComponentEur = 0;
  let co2Coefficient = 0;
  let dmvCo2ComponentEur = 0;
  let dmvEur = 0;

  if (dmvExemption === 'none') {
    dmvValueComponentEur = vmvEur * (valuePct / 100);
    co2Coefficient = pickCo2Coefficient(effectiveCo2, input.co2Standard, input.fuel);
    // CO2 component is defined in denari: CO2(g/km) x coefficient(den per g). → EUR
    dmvCo2ComponentEur = (effectiveCo2 * co2Coefficient) / fx;
    dmvEur = dmvValueComponentEur + dmvCo2ComponentEur;
  }

  // 5 & 6. VAT
  const vatBaseEur = customsValueEur + dutyEur + dmvEur;
  const vatEur = vatBaseEur * VAT_RATE;

  // Totals
  const taxesTotalEur = dutyEur + dmvEur + vatEur;
  const logisticsTotalEur =
    input.shippingToBorderEur +
    input.domesticTransportEur +
    input.registrationEur +
    input.brokerEur +
    input.otherLogisticsEur;
  const grandTotalEur = input.vehiclePriceEur + taxesTotalEur + logisticsTotalEur;

  return {
    customsValueEur: round2(customsValueEur),
    dutyEur: round2(dutyEur),
    vmvEur: round2(vmvEur),
    valuePct,
    dmvValueComponentEur: round2(dmvValueComponentEur),
    co2Coefficient,
    dmvCo2ComponentEur: round2(dmvCo2ComponentEur),
    dmvEur: round2(dmvEur),
    vatBaseEur: round2(vatBaseEur),
    vatEur: round2(vatEur),
    taxesTotalEur: round2(taxesTotalEur),
    logisticsTotalEur: round2(logisticsTotalEur),
    grandTotalEur: round2(grandTotalEur),
    effectiveCo2,
    co2WasAssumed,
    dmvExemption,
    fxMkdPerEur: fx,
  };
}
