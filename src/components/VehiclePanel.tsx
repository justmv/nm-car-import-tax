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
  { id: 'petrol', label: 'Petrol' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'hybrid', label: 'Hybrid (petrol)' },
  { id: 'lpg', label: 'LPG' },
  { id: 'cng', label: 'CNG' },
  { id: 'electric', label: 'Electric (BEV)' },
];

export function VehiclePanel({ form, update }: { form: FormState; update: Update }) {
  const age = vehicleAge(form);
  const isOldtimer = age >= OLDTIMER_MIN_AGE_YEARS;
  const isElectric = form.fuel === 'electric';
  const dutyPct = (dutyRateOf(form) * 100).toLocaleString('en-GB', { maximumFractionDigits: 2 });
  const activePreset = DUTY_PRESETS.find((d) => d.id === form.dutyPresetId);

  function onCountry(country: string) {
    // Suggest a duty preset for the chosen origin, but never lock the user in.
    update({ country, dutyPresetId: suggestedDutyPresetId(country) });
  }

  return (
    <section className="panel panel--tax rise" style={{ animationDelay: '0.05s' }}>
      <header className="panel__head">
        <span className="panel__num">1</span>
        <span className="panel__title">Vehicle &amp; state taxes</span>
        <span className="panel__hint">царина · ДМВ · ДДВ</span>
      </header>
      <div className="panel__body">
        <div className="fields">
          <Field label="Country of origin (Y)" htmlFor="country" wide
            hint="Determines the customs-duty preference. EU origin with a EUR.1 / invoice declaration qualifies for the reduced 1% rate.">
            <select id="country" className="control" value={form.country}
              onChange={(e) => onCountry(e.target.value)}>
              <optgroup label="European Union">
                {EU_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </optgroup>
              <optgroup label="CEFTA / EFTA / Türkiye / Ukraine">
                {CEFTA_EFTA_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Other">
                {OTHER_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </optgroup>
            </select>
          </Field>

          <Field label="Vehicle price / customs value" htmlFor="price"
            hint="The price you pay for the car (transaction value). Customs may reference a catalogue/Schwacke value for used cars.">
            <MoneyInput id="price" value={form.vehiclePrice}
              onChange={(v) => update({ vehiclePrice: v })} />
          </Field>

          <Field label="Year of manufacture" htmlFor="year"
            hint={isOldtimer
              ? `${age} yrs — qualifies as an oldtimer (35+) → ДМВ-exempt`
              : `≈ ${age} years old`}>
            <UnitInput id="year" value={form.year} unit="yr"
              onChange={(v) => update({ year: v })} placeholder={`${CURRENT_YEAR - 5}`} />
          </Field>

          <Field label="Fuel / propulsion" htmlFor="fuel"
            hint={isElectric ? 'Pure EVs are exempt from ДМВ (still pay duty + VAT).' : undefined}>
            <select id="fuel" className="control" value={form.fuel}
              onChange={(e) => update({ fuel: e.target.value as FuelType })}>
              {FUELS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </Field>

          <Field label="Customs duty basis" htmlFor="duty"
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
            <Field label="Custom duty rate" htmlFor="customduty">
              <UnitInput id="customduty" value={form.customDutyPct} unit="%"
                onChange={(v) => update({ customDutyPct: v })} />
            </Field>
          )}

          {!isElectric && (
            <Field label="CO₂ emissions (combined)" htmlFor="co2" wide
              hint={form.co2Unknown
                ? <span className="hint--warn">Unknown → customs assumes a punitive <b>400 g/km</b>. Provide the COC figure to lower this.</span>
                : <>Take this from the vehicle's Certificate of Conformity (COC). The threshold bands differ by test method.</>}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 130px', minWidth: 0 }}>
                  <UnitInput id="co2" value={form.co2Unknown ? '' : form.co2} unit="g/km"
                    disabled={form.co2Unknown}
                    onChange={(v) => update({ co2: v })} placeholder="—" />
                </div>
                <div className="seg" role="group" aria-label="CO₂ test method">
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
                <span className="ctxt">I don't know it — use the legal 400 g/km assumption</span>
              </label>
            </Field>
          )}

          <Field label="Exchange rate" htmlFor="fx" optional="NBRM"
            hint="MKD per EUR. The denar is pegged near 61.5.">
            <UnitInput id="fx" value={form.fx} unit="ден/€"
              onChange={(v) => update({ fx: v })} />
          </Field>

          <Field label="Effective duty" hint="Applied to the customs value.">
            <div className="control" style={{ background: 'var(--surface)', pointerEvents: 'none' }}>
              {dutyPct}%
            </div>
          </Field>
        </div>
      </div>
    </section>
  );
}
