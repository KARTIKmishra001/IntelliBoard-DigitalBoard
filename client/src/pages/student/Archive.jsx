import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/common/Sidebar.jsx';
import Navbar from '../../components/common/Navbar.jsx';
import api from '../../services/api.js';
import { Archive as ArchiveIcon, Search, Download, FileImage, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function Archive() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/archive').then(r => setArchives(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = archives.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const downloadArchive = (arc) => {
    const link = document.createElement('a');
    link.href = arc.filePath;
    link.download = arc.fileName || `${arc.title}.png`;
    link.click();
  };

  return (
    <div className="flex min-h-screen bg-navy-900">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title="Archive" />
        <main className="flex-1 p-6">
          <div className="page-header">
            <h1 className="page-title">Session Archive</h1>
            <p className="page-subtitle">Browse and download saved whiteboard sessions</p>
          </div>

          {/* Search */}
          <div className="relative mb-6 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or subject..."
              className="input-field pl-10" />
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-2xl shimmer" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((arc, i) => (
                <motion.div key={arc._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card-hover overflow-hidden">
                  {/* Thumbnail */}
                  <div className="h-36 bg-navy-800 flex items-center justify-center overflow-hidden">
                    {arc.filePath && arc.filePath.startsWith('data:image') ? (
                      <img src={arc.filePath} alt={arc.title} className="w-full h-full object-cover" />
                    ) : (
                      <FileImage size={40} className="text-white/20" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-white text-sm truncate">{arc.title}</h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      {arc.subject && <span>{arc.subject} · </span>}
                      {format(new Date(arc.createdAt), 'MMM d, yyyy')}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="badge badge-admin">{arc.fileType?.toUpperCase()}</span>
                      <button onClick={() => downloadArchive(arc)}
                        className="ml-auto btn-ghost text-xs flex items-center gap-1 py-1 px-2">
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-3 text-center py-16 text-white/30">
                  <ArchiveIcon size={40} className="mx-auto mb-3 opacity-30" />
                  No archived sessions found
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
