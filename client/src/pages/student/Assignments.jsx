import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { BookOpen, Upload, Eye, Star, Clock, Filter } from 'lucide-react';
import { format, isPast } from 'date-fns';

const TABS = ['All', 'Pending', 'Submitted', 'Graded'];

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [submitModal, setSubmitModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/assignments').then(r => setAssignments(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setFile(files[0]),
    maxFiles: 1,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'], 'image/*': ['.png', '.jpg'] },
  });

  const getStatus = (a) => {
    if (a.mySubmission?.status === 'graded') return 'graded';
    if (a.mySubmission) return 'submitted';
    return isPast(new Date(a.dueDate)) ? 'overdue' : 'pending';
  };

  const filtered = assignments.filter(a => {
    if (filter === 'All') return true;
    const s = getStatus(a);
    return filter.toLowerCase() === s;
  });

  const handleSubmit = async () => {
    if (!file) return toast.error('Please select a file');
    setSubmitting(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/assignments/${submitModal._id}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Assignment submitted!');
      setSubmitModal(null);
      setFile(null);
      const r = await api.get('/assignments');
      setAssignments(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = { pending: 'badge-pending', submitted: 'badge-submitted', graded: 'badge-graded', overdue: 'badge-absent' };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Assignments" />
        <main className="flex-1 p-6">
          <div className="page-header">
            <h1 className="page-title">My Assignments</h1>
            <p className="page-subtitle">Track and submit your course assignments</p>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {TABS.map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === t ? 'bg-accent-purple text-white' : 'bg-navy-700 text-white/50 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl shimmer" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((a, i) => {
                const status = getStatus(a);
                return (
                  <motion.div key={a._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card-hover p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-blue-400" />
                      </div>
                      <span className={`badge ${statusBadge[status] || 'badge-pending'} capitalize`}>{status}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{a.title}</h3>
                      <p className="text-xs text-white/40 mt-1 line-clamp-2">{a.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span className="badge-admin badge">{a.course?.code}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> Due {format(new Date(a.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex gap-2 mt-auto pt-2 border-t border-white/5">
                      <button onClick={() => setDetailModal(a)} className="btn-ghost text-xs flex-1 flex items-center justify-center gap-1">
                        <Eye size={12} /> Details
                      </button>
                      {status === 'pending' && (
                        <button onClick={() => setSubmitModal(a)} className="btn-primary text-xs flex-1 flex items-center justify-center gap-1 py-1.5">
                          <Upload size={12} /> Submit
                        </button>
                      )}
                      {status === 'graded' && (
                        <div className="flex items-center gap-1 text-xs text-green-400 font-semibold px-3">
                          <Star size={12} /> {a.mySubmission?.grade}/{a.totalPoints}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-16 text-white/30">
                  <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                  No assignments found for "{filter}"
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Submit Modal */}
      <Modal isOpen={!!submitModal} onClose={() => { setSubmitModal(null); setFile(null); }} title={`Submit: ${submitModal?.title}`}>
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-accent-purple bg-accent-purple/5' : 'border-white/10 hover:border-accent-purple/50'}`}>
          <input {...getInputProps()} />
          <Upload size={32} className="mx-auto mb-3 text-white/30" />
          {file ? <p className="text-white font-medium">{file.name}</p> : <p className="text-white/50">Drag & drop or click to upload</p>}
          <p className="text-xs text-white/30 mt-1">Formats: {submitModal?.allowedFormats?.join(', ')}</p>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={() => { setSubmitModal(null); setFile(null); }} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !file} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal?.title} size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-white/40">Course:</span> <span className="text-white ml-2">{detailModal.course?.title}</span></div>
              <div><span className="text-white/40">Points:</span> <span className="text-white ml-2">{detailModal.totalPoints}</span></div>
              <div><span className="text-white/40">Due:</span> <span className="text-white ml-2">{format(new Date(detailModal.dueDate), 'PPpp')}</span></div>
              <div><span className="text-white/40">Formats:</span> <span className="text-white ml-2">{detailModal.allowedFormats?.join(', ')}</span></div>
            </div>
            <div><p className="text-white/40 text-sm mb-1">Description</p><p className="text-white/80 text-sm">{detailModal.description}</p></div>
            {detailModal.instructions && <div><p className="text-white/40 text-sm mb-1">Instructions</p><p className="text-white/80 text-sm">{detailModal.instructions}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
