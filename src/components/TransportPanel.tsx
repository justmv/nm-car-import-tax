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
        <span className="panel__title">Транспорт и логистика</span>
        <span className="panel__hint">{eur(logisticsTotal)}</span>
      </header>
      <div className="panel__body">
        <div className="sep-banner"><span>одвоено од давачките</span></div>

        <div className="fields">
          <Field label="Превоз / шпедиција до границата на СМ" htmlFor="ship" wide
            hint="Превоз + осигурување до границата. Според закон ова е дел од царинската вредност, па вообичаено се оданочува.">
            <MoneyInput id="ship" value={form.shipping}
              onChange={(v) => update({ shipping: v })} />
          </Field>

          <Field label="" wide htmlFor="shiptax">
            <label className="check">
              <input id="shiptax" type="checkbox" checked={form.shippingTaxable}
                onChange={(e) => update({ shippingTaxable: e.target.checked })} />
              <span className="ctxt">
                <b>Вклучи го превозот во царинската вредност (оданочиво)</b> — препорачано.
                Отштиклирајте само ако превозот се фактурира одделно и е исклучен од царинската декларација.
              </span>
            </label>
          </Field>

          <Field label="Домашен превоз во СМ" htmlFor="dom"
            hint="Од граница → до вашиот град. Не се оданочува.">
            <MoneyInput id="dom" value={form.domestic}
              onChange={(v) => update({ domestic: v })} />
          </Field>

          <Field label="Регистрација и таблички" htmlFor="reg"
            hint="Технички преглед, таблички, такси. Не се оданочува.">
            <MoneyInput id="reg" value={form.registration}
              onChange={(v) => update({ registration: v })} />
          </Field>

          <Field label="Царински посредник / агенција" htmlFor="brk"
            hint="Надомест за шпедитер. Не се оданочува.">
            <MoneyInput id="brk" value={form.broker}
              onChange={(v) => update({ broker: v })} />
          </Field>

          <Field label="Други трошоци" htmlFor="oth"
            hint="Складирање, преглед, ситни трошоци.">
            <MoneyInput id="oth" value={form.other}
              onChange={(v) => update({ other: v })} />
          </Field>
        </div>
      </div>
    </section>
  );
}
