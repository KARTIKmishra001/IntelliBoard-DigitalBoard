import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { BookMarked, PlusCircle, Trash2, Users } from 'lucide-react';

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ title: '', code: '', description: '', faculty: '' });

  const fetchCourses = async () => {
    setLoading(true);
    const [c, u] = await Promise.all([api.get('/courses'), api.get('/admin/users?role=faculty&limit=100')]);
    setCourses(c.data);
    setFaculty(u.data.users || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const createCourse = async () => {
    if (!form.title || !form.code) return toast.error('Title and code required');
    try {
      await api.post('/courses', form);
      toast.success('Course created!');
      setAddModal(false);
      setForm({ title: '', code: '', description: '', faculty: '' });
      fetchCourses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    await api.delete(`/courses/${id}`);
    toast.success('Course deleted');
    fetchCourses();
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Manage Courses" />
        <main className="flex-1 p-6 space-y-5">
          <div className="flex items-center justify-between page-header">
            <div>
              <h1 className="page-title">Manage Courses</h1>
              <p className="page-subtitle">{courses.length} courses in the system</p>
            </div>
            <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
              <PlusCircle size={16} /> Create Course
            </button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl shimmer" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map(c => (
                <div key={c._id} className="glass-card-hover p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <BookMarked size={18} className="text-green-400" />
                    </div>
                    <button onClick={() => deleteCourse(c._id)} className="text-red-400/50 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-white">{c.title}</h3>
                  <p className="text-xs text-accent-purple font-medium mb-1">{c.code}</p>
                  <p className="text-xs text-white/40 mb-3 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span>Faculty: {c.faculty?.name || '—'}</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {c.students?.length || 0}</span>
                  </div>
                </div>
              ))}
              {courses.length === 0 && <p className="text-white/30 col-span-3 text-center py-12">No courses yet</p>}
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Create New Course">
        <div className="space-y-4">
          <div>
            <label className="label">Course Title *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field" placeholder="e.g. Mathematics 101" />
          </div>
          <div>
            <label className="label">Course Code *</label>
            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} className="input-field" placeholder="e.g. MATH101" />
          </div>
          <div>
            <label className="label">Assign Faculty</label>
            <select value={form.faculty} onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))} className="input-field">
              <option value="">Select faculty</option>
              {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="input-field resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createCourse} className="btn-primary flex-1">Create Course</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
