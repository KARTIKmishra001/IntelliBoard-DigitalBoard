import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { ClipboardCheck, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';
import { useAuth } from '../../context/AuthContext.jsx';

const TABS = ['Upcoming', 'Active', 'Completed'];

export default function Tests() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [filter, setFilter] = useState('Upcoming');
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/tests').then(r => setTests(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeTest || result) return;
    setTimeLeft((activeTest.duration || 60) * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeTest, result]);

  const startTest = async (test) => {
    try {
      const r = await api.post(`/tests/${test._id}/start`);
      setAttempt(r.data);
      setActiveTest(test);
      setAnswers({});
      setCurrentQ(0);
      setResult(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start test');
    }
  };

  const handleSubmit = async (timedOut = false) => {
    if (submitting || !attempt) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    const answerList = Object.entries(answers).map(([questionId, selectedAnswer]) => ({ questionId, selectedAnswer }));
    try {
      const r = await api.post(`/tests/${activeTest._id}/submit`, { answers: answerList, attemptId: attempt._id });
      setResult(r.data);
      if (timedOut) toast.error('Time up! Test auto-submitted.');
      else toast.success(`Test submitted! Score: ${r.data.score}/${activeTest.totalPoints}`);
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const getStatus = (t) => {
    if (!t.startTime) return 'upcoming';
    const now = new Date();
    const start = new Date(t.startTime);
    const end = new Date(t.endTime || '');
    if (isFuture(start)) return 'upcoming';
    if (t.endTime && isPast(end)) return 'completed';
    return 'active';
  };

  const filtered = tests.filter(t => getStatus(t) === filter.toLowerCase());

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Tests" />
        <main className="flex-1 p-6">
          <div className="page-header">
            <h1 className="page-title">My Tests</h1>
            <p className="page-subtitle">Manage and take your scheduled tests</p>
          </div>

          <div className="flex gap-2 mb-6">
            {TABS.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === t ? 'bg-accent-purple text-white' : 'bg-navy-700 text-white/50 hover:text-white'}`}>{t}</button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t, i) => (
                <motion.div key={t._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card-hover p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck size={18} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{t.title}</h3>
                    <p className="text-xs text-white/40 flex items-center gap-2">
                      <span>{t.course?.code}</span>
                      {t.startTime && <><span>·</span><Clock size={10} /><span>{format(new Date(t.startTime), 'MMM d, h:mm a')}</span></>}
                      <span>· {t.duration} min · {t.totalPoints} pts</span>
                    </p>
                  </div>
                  {getStatus(t) === 'active' && (
                    <button onClick={() => startTest(t)} className="btn-primary text-sm px-4 py-2">Start Test</button>
                  )}
                  {getStatus(t) === 'completed' && <span className="badge badge-graded">Completed</span>}
                  {getStatus(t) === 'upcoming' && <span className="badge badge-pending">Upcoming</span>}
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-16 text-white/30">
                  <ClipboardCheck size={40} className="mx-auto mb-3 opacity-30" />
                  No {filter.toLowerCase()} tests
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Test-taking modal */}
      <Modal isOpen={!!activeTest && !result} onClose={() => {}} size="xl" className="!max-h-screen overflow-y-auto">
        {activeTest && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">{activeTest.title}</h2>
                <p className="text-white/40 text-sm">{Object.keys(answers).length}/{activeTest.questions?.length} answered</p>
              </div>
              <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-xl ${timeLeft < 300 ? 'text-red-400 bg-red-500/10' : 'text-white bg-navy-800'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Progress */}
            <div className="h-1.5 bg-navy-800 rounded-full mb-6">
              <div className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full transition-all"
                style={{ width: `${(Object.keys(answers).length / (activeTest.questions?.length || 1)) * 100}%` }} />
            </div>

            {/* Question */}
            {activeTest.questions?.[currentQ] && (
              <div className="mb-6">
                <p className="text-white font-medium mb-4">Q{currentQ + 1}: {activeTest.questions[currentQ].question}</p>
                <div className="space-y-3">
                  {activeTest.questions[currentQ].options?.map((opt) => (
                    <label key={opt} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      answers[activeTest.questions[currentQ]._id] === opt
                        ? 'bg-accent-purple/20 border-accent-purple text-white'
                        : 'bg-navy-800 border-white/5 text-white/70 hover:border-white/20'}`}>
                      <input type="radio" name={`q${currentQ}`} value={opt}
                        checked={answers[activeTest.questions[currentQ]._id] === opt}
                        onChange={() => setAnswers(a => ({ ...a, [activeTest.questions[currentQ]._id]: opt }))}
                        className="hidden" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        answers[activeTest.questions[currentQ]._id] === opt ? 'border-accent-purple' : 'border-white/20'}`}>
                        {answers[activeTest.questions[currentQ]._id] === opt && <div className="w-2 h-2 rounded-full bg-accent-purple" />}
                      </div>
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Question palette */}
            <div className="flex flex-wrap gap-2 mb-6">
              {activeTest.questions?.map((q, idx) => (
                <button key={idx} onClick={() => setCurrentQ(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                    idx === currentQ ? 'bg-accent-purple text-white'
                    : answers[q._id] ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-navy-800 text-white/40 hover:text-white'}`}>
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Nav */}
            <div className="flex gap-3">
              <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} className="btn-secondary flex items-center gap-2">
                <ChevronLeft size={16} /> Prev
              </button>
              {currentQ < (activeTest.questions?.length || 1) - 1 ? (
                <button onClick={() => setCurrentQ(q => q + 1)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={() => { if (confirm('Submit test?')) handleSubmit(); }} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Submitting...' : '✓ Submit Test'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Result modal */}
      <Modal isOpen={!!result} onClose={() => { setResult(null); setActiveTest(null); setAttempt(null); }} title="Test Results" size="lg">
        {result && (
          <div className="text-center">
            <div className="text-6xl font-bold gradient-text mb-2">{result.score}</div>
            <p className="text-white/50 text-lg mb-6">out of {activeTest?.totalPoints} points</p>
            <div className="h-3 bg-navy-800 rounded-full mb-6">
              <div className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full"
                style={{ width: `${(result.score / (activeTest?.totalPoints || 1)) * 100}%` }} />
            </div>
            <p className="text-white/60">
              {result.score / (activeTest?.totalPoints || 1) >= 0.8 ? '🏆 Excellent!' : result.score / (activeTest?.totalPoints || 1) >= 0.6 ? '👍 Good job!' : '📚 Keep practicing!'}
            </p>
            <button onClick={() => { setResult(null); setActiveTest(null); setAttempt(null); }} className="btn-primary mt-6 px-8">Done</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
