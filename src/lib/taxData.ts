/**
 * North Macedonia — car import tax data (single source of truth).
 *
 * Every number below is transcribed from primary legislation. When the law
 * changes, edit ONLY this file.
 *
 * SOURCES (Службен весник на РСМ = Official Gazette of N. Macedonia):
 *  - Закон за данок на моторни возила (Law on Motor Vehicle Tax) — бр. 261/19
 *  - Уредба за начинот на пресметка на ДМВ (Regulation on calculation) — бр. 277/19
 *  - Уредба за изменување (Amendment that REPLACED Table 2) — бр. 220 / 19.10.2023
 *  - Закон за изменување (cosmetic ministry rename only) — бр. 3 / 03.01.2025
 *  - Customs Administration "Увоз на возила": duty 5% (1% with EUR.1 from EU); VAT 18%.
 *
 * Last verified against primary sources: June 2026.
 */

export type FuelType =
  | 'petrol' // бензин
  | 'diesel' // дизел
  | 'lpg' // ТНГ
  | 'cng' // КПГ
  | 'hybrid' // хибрид (petrol-electric) — taxed via the petrol CO2 column
  | 'electric'; // електричен — ДМВ-exempt

/** CO2 figure measurement method. Modern EU cars (post ~2018) quote WLTP. */
export type Co2Standard = 'WLTP' | 'NEDC';

export const VAT_RATE = 0.18; // ДДВ — applied to (customs value + duty + ДМВ)

/**
 * NBRM mid-rate (СКД). The denar is in a de-facto peg to the euro; the central
 * parity has sat at ~61.5 MKD/EUR for years. Editable in the UI.
 */
export const DEFAULT_FX_MKD_PER_EUR = 61.5;

/**
 * Legal fallback: if average CO2 cannot be proven from documents (COC etc.),
 * customs ASSUMES this value for the ДМВ calculation. It is deliberately
 * punitive — always prefer the real COC figure.
 * (Pojasnuvanje, "ПОТРЕБНА ДОКУМЕНТАЦИЈА...": "...се смета дека износот на
 *  емисија на CO2 ќе изнесува 400 гр./км.")
 */
export const UNKNOWN_CO2_GKM = 400;

/** Vehicles 35+ years old (oldtimers) are ДМВ-exempt (член 17). */
export const OLDTIMER_MIN_AGE_YEARS = 35;

// ---------------------------------------------------------------------------
// Customs duty (царина)
// ---------------------------------------------------------------------------
export interface DutyPreset {
  id: string;
  label: string;
  rate: number;
  note: string;
}

export const DUTY_PRESETS: DutyPreset[] = [
  {
    id: 'eu_eur1',
    label: 'Потекло од ЕУ + EUR.1 / изјава на фактура',
    rate: 0.01,
    note: 'Возила со потекло од ЕУ што имаат сертификат EUR.1 или изјава за потекло на фактурата плаќаат намалена царина од 1% (Царинска управа).',
  },
  {
    id: 'mfn',
    label: 'Без преференцијално потекло (стандардна стапка)',
    rate: 0.05,
    note: 'Стандардната царина на патнички возила е 5% од царинската вредност кога не важи преференција (пр. возило од ЕУ без EUR.1 или повеќето неевропски потекла).',
  },
  {
    id: 'cefta',
    label: 'ЦЕФТА / ЕФТА / Турција / Украина (квалификувано потекло)',
    rate: 0.0,
    note: 'Индустриски производи што навистина потекнуваат од овие партнери може да бидат ослободени од царина со доказ за потекло — но повеќето половни возила не се сметаат за „со потекло“. Потврдете кај вашиот шпедитер.',
  },
  {
    id: 'custom',
    label: 'Сопствена стапка',
    rate: 0.05,
    note: 'Внесете ја точната царинска стапка потврдена од вашиот царински посредник.',
  },
];

// ---------------------------------------------------------------------------
// Table 1 — value component percentage (пВВ)
// Уредба бр. 277/19, Табела 1. Brackets are on ВМВ = customs value + duty (EUR).
// Boundaries are upper-inclusive: row "над 10.000 до 12.000" => 10000 < v <= 12000.
// ---------------------------------------------------------------------------
export interface ValueBracket {
  /** upper bound in EUR, inclusive; null = no upper bound (top bracket) */
  upTo: number | null;
  /** percentage of ВМВ (e.g. 4 = 4%) */
  pct: number;
}

