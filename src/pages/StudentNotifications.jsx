// src/pages/StudentNotifications.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function StudentNotifications() {
  const { userProfile, currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = collection(db, "notifications");
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return tB - tA;
        });
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading student notifications:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Robust student identification
  const studentGrade = (userProfile?.grade || "").trim();
  const studentGroup = (userProfile?.group || "").trim();
  const studentUid = (currentUser?.uid || localStorage.getItem("math_app_user_uid") || userProfile?.uid || userProfile?.id || "").trim();
  const studentEmail = (userProfile?.email || "").trim().toLowerCase();
  const studentPhone = (userProfile?.phone || "").trim();

  // Filter notifications targeted to this student
  const myNotifications = notifications.filter((n) => {
    if (!n.targetType || n.targetType === "all") return true;

    // Individual Student targeting
    if (n.targetType === "student") {
      const val = (n.targetValue || "").trim();
      const notifEmail = (n.targetStudentEmail || "").trim().toLowerCase();
      const notifPhone = (n.targetStudentPhone || "").trim();

      if (val && (val === studentUid || val === studentEmail || val === studentPhone)) return true;
      if (notifEmail && notifEmail === studentEmail) return true;
      if (notifPhone && notifPhone === studentPhone) return true;
      return false;
    }

    // Grade targeting
    if (n.targetType === "grade" && (n.targetValue || "").trim() === studentGrade) return true;

    // Group targeting
    if (n.targetType === "group" && (n.targetValue || "").trim() === studentGroup) return true;

    // Stage targeting
    if (n.targetType === "stage") {
      const stageName = (n.targetValue || "").trim();
      if (stageName.includes("ابتدائ") && studentGrade.includes("الابتدائي")) return true;
      if (stageName.includes("إعداد") && studentGrade.includes("الإعدادي")) return true;
      if (stageName.includes("ثانو") && studentGrade.includes("الثانوي")) return true;
    }

    return false;
  });

  const priorityBadges = {
    normal: { label: "🟢 إشعار عام", bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
    important: { label: "🟡 تنبيه هام", bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
    urgent: { label: "🔴 عاجل وتنبيه", bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Title */}
      <div style={{ marginBottom: "0.5rem" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 900, margin: 0 }}>
          🔔 <span className="text-gradient">الإشعارات والتنبيهات الموجهة</span>
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: "0.3rem 0 0 0" }}>
          التنبيهات المرسلة من المعلم إليك — الصف: <strong>{studentGrade || "غير محدد"}</strong>
        </p>
      </div>

      {loading ? (
        <div className="loading-state">
          <img src="/logo-circle.png" alt="Loading" className="logo-loading-sway" style={{ width: 50, height: 50 }} />
          <p>جاري تحميل الإشعارات وتحديثها...</p>
        </div>
      ) : myNotifications.length === 0 ? (
        <div className="empty-state glass">
          <span style={{ fontSize: "3.5rem" }}>🔕</span>
          <p className="font-heading">لا توجد إشعارات جديدة موجهة إليك حالياً</p>
          <p className="muted" style={{ fontSize: "0.88rem" }}>سيظهر هنا أي تنبيه أو إعلان أو موعد اختبار يرسله لك المعلم.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {myNotifications.map((notif) => {
            const pInfo = priorityBadges[notif.priority] || priorityBadges.normal;
            const dateStr = notif.createdAt?.toDate
              ? notif.createdAt.toDate().toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "الآن";

            return (
              <div
                key={notif.id}
                className="glass fade-in"
                style={{
                  padding: "1.25rem 1.5rem",
                  borderRadius: "20px",
                  border: `1.5px solid ${pInfo.color}45`,
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <span
                    style={{
                      background: pInfo.bg,
                      color: pInfo.color,
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      padding: "0.22rem 0.7rem",
                      borderRadius: "20px",
                    }}
                  >
                    {pInfo.label}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>🕒 {dateStr}</span>
                </div>

                <h3 style={{ margin: "0.3rem 0 0.5rem 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                  {notif.title}
                </h3>

                <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
                  {notif.body}
                </p>

                {notif.attachmentUrl && (
                  <div style={{ marginTop: "0.8rem" }}>
                    <a
                      href={notif.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button button-sm button-primary"
                      style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                    >
                      📎 عرض وتحميل المرفق ↗️
                    </a>
                  </div>
                )}

            <div style={{ marginTop: "0.85rem", fontSize: "0.75rem", color: "#94a3b8", borderTop: "1px dashed #e2e8f0", paddingTop: "0.4rem" }}>
                  ✍️ مرسل من: <strong>{notif.senderName || "المعلم"}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
