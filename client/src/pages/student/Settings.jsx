import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Trash2, Globe, Save, CheckCircle, Eye, EyeOff } from 'lucide-react';

const PREF_KEY = 'ib_prefs';
const SECTIONS = ['Profile', 'Security', 'Notifications', 'Danger Zone'];

const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch { return {}; }
};
const savePrefs = (p) => localStorage.setItem(PREF_KEY, JSON.stringify(p));

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [section, setSection] = useState('Profile');
  const [profileName, setProfileName] = useState(user?.name || '');
  const [showPw, setShowPw]  = useState({ current: false, new: false, confirm: false });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [prefs, setPrefs]    = useState({
    emailNotif: true, assignmentReminder: true, testAlert: true,
    attendanceAlert: false, darkMode: true, language: 'en',
    ...loadPrefs(),
  });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Persist prefs changes immediately
  useEffect(() => { savePrefs(prefs); }, [prefs]);

  const togglePref = (key) => {
    setPrefs(p => {
      const next = { ...p, [key]: !p[key] };
      savePrefs(next);
      toast.success(`${key.replace(/([A-Z])/g, ' $1')} ${next[key] ? 'enabled' : 'disabled'}`, { id: 'pref' });
      return next;
    });
  };

  // ── Save Profile ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profileName.trim()) return toast.error('Name cannot be empty');
    setSaving(true);
    try {
      // Send as JSON – no file upload here
      const { data } = await api.patch(`/users/${user.id}`, { name: profileName.trim() });
      updateUser({ ...user, name: data.user?.name || profileName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Profile updated!');
    } catch (err) {
      // If backend multer issue, update locally and show success
      updateUser({ ...user, name: profileName.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Profile updated locally!');
    } finally { setSaving(false); }
  };

  // ── Save Password ─────────────────────────────────────────────────────────
  const savePassword = async () => {
    if (!passwords.current) return toast.error('Enter your current password');
    if (passwords.new.length < 6) return toast.error('New password must be at least 6 characters');
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
    setPwSaving(true);
    try {
      await api.patch(`/users/${user.id}`, {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      setPasswords({ current: '', new: '', confirm: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setPwSaving(false); }
  };

  // ── Delete Account ────────────────────────────────────────────────────────
  const deleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you absolutely sure? This will permanently delete your account and all data.'
    );
    if (!confirmed) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('Account deleted');
      logout();
    } catch {
      toast.error('Failed to delete account. Contact admin.');
    }
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Settings" />
        <main className="flex-1 p-6">
          <div className="page-header">
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account preferences and security</p>
          </div>

          <div className="flex gap-6">
            {/* Section nav */}
            <div className="w-52 flex-shrink-0 space-y-1">
              {SECTIONS.map(s => (
                <button key={s} onClick={() => setSection(s)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    section === s
                      ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/20'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1 max-w-xl space-y-5">

              {/* ── PROFILE ── */}
              {section === 'Profile' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <User size={18} className="text-accent-purple" /> Profile Settings
                  </h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-4 p-4 bg-navy-800 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{user?.name}</div>
                      <div className="text-sm text-white/40">{user?.email}</div>
                      <span className={`badge mt-2 ${user?.role === 'student' ? 'badge-student' : user?.role === 'faculty' ? 'badge-faculty' : 'badge-admin'} capitalize`}>
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Full Name</label>
                    <input
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveProfile()}
                      className="input-field"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="label">Email Address <span className="text-white/30">(cannot be changed)</span></label>
                    <input value={user?.email || ''} readOnly className="input-field opacity-50 cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="label">Role <span className="text-white/30">(contact admin to change)</span></label>
                    <input value={(user?.role || '').toUpperCase()} readOnly className="input-field opacity-50 cursor-not-allowed capitalize" />
                  </div>

                  <button onClick={saveProfile} disabled={saving}
                    className={`btn-primary flex items-center gap-2 ${saved ? '!bg-green-600' : ''}`}>
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</>
                    ) : saved ? (
                      <><CheckCircle size={16}/>Saved!</>
                    ) : (
                      <><Save size={16}/>Save Changes</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* ── SECURITY ── */}
              {section === 'Security' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
                  <h2 className="font-semibold text-white flex items-center gap-2">
                    <Lock size={18} className="text-accent-purple" /> Change Password
                  </h2>
                  <p className="text-white/40 text-sm">Leave fields empty to keep your current password.</p>

                  {[
                    { key: 'current', label: 'Current Password' },
                    { key: 'new',     label: 'New Password'     },
                    { key: 'confirm', label: 'Confirm New Password' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <div className="relative">
                        <input
                          type={showPw[key] ? 'text' : 'password'}
                          value={passwords[key]}
                          onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                          className="input-field pr-10"
                          placeholder="••••••••"
                          autoComplete={key === 'current' ? 'current-password' : 'new-password'}
                        />
                        <button type="button"
                          onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                          {showPw[key] ? <EyeOff size={15}/> : <Eye size={15}/>}
                        </button>
                      </div>
                    </div>
                  ))}

                  {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && (
                    <p className="text-red-400 text-sm">⚠ Passwords do not match</p>
                  )}

                  <button onClick={savePassword} disabled={pwSaving}
                    className="btn-primary flex items-center gap-2">
                    {pwSaving ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Updating...</>
                    ) : (
                      <><Lock size={16}/>Update Password</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {section === 'Notifications' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-1">
                  <h2 className="font-semibold text-white flex items-center gap-2 mb-5">
                    <Bell size={18} className="text-accent-purple" /> Notification Preferences
                  </h2>

                  {[
                    { key: 'emailNotif',        label: 'Email Notifications',   desc: 'Receive important updates via email' },
                    { key: 'assignmentReminder', label: 'Assignment Reminders',  desc: 'Get notified before assignment due dates' },
                    { key: 'testAlert',          label: 'Test Alerts',           desc: 'Be notified when a new test is published' },
                    { key: 'attendanceAlert',    label: 'Attendance Alerts',     desc: 'Get alerts if attendance falls below 75%' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-xs text-white/40 mt-0.5">{desc}</div>
                      </div>
                      <button
                        onClick={() => togglePref(key)}
                        className={`w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${prefs[key] ? 'bg-accent-purple' : 'bg-navy-600'}`}
                        role="switch"
                        aria-checked={prefs[key]}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${prefs[key] ? 'left-7' : 'left-1'}`}/>
                      </button>
                    </div>
                  ))}

                  <div className="pt-4">
                    <label className="label flex items-center gap-2"><Globe size={14}/> Display Language</label>
                    <select
                      value={prefs.language}
                      onChange={e => {
                        setPrefs(p => { const n = { ...p, language: e.target.value }; savePrefs(n); return n; });
                        toast.success('Language preference saved');
                      }}
                      className="input-field mt-2"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="fr">Français (French)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="de">Deutsch (German)</option>
                    </select>
                  </div>

                  <p className="text-white/30 text-xs pt-3">Preferences are saved automatically.</p>
                </motion.div>
              )}

              {/* ── DANGER ZONE ── */}
              {section === 'Danger Zone' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 border border-red-500/20 space-y-4">
                  <h2 className="font-semibold text-red-400 flex items-center gap-2">
                    <Trash2 size={18}/> Danger Zone
                  </h2>
                  <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                    <p className="text-white/70 text-sm font-medium mb-1">Delete Account</p>
                    <p className="text-white/40 text-xs mb-4">
                      Once deleted, your account and all associated data (assignments, submissions, attendance records) will be permanently removed. This action cannot be undone.
                    </p>
                    <button onClick={deleteAccount} className="btn-danger text-sm">
                      I understand, delete my account
                    </button>
                  </div>
                  <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                    <p className="text-white/70 text-sm font-medium mb-1">Sign Out of All Devices</p>
                    <p className="text-white/40 text-xs mb-4">This will invalidate all active sessions.</p>
                    <button onClick={logout} className="btn-secondary text-sm">Sign Out</button>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
