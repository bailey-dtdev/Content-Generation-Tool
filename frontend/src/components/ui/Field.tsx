import { cloneElement, type ReactElement, useId } from "react";

// A labelled form field. The control is associated to its <label> via a
// generated id so assistive tech (and getByLabelText) resolve it cleanly.
export function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div className="field">
      <span className="field__label">
        <label htmlFor={id}>{label}</label>
        {required ? <span className="field__req">*</span> : null}
        {hint ? <span className="field__hint">{hint}</span> : null}
      </span>
      {cloneElement(children, { id })}
      {error ? (
        <span style={{ fontSize: "11.5px", color: "var(--status-danger)" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
