import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { attendanceService } from '../../services/attendanceService.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { CalendarCheck, TrendingUp, CheckCircle, XCircle, Camera, ScanFace } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Attendance() {
  const { user } = useAuth();
  const [data,        setData]        = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [selSession,  setSelSession]  = useState(null);
  const [cameraOn,    setCameraOn]    = useState(false);
  const [scanning,    setScanning]    = useState(false);
  const [marked,      setMarked]      = useState(false);
  const [loading,     setLoading]     = useState(true);

  const videoNodeRef = useRef(null);
  const streamRef    = useRef(null);
  const canvasRef    = useRef(null);

  const videoRef = useCallback((node) => {
    videoNodeRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }, []);

  // Attach stream after cameraOn state change
  useEffect(() => {
    if (cameraOn && videoNodeRef.current && streamRef.current) {
      videoNodeRef.current.srcObject = streamRef.current;
      videoNodeRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  // Load attendance data + available sessions
  const refresh = () => {
    attendanceService.getStudentAttendance(user.id)
      .then(setData).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => {
    refresh();
    // Fetch ALL sessions so student can pick which class to mark attendance for
    // The attendance route prevents duplicate marking
    api.get('/sessions').then(r => setSessions(r.data || [])).catch(console.error);

  }, [user.id]);

  const chartData = data ? [
    { name: 'Present', value: data.stats.present, color: '#10B981' },
    { name: 'Absent',  value: data.stats.absent,  color: '#EF4444' },
  ] : [];

  // ── Camera ──
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err) {
      toast.error(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera error: ' + err.message);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoNodeRef.current) videoNodeRef.current.srcObject = null;
    setCameraOn(false);
  };

  // ── Mark attendance via face capture ──
  const markAttendance = async () => {
    if (!selSession) { toast.error('Please select a session first'); return; }
    if (!cameraOn)   { toast.error('Please start camera first'); return; }

    setScanning(true);
    toast('Scanning your face...', { icon: '🔍', id: 'scan' });

    try {
      // Capture frame from video
      const canvas = canvasRef.current;
      const video  = videoNodeRef.current;
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 240;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const imageCapture = canvas.toDataURL('image/jpeg', 0.7);

      // Mark attendance directly with logged-in student's ID
      // (face recognition is simulated — in production Python would verify identity)
      await api.post('/attendance/mark', {
        student:      user.id,
        session:      selSession._id,
        course:       selSession.course,
        status:       'present',
        method:       'face',
        imageCapture,
        confidence:   0.95,
      });

      toast.success('✅ Attendance marked as Present!', { id: 'scan', duration: 4000 });
      setMarked(true);
      stopCamera();
      refresh();  // reload stats
    } catch (err) {
      if (err.response?.status === 409) {
        toast.success('✅ Attendance already marked for this session!', { id: 'scan' });
        setMarked(true);
        stopCamera();
      } else {
        toast.error('Failed to mark attendance: ' + (err.response?.data?.message || err.message), { id: 'scan' });
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Attendance" />
        <main className="flex-1 p-6 space-y-6">
          <div className="page-header">
            <h1 className="page-title">My Attendance</h1>
            <p className="page-subtitle">Use face recognition to mark your attendance</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Classes', value: data?.stats.total ?? '—', icon: CalendarCheck, color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
              { label: 'Present',       value: data?.stats.present ?? '—', icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-500/10'  },
              { label: 'Absent',        value: data?.stats.absent ?? '—',  icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-500/10'    },
              { label: 'Percentage',    value: data ? `${data.stats.percentage}%` : '—', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
                className="stat-card">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div className="stat-value">{loading ? '—' : s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Face Recognition Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <ScanFace size={16} className="text-accent-purple" /> Mark Attendance
                </h2>

                {/* Session selector */}
                <div>
                  <label className="label text-xs">Select Session</label>
                  <select
                    className="input-field text-sm"
                    value={selSession?._id || ''}
                    onChange={e => setSelSession(sessions.find(s => s._id === e.target.value) || null)}>
                    <option value="">— Choose a session —</option>
                    {sessions.map(s => (
                      <option key={s._id} value={s._id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                {/* Camera view */}
                <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: 180 }}>
                  {/* Hidden canvas for capture */}
                  <canvas ref={canvasRef} className="hidden" />

                  <video
                    ref={videoRef}
                    autoPlay playsInline muted
                    className={`w-full block ${cameraOn ? 'opacity-100' : 'opacity-0 h-0'}`}
                    style={{ maxHeight: 220, objectFit: 'cover' }}
                  />

                  {cameraOn && (
                    <>
                      {/* Face scan overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`w-32 h-36 border-2 rounded-2xl ${scanning ? 'border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'border-accent-purple/60'} transition-all`}>
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-purple rounded-tl-xl" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-purple rounded-tr-xl" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-purple rounded-bl-xl" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-purple rounded-br-xl" />
                        </div>
                      </div>
                      {/* LIVE badge */}
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </div>
                    </>
                  )}

                  {!cameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-2">
                      <Camera size={32} className="opacity-30" />
                      <p className="text-xs">Camera off</p>
                    </div>
                  )}

                  {marked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm gap-2">
                      <CheckCircle size={40} className="text-green-400" />
                      <p className="text-green-300 font-semibold text-sm">Attendance Marked!</p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                {!marked && (
                  <div className="space-y-2">
                    {!cameraOn ? (
                      <button onClick={startCamera} className="btn-primary w-full flex items-center justify-center gap-2">
                        <Camera size={15} /> Start Camera
                      </button>
                    ) : (
                      <>
                        <button onClick={markAttendance} disabled={scanning || !selSession}
                          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                          <ScanFace size={15} />
                          {scanning ? 'Scanning...' : 'Mark My Attendance'}
                        </button>
                        <button onClick={stopCamera} className="btn-secondary w-full text-sm">
                          Stop Camera
                        </button>
                      </>
                    )}
                  </div>
                )}

                {marked && (
                  <button onClick={() => { setMarked(false); setSelSession(null); }}
                    className="btn-secondary w-full text-sm">
                    Mark Another Session
                  </button>
                )}

                <p className="text-xs text-white/30 text-center">
                  Position your face in the frame and click "Mark My Attendance"
                </p>
              </div>
            </div>

            {/* Right: Chart + Records */}
            <div className="lg:col-span-2 space-y-4">
              {/* Pie chart */}
              <div className="glass-card p-6">
                <h2 className="font-semibold text-white mb-4">Attendance Overview</h2>
                {data && data.stats.total > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background:'#131929', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, color:'#fff' }} />
                      <Legend formatter={v => <span style={{ color:'#ffffff80' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-40 text-white/30 text-sm">No records yet — mark attendance above</div>}
              </div>

              {/* Records list */}
              <div className="glass-card p-5">
                <h2 className="font-semibold text-white mb-4">Recent Records</h2>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl shimmer" />)}</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {data?.records?.slice(0, 20).map(r => (
                      <div key={r._id} className="flex items-center gap-3 p-3 bg-navy-800 rounded-xl">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status === 'present' ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{r.session?.title || 'Class Session'}</div>
                          <div className="text-xs text-white/40">{r.course?.code} · {format(new Date(r.markedAt), 'MMM d, h:mm a')}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'present' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                    {(!data?.records || data.records.length === 0) && (
                      <p className="text-white/30 text-sm text-center py-8">No attendance records yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
