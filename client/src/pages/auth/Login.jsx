import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, School, Brain, Hand, Languages, Users } from 'lucide-react';

const features = [
  { icon: Brain, text: 'AI-Powered OCR & Shape Recognition' },
  { icon: Hand, text: 'Gesture-Based Whiteboard Interaction' },
  { icon: Languages, text: 'Real-time Translation & Summarization' },
  { icon: Users, text: 'Faculty & Student Collaboration' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy-900 overflow-hidden">
      {/* Animated blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent-purple/20 blur-3xl animate-blob" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-accent-blue/20 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-green-500/10 blur-3xl animate-blob" style={{ animationDelay: '5s' }} />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative z-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/30">
            <School size={24} className="text-white" />
          </div>
          <div>
            <span className="text-2xl font-bold text-white">IntelliBoard </span>
            <span className="text-2xl font-bold text-accent-purple">360</span>
          </div>
        </div>

        <h1 className="text-5xl font-bold text-white mb-5 leading-tight">
          Smart <span className="gradient-text">Learning</span><br />Starts Here
        </h1>
        <p className="text-white/60 text-lg mb-10 max-w-md leading-relaxed">
          An AI-powered digital whiteboard platform for real-time collaboration, gesture control, and intelligent learning.
        </p>

        <div className="space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-accent-purple" />
              </div>
              <span className="text-white/70">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login card */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full glass-card p-8 shadow-2xl shadow-black/40"
        >
          <h2 className="text-2xl font-bold text-white mb-1">Welcome Back 👋</h2>
          <p className="text-white/50 text-sm mb-8">Sign in to your IntelliBoard 360 account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@intelliboard.edu"
                  className="input-field pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-accent-purple hover:text-accent-purple-light font-semibold transition-colors">
                Register now
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-3 bg-navy-800 rounded-xl border border-white/5">
            <p className="text-xs text-white/30 mb-2 font-medium">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-white/50">
              <div>Student: alice@intelliboard.edu / Student@123</div>
              <div>Faculty: sarah.johnson@intelliboard.edu / Faculty@123</div>
              <div>Admin: admin@intelliboard.edu / Admin@123</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