export const VALUE_BRACKETS: ValueBracket[] = [
  { upTo: 10000, pct: 0 },
  { upTo: 12000, pct: 1 },
  { upTo: 14000, pct: 2 },
  { upTo: 16000, pct: 4 },
  { upTo: 18000, pct: 6 },
  { upTo: 20000, pct: 8 },
  { upTo: 23000, pct: 10 },
  { upTo: 26000, pct: 12 },
  { upTo: 29000, pct: 14 },
  { upTo: 32000, pct: 16 },
  { upTo: 35000, pct: 17 },
  { upTo: 40000, pct: 18 },
  { upTo: 50000, pct: 19 },
  { upTo: null, pct: 20 },
];

// ---------------------------------------------------------------------------
// Table 2 — CO2 specific coefficient (кCO2), in denari per (gram CO2/km).
// REPLACED in full by Уредба бр. 220 / 19.10.2023.
//
// IMPORTANT: the 2023 amendment ALSO deleted the old +25%/+50% annual
// escalation. These coefficients are applied DIRECTLY — there is NO multiplier.
//
// The same coefficient maps to DIFFERENT CO2 thresholds depending on the test
// method the figure comes from (WLTP figures run higher than NEDC). Rule
// (амандман, став 2): COC has only WLTP -> use WLTP; only NEDC -> use NEDC;
// both present -> use WLTP.
//
// The "petrol" column is the law's "Бензин, ТНГ, КПГ" column (petrol/LPG/CNG,
// and petrol-electric hybrids). The "diesel" column is "Дизел".
// Boundaries upper-inclusive.
// ---------------------------------------------------------------------------
export interface Co2Bracket {
  wltpUpTo: number | null; // upper g/km bound for WLTP figures (inclusive)
  nedcUpTo: number | null; // upper g/km bound for NEDC figures (inclusive)
  petrol: number; // den / (g CO2/km)
  diesel: number; // den / (g CO2/km)
}

export const CO2_BRACKETS: Co2Bracket[] = [
  { wltpUpTo: 1, nedcUpTo: 1, petrol: 0, diesel: 0 },
  { wltpUpTo: 63, nedcUpTo: 50, petrol: 8, diesel: 15 },
  { wltpUpTo: 94, nedcUpTo: 75, petrol: 15, diesel: 30 },
  { wltpUpTo: 113, nedcUpTo: 90, petrol: 30, diesel: 60 },
  { wltpUpTo: 123, nedcUpTo: 100, petrol: 45, diesel: 90 },
  { wltpUpTo: 135, nedcUpTo: 110, petrol: 60, diesel: 120 },
  { wltpUpTo: 153, nedcUpTo: 130, petrol: 75, diesel: 150 },
  { wltpUpTo: 160, nedcUpTo: 140, petrol: 105, diesel: 195 },
  { wltpUpTo: 172, nedcUpTo: 150, petrol: 180, diesel: 270 },
  { wltpUpTo: 188, nedcUpTo: 170, petrol: 265, diesel: 375 },
  { wltpUpTo: 210, nedcUpTo: 190, petrol: 390, diesel: 510 },
  { wltpUpTo: 249, nedcUpTo: 225, petrol: 495, diesel: 605 },
  { wltpUpTo: 282, nedcUpTo: 255, petrol: 590, diesel: 750 },
  { wltpUpTo: null, nedcUpTo: null, petrol: 695, diesel: 880 },
];

// ---------------------------------------------------------------------------
// Country -> trade relationship, used to SUGGEST a duty preset for "country Y".
// Not exhaustive; the user can always override the rate.
// ---------------------------------------------------------------------------
export const EU_COUNTRIES = [
  'Австрија', 'Белгија', 'Бугарија', 'Хрватска', 'Кипар', 'Чешка', 'Данска',
  'Естонија', 'Финска', 'Франција', 'Германија', 'Грција', 'Унгарија', 'Ирска',
  'Италија', 'Латвија', 'Литванија', 'Луксембург', 'Малта', 'Холандија',
  'Полска', 'Португалија', 'Романија', 'Словачка', 'Словенија', 'Шпанија', 'Шведска',
] as const;

export const CEFTA_EFTA_COUNTRIES = [
  'Албанија', 'Босна и Херцеговина', 'Косово', 'Молдавија', 'Црна Гора',
  'Србија', 'Исланд', 'Лихтенштајн', 'Норвешка', 'Швајцарија', 'Турција',
  'Украина',
] as const;

export const OTHER_COUNTRIES = [
  'Велика Британија', 'САД', 'Јапонија', 'Јужна Кореја', 'Кина',
  'Обединети Арапски Емирати', 'Друго',
] as const;

export function suggestedDutyPresetId(country: string): string {
  if ((EU_COUNTRIES as readonly string[]).includes(country)) return 'eu_eur1';
  if ((CEFTA_EFTA_COUNTRIES as readonly string[]).includes(country)) return 'cefta';
  return 'mfn';
}
