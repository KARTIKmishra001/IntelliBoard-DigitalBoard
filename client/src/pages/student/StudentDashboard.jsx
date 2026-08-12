import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import api from '../../services/api.js';
import { BookOpen, ClipboardCheck, CalendarCheck, TrendingUp, School, Clock } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assRes, testRes, attRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/tests'),
          api.get(`/attendance/student/${user.id}`),
        ]);
        setAssignments(assRes.data);
        setTests(testRes.data);
        setAttendance(attRes.data.stats);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  const pendingAssignments = assignments.filter((a) => !isPast(new Date(a.dueDate)));
  const upcomingTests = tests.filter((t) => t.startTime && !isPast(new Date(t.startTime)));

  const stats = [
    { label: 'Total Assignments', value: assignments.length, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Upcoming Tests', value: upcomingTests.length, icon: ClipboardCheck, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Attendance %', value: `${attendance?.percentage ?? 0}%`, icon: CalendarCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Performance', value: 'A', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Student Dashboard" />
        <main className="flex-1 p-6 space-y-6">
          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="page-header">
            <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Here's what's happening in your classes today</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="stat-card glass-card-hover">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div className="stat-value">{loading ? '—' : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Assignments */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Recent Assignments</h2>
                <Link to="/student/assignments" className="text-xs text-accent-purple hover:text-accent-purple-light">View all →</Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl shimmer" />)}</div>
                ) : assignments.slice(0, 3).map((a) => (
                  <div key={a._id} className="flex items-center gap-3 p-3 bg-navy-800 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{a.title}</div>
                      <div className="text-xs text-white/40">{a.course?.code} · Due {format(new Date(a.dueDate), 'MMM d')}</div>
                    </div>
                    <span className={`badge ${isPast(new Date(a.dueDate)) ? 'badge-absent' : 'badge-pending'}`}>
                      {isPast(new Date(a.dueDate)) ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                ))}
                {!loading && assignments.length === 0 && <p className="text-white/30 text-sm text-center py-4">No assignments yet</p>}
              </div>
            </motion.div>

            {/* Upcoming Tests */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Upcoming Tests</h2>
                <Link to="/student/tests" className="text-xs text-accent-purple hover:text-accent-purple-light">View all →</Link>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 rounded-xl shimmer" />)}</div>
                ) : upcomingTests.slice(0, 2).map((t) => (
                  <div key={t._id} className="p-3 bg-navy-800 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck size={14} className="text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{t.title}</div>
                        <div className="text-xs text-white/40 flex items-center gap-1">
                          <Clock size={10} /> {t.startTime ? format(new Date(t.startTime), 'MMM d, h:mm a') : 'TBD'} · {t.duration} min
                        </div>
                      </div>
                      <span className="badge badge-pending">Upcoming</span>
                    </div>
                  </div>
                ))}
                {!loading && upcomingTests.length === 0 && <p className="text-white/30 text-sm text-center py-4">No upcoming tests</p>}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { to: '/whiteboard', label: 'Open Whiteboard', icon: School, color: 'from-accent-purple to-accent-blue' },
                { to: '/student/assignments', label: 'Submit Assignment', icon: BookOpen, color: 'from-blue-600 to-blue-400' },
                { to: '/student/tests', label: 'Take Test', icon: ClipboardCheck, color: 'from-yellow-600 to-yellow-400' },
                { to: '/student/archive', label: 'View Archive', icon: CalendarCheck, color: 'from-green-600 to-green-400' },
              ].map(({ to, label, icon: Icon, color }) => (
                <Link key={to} to={to}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${color} text-white text-center font-medium text-sm
                    transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                >
                  <Icon size={24} />
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
