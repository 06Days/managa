"use client";

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="form-check form-switch mb-0" title={label}>
      <input
        className="form-check-input"
        type="checkbox"
        role="switch"
        checked={checked}
        aria-label={label}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  );
}
