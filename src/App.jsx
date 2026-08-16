import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./lib/ProtectedRoute";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherRegister from "./pages/TeacherRegister";
import TeacherAddStudent from "./pages/TeacherAddStudent";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherGroups from "./pages/TeacherGroups";
import TeacherLiveSessions from "./pages/TeacherLiveSessions";
import TeacherLibrary from "./pages/TeacherLibrary";
import TeacherQuizzes from "./pages/TeacherQuizzes";
import TeacherProfileSettings from "./pages/TeacherProfileSettings";
import TeacherReports from "./pages/TeacherReports";
import TeacherFinances from "./pages/TeacherFinances";
import Dashboard from "./pages/Dashboard";
import TeacherNotifications from "./pages/TeacherNotifications";
import SupportTickets from "./pages/SupportTickets";
import { useAuth } from "./context/AuthContext";

// Teacher: full dedicated page. Student: redirect to dashboard (sidebar handles tabs)
function NotificationsRoute() {
  const { isTeacher } = useAuth();
  return isTeacher
    ? <TeacherNotifications />
    : <Navigate to="/dashboard" replace />;
}

function SupportRoute() {
  const { isTeacher } = useAuth();
  return isTeacher
    ? <SupportTickets />
    : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/register" element={<Layout><Register /></Layout>} />
          <Route path="/register-teacher" element={<Layout><TeacherRegister /></Layout>} />
          <Route path="/students" element={<Layout><ProtectedRoute><TeacherStudents /></ProtectedRoute></Layout>} />
          <Route path="/students/add" element={<Layout><ProtectedRoute><TeacherAddStudent /></ProtectedRoute></Layout>} />
          <Route path="/groups" element={<Layout><ProtectedRoute><TeacherGroups /></ProtectedRoute></Layout>} />
          <Route path="/live-sessions" element={<Layout><ProtectedRoute><TeacherLiveSessions /></ProtectedRoute></Layout>} />
          <Route path="/library" element={<Layout><ProtectedRoute><TeacherLibrary /></ProtectedRoute></Layout>} />
          <Route path="/quizzes" element={<Layout><ProtectedRoute><TeacherQuizzes /></ProtectedRoute></Layout>} />
          <Route path="/profile" element={<Layout><ProtectedRoute><TeacherProfileSettings /></ProtectedRoute></Layout>} />
          <Route path="/reports" element={<Layout><ProtectedRoute><TeacherReports /></ProtectedRoute></Layout>} />
          <Route path="/finances" element={<Layout><ProtectedRoute><TeacherFinances /></ProtectedRoute></Layout>} />
          <Route path="/notifications" element={<Layout><ProtectedRoute><NotificationsRoute /></ProtectedRoute></Layout>} />
          <Route path="/support-tickets" element={<Layout><ProtectedRoute><SupportRoute /></ProtectedRoute></Layout>} />
          <Route path="/dashboard" element={<Layout><ProtectedRoute><Dashboard /></ProtectedRoute></Layout>} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
