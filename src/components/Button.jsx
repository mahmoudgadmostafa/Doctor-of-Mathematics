// src/components/Button.jsx
import React from "react";

export default function Button({ variant = "primary", onClick, disabled, children, type = "button" }) {
  const className = `button button-${variant}`;
  return (
    <button className={className} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
}
