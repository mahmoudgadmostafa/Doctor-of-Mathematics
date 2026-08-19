import React, { useEffect, useRef, useState, useCallback } from "react";
import Header from "./Header";
import Footer from "./Footer";
import TeacherSidebar from "./TeacherSidebar";
import FloatingContactWidget from "./FloatingContactWidget";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const { isTeacher } = useAuth();
  const location = useLocation();
  const mainRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  // Smooth page transition: fade+slide on every route change
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.classList.remove("page-enter-active");
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("page-enter-active");
    // Scroll to top on navigate
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Close sidebar on navigation (mobile)
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e) => { if (e.key === "Escape") closeSidebar(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [sidebarOpen, closeSidebar]);

  return (
    <>
      <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
      <div
        ref={mainRef}
        className="page-wrapper container page-enter-active"
        style={{ paddingTop: "1rem", minHeight: "80vh" }}
      >
        {isTeacher ? (
          <div className="teacher-layout-wrapper">
            {/* Mobile Overlay */}
            {sidebarOpen && (
              <div
                className="sidebar-mobile-overlay"
                onClick={closeSidebar}
                aria-hidden="true"
              />
            )}
            <TeacherSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
            <div className="teacher-vertical-divider" />
            <main className="teacher-main-content">
              {children}
            </main>
          </div>
        ) : (
          <main style={{ paddingTop: "0.5rem", minHeight: "80vh" }}>
            {children}
          </main>
        )}
      </div>
      <FloatingContactWidget />
      <Footer />
    </>
  );
}
