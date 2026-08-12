import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Star, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

export default function GradeSubmissions() {
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradeModal, setGradeModal] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/assignments').then(r => setAssignments(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadSubmissions = async (assignment) => {
    setSelected(assignment);
    const r = await api.get(`/assignments/${assignment._id}/submissions`);
    setSubmissions(r.data);
  };

  const saveGrade = async () => {
    setSaving(true);
    try {
      await api.patch(`/assignments/submissions/${gradeModal._id}/grade`, gradeForm);
      toast.success('Grade saved!');
      setGradeModal(null);
      if (selected) loadSubmissions(selected);
    } catch { toast.error('Failed to save grade'); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Grade Submissions" />
        <main className="flex-1 p-6">
          <div className="page-header">
            <h1 className="page-title">Grade Submissions</h1>
            <p className="page-subtitle">Review and grade student assignment submissions</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Assignments list */}
            <div className="glass-card p-4 space-y-2 h-fit">
              <h2 className="font-semibold text-white text-sm px-2 mb-3">Assignments</h2>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl shimmer" />)}</div>
              ) : assignments.map(a => (
                <button key={a._id} onClick={() => loadSubmissions(a)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${selected?._id === a._id ? 'bg-accent-purple/20 border border-accent-purple/30' : 'bg-navy-800 hover:bg-navy-700 border border-transparent'}`}>
                  <div className="text-sm font-medium text-white truncate">{a.title}</div>
                  <div className="text-xs text-white/40 mt-0.5">{a.course?.code} · {a.submissions?.length || 0} submissions</div>
                </button>
              ))}
            </div>

            {/* Submissions */}
            <div className="lg:col-span-2 glass-card p-6">
              {!selected ? (
                <div className="text-center py-16 text-white/30">
                  <Star size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Select an assignment to view submissions</p>
                </div>
              ) : (
                <>
                  <h2 className="font-semibold text-white mb-4">
                    {selected.title} <span className="text-white/40 font-normal text-sm">({submissions.length} submissions)</span>
                  </h2>
                  <div className="space-y-3">
                    {submissions.map(sub => (
                      <div key={sub._id} className="flex items-center gap-4 p-4 bg-navy-800 rounded-xl border border-white/5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {sub.student?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">{sub.student?.name}</div>
                          <div className="text-xs text-white/40">{format(new Date(sub.submittedAt), 'MMM d, h:mm a')}</div>
                        </div>
                        {sub.status === 'graded' ? (
                          <span className="text-green-400 font-semibold text-sm">{sub.grade}/{selected.totalPoints}</span>
                        ) : <span className="badge badge-submitted">Submitted</span>}
                        {sub.filePath && (
                          <a href={sub.filePath} target="_blank" rel="noreferrer" className="btn-icon">
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button onClick={() => { setGradeModal(sub); setGradeForm({ grade: sub.grade || '', feedback: sub.feedback || '' }); }}
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                          <Star size={12} /> Grade
                        </button>
                      </div>
                    ))}
                    {submissions.length === 0 && <p className="text-white/30 text-sm text-center py-8">No submissions yet</p>}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <Modal isOpen={!!gradeModal} onClose={() => setGradeModal(null)} title={`Grade: ${gradeModal?.student?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="label">Points (out of {selected?.totalPoints})</label>
            <input type="number" value={gradeForm.grade} onChange={e => setGradeForm(p => ({ ...p, grade: e.target.value }))}
              min="0" max={selected?.totalPoints} className="input-field" />
          </div>
          <div>
            <label className="label">Feedback</label>
            <textarea value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))}
              rows={3} className="input-field resize-none" placeholder="Write feedback for the student..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setGradeModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={saveGrade} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save Grade'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
