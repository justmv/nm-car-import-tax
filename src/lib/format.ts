// Macedonian number conventions, formatted MANUALLY so they are identical on
// every device (browsers with "small-icu" don't support the mk-MK locale and
// would silently fall back to US-style comma grouping).
//   thousands separator: "."   decimal separator: ","

function groupMK(value: number, fractionDigits = 0): string {
  const neg = value < 0;
  const fixed = Math.abs(value).toFixed(fractionDigits);
  const [intRaw, frac] = fixed.split('.');
  const grouped = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const out = frac ? `${grouped},${frac}` : grouped;
  return neg ? `-${out}` : out;
}

/** "€14.000" */
export const eur = (n: number) => `€${groupMK(Math.round(n))}`;

/** "861.000 ден" */
export const mkd = (n: number, fx: number) => `${groupMK(Math.round(n * fx))} ден`;

/** plain grouped integer — "1.146.212" */
export const int = (n: number) => groupMK(Math.round(n));

/** decimal with comma, trailing zeros stripped — e.g. dec(61.5) → "61,5", dec(5) → "5" */
export const dec = (n: number, maxFrac = 2): string => {
  const factor = 10 ** maxFrac;
  const r = Math.round(n * factor) / factor;
  if (Number.isInteger(r)) return groupMK(r);
  return groupMK(r, maxFrac).replace(/0+$/, '').replace(/,$/, '');
};

/** "26,2%" (≤1 decimal, no trailing zero) */
export const pct = (fraction: number) => `${dec(fraction * 100, 1)}%`;

/** Parse a free-text number field; accepts comma decimals; blank/garbage → 0. */
export const num = (s: string): number => {
  const cleaned = String(s).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  const v = parseFloat(cleaned);
  return Number.isFinite(v) ? v : 0;
};
