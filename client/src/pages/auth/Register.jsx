import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, School, CreditCard } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student', rollNumber: '', employeeId: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const data = await register(form);
      toast.success(`Account created! Welcome, ${data.user.name}!`);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 p-6 overflow-hidden">
      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent-purple/20 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent-blue/20 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-8 shadow-2xl relative z-10"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
            <School size={20} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white">IntelliBoard </span>
            <span className="font-bold text-accent-purple">360</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
        <p className="text-white/50 text-sm mb-6">Join IntelliBoard 360 today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="label">I am a</label>
            <div className="grid grid-cols-2 gap-2">
              {['student', 'faculty'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`py-2.5 rounded-xl text-sm font-medium capitalize border transition-all duration-200 ${
                    form.role === r
                      ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white border-transparent'
                      : 'bg-navy-800 text-white/50 border-white/10 hover:text-white hover:border-white/20'
                  }`}
                >
                  {r === 'student' ? '🎓 Student' : '🏫 Faculty'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="text" value={form.name} onChange={update('name')} placeholder="Your full name" className="input-field pl-10" required />
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" value={form.email} onChange={update('email')} placeholder="you@intelliboard.edu" className="input-field pl-10" required />
            </div>
          </div>

          {form.role === 'student' && (
            <div>
              <label className="label">Roll Number <span className="text-white/30">(optional)</span></label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" value={form.rollNumber} onChange={update('rollNumber')} placeholder="e.g. STU001" className="input-field pl-10" />
              </div>
            </div>
          )}

          {form.role === 'faculty' && (
            <div>
              <label className="label">Employee ID <span className="text-white/30">(optional)</span></label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input type="text" value={form.employeeId} onChange={update('employeeId')} placeholder="e.g. FAC001" className="input-field pl-10" />
              </div>
            </div>
          )}

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="Min. 6 characters" className="input-field pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="password" value={form.confirm} onChange={update('confirm')} placeholder="Repeat password" className="input-field pl-10" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : 'Create Account →'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-white/40 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-purple hover:text-accent-purple-light font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
