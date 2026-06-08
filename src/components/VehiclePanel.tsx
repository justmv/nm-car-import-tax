import { dec } from '../lib/format';
import {
  CURRENT_YEAR,
  dutyRateOf,
  vehicleAge,
  type FormState,
} from '../lib/formState';
import {
  CEFTA_EFTA_COUNTRIES,
  DUTY_PRESETS,
  EU_COUNTRIES,
  OLDTIMER_MIN_AGE_YEARS,
  OTHER_COUNTRIES,
  suggestedDutyPresetId,
  type FuelType,
} from '../lib/taxData';
import { Field, MoneyInput, UnitInput } from './ui';

type Update = (patch: Partial<FormState>) => void;

const FUELS: { id: FuelType; label: string }[] = [
  { id: 'petrol', label: 'Бензин' },
  { id: 'diesel', label: 'Дизел' },
  { id: 'hybrid', label: 'Хибрид (бензин)' },
  { id: 'lpg', label: 'ТНГ (LPG)' },
  { id: 'cng', label: 'КПГ (CNG)' },
  { id: 'electric', label: 'Електрично (BEV)' },
];

export function VehiclePanel({ form, update }: { form: FormState; update: Update }) {
  const age = vehicleAge(form);
  const isOldtimer = age >= OLDTIMER_MIN_AGE_YEARS;
  const isElectric = form.fuel === 'electric';
  const dutyPct = dec(dutyRateOf(form) * 100);
  const activePreset = DUTY_PRESETS.find((d) => d.id === form.dutyPresetId);

  function onCountry(country: string) {
    // Предложи царинска основа за избраното потекло, но дозволи рачна промена.
    update({ country, dutyPresetId: suggestedDutyPresetId(country) });
  }

  return (
    <section className="panel panel--tax rise" style={{ animationDelay: '0.05s' }}>
      <header className="panel__head">
        <span className="panel__num">1</span>
        <span className="panel__title">Возило и државни давачки</span>
        <span className="panel__hint">царина · ДМВ · ДДВ</span>
      </header>
      <div className="panel__body">
        <div className="fields">
          <Field label="Земја на потекло" htmlFor="country" wide
            hint="Ја определува царинската поволност. Потекло од ЕУ со EUR.1 / изјава на фактура добива намалена стапка од 1%.">
            <select id="country" className="control" value={form.country}
              onChange={(e) => onCountry(e.target.value)}>
              <optgroup label="Европска унија">
                {EU_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </optgroup>
              <optgroup label="ЦЕФТА / ЕФТА / Турција / Украина">
                {CEFTA_EFTA_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Друго">
                {OTHER_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </optgroup>
            </select>
          </Field>

          <Field label="Цена на возилото / царинска вредност" htmlFor="price"
            hint="Цената што ја плаќате за возилото (трансакциска вредност). Царината може да користи каталошка/Schwacke вредност за половни возила.">
            <MoneyInput id="price" value={form.vehiclePrice}
              onChange={(v) => update({ vehiclePrice: v })} />
          </Field>

          <Field label="Година на производство" htmlFor="year"
            hint={isOldtimer
              ? `${age} год. — се квалификува како олдтајмер (35+) → ослободено од ДМВ`
              : `≈ ${age} години старост`}>
            <UnitInput id="year" value={form.year} unit="год."
              onChange={(v) => update({ year: v })} placeholder={`${CURRENT_YEAR - 5}`} />
          </Field>

          <Field label="Гориво / погон" htmlFor="fuel"
            hint={isElectric ? 'Чисто електричните возила се ослободени од ДМВ (плаќаат царина + ДДВ).' : undefined}>
            <select id="fuel" className="control" value={form.fuel}
              onChange={(e) => update({ fuel: e.target.value as FuelType })}>
              {FUELS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </Field>

          <Field label="Основа за царина" htmlFor="duty"
            hint={activePreset?.note}>
            <select id="duty" className="control" value={form.dutyPresetId}
              onChange={(e) => update({ dutyPresetId: e.target.value })}>
              {DUTY_PRESETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}{d.id !== 'custom' ? ` — ${(d.rate * 100)}%` : ''}
                </option>
              ))}
            </select>
          </Field>

          {form.dutyPresetId === 'custom' && (
            <Field label="Сопствена царинска стапка" htmlFor="customduty">
              <UnitInput id="customduty" value={form.customDutyPct} unit="%"
                onChange={(v) => update({ customDutyPct: v })} />
            </Field>
          )}

          {!isElectric && (
            <Field label="Емисија на CO₂ (комбинирана)" htmlFor="co2" wide
              hint={form.co2Unknown
                ? <span className="hint--warn">Непознато → царината претпоставува казнени <b>400 гр/км</b>. Внесете го податокот од COC за пониска пресметка.</span>
                : <>Преземете го од Потврдата за сообразност (COC) на возилото. Граничните вредности се разликуваат според методата на тестирање.</>}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                  <UnitInput id="co2" value={form.co2Unknown ? '' : form.co2} unit="гр/км"
                    disabled={form.co2Unknown}
                    onChange={(v) => update({ co2: v })} placeholder="—" />
                </div>
                <div className="seg" role="group" aria-label="Метода за CO₂">
                  {(['WLTP', 'NEDC'] as const).map((s) => (
                    <button key={s} type="button"
                      aria-pressed={form.co2Standard === s}
                      onClick={() => update({ co2Standard: s })}>{s}</button>
                  ))}
                </div>
              </div>
              <label className="check" style={{ marginTop: 10, alignItems: 'center' }}>
                <input type="checkbox" checked={form.co2Unknown}
                  onChange={(e) => update({ co2Unknown: e.target.checked })} />
                <span className="ctxt">Не ја знам — користи ја законската претпоставка од 400 гр/км</span>
              </label>
            </Field>
          )}

          <Field label="Девизен курс" htmlFor="fx" optional="НБРСМ"
            hint="МКД за 1 ЕУР. Денарот е во фиксен курс околу 61,5.">
            <UnitInput id="fx" value={form.fx} unit="ден/€"
              onChange={(v) => update({ fx: v })} />
          </Field>

          <Field label="Ефективна царина" hint="Се применува на царинската вредност.">
            <div className="control" style={{ background: 'var(--surface)', pointerEvents: 'none' }}>
              {dutyPct}%
            </div>
          </Field>
        </div>
      </div>
    </section>
  );
}
