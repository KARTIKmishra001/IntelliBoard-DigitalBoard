import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { School, BookOpen, Users, ClipboardCheck, Star, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/assignments'),
      api.get('/sessions'),
    ]).then(([c, a, s]) => {
      setCourses(c.data);
      setAssignments(a.data);
      setSessions(s.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const totalStudents = courses.reduce((s, c) => s + (c.students?.length || 0), 0);
  const pendingGrading = assignments.reduce((s, a) => s + (a.submissions?.filter(sub => sub.status === 'submitted')?.length || 0), 0);

  const stats = [
    { label: 'Active Sessions', value: sessions.filter(s => s.isActive).length, icon: School, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Pending Grading', value: pendingGrading, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'My Courses', value: courses.length, icon: BookOpen, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Faculty Dashboard" />
        <main className="flex-1 p-6 space-y-6">
          <div className="page-header">
            <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Manage your classes, assignments, and sessions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="stat-card">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div className="stat-value">{loading ? '—' : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* My Courses */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4">My Courses</h2>
              <div className="space-y-3">
                {courses.map(c => (
                  <div key={c._id} className="flex items-center gap-3 p-3 bg-navy-800 rounded-xl border border-white/5">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <BookOpen size={16} className="text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{c.title}</div>
                      <div className="text-xs text-white/40">{c.code} · {c.students?.length || 0} students</div>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && <p className="text-white/30 text-sm text-center py-4">No courses assigned</p>}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { to: '/whiteboard', label: 'Start Whiteboard', icon: School, color: 'from-accent-purple to-accent-blue' },
                  { to: '/faculty/create-assignment', label: 'Create Assignment', icon: PlusCircle, color: 'from-blue-600 to-blue-400' },
                  { to: '/faculty/create-test', label: 'Create Test', icon: ClipboardCheck, color: 'from-yellow-600 to-yellow-400' },
                  { to: '/faculty/attendance', label: 'View Attendance', icon: Users, color: 'from-green-600 to-green-400' },
                ].map(({ to, label, icon: Icon, color }) => (
                  <Link key={to} to={to}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${color} text-white text-center font-medium text-sm
                      transition-all duration-200 hover:scale-105 hover:shadow-lg`}>
                    <Icon size={22} />{label}
                  </Link>
                ))}
              </div>

              {/* Recent Assignments */}
              <h2 className="font-semibold text-white mt-5 mb-3">Recent Assignments</h2>
              <div className="space-y-2">
                {assignments.slice(0, 3).map(a => (
                  <div key={a._id} className="flex items-center gap-2 p-2.5 bg-navy-800 rounded-xl text-sm">
                    <BookOpen size={14} className="text-blue-400 flex-shrink-0" />
                    <span className="text-white/80 flex-1 truncate">{a.title}</span>
                    <span className="text-white/30 text-xs">{a.submissions?.length || 0} subs</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
