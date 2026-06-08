import type { FuelType } from './taxData';

/**
 * Rough CO2 estimator (PLANNING AID ONLY).
 *
 * When a buyer doesn't have the exact combined-cycle CO2 from the vehicle's
 * COC, this gives a ballpark so the calculator isn't forced onto the punitive
 * 400 g/km legal default. The real COC figure should always win.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ★ YOUR TURN — this is a genuine modelling decision, not boilerplate.     │
 * │                                                                           │
 * │  There are several defensible approaches:                                 │
 * │    (a) regression on engine displacement (what's drafted below),          │
 * │    (b) a lookup by body segment (city / compact / SUV / luxury),          │
 * │    (c) a power-based model (kW → CO2),                                     │
 * │    (d) a blend of the above.                                              │
 * │                                                                           │
 * │  The constants below are deliberately conservative first guesses. Tune    │
 * │  them against cars you actually know (your own, or listings you trust),   │
 * │  and decide how the fuel multipliers should behave. Your call shapes      │
 * │  how optimistic vs. cautious the "estimate" button feels to users.        │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Returns a WLTP-style combined figure in g/km.
 */
export function estimateCo2FromSpecs(specs: {
  fuel: FuelType;
  /** engine displacement in litres, e.g. 1.6 */
  displacementL: number;
  /** optional engine power in kW */
  powerKw?: number;
}): number {
  const { fuel, displacementL, powerKw } = specs;

  if (fuel === 'electric') return 0;

  // Baseline: a ~1.0 L car emits ~110 g/km; each extra litre adds ~45 g/km.
  let co2 = 110 + Math.max(0, displacementL - 1.0) * 45;

  // Nudge upward for high specific output (a powerful small engine works harder).
  if (powerKw && displacementL > 0) {
    const kwPerLitre = powerKw / displacementL;
    if (kwPerLitre > 75) co2 += (kwPerLitre - 75) * 0.6;
  }

  // Fuel multipliers — your tuning knobs.
  const fuelFactor: Record<FuelType, number> = {
    petrol: 1.0,
    lpg: 0.93, // LPG burns a little cleaner per km
    cng: 0.85,
    diesel: 0.88, // diesels emit less CO2 per km than equivalent petrols
    hybrid: 0.62, // electric assist cuts tailpipe CO2 substantially
    electric: 0,
  };
  co2 *= fuelFactor[fuel];

  // Keep within sane physical bounds.
  return Math.round(Math.min(400, Math.max(0, co2)));
}
