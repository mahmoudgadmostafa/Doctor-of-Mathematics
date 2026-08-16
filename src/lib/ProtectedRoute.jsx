// src/lib/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// requiredRole: "teacher" | "student" | undefined (أي مستخدم مسجل دخول)
export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userProfile } = useAuth();

  if (!currentUser) return <Navigate to="/" replace />;

  if (requiredRole && userProfile?.role !== requiredRole) {
    // مستخدم مسجل بس دوره مش مناسب لهذه الصفحة
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
