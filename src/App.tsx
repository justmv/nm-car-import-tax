import { useMemo, useState } from 'react';
import { ResultsSlip } from './components/ResultsSlip';
import { TransportPanel } from './components/TransportPanel';
import { VehiclePanel } from './components/VehiclePanel';
import { calculate } from './lib/calc';
import { defaultForm, toCalcInput, type FormState } from './lib/formState';

export default function App() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const result = useMemo(() => calculate(toCalcInput(form)), [form]);

  return (
    <div className="shell">
      <header className="masthead rise">
        <div>
          <div className="kicker">Северна Македонија · Vehicle import</div>
          <h1>Car import tax <em>calculator</em></h1>
          <p className="sub">
            Estimate the customs duty, motor-vehicle tax (ДМВ) and 18% VAT on a car
            imported into North Macedonia — with transport costs kept cleanly separate.
          </p>
        </div>
        <div className="seal">
          VAT <b>18%</b><br />
          Duty <b>1% / 5%</b><br />
          ДМВ <b>value + CO₂</b>
        </div>
      </header>

      <div className="grid">
        <div className="col-inputs">
          <VehiclePanel form={form} update={update} />
          <TransportPanel form={form} update={update} />
        </div>
        <div className="col-results">
          <ResultsSlip r={result} form={form} />
        </div>
      </div>

      <footer className="foot">
        <div className="disc">
          <b>Indicative only.</b> This tool implements the public North Macedonian rules
          (Law on Motor Vehicle Tax 261/19; calculation regulation 277/19 as amended by
          220/2023; VAT 18%; customs duty 5%, or 1% for EU origin with EUR.1). The legally
          binding amount is determined by the Customs Administration at the time of clearance.
          Rates verified June 2026.
        </div>
        <div className="srcs">
          <span>Sources:</span>
          <a href="https://customs.gov.mk/index.php/mk/biznis-zaednica-mk/patnicki-avtomobili" target="_blank" rel="noreferrer">Customs · passenger cars</a>
          <a href="https://customs.gov.mk/index.php/mk/e-carina/kalkulator-dmv" target="_blank" rel="noreferrer">Official ДМВ calculator</a>
          <a href="https://customs.gov.mk/images/uredbadmv_copy.pdf" target="_blank" rel="noreferrer">Regulation 277/19</a>
        </div>
      </footer>
    </div>
  );
}
