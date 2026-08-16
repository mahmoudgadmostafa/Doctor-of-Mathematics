// src/components/TeacherSidebar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function TeacherSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { userProfile } = useAuth();
  const [pendingTicketsCount, setPendingTicketsCount] = useState(0);

  useEffect(() => {
    if (location.pathname === "/support-tickets") {
      localStorage.setItem("math_app_teacher_last_seen_tickets", Date.now().toString());
      setPendingTicketsCount(0);
      return;
    }

    const q = query(collection(db, "support_tickets"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      const lastSeen = Number(localStorage.getItem("math_app_teacher_last_seen_tickets") || 0);
      const unreadPending = snap.docs.filter((d) => {
        const ticketTime = d.data().createdAt?.toDate ? d.data().createdAt.toDate().getTime() : new Date(d.data().createdAt || 0).getTime();
        return ticketTime > lastSeen;
      });
      setPendingTicketsCount(unreadPending.length);
    });
    return () => unsub();
  }, [location.pathname]);

  const navItems = [
    { path: "/dashboard", label: "الرئيسية والإحصائيات", icon: "📊" },
    { path: "/students", label: "إدارة الطلاب والاشتراكات", icon: "👥" },
    { path: "/students/add", label: "إضافة طالب جديد", icon: "➕" },
    { path: "/groups", label: "المراحل والمجموعات", icon: "🏫" },
    { path: "/finances", label: "النظام المالي والأرباح", icon: "💰" },
    { path: "/quizzes", label: "الاختبارات والتطبيقات الذكية", icon: "📝" },
    { path: "/library", label: "المكتبة والشروحات", icon: "📚" },
    { path: "/live-sessions", label: "الحصص المباشرة", icon: "📡" },
    { path: "/notifications", label: "مركز الإشعارات والتنبيهات", icon: "🔔" },
    { path: "/support-tickets", label: "الدعم والطلبات", icon: "🧑‍💻", badge: pendingTicketsCount },
    { path: "/reports", label: "تقارير الطلاب", icon: "📈" },
    { path: "/profile", label: "إعدادات الحساب والرقم السري", icon: "⚙️" },
  ];

  return (
    <aside className={`teacher-sidebar${isOpen ? " sidebar-mobile-open" : ""}`}>
      {/* Close button — visible on mobile only */}
      {onClose && (
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="إغلاق القائمة"
        >
          ✕
        </button>
      )}

      <div className="sidebar-teacher-header">
        <img src="/logo-circle.png" alt="Teacher Avatar" className="sidebar-teacher-avatar" />
        <div className="sidebar-teacher-info">
          <span className="sidebar-teacher-name">{userProfile?.fullName || "المعلم المدير"}</span>
          <span className="sidebar-teacher-badge">مدير المنصة والمعلم</span>
        </div>
      </div>
      <div className="sidebar-menu-divider" />
      <nav className="teacher-sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`teacher-nav-item ${isActive ? "active" : ""}`}
              style={{ justifyContent: "space-between" }}
              onClick={onClose}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span className="teacher-nav-icon">{item.icon}</span>
                <span className="teacher-nav-label">{item.label}</span>
              </div>

              {Boolean(item.badge) && item.badge > 0 && (
                <span
                  style={{
                    background: "#f59e0b",
                    color: "#ffffff",
                    fontSize: "0.72rem",
                    fontWeight: 900,
                    borderRadius: "20px",
                    padding: "0.15rem 0.5rem",
                    boxShadow: "0 0 8px rgba(245, 158, 11, 0.5)",
                  }}
                >
                  {item.badge}
                </span>
              )}

              {isActive && <span className="teacher-nav-indicator" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
