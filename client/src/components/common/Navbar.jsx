import { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Search, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { format, parseISO } from 'date-fns';

// ── Build notifications from real data ────────────────────────────────────────
const buildNotifications = (assignments = [], tests = []) => {
  const now = Date.now();
  const notes = [];

  assignments.forEach(a => {
    const due = new Date(a.dueDate).getTime();
    const diff = (due - now) / 1000 / 60 / 60; // hours
    if (diff > 0 && diff < 48) {
      notes.push({
        id: `asgn-${a._id}`,
        type: 'warning',
        title: 'Assignment Due Soon',
        body: `"${a.title}" is due in ${diff < 24 ? `${Math.round(diff)}h` : '2 days'}`,
        time: a.dueDate,
        read: false,
        link: '/student/assignments',
      });
    }
  });

  tests.forEach(t => {
    if (t.startTime) {
      const start = new Date(t.startTime).getTime();
      const diff  = (start - now) / 1000 / 60 / 60;
      if (diff > 0 && diff < 24) {
        notes.push({
          id: `test-${t._id}`,
          type: 'info',
          title: 'Upcoming Test',
          body: `"${t.title}" starts in ${Math.round(diff)}h`,
          time: t.startTime,
          read: false,
          link: '/student/tests',
        });
      }
    }
  });

  // Always include a welcome notification
  notes.push({
    id: 'welcome',
    type: 'success',
    title: 'Welcome to IntelliBoard 360',
    body: 'Your smart classroom platform is ready. Explore the whiteboard!',
    time: new Date().toISOString(),
    read: false,
    link: '/whiteboard',
  });

  return notes;
};

const TYPE_COLORS = {
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  info:    'bg-blue-500/20   text-blue-400   border-blue-500/20',
  success: 'bg-green-500/20  text-green-400  border-green-500/20',
  error:   'bg-red-500/20    text-red-400    border-red-500/20',
};
const TYPE_DOT = {
  warning: 'bg-yellow-400',
  info:    'bg-blue-400',
  success: 'bg-green-400',
  error:   'bg-red-400',
};

export default function Navbar({ title = 'IntelliBoard 360' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ib_read_notifs') || '[]'); } catch { return []; }
  });
  const notifRef = useRef(null);

  useEffect(() => {
    // Load real data to build notifications
    if (!user) return;
    const load = async () => {
      try {
        if (user.role === 'student') {
          const [aRes, tRes] = await Promise.allSettled([
            api.get('/assignments'),
            api.get('/tests'),
          ]);
          const asgns = aRes.status === 'fulfilled' ? aRes.value.data : [];
          const tests = tRes.status === 'fulfilled' ? tRes.value.data : [];
          setNotifications(buildNotifications(asgns, tests));
        } else {
          // Faculty/admin get a generic welcome + tip
          setNotifications([
            {
              id: 'welcome-fac',
              type: 'success',
              title: 'IntelliBoard 360 Ready',
              body: 'Start a whiteboard session or create an assignment.',
              time: new Date().toISOString(),
              read: false,
              link: '/whiteboard',
            },
            {
              id: 'tip-ai',
              type: 'info',
              title: 'AI Features Available',
              body: 'Use the AI panel inside the whiteboard for OCR, equations, and more.',
              time: new Date().toISOString(),
              read: false,
              link: '/whiteboard',
            },
          ]);
        }
      } catch {}
    };
    load();
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    const ids = notifications.map(n => n.id);
    setReadIds(ids);
    localStorage.setItem('ib_read_notifs', JSON.stringify(ids));
  };

  const markRead = (id) => {
    const next = [...new Set([...readIds, id])];
    setReadIds(next);
    localStorage.setItem('ib_read_notifs', JSON.stringify(next));
  };

  const unread = notifications.filter(n => !readIds.includes(n.id)).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="h-16 bg-navy-800/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-white truncate">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotif(s => !s); }}
            className="btn-icon relative"
            title="Notifications"
          >
            <Bell size={18}/>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-purple text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-navy-700 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <span className="text-sm font-semibold text-white">Notifications</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-accent-purple hover:underline flex items-center gap-1">
                      <CheckCheck size={12}/> Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotif(false)} className="text-white/30 hover:text-white">
                    <X size={14}/>
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {notifications.length === 0 && (
                  <p className="text-center text-white/30 text-sm py-8">No notifications</p>
                )}
                {notifications.map(n => {
                  const isRead = readIds.includes(n.id);
                  return (
                    <Link
                      key={n.id}
                      to={n.link || '/'}
                      onClick={() => { markRead(n.id); setShowNotif(false); }}
                      className={`flex gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${isRead ? 'opacity-60' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isRead ? 'bg-white/20' : TYPE_DOT[n.type]}`}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{n.title}</div>
                        <div className="text-xs text-white/50 mt-0.5 line-clamp-2">{n.body}</div>
                        <div className="text-xs text-white/25 mt-1">
                          {format(new Date(n.time), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-white/5 text-center">
                <button onClick={() => setShowNotif(false)} className="text-xs text-white/30 hover:text-white">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-white leading-tight">{user?.name}</div>
            <div className="text-xs text-white/40 capitalize">{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="btn-icon text-white/40 hover:text-red-400 ml-1" title="Logout">
            <LogOut size={16}/>
          </button>
        </div>
      </div>
    </header>
  );
}
