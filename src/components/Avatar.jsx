// src/components/Avatar.jsx
import React from "react";

export default function Avatar({ src, alt = "avatar", size = 48 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "var(--color-muted)",
  };
  return <img src={src} alt={alt} style={style} className="avatar" />;
}
