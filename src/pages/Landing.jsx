import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="landing-page fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title font-heading">
              <span className="text-gradient">منصة الدكتور</span> فى الرياضيات
            </h1>
            <p className="hero-subtitle">
              وجهتك الأولى لاحتراف الرياضيات بأسلوب تفاعلي، مبسط، وعصري. 
              تعلم بشغف، تدرب بذكاء، وحقق التفوق الذي تطمح إليه في جميع المراحل التعليمية.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="button button-primary hero-btn">
                ابدأ رحلة التفوق
              </Link>
              <Link to="/login" className="button button-secondary hero-btn">
                تسجيل الدخول
              </Link>
            </div>
          </div>
          <div className="hero-image-container">
            <div className="hero-logo-wrapper">
              <div className="hero-logo-aura"></div>
              <img 
                src="/logo-circle.png" 
                alt="شعار منصة الدكتور فى الرياضيات" 
                className="hero-logo-animated"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title font-heading">لماذا تختار منصتنا؟</h2>
        <div className="features-grid">
          <div className="feature-card glass">
            <div className="feature-icon">🚀</div>
            <h3>شرح متطور ومبسط</h3>
            <p>
              نقدم المفاهيم الرياضية المعقدة بطريقة بصرية سهلة الفهم تضمن لك استيعاب الدروس بسرعة.
            </p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon">📊</div>
            <h3>اختبارات تفاعلية</h3>
            <p>
              قيم مستواك باستمرار من خلال اختبارات ذكية تواكب جميع مستويات المنهج الدراسي.
            </p>
          </div>
          <div className="feature-card glass">
            <div className="feature-icon">📈</div>
            <h3>متابعة مستمرة</h3>
            <p>
              راقب تقدمك خطوة بخطوة من خلال لوحة تحكم ذكية تعرض تقارير الأداء بشكل تفصيلي.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section glass">
        <h2 className="font-heading">جاهز لتحقيق التميز في الرياضيات؟</h2>
        <p>انضم الآن لمئات الطلاب الذين غيروا نظرتهم للرياضيات واكتشف متعة التعلم.</p>
        <Link to="/register" className="button button-primary cta-btn">
          أنشئ حسابك مجاناً
        </Link>
      </section>
    </div>
  );
}
