import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard, BookOpen, ClipboardCheck, CalendarCheck,
  Archive, Settings, Users, BookMarked, BarChart3,
  PlusCircle, FilePen, Star, School,
} from 'lucide-react';

const studentLinks = [
  { to: '/student', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/assignments', icon: BookOpen, label: 'Assignments' },
  { to: '/student/tests', icon: ClipboardCheck, label: 'Tests' },
  { to: '/student/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/student/archive', icon: Archive, label: 'Archive' },
  { to: '/student/settings', icon: Settings, label: 'Settings' },
];

const facultyLinks = [
  { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/faculty/create-assignment', icon: PlusCircle, label: 'Create Assignment' },
  { to: '/faculty/create-test', icon: FilePen, label: 'Create Test' },
  { to: '/faculty/grade-submissions', icon: Star, label: 'Grade Submissions' },
  { to: '/faculty/attendance', icon: CalendarCheck, label: 'Attendance' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Manage Users' },
  { to: '/admin/courses', icon: BookMarked, label: 'Manage Courses' },
  { to: '/admin/stats', icon: BarChart3, label: 'System Stats' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'faculty' ? facultyLinks
    : studentLinks;

  return (
    <aside className="w-64 h-screen flex flex-col bg-navy-800 border-r border-white/5 fixed left-0 top-0 z-30">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
            <School size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">IntelliBoard</div>
            <div className="text-xs text-accent-purple font-medium">360</div>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-white/40 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-purple"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Whiteboard quick access */}
      <div className="p-4 border-t border-white/5">
        <Link
          to="/whiteboard"
          className="flex items-center justify-center gap-2 w-full btn-primary text-sm py-2.5"
        >
          <School size={16} />
          Open Whiteboard
        </Link>
      </div>
    </aside>
  );
}
