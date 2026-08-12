import { useState, useEffect } from 'react';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import Modal from '../../components/common/Modal.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Search, UserPlus, Trash2, Edit, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'student' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/users?search=${search}&role=${roleFilter}&limit=50`);
      setUsers(r.data.users);
      setTotal(r.data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    toast.success('User deleted');
    fetchUsers();
  };

  const toggleActive = async (id) => {
    await api.patch(`/users/${id}/toggle-active`);
    toast.success('Status updated');
    fetchUsers();
  };

  const changeRole = async (id, role) => {
    await api.patch(`/users/${id}/role`, { role });
    toast.success('Role updated');
    fetchUsers();
  };

  const createUser = async () => {
    try {
      await api.post('/admin/users', addForm);
      toast.success('User created!');
      setAddModal(false);
      setAddForm({ name: '', email: '', password: '', role: 'student' });
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Manage Users" />
        <main className="flex-1 p-6 space-y-5">
          <div className="page-header">
            <h1 className="page-title">Manage Users</h1>
            <p className="page-subtitle">{total} total users registered</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="input-field pl-9" />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-40">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
            <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
              <UserPlus size={16} /> Add User
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-16 text-center text-white/30">Loading...</td></tr>
                ) : users.map(u => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-white/50 text-xs">{u.email}</td>
                    <td>
                      <select value={u.role} onChange={e => changeRole(u._id, e.target.value)}
                        className="bg-navy-700 border border-white/10 rounded-lg px-2 py-1 text-xs text-white">
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-present' : 'badge-absent'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="text-white/40 text-xs">{u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => toggleActive(u._id)} className="btn-icon text-xs" title="Toggle status">
                          <ShieldCheck size={14} />
                        </button>
                        <button onClick={() => deleteUser(u._id)} className="btn-icon text-red-400/60 hover:text-red-400" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New User">
        <div className="space-y-4">
          {[['name','Full Name','text'],['email','Email','email'],['password','Password (default: Intelliboard@123)','password']].map(([f, label, type]) => (
            <div key={f}>
              <label className="label">{label}</label>
              <input type={type} value={addForm[f]} onChange={e => setAddForm(p => ({ ...p, [f]: e.target.value }))} className="input-field" />
            </div>
          ))}
          <div>
            <label className="label">Role</label>
            <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))} className="input-field">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createUser} className="btn-primary flex-1">Create User</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
