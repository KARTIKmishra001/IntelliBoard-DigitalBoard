import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import api from '../../services/api.js';
import { Users, BookOpen, Monitor, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const TT_STYLE = { background: '#131929', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const roleData = stats?.usersByRole?.map(r => ({ name: r._id, value: r.count })) || [];
  const barData = [
    { name: 'Users', count: stats?.totalUsers || 0 },
    { name: 'Courses', count: stats?.totalCourses || 0 },
    { name: 'Sessions', count: stats?.totalSessions || 0 },
    { name: 'Assignments', count: stats?.totalAssignments || 0 },
    { name: 'Tests', count: stats?.totalTests || 0 },
  ];

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Total Courses', value: stats?.totalCourses, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active Sessions', value: stats?.activeSessions, icon: Monitor, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'System Uptime', value: '99.9%', icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Admin Dashboard" />
        <main className="flex-1 p-6 space-y-6">
          <div className="page-header">
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">System overview and management</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="stat-card">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <c.icon size={20} className={c.color} />
                </div>
                <div className="stat-value">{loading ? '—' : c.value ?? '—'}</div>
                <div className="stat-label">{c.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4">Platform Overview</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#ffffff50', fontSize: 12 }} />
                  <Tooltip contentStyle={TT_STYLE} />
                  <Bar dataKey="count" fill="#7C3AED" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4">User Distribution</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE} />
                  <Legend formatter={v => <span style={{ color: '#ffffff80' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Users */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">Recent Registrations</h2>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {(stats?.recentUsers || []).slice(0, 8).map(u => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-white/50">{u.email}</td>
                    <td><span className={`badge badge-${u.role} capitalize`}>{u.role}</span></td>
                    <td className="text-white/50">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
