import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import api from '../../services/api.js';
import { attendanceService } from '../../services/attendanceService.js';
import toast from 'react-hot-toast';
import { CalendarCheck, CheckCircle, XCircle, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function FacultyAttendance() {
  const [sessions,        setSessions]        = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [students,        setStudents]        = useState([]);
  const [records,         setRecords]         = useState([]);
  const [manualStatus,    setManualStatus]    = useState({});
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/sessions'),
      api.get('/users?role=student'),
    ]).then(([s, u]) => {
      setSessions(s.data || []);
      setStudents(u.data?.users || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadSession = async (session) => {
    setSelectedSession(session);
    try {
      const recs = await attendanceService.getSessionAttendance(session._id);
      setRecords(recs);
      // Build status map: recorded first, then default absent
      const map = {};
      students.forEach(s => { map[s._id] = 'absent'; });
      recs.forEach(r => { if (r.student?._id) map[r.student._id] = r.status; });
      setManualStatus(map);
    } catch { toast.error('Failed to load attendance'); }
  };

  const saveAttendance = async () => {
    if (!selectedSession) return;
    setSaving(true);
    try {
      await attendanceService.markManual({
        records: Object.entries(manualStatus).map(([studentId, status]) => ({ studentId, status })),
        sessionId: selectedSession._id,
      });
      toast.success('✅ Attendance saved!');
      await loadSession(selectedSession); // refresh
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  // Stats for selected session
  const presentCount = Object.values(manualStatus).filter(v => v === 'present').length;
  const absentCount  = Object.values(manualStatus).filter(v => v === 'absent').length;
  const total        = students.length;
  const pct          = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Face-marked students (came via camera)
  const faceMapped = records.reduce((acc, r) => { if (r.student?._id) acc[r.student._id] = r; return acc; }, {});

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Attendance Management" />
        <main className="flex-1 p-6 space-y-6">
          <div className="page-header">
            <h1 className="page-title">Attendance Management</h1>
            <p className="page-subtitle">View and manage student attendance per session</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Sessions list */}
            <div className="glass-card p-4 h-fit">
              <h2 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <CalendarCheck size={15} className="text-accent-purple" /> Sessions
              </h2>
              {loading && <p className="text-white/30 text-xs text-center py-4">Loading...</p>}
              {!loading && sessions.length === 0 && (
                <div className="text-center py-6 space-y-1">
                  <p className="text-white/30 text-xs">No sessions yet.</p>
                  <p className="text-white/20 text-xs">Create one from the Whiteboard.</p>
                </div>
              )}
              <div className="space-y-1">
                {sessions.map(s => (
                  <button key={s._id} onClick={() => loadSession(s)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedSession?._id === s._id
                        ? 'bg-accent-purple/20 border border-accent-purple/30'
                        : 'bg-navy-800 hover:bg-navy-700 border border-transparent'}`}>
                    <div className="text-sm font-medium text-white truncate">{s.title}</div>
                    <div className="text-xs text-white/40">{format(new Date(s.createdAt), 'MMM d, yyyy · h:mm a')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main panel */}
            <div className="lg:col-span-2 space-y-4">
              {selectedSession ? (
                <>
                  {/* Stats bar */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Total',   value: total,        color: 'text-white',        bg: 'bg-white/5',        icon: Users },
                      { label: 'Present', value: presentCount, color: 'text-green-400',    bg: 'bg-green-500/10',   icon: CheckCircle },
                      { label: 'Absent',  value: absentCount,  color: 'text-red-400',      bg: 'bg-red-500/10',     icon: XCircle },
                      { label: 'Rate',    value: `${pct}%`,    color: 'text-purple-400',   bg: 'bg-purple-500/10',  icon: TrendingUp },
                    ].map(s => (
                      <div key={s.label} className={`glass-card p-3 text-center ${s.bg} border-0`}>
                        <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
                        <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-white/40">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Attendance table */}
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-white text-sm">
                        {selectedSession.title}
                        <span className="text-white/40 font-normal ml-2 text-xs">
                          {format(new Date(selectedSession.createdAt), 'MMM d, yyyy')}
                        </span>
                      </h2>
                      <div className="flex gap-2">
                        <button onClick={() => loadSession(selectedSession)}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                          <RefreshCw size={12} /> Refresh
                        </button>
                        <button onClick={saveAttendance} disabled={saving}
                          className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50">
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {students.length === 0 && (
                      <p className="text-white/30 text-sm text-center py-6">No students in system. Run seed script.</p>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {students.map(s => {
                        const faceRec = faceMapped[s._id];
                        const status  = manualStatus[s._id] || 'absent';
                        return (
                          <div key={s._id} className="flex items-center gap-3 p-3 bg-navy-800 rounded-xl">
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {s.name?.charAt(0)?.toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{s.name}</div>
                              <div className="text-xs text-white/40 flex items-center gap-2">
                                <span>{s.rollNumber || s.email}</span>
                                {faceRec && (
                                  <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-xs">
                                    📷 Face {Math.round((faceRec.confidence || 1) * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Toggle buttons */}
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setManualStatus(p => ({ ...p, [s._id]: 'present' }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                  status === 'present'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                                    : 'bg-navy-700 text-white/30 hover:text-green-400 hover:bg-green-500/10'}`}>
                                <CheckCircle size={12} /> Present
                              </button>
                              <button
                                onClick={() => setManualStatus(p => ({ ...p, [s._id]: 'absent' }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                  status === 'absent'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                    : 'bg-navy-700 text-white/30 hover:text-red-400 hover:bg-red-500/10'}`}>
                                <XCircle size={12} /> Absent
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card p-16 text-center text-white/30">
                  <CalendarCheck size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-base font-medium text-white/20 mb-1">No Session Selected</p>
                  <p className="text-sm">Select a session from the left to view and manage attendance</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
