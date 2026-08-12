import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';
import { aiService } from '../../services/aiService.js';
import toast from 'react-hot-toast';
import { Plus, Trash2, Sparkles, CheckCircle } from 'lucide-react';

const blankQ = () => ({ question: '', options: ['', '', '', ''], correctAnswer: '', points: 1 });

export default function CreateTest() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', course: '', startTime: '', endTime: '', duration: 60, isPublished: false });
  const [questions, setQuestions] = useState([blankQ()]);
  const [saving, setSaving] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { api.get('/courses').then(r => setCourses(r.data)).catch(console.error); }, []);

  const update = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const updateQ = (i, f, v) => setQuestions(qs => { const n = [...qs]; n[i] = { ...n[i], [f]: v }; return n; });
  const updateOpt = (qi, oi, v) => setQuestions(qs => { const n = [...qs]; n[qi].options[oi] = v; return n; });

  const generateWithAI = async () => {
    if (!aiTopic) return toast.error('Enter a topic');
    setAiLoading(true);
    try {
      const r = await aiService.quiz(aiTopic, 5);
      const generated = r.questions.map(q => ({
        question: q.question, options: q.options, correctAnswer: q.correct, points: 1,
      }));
      setQuestions(generated);
      setAiModal(false);
      toast.success(`Generated ${generated.length} questions!`);
    } catch { toast.error('AI generation failed'); }
    finally { setAiLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course) return toast.error('Select a course');
    setSaving(true);
    try {
      await api.post('/tests', { ...form, questions });
      toast.success('Test created!');
      navigate('/faculty');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Create Test" />
        <main className="flex-1 p-6">
          <div className="page-header">
            <h1 className="page-title">Create Test</h1>
            <p className="page-subtitle">Build a test manually or use AI to generate questions</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-semibold text-white">Test Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Test Title *</label>
                  <input value={form.title} onChange={update('title')} className="input-field" required />
                </div>
                <div>
                  <label className="label">Course *</label>
                  <select value={form.course} onChange={update('course')} className="input-field" required>
                    <option value="">Select course</option>
                    {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Duration (minutes)</label>
                  <input type="number" value={form.duration} onChange={update('duration')} className="input-field" min="5" />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input type="datetime-local" value={form.startTime} onChange={update('startTime')} className="input-field" />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="datetime-local" value={form.endTime} onChange={update('endTime')} className="input-field" />
                </div>
              </div>
            </div>
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Questions ({questions.length})</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAiModal(true)} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                    <Sparkles size={14} /> AI Generate
                  </button>
                  <button type="button" onClick={() => setQuestions(q => [...q, blankQ()])} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1">
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
              {questions.map((q, qi) => (
                <div key={qi} className="bg-navy-800 rounded-xl p-4 border border-white/5 space-y-3">
                  <div className="flex gap-2 items-start">
                    <span className="w-6 h-6 rounded-lg bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center mt-2 flex-shrink-0">{qi+1}</span>
                    <input value={q.question} onChange={e => updateQ(qi, 'question', e.target.value)} placeholder="Question text..." className="input-field flex-1" />
                    {questions.length > 1 && <button type="button" onClick={() => setQuestions(qs => qs.filter((_,i) => i !== qi))} className="text-red-400/60 hover:text-red-400 mt-2"><Trash2 size={15} /></button>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-8">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button type="button" onClick={() => updateQ(qi, 'correctAnswer', String.fromCharCode(65+oi))}
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${q.correctAnswer === String.fromCharCode(65+oi) ? 'border-green-500 bg-green-500/20' : 'border-white/20'}`}>
                          {q.correctAnswer === String.fromCharCode(65+oi) && <div className="w-2 h-2 rounded-full bg-green-400" />}
                        </button>
                        <input value={opt} onChange={e => updateOpt(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65+oi)}`} className="input-field py-1.5 text-sm flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/faculty')} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create Test'}</button>
            </div>
          </form>
        </main>
      </div>
      <Modal isOpen={aiModal} onClose={() => setAiModal(false)} title="AI Question Generator">
        <p className="text-white/50 text-sm mb-4">Enter a topic to generate 5 MCQ questions.</p>
        <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g. Calculus derivatives" className="input-field mb-4" />
        <div className="flex gap-3">
          <button onClick={() => setAiModal(false)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={generateWithAI} disabled={aiLoading} className="btn-primary flex-1">
            {aiLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
