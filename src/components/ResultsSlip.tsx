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
          <div className="doc">Решение · Customs assessment</div>
          <h2>Import to North Macedonia</h2>
        </div>
        <div className="slip__total-mini">
          <div className="lab">State taxes</div>
          <div className="val">{eur(r.taxesTotalEur)}</div>
        </div>
      </div>

      <div className="slip__body">
        {/* customs value build-up */}
        <Line name="Vehicle price" amount={priceEur} fx={fx} />
        {form.shippingTaxable && r.customsValueEur > priceEur && (
          <Line name="+ Freight to border" meta="part of customs value" sub
            amount={r.customsValueEur - priceEur} fx={fx} />
        )}
        <Line name="Customs value" group amount={r.customsValueEur} fx={fx} />

        <div className="divider" />

        {/* duty */}
        <Line name="Customs duty" meta={`царина · ${pct(r.dutyEur / (r.customsValueEur || 1))} of customs value`}
          amount={r.dutyEur} fx={fx} />

        {/* ДМВ */}
        {r.dmvExemption === 'none' ? (
          <>
            <Line name="Motor-vehicle tax (ДМВ)" group amount={r.dmvEur} fx={fx} />
            <Line name="Value component" meta={`${r.valuePct}% of ВМВ ${eur(r.vmvEur)}`} sub
              amount={r.dmvValueComponentEur} fx={fx} />
            <Line name="CO₂ component"
              meta={`${r.effectiveCo2} g/km × ${r.co2Coefficient} ден (${form.co2Standard})`} sub
              amount={r.dmvCo2ComponentEur} fx={fx} />
          </>
        ) : (
          <Line name="Motor-vehicle tax (ДМВ)"
            meta={r.dmvExemption === 'electric' ? 'EV — exempt' : 'oldtimer — exempt'}
            amount={0} fx={fx} />
        )}

        {/* VAT */}
        <Line name="VAT (ДДВ 18%)" meta={`on ${eur(r.vatBaseEur)} (value + duty + ДМВ)`}
          amount={r.vatEur} fx={fx} />

        <div className="subtotal subtotal--tax">
          <span className="lab">Taxes &amp; duties</span>
          <span className="v">{eur(r.taxesTotalEur)}</span>
        </div>

        <div className="subtotal subtotal--transport">
          <span className="lab">Transport &amp; logistics</span>
          <span className="v">{eur(r.logisticsTotalEur)}</span>
        </div>
      </div>

      <div className="grand">
        <div className="lab">
          Total landed cost
          <small>vehicle + taxes + transport</small>
        </div>
        <div className="big">
          {eur(r.grandTotalEur)}
          <span className="mk">{mkd(r.grandTotalEur, fx)}</span>
        </div>
      </div>

      <div className="eff">
        <div className="cell">
          <div className="k">Effective tax</div>
          <div className="v red">{pct(effTaxPct)}</div>
        </div>
        <div className="cell">
          <div className="k">ДМВ excise</div>
          <div className="v">{eur(r.dmvEur)}</div>
        </div>
        <div className="cell">
          <div className="k">VAT</div>
          <div className="v">{eur(r.vatEur)}</div>
        </div>
      </div>

      <div className="flags">
        {r.dmvExemption === 'electric' && (
          <div className="flag flag--ok"><span className="ic">✓</span>
            <span>Pure electric vehicle — <b>exempt from ДМВ</b>. Customs duty and 18% VAT still apply.</span></div>
        )}
        {r.dmvExemption === 'oldtimer' && (
          <div className="flag flag--ok"><span className="ic">✓</span>
            <span>Vehicle is 35+ years old — treated as an <b>oldtimer, exempt from ДМВ</b> (subject to customs confirmation).</span></div>
        )}
        {r.co2WasAssumed && (
          <div className="flag flag--warn"><span className="ic">!</span>
            <span>CO₂ unproven — customs assumes <b>400 g/km</b>, the maximum penalty. Provide the COC figure to lower this.</span></div>
        )}
        {!form.shippingTaxable && form.shipping !== '0' && form.shipping !== '' && (
          <div className="flag"><span className="ic">i</span>
            <span>Freight is excluded from the customs value here — confirm this matches your customs declaration.</span></div>
        )}
        <div className="flag"><span className="ic">i</span>
          <span>Indicative estimate. The binding amount is set by customs at clearance. Verify against the official <a href="https://customs.gov.mk/index.php/mk/e-carina/kalkulator-dmv" target="_blank" rel="noreferrer">ДМВ calculator</a>.</span></div>
      </div>

      <div className="stamp" aria-hidden="true">
        <div>
          <div className="st-top">РСМ · ЦАРИНА</div>
          <div className="st-mid">{pct(effTaxPct)}</div>
          <div className="st-bot">ASSESSED</div>
        </div>
      </div>
    </div>
  );
}
