import { describe, expect, it } from 'vitest';
import { calculate, pickCo2Coefficient, pickValuePct, type CalcInput } from './calc';

const base: CalcInput = {
  vehiclePriceEur: 12000,
  shippingToBorderEur: 0,
  shippingIsTaxable: true,
  dutyRate: 0.01,
  fuel: 'petrol',
  co2Standard: 'WLTP',
  co2Gkm: 130,
  vehicleAgeYears: 5,
  fxMkdPerEur: 61.5,
  domesticTransportEur: 0,
  registrationEur: 0,
  brokerEur: 0,
  otherLogisticsEur: 0,
};

describe('Table 1 — value % bracket lookup (upper-inclusive)', () => {
  it('is 0% up to and including €10,000', () => {
    expect(pickValuePct(0)).toBe(0);
    expect(pickValuePct(10000)).toBe(0);
  });
  it('steps to 1% just above €10,000', () => {
    expect(pickValuePct(10000.01)).toBe(1);
    expect(pickValuePct(12000)).toBe(1);
  });
  it('tops out at 20% above €50,000', () => {
    expect(pickValuePct(50000)).toBe(19);
    expect(pickValuePct(50000.01)).toBe(20);
    expect(pickValuePct(120000)).toBe(20);
  });
});

describe('Table 2 — CO2 coefficient (2023 amendment, WLTP vs NEDC)', () => {
  it('uses different thresholds for WLTP vs NEDC at the same g/km', () => {
    // 130 g/km: WLTP falls in the 124–135 band (60), NEDC in the 111–130 band (75)
    expect(pickCo2Coefficient(130, 'WLTP', 'petrol')).toBe(60);
    expect(pickCo2Coefficient(130, 'NEDC', 'petrol')).toBe(75);
  });
  it('charges diesel roughly double petrol', () => {
    expect(pickCo2Coefficient(200, 'NEDC', 'petrol')).toBe(495);
    expect(pickCo2Coefficient(200, 'NEDC', 'diesel')).toBe(605);
  });
  it('is 0 for ≤1 g/km and maxes out at the top band', () => {
    expect(pickCo2Coefficient(1, 'WLTP', 'petrol')).toBe(0);
    expect(pickCo2Coefficient(400, 'NEDC', 'diesel')).toBe(880);
    expect(pickCo2Coefficient(300, 'WLTP', 'petrol')).toBe(695);
  });
});

describe('Full cascade — petrol Golf from the EU (EUR.1)', () => {
  const r = calculate({ ...base, shippingToBorderEur: 800 });
  it('builds the customs value from price + taxable shipping', () => {
    expect(r.customsValueEur).toBe(12800);
  });
  it('applies 1% duty', () => {
    expect(r.dutyEur).toBe(128);
  });
  it('uses ВМВ = customs value + duty for the value component', () => {
    expect(r.vmvEur).toBe(12928);
    expect(r.valuePct).toBe(2); // 12,928 → 12k–14k band
    expect(r.dmvValueComponentEur).toBeCloseTo(258.56, 2);
  });
  it('computes the CO2 component from the denari coefficient', () => {
    expect(r.co2Coefficient).toBe(60); // 130 WLTP petrol
    expect(r.dmvCo2ComponentEur).toBeCloseTo(126.83, 2); // 130*60/61.5
  });
  it('charges 18% VAT on (customs value + duty + ДМВ)', () => {
    expect(r.dmvEur).toBeCloseTo(385.39, 2);
    expect(r.vatBaseEur).toBeCloseTo(13313.39, 2);
    expect(r.vatEur).toBeCloseTo(2396.41, 1);
  });
  it('separates taxes, logistics and grand total', () => {
    expect(r.taxesTotalEur).toBeCloseTo(2909.8, 1);
    expect(r.logisticsTotalEur).toBe(800);
    expect(r.grandTotalEur).toBeCloseTo(15709.8, 1);
  });
});

describe('Electric vehicles are ДМВ-exempt (but still pay duty + VAT)', () => {
  const r = calculate({
    ...base,
    vehiclePriceEur: 30000,
    fuel: 'electric',
    co2Gkm: 0,
  });
  it('zeroes the motor-vehicle tax', () => {
    expect(r.dmvExemption).toBe('electric');
    expect(r.dmvEur).toBe(0);
  });
  it('still charges duty and VAT', () => {
    expect(r.dutyEur).toBe(300);
    expect(r.vatEur).toBeCloseTo(5454, 0);
    expect(r.taxesTotalEur).toBeCloseTo(5754, 0);
  });
});

describe('Oldtimers (35+ years) are ДМВ-exempt', () => {
  const r = calculate({ ...base, vehicleAgeYears: 40 });
  it('zeroes ДМВ via the oldtimer rule', () => {
    expect(r.dmvExemption).toBe('oldtimer');
    expect(r.dmvEur).toBe(0);
  });
});

describe('Unknown CO2 falls back to the punitive 400 g/km', () => {
  const r = calculate({ ...base, co2Gkm: null });
  it('flags the assumption and uses 400 g/km', () => {
    expect(r.co2WasAssumed).toBe(true);
    expect(r.effectiveCo2).toBe(400);
    expect(r.co2Coefficient).toBe(695); // 400 WLTP petrol → top band
  });
});

describe('High-CO2 diesel from outside the EU (5% duty)', () => {
  const r = calculate({
    ...base,
    vehiclePriceEur: 20000,
    dutyRate: 0.05,
    fuel: 'diesel',
    co2Standard: 'NEDC',
    co2Gkm: 200,
  });
  it('stacks duty, a large ДМВ and VAT', () => {
    expect(r.dutyEur).toBe(1000);
    expect(r.valuePct).toBe(10); // ВМВ 21,000
    expect(r.co2Coefficient).toBe(605);
    expect(r.dmvEur).toBeCloseTo(4067.48, 1);
    expect(r.taxesTotalEur).toBeCloseTo(9579.63, 0);
  });
});
