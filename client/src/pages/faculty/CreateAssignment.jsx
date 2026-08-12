import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'mcq',       label: 'Multiple Choice (MCQ)' },
  { value: 'short',     label: 'Short Answer'           },
  { value: 'long',      label: 'Long Answer'            },
  { value: 'truefalse', label: 'True / False'           },
];

const blankQuestion = () => ({
  id: Date.now() + Math.random(),
  type: 'mcq',
  text: '',
  marks: 5,
  options: ['', '', '', ''],
  correctOption: 0,
  expanded: true,
});

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', course: '', dueDate: '', totalPoints: 100,
    allowedFormats: ['pdf', 'docx'], instructions: '',
  });
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get('/courses').then(r => setCourses(r.data)).catch(console.error); }, []);

  const update = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const toggleFormat = (fmt) => setForm(p => ({
    ...p, allowedFormats: p.allowedFormats.includes(fmt)
      ? p.allowedFormats.filter(f => f !== fmt) : [...p.allowedFormats, fmt],
  }));

  // ── Question helpers ──
  const addQuestion = () => setQuestions(q => [...q, blankQuestion()]);

  const removeQuestion = (id) => setQuestions(q => q.filter(x => x.id !== id));

  const updateQ = (id, field, value) =>
    setQuestions(q => q.map(x => x.id === id ? { ...x, [field]: value } : x));

  const toggleExpand = (id) =>
    setQuestions(q => q.map(x => x.id === id ? { ...x, expanded: !x.expanded } : x));

  const updateOption = (qId, idx, val) =>
    setQuestions(q => q.map(x => x.id === qId
      ? { ...x, options: x.options.map((o, i) => i === idx ? val : o) }
      : x));

  const addOption = (qId) =>
    setQuestions(q => q.map(x => x.id === qId && x.options.length < 6
      ? { ...x, options: [...x.options, ''] } : x));

  const removeOption = (qId, idx) =>
    setQuestions(q => q.map(x => x.id === qId && x.options.length > 2
      ? { ...x, options: x.options.filter((_, i) => i !== idx), correctOption: 0 } : x));

  // Auto-calc total marks from questions
  const questionTotal = questions.reduce((s, q) => s + Number(q.marks || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course) return toast.error('Please select a course');
    setSaving(true);
    try {
      const cleanQ = questions.map(({ id, expanded, ...q }) => q);
      await api.post('/assignments', { ...form, questions: cleanQ });
      toast.success('Assignment created!');
      navigate('/faculty');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Create Assignment" />
        <main className="flex-1 p-6">
          <div className="page-header">
            <h1 className="page-title">Create Assignment</h1>
            <p className="page-subtitle">Set up a new assignment with questions for your students</p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">

            {/* ── Basic Info ── */}
            <div className="glass-card p-6 space-y-5">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Basic Info</h2>

              <div>
                <label className="label">Assignment Title *</label>
                <input value={form.title} onChange={update('title')} className="input-field"
                  placeholder="e.g. Calculus Problem Set 1" required />
              </div>

              <div>
                <label className="label">Course *</label>
                <select value={form.course} onChange={update('course')} className="input-field" required>
                  <option value="">Select a course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Due Date & Time *</label>
                  <input type="datetime-local" value={form.dueDate} onChange={update('dueDate')} className="input-field" required />
                </div>
                <div>
                  <label className="label">
                    Total Points
                    {questionTotal > 0 && (
                      <span className="ml-2 text-accent-purple/80 text-xs font-normal">
                        (questions = {questionTotal} pts)
                      </span>
                    )}
                  </label>
                  <input type="number" value={form.totalPoints} onChange={update('totalPoints')}
                    className="input-field" min="1" />
                </div>
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={update('description')} rows={3}
                  className="input-field resize-none" placeholder="Describe the assignment..." />
              </div>

              <div>
                <label className="label">Instructions</label>
                <textarea value={form.instructions} onChange={update('instructions')} rows={2}
                  className="input-field resize-none" placeholder="Submission guidelines..." />
              </div>

              <div>
                <label className="label">Allowed File Formats</label>
                <div className="flex flex-wrap gap-2">
                  {['pdf', 'docx', 'pptx', 'png', 'jpg', 'zip'].map(fmt => (
                    <button key={fmt} type="button" onClick={() => toggleFormat(fmt)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        form.allowedFormats.includes(fmt)
                          ? 'bg-accent-purple/20 border-accent-purple text-accent-purple'
                          : 'bg-navy-800 border-white/10 text-white/50 hover:text-white'}`}>
                      .{fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Questions ── */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">Questions</h2>
                  <p className="text-xs text-white/30 mt-0.5">
                    {questions.length === 0 ? 'Optional — add questions or let students upload files' : `${questions.length} question(s) · ${questionTotal} marks`}
                  </p>
                </div>
                <button type="button" onClick={addQuestion}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                  <PlusCircle size={15} /> Add Question
                </button>
              </div>

              {questions.length === 0 && (
                <div className="border border-dashed border-white/10 rounded-xl p-8 text-center">
                  <PlusCircle size={28} className="mx-auto mb-2 text-white/20" />
                  <p className="text-white/30 text-sm">No questions yet. Click "Add Question" to start.</p>
                  <p className="text-white/20 text-xs mt-1">You can mix MCQ, short answer, true/false, and long answer questions.</p>
                </div>
              )}

              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-navy-800 rounded-xl border border-white/5 overflow-hidden">

                    {/* Question header */}
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-all"
                      onClick={() => toggleExpand(q.id)}>
                      <GripVertical size={14} className="text-white/20 flex-shrink-0" />
                      <div className="w-6 h-6 rounded-lg bg-accent-purple/20 text-accent-purple text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {q.text || <span className="text-white/30">Untitled question...</span>}
                        </p>
                        <p className="text-xs text-white/30">
                          {QUESTION_TYPES.find(t => t.value === q.type)?.label} · {q.marks} marks
                        </p>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                        className="text-red-400/50 hover:text-red-400 p-1 flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                      {q.expanded ? <ChevronUp size={14} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={14} className="text-white/30 flex-shrink-0" />}
                    </div>

                    {/* Expanded editor */}
                    {q.expanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2">
                            <label className="label text-xs">Question Type</label>
                            <select value={q.type} onChange={e => updateQ(q.id, 'type', e.target.value)}
                              className="input-field text-sm">
                              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label text-xs">Marks</label>
                            <input type="number" value={q.marks} min="1"
                              onChange={e => updateQ(q.id, 'marks', +e.target.value)}
                              className="input-field text-sm" />
                          </div>
                        </div>

                        <div>
                          <label className="label text-xs">Question Text *</label>
                          <textarea value={q.text} rows={2}
                            onChange={e => updateQ(q.id, 'text', e.target.value)}
                            className="input-field text-sm resize-none"
                            placeholder="Write your question here..." />
                        </div>

                        {/* MCQ options */}
                        {q.type === 'mcq' && (
                          <div className="space-y-2">
                            <label className="label text-xs">Options <span className="text-white/30">(select correct answer)</span></label>
                            {q.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button type="button" onClick={() => updateQ(q.id, 'correctOption', i)}
                                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                                    q.correctOption === i
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-white/20 hover:border-green-500/50'}`} />
                                <input value={opt} onChange={e => updateOption(q.id, i, e.target.value)}
                                  className="input-field text-sm flex-1 py-2"
                                  placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                                {q.options.length > 2 && (
                                  <button type="button" onClick={() => removeOption(q.id, i)}
                                    className="text-red-400/50 hover:text-red-400 p-1 flex-shrink-0">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {q.options.length < 6 && (
                              <button type="button" onClick={() => addOption(q.id)}
                                className="text-xs text-accent-purple/70 hover:text-accent-purple flex items-center gap-1">
                                <PlusCircle size={12} /> Add option
                              </button>
                            )}
                          </div>
                        )}

                        {/* True / False */}
                        {q.type === 'truefalse' && (
                          <div>
                            <label className="label text-xs">Correct Answer</label>
                            <div className="flex gap-3">
                              {['True', 'False'].map(v => (
                                <button key={v} type="button"
                                  onClick={() => updateQ(q.id, 'correctOption', v)}
                                  className={`px-6 py-2 rounded-xl text-sm font-medium border transition-all ${
                                    q.correctOption === v
                                      ? v === 'True'
                                        ? 'bg-green-500/20 border-green-500 text-green-400'
                                        : 'bg-red-500/20 border-red-500 text-red-400'
                                      : 'bg-navy-700 border-white/10 text-white/50 hover:text-white'}`}>
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Short / Long answer — just a hint */}
                        {(q.type === 'short' || q.type === 'long') && (
                          <div className="bg-navy-900/60 rounded-xl px-4 py-3 text-xs text-white/40 border border-white/5">
                            📝 Students will type their {q.type === 'short' ? 'short' : 'detailed'} answer in a text box.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {questions.length > 0 && (
                <button type="button" onClick={addQuestion}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                  <PlusCircle size={14} /> Add Another Question
                </button>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/faculty')} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Creating...' : `+ Create Assignment${questions.length > 0 ? ` (${questions.length} questions)` : ''}`}
              </button>
            </div>

          </form>
        </main>
      </div>
    </div>
  );
}
