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
          <div className="kicker">Северна Македонија · Увоз на возило</div>
          <h1>Калкулатор за <em>увозен данок</em></h1>
          <p className="sub">
            Пресметајте ја царината, данокот на моторни возила (ДМВ) и 18% ДДВ при
            увоз на автомобил во Северна Македонија — со јасно одвоени трошоци за транспорт.
          </p>
        </div>
        <div className="seal">
          ДДВ <b>18%</b><br />
          Царина <b>1% / 5%</b><br />
          ДМВ <b>вредност + CO₂</b>
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
          <b>Само информативно.</b> Алатката ги применува јавните прописи на Северна
          Македонија (Закон за данок на моторни возила 261/19; уредба за пресметка 277/19
          изменета со 220/2023; ДДВ 18%; царина 5%, или 1% за потекло од ЕУ со EUR.1).
          Нема посебен данок на луксуз — таа улога ја презема прогресивната вредносна
          компонента на ДМВ (0% до €10.000, до 20% над €50.000). Обврзувачкиот износ го
          утврдува Царинската управа при царинење. Стапки проверени во јуни 2026.
        </div>
        <div className="srcs">
          <span>Извори:</span>
          <a href="https://customs.gov.mk/index.php/mk/biznis-zaednica-mk/patnicki-avtomobili" target="_blank" rel="noreferrer">Царина · патнички автомобили</a>
          <a href="https://customs.gov.mk/index.php/mk/e-carina/kalkulator-dmv" target="_blank" rel="noreferrer">Официјален ДМВ калкулатор</a>
          <a href="https://customs.gov.mk/images/uredbadmv_copy.pdf" target="_blank" rel="noreferrer">Уредба 277/19</a>
        </div>
      </footer>
    </div>
  );
}
