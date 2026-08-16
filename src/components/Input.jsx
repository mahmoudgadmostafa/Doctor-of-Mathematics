// src/components/Input.jsx
import React from "react";

export default function Input({ label, type = "text", value, onChange, required = false, name }) {
  const id = `input-${name || label.replace(/\s+/g, "-")}`;
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="input-field"
        type={type}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}
