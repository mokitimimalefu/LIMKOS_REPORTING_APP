import React from "react";

export default function FormInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  options = [],
  required = false,
  rows = 3,
  placeholder = "",
  helperText = "",
  disabled = false
}) {
  const inputClass = `form-input ${disabled ? 'disabled' : ''}`;

  if (type === "select") {
    return (
      <div className="form-group">
        {label && <label htmlFor={name} className="form-label">{label}</label>}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={inputClass}
          disabled={disabled}
        >
          <option value="">Select {label}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {helperText && <div className="input-helper">{helperText}</div>}
      </div>
    );
  }

  if (type === "textarea") {
    return (
      <div className="form-group">
        {label && <label htmlFor={name} className="form-label">{label}</label>}
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          required={required}
          className={inputClass}
          disabled={disabled}
        />
        {helperText && <div className="input-helper">{helperText}</div>}
      </div>
    );
  }

  return (
    <div className="form-group">
      {label && <label htmlFor={name} className="form-label">{label}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={inputClass}
        disabled={disabled}
      />
      {helperText && <div className="input-helper">{helperText}</div>}
    </div>
  );
}