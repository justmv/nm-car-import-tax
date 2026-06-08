import type { ReactNode } from 'react';
import type { CalcResult } from '../lib/calc';
import { eur, mkd, pct } from '../lib/format';
import type { FormState } from '../lib/formState';

function Line({
  name,
  meta,
  amount,
  fx,
  sub,
  group,
}: {
  name: ReactNode;
  meta?: ReactNode;
  amount: number;
  fx: number;
  sub?: boolean;
  group?: boolean;
}) {
  return (
    <div className={`line${sub ? ' line--sub' : ''}${group ? ' line--group' : ''}`}>
      <div className="name">
        {name}
        {meta && <span className="meta">{meta}</span>}
      </div>
      <div className="dots" />
      <div className="amt">
        {eur(amount)}
        <span className="mk">{mkd(amount, fx)}</span>
      </div>
    </div>
  );
}

export function ResultsSlip({ r, form }: { r: CalcResult; form: FormState }) {
  const fx = r.fxMkdPerEur;
  const priceEur = Math.max(0, r.grandTotalEur - r.taxesTotalEur - r.logisticsTotalEur);
  const effTaxPct = priceEur > 0 ? r.taxesTotalEur / priceEur : 0;

  return (
    <div className="slip rise" style={{ animationDelay: '0.18s' }}>
      <div className="slip__head">
        <div>
          <div className="doc">Решение · Царинска пресметка</div>
          <h2>Увоз во Северна Македонија</h2>
        </div>
        <div className="slip__total-mini">
          <div className="lab">Државни давачки</div>
          <div className="val">{eur(r.taxesTotalEur)}</div>
        </div>
      </div>

      <div className="slip__body">
        {/* градба на царинската вредност */}
        <Line name="Цена на возилото" amount={priceEur} fx={fx} />
        {form.shippingTaxable && r.customsValueEur > priceEur && (
          <Line name="+ Превоз до границата" meta="дел од царинската вредност" sub
            amount={r.customsValueEur - priceEur} fx={fx} />
        )}
        <Line name="Царинска вредност" group amount={r.customsValueEur} fx={fx} />

        <div className="divider" />

        {/* царина */}
        <Line name="Царина" meta={`царина · ${pct(r.dutyEur / (r.customsValueEur || 1))} од царинската вредност`}
          amount={r.dutyEur} fx={fx} />

        {/* ДМВ */}
        {r.dmvExemption === 'none' ? (
          <>
            <Line name="Данок на моторни возила (ДМВ)" group amount={r.dmvEur} fx={fx} />
            <Line name="Вредносна компонента (луксузна скала)"
              meta={`прогресивно ${r.valuePct}% од ВМВ ${eur(r.vmvEur)} · 0%→20%`} sub
              amount={r.dmvValueComponentEur} fx={fx} />
            <Line name="CO₂ компонента"
              meta={`${r.effectiveCo2} гр/км × ${r.co2Coefficient} ден (${form.co2Standard})`} sub
              amount={r.dmvCo2ComponentEur} fx={fx} />
          </>
        ) : (
          <Line name="Данок на моторни возила (ДМВ)"
            meta={r.dmvExemption === 'electric' ? 'ЕВ — ослободено' : 'олдтајмер — ослободено'}
            amount={0} fx={fx} />
        )}

        {/* ДДВ */}
        <Line name="ДДВ (18%)" meta={`на ${eur(r.vatBaseEur)} (вредност + царина + ДМВ)`}
          amount={r.vatEur} fx={fx} />

        <div className="subtotal subtotal--tax">
          <span className="lab">Давачки и царина</span>
          <span className="v">{eur(r.taxesTotalEur)}</span>
        </div>

        <div className="subtotal subtotal--transport">
          <span className="lab">Транспорт и логистика</span>
          <span className="v">{eur(r.logisticsTotalEur)}</span>
        </div>
      </div>

      <div className="grand">
        <div className="lab">
          Вкупна цена на чинење
          <small>возило + давачки + транспорт</small>
        </div>
        <div className="big">
          {eur(r.grandTotalEur)}
          <span className="mk">{mkd(r.grandTotalEur, fx)}</span>
        </div>
      </div>

      <div className="eff">
        <div className="cell">
          <div className="k">Ефективен данок</div>
          <div className="v red">{pct(effTaxPct)}</div>
        </div>
        <div className="cell">
          <div className="k">ДМВ акциза</div>
          <div className="v">{eur(r.dmvEur)}</div>
        </div>
        <div className="cell">
          <div className="k">ДДВ</div>
          <div className="v">{eur(r.vatEur)}</div>
        </div>
      </div>

      <div className="flags">
        {r.dmvExemption === 'electric' && (
          <div className="flag flag--ok"><span className="ic">✓</span>
            <span>Чисто електрично возило — <b>ослободено од ДМВ</b>. Сепак се плаќа царина и 18% ДДВ.</span></div>
        )}
        {r.dmvExemption === 'oldtimer' && (
          <div className="flag flag--ok"><span className="ic">✓</span>
            <span>Возилото е постаро од 35 години — се третира како <b>олдтајмер, ослободено од ДМВ</b> (подлежи на потврда од царина).</span></div>
        )}
        {r.co2WasAssumed && (
          <div className="flag flag--warn"><span className="ic">!</span>
            <span>CO₂ е недокажано — царината претпоставува <b>400 гр/км</b>, максимална казна. Внесете го податокот од COC за намалување.</span></div>
        )}
        {!form.shippingTaxable && form.shipping !== '0' && form.shipping !== '' && (
          <div className="flag"><span className="ic">i</span>
            <span>Превозот тука е исклучен од царинската вредност — потврдете дека ова одговара на вашата царинска декларација.</span></div>
        )}
        <div className="flag"><span className="ic">i</span>
          <span>Информативна проценка. Обврзувачкиот износ го утврдува царината при царинење. Проверете на официјалниот <a href="https://customs.gov.mk/index.php/mk/e-carina/kalkulator-dmv" target="_blank" rel="noreferrer">ДМВ калкулатор</a>.</span></div>
      </div>

      <div className="stamp" aria-hidden="true">
        <div>
          <div className="st-top">РСМ · ЦАРИНА</div>
          <div className="st-mid">{pct(effTaxPct)}</div>
          <div className="st-bot">ПРЕСМЕТАНО</div>
        </div>
      </div>
    </div>
  );
}
