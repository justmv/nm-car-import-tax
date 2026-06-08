# 🇲🇰 North Macedonia Car Import Tax Calculator

A free, client-side calculator that estimates the **total cost of importing a car into
North Macedonia** — customs duty (царина), the motor-vehicle tax (ДМВ, with its value
and CO₂ components) and 18% VAT (ДДВ) — while keeping **transport & logistics costs
cleanly separated** from the state taxes.

No backend, no tracking, no cost. It runs entirely in the browser and is hosted free
forever on GitHub Pages.

**Live:** https://justmv.github.io/nm-car-import-tax/

---

## How the tax is calculated

North Macedonian import charges **cascade** — each layer's base includes the ones below
it. That is why a high-CO₂ car is effectively taxed twice on its emissions (once via the
ДМВ CO₂ component, then again because VAT is charged on top of the ДМВ).

```
1. Customs value (CIF)  = vehicle price + freight/insurance to the NM border
2. Customs duty         = customs value × duty rate         (5%, or 1% for EU + EUR.1)
3. ВМВ (ДМВ value base) = customs value + customs duty
4. ДМВ (motor-veh. tax) = (ВМВ × pVV) × FX  +  CO₂ × kCO₂
5. VAT base             = customs value + customs duty + ДМВ
6. VAT (ДДВ)            = VAT base × 18%

Total taxes  = duty + ДМВ + VAT
Landed cost  = vehicle price + total taxes + transport/logistics
```

- **`pVV`** — value-component %, from 0% (≤ €10,000) up to 20% (> €50,000).
- **`kCO₂`** — denari per gram of CO₂/km. Diesel is taxed at roughly **double** petrol.
  The same coefficient maps to **different CO₂ thresholds for WLTP vs NEDC** figures.

### Key rules baked in
- **EV (pure electric):** exempt from ДМВ (still pays duty + VAT).
- **Oldtimer (35+ years):** exempt from ДМВ.
- **Unknown CO₂:** the law assumes a punitive **400 g/km** — the tool flags this and
  offers a rough estimator instead.
- **No CO₂ multiplier:** the 2023 amendment removed the old +25%/+50% escalation and
  baked higher coefficients directly into the table.

## Sources (primary legislation)

All rates live in [`src/lib/taxData.ts`](src/lib/taxData.ts), each cited to its
*Службен весник* (Official Gazette) number:

| Instrument | Gazette | What it sets |
|---|---|---|
| Law on Motor Vehicle Tax | 261/19 | The ДМВ; exemptions (EV, oldtimer) |
| Calculation Regulation | 277/19 | Formula, value brackets (Table 1) |
| Amendment | 220/2023 | **Replaced the CO₂ table** (Table 2); WLTP/NEDC split |
| Law amendment | 3/2025 | Cosmetic ministry rename only |
| Customs Administration | — | Duty 5% / 1% (EU + EUR.1); VAT 18% |

> ⚠️ **Indicative only.** The legally binding amount is set by the Customs Administration
> at clearance. Verify against the official
> [ДМВ calculator](https://customs.gov.mk/index.php/mk/e-carina/kalkulator-dmv).
> Rates verified June 2026.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # run the tax-engine unit tests (vitest)
npm run build    # type-check + production build to dist/
```

## Deploy

The site is published to the `gh-pages` branch (Settings → Pages → Source =
*Deploy from a branch* → `gh-pages` / root). To build and publish in one step:

```bash
npm run deploy        # builds, then pushes dist/ to the gh-pages branch
```

**Optional CI auto-deploy:** a ready-to-use GitHub Actions workflow lives at
[`deploy/github-pages-ci.yml`](deploy/github-pages-ci.yml). Move it to
`.github/workflows/`, switch Pages back to *GitHub Actions* as the source, and every
push to `main` will test + build + deploy automatically. (Pushing workflow files
requires a token with the `workflow` scope.)

Deploying to a root domain instead (Cloudflare Pages / Netlify)? Build with
`VITE_BASE=/ npm run build` and point the host at `dist/`.

## Project layout

```
src/
  lib/
    taxData.ts     # all rates & brackets (single source of truth, cited)
    calc.ts        # the cascade engine (pure functions)
    calc.test.ts   # hand-verified worked examples
    estimateCo2.ts # optional CO₂ estimator — tunable heuristic
    formState.ts   # form ↔ calc-input mapping
    format.ts      # EUR / MKD / % formatters
  components/       # VehiclePanel, TransportPanel, ResultsSlip, ui
```
