import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  optional,
  wide,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  optional?: string;
  wide?: boolean;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className={`field${wide ? ' field--wide' : ''}`}>
      <label className="lbl" htmlFor={htmlFor}>
        {label}
        {optional && <span className="opt">{optional}</span>}
      </label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="affix">
      <span className="unit unit--lead">€</span>
      <input
        id={id}
        className="control"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function UnitInput({
  id,
  value,
  onChange,
  unit,
  placeholder,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="affix">
      <input
        id={id}
        className="control"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={disabled ? { opacity: 0.5 } : undefined}
      />
      <span className="unit">{unit}</span>
    </div>
  );
}
