import type { CalcInput } from './calc';
import { num } from './format';
import { DUTY_PRESETS, type Co2Standard, type FuelType } from './taxData';

export interface FormState {
  country: string;
  vehiclePrice: string;
  fuel: FuelType;
  co2: string;
  co2Unknown: boolean;
  co2Standard: Co2Standard;
  year: string;
  dutyPresetId: string;
  customDutyPct: string;
  fx: string;
  // transport / logistics
  shipping: string;
  shippingTaxable: boolean;
  domestic: string;
  registration: string;
  broker: string;
  other: string;
  // estimator helper inputs
  displacement: string;
  powerKw: string;
}

export const CURRENT_YEAR = 2026;

export const defaultForm: FormState = {
  country: 'Germany',
  vehiclePrice: '14000',
  fuel: 'petrol',
  co2: '128',
  co2Unknown: false,
  co2Standard: 'WLTP',
  year: '2019',
  dutyPresetId: 'eu_eur1',
  customDutyPct: '5',
  fx: '61.5',
  shipping: '700',
  shippingTaxable: true,
  domestic: '0',
  registration: '120',
  broker: '150',
  other: '0',
  displacement: '1.5',
  powerKw: '110',
};

export function dutyRateOf(form: FormState): number {
  if (form.dutyPresetId === 'custom') return num(form.customDutyPct) / 100;
  const p = DUTY_PRESETS.find((d) => d.id === form.dutyPresetId);
  return p ? p.rate : 0.05;
}

export function vehicleAge(form: FormState): number {
  const y = num(form.year);
  if (!y) return 0;
  return Math.max(0, CURRENT_YEAR - y);
}

export function toCalcInput(form: FormState): CalcInput {
  return {
    vehiclePriceEur: num(form.vehiclePrice),
    shippingToBorderEur: num(form.shipping),
    shippingIsTaxable: form.shippingTaxable,
    dutyRate: dutyRateOf(form),
    fuel: form.fuel,
    co2Standard: form.co2Standard,
    co2Gkm: form.co2Unknown ? null : num(form.co2),
    vehicleAgeYears: vehicleAge(form),
    fxMkdPerEur: num(form.fx) || 61.5,
    domesticTransportEur: num(form.domestic),
    registrationEur: num(form.registration),
    brokerEur: num(form.broker),
    otherLogisticsEur: num(form.other),
  };
}
