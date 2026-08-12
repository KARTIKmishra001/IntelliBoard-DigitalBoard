import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

// Auth
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// Common
import ProtectedRoute from './components/common/ProtectedRoute.jsx';

// Student
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import Assignments from './pages/student/Assignments.jsx';
import Tests from './pages/student/Tests.jsx';
import Attendance from './pages/student/Attendance.jsx';
import Archive from './pages/student/Archive.jsx';
import Settings from './pages/student/Settings.jsx';

// Faculty
import FacultyDashboard from './pages/faculty/FacultyDashboard.jsx';
import CreateAssignment from './pages/faculty/CreateAssignment.jsx';
import CreateTest from './pages/faculty/CreateTest.jsx';
import GradeSubmissions from './pages/faculty/GradeSubmissions.jsx';
import FacultyAttendance from './pages/faculty/FacultyAttendance.jsx';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import ManageCourses from './pages/admin/ManageCourses.jsx';
import SystemStats from './pages/admin/SystemStats.jsx';

// Whiteboard
import WhiteboardPage from './pages/whiteboard/WhiteboardPage.jsx';

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Student */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/assignments" element={<Assignments />} />
        <Route path="/student/tests" element={<Tests />} />
        <Route path="/student/attendance" element={<Attendance />} />
        <Route path="/student/archive" element={<Archive />} />
        <Route path="/student/settings" element={<Settings />} />
      </Route>

      {/* Faculty */}
      <Route element={<ProtectedRoute allowedRoles={['faculty']} />}>
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/create-assignment" element={<CreateAssignment />} />
        <Route path="/faculty/create-test" element={<CreateTest />} />
        <Route path="/faculty/grade-submissions" element={<GradeSubmissions />} />
        <Route path="/faculty/attendance" element={<FacultyAttendance />} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        <Route path="/admin/courses" element={<ManageCourses />} />
        <Route path="/admin/stats" element={<SystemStats />} />
      </Route>

      {/* Whiteboard - all authenticated */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'admin']} />}>
        <Route path="/whiteboard/:sessionId?" element={<WhiteboardPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
