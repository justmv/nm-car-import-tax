const eur0 = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const mkd0 = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0,
});

const num0 = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });

/** "€12,800" */
export const eur = (n: number) => eur0.format(Math.round(n));

/** "787,200 ден" */
export const mkd = (n: number, fx: number) => `${mkd0.format(Math.round(n * fx))} ден`;

/** plain grouped integer */
export const int = (n: number) => num0.format(Math.round(n));

/** "12.3%" */
export const pct = (fraction: number) =>
  `${(fraction * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 })}%`;

/** Parse a free-text number field; blank/garbage → 0. */
export const num = (s: string): number => {
  const v = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(v) ? v : 0;
};
