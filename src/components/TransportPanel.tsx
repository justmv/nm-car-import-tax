import { eur, num } from '../lib/format';
import { type FormState } from '../lib/formState';
import { Field, MoneyInput } from './ui';

type Update = (patch: Partial<FormState>) => void;

export function TransportPanel({ form, update }: { form: FormState; update: Update }) {
  const logisticsTotal =
    num(form.shipping) + num(form.domestic) + num(form.registration) +
    num(form.broker) + num(form.other);

  return (
    <section className="panel panel--transport rise" style={{ animationDelay: '0.12s' }}>
      <header className="panel__head">
        <span className="panel__num">2</span>
        <span className="panel__title">Transport &amp; logistics</span>
        <span className="panel__hint">{eur(logisticsTotal)}</span>
      </header>
      <div className="panel__body">
        <div className="sep-banner"><span>kept separate from taxes</span></div>

        <div className="fields">
          <Field label="Freight / shipping to the NM border" htmlFor="ship" wide
            hint="Transport + insurance up to the border. By law this is part of the customs value, so it is normally taxed.">
            <MoneyInput id="ship" value={form.shipping}
              onChange={(v) => update({ shipping: v })} />
          </Field>

          <Field label="" wide htmlFor="shiptax">
            <label className="check">
              <input id="shiptax" type="checkbox" checked={form.shippingTaxable}
                onChange={(e) => update({ shippingTaxable: e.target.checked })} />
              <span className="ctxt">
                <b>Include freight in the customs value (taxable)</b> — recommended.
                Uncheck only if your shipping is billed separately and excluded from the customs declaration.
              </span>
            </label>
          </Field>

          <Field label="Domestic transport within NM" htmlFor="dom"
            hint="Border → your city. Not taxed.">
            <MoneyInput id="dom" value={form.domestic}
              onChange={(v) => update({ domestic: v })} />
          </Field>

          <Field label="Registration & plates" htmlFor="reg"
            hint="Tech inspection, plates, fees. Not taxed.">
            <MoneyInput id="reg" value={form.registration}
              onChange={(v) => update({ registration: v })} />
          </Field>

          <Field label="Customs broker / agency" htmlFor="brk"
            hint="Clearing-agent fee. Not taxed.">
            <MoneyInput id="brk" value={form.broker}
              onChange={(v) => update({ broker: v })} />
          </Field>

          <Field label="Other logistics" htmlFor="oth"
            hint="Storage, inspection, sundries.">
            <MoneyInput id="oth" value={form.other}
              onChange={(v) => update({ other: v })} />
          </Field>
        </div>
      </div>
    </section>
  );
}
