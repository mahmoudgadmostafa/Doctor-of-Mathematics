// src/components/Select.jsx
import React from "react";

export default function Select({ label, options, value, onChange, required = false, name }) {
  const id = `select-${name || label.replace(/\s+/g, "-")}`;
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="input-field"
        value={value}
        onChange={onChange}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
