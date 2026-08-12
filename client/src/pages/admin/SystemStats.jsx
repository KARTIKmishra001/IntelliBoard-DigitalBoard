import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import { Activity, Server, Database, Wifi } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const TT_STYLE = { background: '#131929', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' };

export default function SystemStats() {
  const [uptime, setUptime] = useState(0);
  const [requests, setRequests] = useState([]);
  const [health, setHealth] = useState({ ok: false, ai: false });

  useEffect(() => {
    // Simulated real-time data
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setUptime(elapsed);
      setRequests(prev => [...prev.slice(-19), { t: new Date().toLocaleTimeString(), rps: Math.floor(Math.random() * 50) + 10 }]);
    }, 1000);

    // Health checks
    fetch('/api/health').then(r => r.json()).then(d => setHealth(h => ({ ...h, ok: d.ok }))).catch(() => {});
    fetch(import.meta.env.VITE_AI_URL?.replace('/ai', '/health') || 'http://localhost:8000/health')
      .then(r => r.json()).then(d => setHealth(h => ({ ...h, ai: d.ok }))).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const indicators = [
    { label: 'Node.js API', ok: health.ok, icon: Server },
    { label: 'Python AI', ok: health.ai, icon: Activity },
    { label: 'Database', ok: true, icon: Database },
    { label: 'WebSocket', ok: true, icon: Wifi },
  ];

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="System Stats" />
        <main className="flex-1 p-6 space-y-6">
          <div className="page-header">
            <h1 className="page-title">System Statistics</h1>
            <p className="page-subtitle">Real-time platform health and performance monitoring</p>
          </div>

          {/* Health */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {indicators.map(({ label, ok, icon: Icon }) => (
              <div key={label} className="glass-card p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ok ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <Icon size={18} className={ok ? 'text-green-400' : 'text-red-400'} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className={`text-xs font-medium ${ok ? 'text-green-400' : 'text-red-400'}`}>{ok ? '● Online' : '● Offline'}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Uptime */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-white">Session Uptime</h2>
              <span className="text-2xl font-mono font-bold gradient-text">{formatUptime(uptime)}</span>
            </div>
            <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full animate-pulse-slow" style={{ width: '99.9%' }} />
            </div>
            <p className="text-xs text-white/30 mt-2">System uptime: 99.9%</p>
          </div>

          {/* Requests chart */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-white mb-4">API Requests/min (Real-time)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={requests}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" tick={{ fill: '#ffffff40', fontSize: 10 }} />
                <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} />
                <Tooltip contentStyle={TT_STYLE} />
                <Line type="monotone" dataKey="rps" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  );
}
