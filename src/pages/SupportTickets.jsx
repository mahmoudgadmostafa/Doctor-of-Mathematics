// src/pages/SupportTickets.jsx
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { createPortal } from "react-dom";
import StudentNotifications from "./StudentNotifications";

const CATEGORIES = {
  academic_question: { label: "📐 سؤال أو استفسار دراسي", color: "#6366f1" },
  subscription_help: { label: "💳 استفسار أو تفعيل اشتراك", color: "#0284c7" },
  technical_issue: { label: "💻 مشكلة تقنية أو دخول", color: "#d97706" },
  other: { label: "📌 طلب أو استفسار عام", color: "#64748b" },
};

const STATUS_BADGES = {
  pending: { label: "⏳ قيد الانتظار", bg: "rgba(245, 158, 11, 0.15)", color: "#d97706" },
  in_progress: { label: "🔄 جاري المعالجة", bg: "rgba(2, 132, 199, 0.15)", color: "#0284c7" },
  resolved: { label: "✅ تم الرد والحل", bg: "rgba(34, 197, 94, 0.15)", color: "#16a34a" },
};

export default function SupportTickets({ defaultTab = "support" }) {
  const { userProfile, currentUser, isTeacher } = useAuth();
  const [studentActiveTab, setStudentActiveTab] = useState(defaultTab);

  useEffect(() => {
    setStudentActiveTab(defaultTab);
  }, [defaultTab]);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // New Ticket Form (for Student)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "academic_question",
    message: "",
    attachmentUrl: "",
  });

  // Reply Modal State (for Teacher)
  const [activeReplyTicket, setActiveReplyTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState("");
  const [replyStatus, setReplyStatus] = useState("resolved");
  const [sendingReply, setSendingReply] = useState(false);

  // Real-time listener for support tickets
  useEffect(() => {
    setLoading(true);
    const q = collection(db, "support_tickets");
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return tB - tA;
        });
        setTickets(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching support tickets:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const myStudentUid = (currentUser?.uid || localStorage.getItem("math_app_user_uid") || userProfile?.uid || userProfile?.id || "").trim();
  const myStudentEmail = (userProfile?.email || "").trim().toLowerCase();
  const myStudentPhone = (userProfile?.phone || "").trim();

  // Filtered tickets based on User Role & Filters
  const visibleTickets = useMemo(() => {
    return tickets.filter((t) => {
      // If student, only show their tickets (matching by UID, Email, or Phone)
      if (!isTeacher) {
        const matchUid = myStudentUid && t.studentUid === myStudentUid;
        const matchEmail = myStudentEmail && (t.studentEmail || "").trim().toLowerCase() === myStudentEmail;
        const matchPhone = myStudentPhone && (t.studentPhone || "").trim() === myStudentPhone;

        if (!matchUid && !matchEmail && !matchPhone) return false;
      }

      // Status filter
      const matchesStatus = statusFilter === "all" ? true : t.status === statusFilter;

      // Search query
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.subject?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q) ||
        t.studentName?.toLowerCase().includes(q) ||
        t.studentGrade?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, isTeacher, myStudentUid, myStudentEmail, myStudentPhone, statusFilter, search]);

  // Handle Student Ticket Submission
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      alert("يرجى إدخال عنوان وتفاصيل كرت الدعم.");
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        subject: ticketForm.subject.trim(),
        category: ticketForm.category,
        message: ticketForm.message.trim(),
        attachmentUrl: ticketForm.attachmentUrl.trim() || null,
        studentUid: myStudentUid,
        studentEmail: myStudentEmail,
        studentName: userProfile?.fullName || "طالب",
        studentGrade: userProfile?.grade || "",
        studentPhone: myStudentPhone,
        status: "pending", // 'pending' | 'in_progress' | 'resolved'
        createdAt: serverTimestamp(),
      });

      setTicketForm({
        subject: "",
        category: "academic_question",
        message: "",
        attachmentUrl: "",
      });
      setShowCreateModal(false);
      alert("تم إرسال كرت الدعم للمعلم بنجاح! 📨✨");
    } catch (err) {
      console.error("Error creating support ticket:", err);
      alert("حدث خطأ أثناء إرسال كرت الدعم: " + (err.message || err.toString()));
    } finally {
      setCreating(false);
    }
  };

  // Open Reply Modal (Teacher)
  const openReplyModal = (ticket) => {
    setActiveReplyTicket(ticket);
    setReplyText(ticket.replyText || "");
    setReplyAttachmentUrl(ticket.replyAttachmentUrl || "");
    setReplyStatus(ticket.status || "resolved");
  };

  // Submit Reply (Teacher)
  const handleSendReply = async () => {
    if (!activeReplyTicket) return;
    if (!replyText.trim()) {
      alert("يرجى كتابة نص الرد للطلب.");
      return;
    }

    setSendingReply(true);
    try {
      await updateDoc(doc(db, "support_tickets", activeReplyTicket.id), {
        replyText: replyText.trim(),
        replyAttachmentUrl: replyAttachmentUrl.trim() || null,
        status: replyStatus,
        repliedByName: userProfile?.fullName || "المعلم",
        repliedAt: serverTimestamp(),
      });

      setActiveReplyTicket(null);
      alert("تم إرسال الرد وتحديث حالة طلب الطالب بنجاح! 💬✨");
    } catch (err) {
      console.error("Error replying to ticket:", err);
      alert("حدث خطأ أثناء إرسال الرد: " + (err.message || err.toString()));
    } finally {
      setSendingReply(false);
    }
  };

  // Delete Ticket (Teacher only)
  const handleDeleteTicket = async (id, subject) => {
    if (!window.confirm(`هل أنت تأكد من حذف كرت الدعم "${subject}"؟`)) return;
    try {
      await deleteDoc(doc(db, "support_tickets", id));
    } catch (err) {
      console.error("Error deleting ticket:", err);
      alert("حدث خطأ أثناء الحذف.");
    }
  };

  const pendingCount = tickets.filter((t) => t.status === "pending").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="dashboard-modern fade-in">
      {/* Banner */}
      <div className="dashboard-banner glass">
        <div className="dashboard-banner-content">
          <img src="/logo-circle.png" alt="logo" className="dashboard-avatar" />
          <div>
            <h1 className="font-heading dashboard-welcome">
              <span className="text-gradient">{isTeacher ? "🧑‍💻 إدارة الدعم وطلبات الطلاب" : "🧑‍💻 مركز الدعم والإشعارات"}</span>
            </h1>
            <p className="dashboard-role">
              {isTeacher
                ? `طلبات قيد الانتظار: ${pendingCount} | جاري المعالجة: ${inProgressCount} | تم الرد: ${resolvedCount}`
                : "صفحة التواصل الموحدة مع المعلم والمنصة — الدعم المباشر، الاستفسارات، والإشعارات الموجهة."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {!isTeacher && studentActiveTab === "support" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="button button-primary"
              style={{ fontSize: "0.88rem", padding: "0.6rem 1.2rem" }}
            >
              + إنشاء كرت دعم / طلب جديد
            </button>
          )}
          <Link to="/dashboard" className="button button-secondary" style={{ fontSize: "0.88rem" }}>
            ← العودة للوحة التحكم
          </Link>
        </div>
      </div>

      {/* Unified Tabs for Student */}
      {!isTeacher && (
        <div
          className="glass"
          style={{
            display: "flex",
            gap: "0.5rem",
            margin: "1.25rem 0",
            padding: "0.4rem",
            borderRadius: "16px",
            background: "rgba(15, 23, 42, 0.5)",
          }}
        >
          <button
            onClick={() => setStudentActiveTab("support")}
            className={`button ${studentActiveTab === "support" ? "button-primary" : "button-muted"}`}
            style={{ flex: 1, padding: "0.65rem", fontSize: "0.95rem", borderRadius: "12px", fontWeight: 800 }}
          >
            🧑‍💻 الدعم وطلبات التواصل
          </button>
          <button
            onClick={() => setStudentActiveTab("notifications")}
            className={`button ${studentActiveTab === "notifications" ? "button-primary" : "button-muted"}`}
            style={{ flex: 1, padding: "0.65rem", fontSize: "0.95rem", borderRadius: "12px", fontWeight: 800 }}
          >
            🔔 الإشعارات والتنبيهات الموجهة
          </button>
        </div>
      )}

      {!isTeacher && studentActiveTab === "notifications" ? (
        <StudentNotifications />
      ) : (
        <>
          {/* Direct channels prompt for students / urgent inquiries */}
          {!isTeacher && (
            <div
              className="glass"
              style={{
                margin: "1rem 0",
                padding: "1rem 1.25rem",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                borderRight: "4px solid var(--color-primary)",
                background: "linear-gradient(90deg, rgba(2, 132, 199, 0.08) 0%, rgba(37, 211, 102, 0.05) 100%)",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>💬 هل لديك استفسار عاجل؟</span>
                  <span style={{ fontSize: "0.75rem", background: "rgba(34, 197, 94, 0.15)", color: "#16a34a", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>
                    متاح الآن
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--color-muted)", margin: "0.25rem 0 0 0" }}>
                  يمكنك التواصل المباشر مع مدير المنصة (د. محمود جاد) عبر واتساب أو ماسنجر أو فيسبوك للرد الفوري.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <a
                  href="https://wa.me/201060607654"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                  style={{
                    background: "linear-gradient(135deg, #25d366, #128c7e)",
                    color: "#fff",
                    fontSize: "0.8rem",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  واتساب 💬
                </a>
                <a
                  href="https://m.me/dr.mathee"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #0084ff)",
                    color: "#fff",
                    fontSize: "0.8rem",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  ماسنجر ⚡
                </a>
                <a
                  href="https://web.facebook.com/dr.mathee/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button"
                  style={{
                    background: "linear-gradient(135deg, #1877f2, #0c56c2)",
                    color: "#fff",
                    fontSize: "0.8rem",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  فيسبوك 🌐
                </a>
              </div>
            </div>
          )}

      {/* Controls and Search Bar */}
      <div
        className="glass"
        style={{
          margin: "1.25rem 0",
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-md)",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          justify: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setStatusFilter("all")}
            className={`button button-sm ${statusFilter === "all" ? "button-primary" : "button-muted"}`}
            style={{ fontSize: "0.82rem" }}
          >
            جميع الطلبات ({isTeacher ? tickets.length : visibleTickets.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`button button-sm ${statusFilter === "pending" ? "button-primary" : "button-muted"}`}
            style={{ fontSize: "0.82rem" }}
          >
            ⏳ قيد الانتظار ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`button button-sm ${statusFilter === "in_progress" ? "button-primary" : "button-muted"}`}
            style={{ fontSize: "0.82rem" }}
          >
            🔄 جاري المعالجة ({inProgressCount})
          </button>
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`button button-sm ${statusFilter === "resolved" ? "button-primary" : "button-muted"}`}
            style={{ fontSize: "0.82rem" }}
          >
            ✅ تم الرد ({resolvedCount})
          </button>
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="🔍 بحث في الطلبات وأسماء الطلاب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.88rem", width: "100%", maxWidth: "260px" }}
        />
      </div>

      {/* List of Tickets */}
      {loading ? (
        <div className="loading-state">
          <img src="/logo-circle.png" alt="Loading" className="logo-loading-sway" style={{ width: 50, height: 50 }} />
          <p>جاري تحميل كروت الدعم...</p>
        </div>
      ) : visibleTickets.length === 0 ? (
        <div className="empty-state glass">
          <span style={{ fontSize: "3.5rem" }}>✉️</span>
          <p className="font-heading">لا توجد كروت دعم أو طلبات تطابق بحثك حالياً</p>
          {!isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="button button-primary"
              style={{ marginTop: "0.75rem" }}
            >
              + اكتب سؤالك أو طلبك الآن
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.2rem" }}>
          {visibleTickets.map((ticket) => {
            const cat = CATEGORIES[ticket.category] || CATEGORIES.other;
            const st = STATUS_BADGES[ticket.status] || STATUS_BADGES.pending;
            const dateStr = ticket.createdAt?.toDate
              ? ticket.createdAt.toDate().toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "الآن";

            return (
              <div
                key={ticket.id}
                className="glass fade-in"
                style={{
                  padding: "1.4rem",
                  borderRadius: "20px",
                  border: `1.5px solid ${st.color}40`,
                  background: "rgba(255, 255, 255, 0.96)",
                }}
              >
                {/* Card Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: st.bg,
                          color: st.color,
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          padding: "0.22rem 0.65rem",
                          borderRadius: "20px",
                        }}
                      >
                        {st.label}
                      </span>
                      <span
                        style={{
                          background: "rgba(99, 102, 241, 0.12)",
                          color: cat.color,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          padding: "0.22rem 0.65rem",
                          borderRadius: "20px",
                        }}
                      >
                        {cat.label}
                      </span>
                    </div>

                    <h3 style={{ margin: "0.5rem 0 0.2rem 0", fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                      {ticket.subject}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    {isTeacher ? (
                      <>
                        <button
                          onClick={() => openReplyModal(ticket)}
                          className="button button-sm button-primary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.82rem" }}
                        >
                          {ticket.replyText ? "✏️ تعديل الرد" : "💬 الرد على الطالب"}
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id, ticket.subject)}
                          className="button button-sm button-muted"
                          style={{ padding: "0.35rem 0.6rem", fontSize: "0.82rem", color: "#ef4444" }}
                          title="حذف الكرت"
                        >
                          🗑️ حذف
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>🕒 {dateStr}</span>
                    )}
                  </div>
                </div>

                {/* Student Request Body */}
                <div
                  style={{
                    margin: "0.8rem 0",
                    padding: "0.85rem 1rem",
                    background: "rgba(241, 245, 249, 0.6)",
                    borderRadius: "14px",
                    borderRight: "4px solid #0284c7",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, marginBottom: "0.3rem" }}>
                    👤 الطالب: <strong>{ticket.studentName}</strong> {ticket.studentGrade && `(${ticket.studentGrade})`} {isTeacher && ticket.studentPhone && `📱 ${ticket.studentPhone}`}
                  </div>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {ticket.message}
                  </p>
                  {ticket.attachmentUrl && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <a
                        href={ticket.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0284c7" }}
                      >
                        📎 عرض المرفق المرفق مع الطلب ←
                      </a>
                    </div>
                  )}
                </div>

                {/* Teacher Reply Section (Threaded) */}
                {ticket.replyText ? (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem 1.2rem",
                      background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(2,132,199,0.08) 100%)",
                      border: "1.5px solid rgba(34,197,94,0.3)",
                      borderRadius: "16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#16a34a" }}>
                        👨‍🏫 رد المعلم المدير ({ticket.repliedByName || "المعلم"}):
                      </span>
                      {ticket.repliedAt?.toDate && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          🕒 {ticket.repliedAt.toDate().toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 600, lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                      {ticket.replyText}
                    </p>
                    {ticket.replyAttachmentUrl && (
                      <div style={{ marginTop: "0.6rem" }}>
                        <a
                          href={ticket.replyAttachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="button button-sm button-primary"
                          style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem" }}
                        >
                          📎 فتح مرفق أو صورة الرد ↗️
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic", marginTop: "0.5rem" }}>
                    ⏳ في انتظار مراجعة ورد المعلم...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Student: Create Support Ticket Modal */}
      {showCreateModal && createPortal(
        <div className="modal-overlay-fix fade-in" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-card-fix" style={{ maxWidth: "540px", background: "#ffffff", border: "1px solid #cbd5e1" }}>
            <div className="modal-header-pinned" style={{ background: "linear-gradient(90deg, #6366f1, #4f46e5)" }}>
              <div>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem" }}>✉️ إنشاء كرت دعم أو سؤال دراسي</h3>
                <p style={{ margin: "0.2rem 0 0 0", color: "rgba(255,255,255,0.85)", fontSize: "0.8rem" }}>
                  أرسل طلبك للمعلم وسيتم الرد عليك في أقرب وقت.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="modal-body-scroll" style={{ padding: "1.2rem" }}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "0.3rem", fontSize: "0.85rem", color: "#475569" }}>
                    📌 نوع الطلب / الاستفسار *
                  </label>
                  <select
                    className="form-input"
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm((f) => ({ ...f, category: e.target.value }))}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", fontSize: "0.88rem" }}
                  >
                    <option value="academic_question">📐 سؤال أو استفسار دراسي</option>
                    <option value="subscription_help">💳 استفسار أو تفعيل اشتراك</option>
                    <option value="technical_issue">💻 مشكلة تقنية أو دخول</option>
                    <option value="other">📌 طلب أو استفسار عام</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "0.3rem", fontSize: "0.85rem", color: "#475569" }}>
                    📝 عنوان كرت الدعم *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: سؤال في درس التفاضل..."
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", fontSize: "0.88rem" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "0.3rem", fontSize: "0.85rem", color: "#475569" }}>
                    💬 نص السؤال أو الطلب بالتفصيل *
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="اكتب سؤالك أو مشكلتك بالتفصيل للمعلم..."
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm((f) => ({ ...f, message: e.target.value }))}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", fontSize: "0.88rem", resize: "vertical" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontWeight: "700", marginBottom: "0.3rem", fontSize: "0.85rem", color: "#475569" }}>
                    🔗 رابط صورة أو مستند (اختياري)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="ضع رابط صورة المسألة أو التنسيق..."
                    value={ticketForm.attachmentUrl}
                    onChange={(e) => setTicketForm((f) => ({ ...f, attachmentUrl: e.target.value }))}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div className="modal-footer-pinned">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="button button-muted"
                  disabled={creating}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={creating}
                >
                  {creating ? "جاري الإرسال..." : "🚀 إرسال الكرت للمعلم"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Teacher: Reply Modal */}
      {activeReplyTicket && createPortal(
        <div className="modal-overlay-fix fade-in" onClick={(e) => e.target === e.currentTarget && setActiveReplyTicket(null)}>
          <div className="modal-card-fix" style={{ maxWidth: "540px", background: "#ffffff", border: "1px solid #cbd5e1" }}>
            <div className="modal-header-pinned" style={{ background: "linear-gradient(90deg, #0284c7, #0369a1)" }}>
              <div>
                <h3 style={{ margin: 0, color: "#fff", fontSize: "1.1rem" }}>💬 الرد على طلب الطالب</h3>
                <p style={{ margin: "0.2rem 0 0 0", color: "rgba(255,255,255,0.85)", fontSize: "0.8rem" }}>
                  {activeReplyTicket.studentName} — {activeReplyTicket.subject}
                </p>
              </div>
              <button
                onClick={() => setActiveReplyTicket(null)}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body-scroll" style={{ padding: "1.2rem" }}>
              <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "12px", marginBottom: "1rem", borderRight: "3px solid #0284c7" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b" }}>نص سؤال/طلب الطالب:</div>
                <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.88rem", color: "#0f172a", lineHeight: "1.5" }}>{activeReplyTicket.message}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "0.3rem", fontSize: "0.85rem", color: "#475569" }}>
                  📌 تغيير حالة الطلب:
                </label>
                <select
                  className="form-input"
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.88rem" }}
                >
                  <option value="pending">⏳ قيد الانتظار</option>
                  <option value="in_progress">🔄 جاري المعالجة والمتابعة</option>
                  <option value="resolved">✅ تم الرد وحل الطلب</option>
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "0.3rem", fontSize: "0.85rem", color: "#475569" }}>
                  💬 نص الرد أو الشرح للطالب *
                </label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="اكتب ردك الوافي أو الشرح للطالب..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", fontSize: "0.88rem", resize: "vertical" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "700", marginBottom: "0.3rem", fontSize: "0.85rem", color: "#475569" }}>
                  🔗 رابط صورة أو ملف مرفق للرد (اختياري)
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="ضع رابط صورة حل المسألة أو فيديو الشرح..."
                  value={replyAttachmentUrl}
                  onChange={(e) => setReplyAttachmentUrl(e.target.value)}
                  style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            <div className="modal-footer-pinned">
              <button
                type="button"
                onClick={() => setActiveReplyTicket(null)}
                className="button button-muted"
                disabled={sendingReply}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                className="button button-primary"
                disabled={sendingReply}
              >
                {sendingReply ? "جاري الإرسال..." : "💬 تأكيد وإرسال الرد"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
