import { useState, useEffect } from 'react';
import { FaBullhorn, FaPlus, FaEdit, FaTrash, FaTimes, FaSpinner } from 'react-icons/fa';
import api from '../services/api';

const PRIORITY_COLORS = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  normal: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  low: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal', batchId: '' });
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [annRes, batchRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/batches'),
      ]);
      setAnnouncements(annRes.data.announcements || []);
      setBatches(batchRes.data.batches || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', priority: 'normal', batchId: '' });
    setShowForm(true);
  };

  const openEdit = (ann) => {
    setEditing(ann._id);
    setForm({ title: ann.title, content: ann.content, priority: ann.priority, batchId: ann.batchId || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, batchId: form.batchId || null };
      if (editing) {
        await api.put(`/announcements/${editing}`, payload);
      } else {
        await api.post('/announcements', payload);
      }
      setShowForm(false);
      loadData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${deleteId}`);
      setDeleteId(null);
      loadData();
    } catch {
      // handle error
    }
  };

  const toggleActive = async (ann) => {
    try {
      await api.put(`/announcements/${ann._id}`, { isActive: !ann.isActive });
      loadData();
    } catch {
      // handle error
    }
  };

  const getBatchName = (batchId) => {
    if (!batchId) return 'All Batches';
    return batches.find(b => b._id === batchId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-2xl text-dark-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaBullhorn className="text-2xl text-dark-accent" />
          <h1 className="text-2xl font-bold">Announcements</h1>
          <span className="text-dark-muted text-sm">({announcements.length})</span>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-dark-accent text-white rounded-lg hover:bg-dark-accent/80 transition-colors text-sm">
          <FaPlus /> New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 ? (
          <div className="bg-dark-card border border-dark-secondary rounded-xl p-8 text-center">
            <FaBullhorn className="text-4xl text-dark-muted mx-auto mb-3" />
            <p className="text-dark-muted">No announcements yet</p>
            <p className="text-dark-muted text-sm mt-1">Create one to notify your students</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann._id} className={`bg-dark-card border border-dark-secondary rounded-xl p-4 ${!ann.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{ann.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${PRIORITY_COLORS[ann.priority]}`}>
                      {ann.priority}
                    </span>
                    {!ann.isActive && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/30">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-dark-muted text-sm line-clamp-2">{ann.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-dark-muted">
                    <span>{getBatchName(ann.batchId)}</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => toggleActive(ann)}
                    className={`px-2.5 py-1.5 text-xs rounded-lg transition-colors ${ann.isActive ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'}`}
                  >
                    {ann.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => openEdit(ann)} className="p-2 hover:bg-dark-secondary rounded-lg text-dark-muted hover:text-white transition-colors">
                    <FaEdit className="text-sm" />
                  </button>
                  <button onClick={() => setDeleteId(ann._id)} className="p-2 hover:bg-red-500/10 rounded-lg text-dark-muted hover:text-red-400 transition-colors">
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-secondary rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-dark-secondary">
              <h2 className="font-bold">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-dark-secondary rounded">
                <FaTimes className="text-dark-muted" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-dark-muted mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark-secondary rounded-lg text-sm focus:outline-none focus:border-dark-accent"
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-muted mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  required
                  rows={4}
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark-secondary rounded-lg text-sm focus:outline-none focus:border-dark-accent resize-none"
                  placeholder="Write your announcement..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-muted mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-secondary border border-dark-secondary rounded-lg text-sm focus:outline-none focus:border-dark-accent"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-muted mb-1">Target Batch</label>
                  <select
                    value={form.batchId}
                    onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-secondary border border-dark-secondary rounded-lg text-sm focus:outline-none focus:border-dark-accent"
                  >
                    <option value="">All Batches</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-dark-muted hover:bg-dark-secondary rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-dark-accent text-white rounded-lg hover:bg-dark-accent/80 transition-colors disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card border border-dark-secondary rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-2">Delete Announcement?</h3>
            <p className="text-dark-muted text-sm mb-4">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-dark-muted hover:bg-dark-secondary rounded-lg">
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
