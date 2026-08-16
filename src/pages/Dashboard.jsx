// src/pages/Dashboard.jsx
// نقطة دخول واحدة بعد تسجيل الدخول، بتوجه المستخدم حسب دوره
import { useAuth } from "../context/AuthContext";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
  const { isTeacher, isStudent, userProfile } = useAuth();

  if (isTeacher) return <TeacherDashboard />;
  if (isStudent) return <StudentDashboard />;

  return (
    <div className="page">
      <p>الحساب ده لسه مالوش دور محدد ({userProfile ? "تحقق من مستند users" : "لا يوجد ملف مستخدم"}).</p>
    </div>
  );
}
