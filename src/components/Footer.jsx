// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  return (
    <footer className="site-footer glass">
      <div className="footer-inner">
        <img src="/logo-circle.png" alt="Logo" className="footer-logo" />
        <div className="footer-text">
          <p className="footer-brand font-heading">منصة الدكتور فى الرياضيات</p>
          <p className="footer-copy">
            جميع الحقوق محفوظة لـ <span className="footer-name">د. محمود جاد مصطفى</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
