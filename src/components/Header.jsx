// src/components/Header.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Header({ onToggleSidebar, sidebarOpen }) {
  const { currentUser, userProfile, logout, isTeacher } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifCount, setNotifCount] = useState(0);
  const [supportCount, setSupportCount] = useState(0);

  // Student identification info
  const studentGrade = (userProfile?.grade || "").trim();
  const studentGroup = (userProfile?.group || "").trim();
  const studentUid = (currentUser?.uid || localStorage.getItem("math_app_user_uid") || userProfile?.uid || userProfile?.id || "").trim();
  const studentEmail = (userProfile?.email || "").trim().toLowerCase();
  const studentPhone = (userProfile?.phone || "").trim();

  // Clear badge when visiting the respective route or dashboard tab
  useEffect(() => {
    const isNotifActive = location.pathname === "/notifications" || (location.pathname === "/dashboard" && location.search.includes("tab=notifications"));
    if (isNotifActive) {
      localStorage.setItem("math_app_last_seen_notif", Date.now().toString());
      setNotifCount(0);
    }
    const isSupportActive = location.pathname === "/support-tickets" || (location.pathname === "/dashboard" && location.search.includes("tab=support"));
    if (isSupportActive) {
      if (isTeacher) {
        localStorage.setItem("math_app_teacher_last_seen_tickets", Date.now().toString());
      } else {
        localStorage.setItem("math_app_student_last_seen_replies", Date.now().toString());
      }
      setSupportCount(0);
    }
  }, [location.pathname, location.search, isTeacher]);

  // Listen to notifications count
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const lastSeen = Number(localStorage.getItem("math_app_last_seen_notif") || 0);
      const list = snap.docs.map((d) => d.data());

      const unreadList = list.filter((n) => {
        const notifTime = n.createdAt?.toDate ? n.createdAt.toDate().getTime() : new Date(n.createdAt || 0).getTime();
        // Count notifications created after lastSeen
        if (notifTime <= lastSeen) return false;

        if (isTeacher) return true;

        if (!n.targetType || n.targetType === "all") return true;
        if (n.targetType === "student") {
          const val = (n.targetValue || "").trim();
          const notifEmail = (n.targetStudentEmail || "").trim().toLowerCase();
          const notifPhone = (n.targetStudentPhone || "").trim();
          return (val && (val === studentUid || val === studentEmail || val === studentPhone)) ||
                 (notifEmail && notifEmail === studentEmail) ||
                 (notifPhone && notifPhone === studentPhone);
        }
        if (n.targetType === "grade" && (n.targetValue || "").trim() === studentGrade) return true;
        if (n.targetType === "group" && (n.targetValue || "").trim() === studentGroup) return true;
        if (n.targetType === "stage") {
          const stageName = (n.targetValue || "").trim();
          if (stageName.includes("ابتدائ") && studentGrade.includes("الابتدائي")) return true;
          if (stageName.includes("إعداد") && studentGrade.includes("الإعدادي")) return true;
          if (stageName.includes("ثانو") && studentGrade.includes("الثانوي")) return true;
        }
        return false;
      });

      const isNotifActive = location.pathname === "/notifications" || (location.pathname === "/dashboard" && location.search.includes("tab=notifications"));
      if (!isNotifActive) {
        setNotifCount(unreadList.length);
      }
    });
    return () => unsub();
  }, [currentUser, isTeacher, studentGrade, studentGroup, studentUid, studentEmail, studentPhone, location.pathname, location.search]);

  // Listen to support tickets count
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(collection(db, "support_tickets"), (snap) => {
      const list = snap.docs.map((d) => d.data());
      if (isTeacher) {
        const lastSeen = Number(localStorage.getItem("math_app_teacher_last_seen_tickets") || 0);
        // Count tickets pending teacher reply created/updated after lastSeen
        const pendingUnread = list.filter((t) => {
          if (t.status !== "pending") return false;
          const ticketTime = t.createdAt?.toDate ? t.createdAt.toDate().getTime() : new Date(t.createdAt || 0).getTime();
          return ticketTime > lastSeen;
        });
        const isSupportActive = location.pathname === "/support-tickets" || (location.pathname === "/dashboard" && location.search.includes("tab=support"));
        if (!isSupportActive) {
          setSupportCount(pendingUnread.length);
        }
      } else {
        const lastSeen = Number(localStorage.getItem("math_app_student_last_seen_replies") || 0);
        // Count tickets belonging to student that have new teacher replies after lastSeen
        const myRepliedUnread = list.filter((t) => {
          const matchUid = studentUid && t.studentUid === studentUid;
          const matchEmail = studentEmail && (t.studentEmail || "").trim().toLowerCase() === studentEmail;
          const matchPhone = studentPhone && (t.studentPhone || "").trim() === studentPhone;
          if (!matchUid && !matchEmail && !matchPhone) return false;

          if (!t.replyText) return false;
          const replyTime = t.repliedAt?.toDate ? t.repliedAt.toDate().getTime() : new Date(t.repliedAt || Date.now()).getTime();
          return replyTime > lastSeen;
        });
        const isSupportActive = location.pathname === "/support-tickets" || (location.pathname === "/dashboard" && location.search.includes("tab=support"));
        if (!isSupportActive) {
          setSupportCount(myRepliedUnread.length);
        }
      }
    });
    return () => unsub();
  }, [currentUser, isTeacher, studentUid, studentEmail, studentPhone, location.pathname, location.search]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header
      className="glass page-header header-sticky"
      style={{
        padding: "0.6rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        position: "sticky",
        top: 0,
        zIndex: 200,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 0,
        borderBottom: "1px solid rgba(2,132,199,0.12)",
        boxShadow: "0 4px 20px rgba(15,23,42,0.07)",
      }}
    >
      {/* Right: Hamburger (mobile) + Brand Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
        {/* Hamburger: only shown for teacher on mobile */}
        {currentUser && isTeacher && (
          <button
            id="sidebar-toggle-btn"
            className="hamburger-btn"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={sidebarOpen}
          >
            <span className={`hamburger-icon ${sidebarOpen ? "open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        )}

        {(() => {
          const isAuthPage = ["/login", "/register", "/register-teacher"].includes(location.pathname);
          const brandContent = (
            <>
              <img
                src="/logo-circle.png"
                alt="Math Teacher Logo"
                className="logo-animated"
                style={{ height: "36px", width: "36px", objectFit: "cover", borderRadius: "50%", flexShrink: 0 }}
              />
              <h1
                className="header-title-animated header-title-responsive"
                style={{ fontSize: "1rem", margin: 0 }}
              >
                منصة <span className="brand-highlight">الدكتور</span> فى الرياضيات
              </h1>
            </>
          );

          const brandStyle = {
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            minWidth: 0,
            overflow: "hidden",
          };

          // أثناء تسجيل الدخول - بدون لينك
          if (isAuthPage) {
            return (
              <div className="header-brand-link" style={{ ...brandStyle, cursor: "default" }}>
                {brandContent}
              </div>
            );
          }

          // مسجّل دخول - يروح للداشبورد
          if (currentUser) {
            return (
              <Link to="/dashboard" className="header-brand-link" style={brandStyle}>
                {brandContent}
              </Link>
            );
          }

          // مش مسجّل دخول - يروح للصفحة الرئيسية
          return (
            <Link to="/" className="header-brand-link" style={brandStyle}>
              {brandContent}
            </Link>
          );
        })()}
      </div>

      {/* Center: Centered User / Student Name */}
      {currentUser && (
        <div
          className="header-user-badge"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flex: "1 1 auto",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: "var(--color-primary)",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.15))",
              border: "1px solid rgba(139, 92, 246, 0.3)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isTeacher ? "👨‍🏫 المعلم" : `👨‍🎓 ${userProfile?.fullName || "الطالب"}`}
          </span>
        </div>
      )}

      {/* Left: Icon-only Navigation Buttons (🔔, 🧑‍💻) + Logout */}
      <nav
        style={{
          display: "flex",
          gap: "0.4rem",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {/* 🔔 Notifications Icon Only */}
            <Link
              to={isTeacher ? "/notifications" : "/dashboard?tab=notifications"}
              className="button button-sm button-muted header-icon-btn"
              style={{
                fontSize: "1rem",
                padding: "0.3rem 0.55rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                borderRadius: "12px",
                minHeight: "34px",
                minWidth: "34px",
              }}
              title="الإشعارات والتنبيهات"
            >
              🔔
              {notifCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "#ef4444",
                    color: "#ffffff",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    borderRadius: "50%",
                    minWidth: "17px",
                    height: "17px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px",
                    boxShadow: "0 0 8px rgba(239, 68, 68, 0.7)",
                    border: "2px solid #ffffff",
                  }}
                >
                  {notifCount}
                </span>
              )}
            </Link>

            {/* 🧑‍💻 Support Icon Only (الدعم) */}
            <Link
              to={isTeacher ? "/support-tickets" : "/dashboard?tab=support"}
              className="button button-sm button-muted header-icon-btn"
              style={{
                fontSize: "1rem",
                padding: "0.3rem 0.55rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                borderRadius: "12px",
                minHeight: "34px",
                minWidth: "34px",
              }}
              title="الدعم والطلبات"
            >
              🧑‍💻
              {supportCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: isTeacher ? "#f59e0b" : "#10b981",
                    color: "#ffffff",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    borderRadius: "50%",
                    minWidth: "17px",
                    height: "17px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px",
                    boxShadow: "0 0 8px rgba(245, 158, 11, 0.7)",
                    border: "2px solid #ffffff",
                  }}
                >
                  {supportCount}
                </span>
              )}
            </Link>

            <button
              className="button button-sm button-muted logout-btn-text"
              onClick={handleLogout}
              style={{
                fontSize: "0.78rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "12px",
                whiteSpace: "nowrap",
                minHeight: "34px",
              }}
            >
              خروج
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
