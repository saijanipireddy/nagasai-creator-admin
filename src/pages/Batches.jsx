import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaTrash, FaEye, FaUsers, FaBook, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { batchAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data } = await batchAPI.getAll();
      setBatches(data);
    } catch (error) {
      addToast('Failed to fetch batches', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      await batchAPI.create({ name: newName.trim(), description: newDesc.trim() });
      addToast('Batch created successfully', 'success');
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      fetchBatches();
    } catch (error) {
      addToast('Failed to create batch', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this batch? Students will lose access to courses in this batch.')) return;
    try {
      await batchAPI.delete(id);
      setBatches(batches.filter((b) => b._id !== id));
      addToast('Batch deleted', 'success');
    } catch (error) {
      addToast('Failed to delete batch', 'error');
    }
  };

  const handleToggleActive = async (batch) => {
    try {
      await batchAPI.update(batch._id, { isActive: !batch.isActive });
      setBatches(batches.map((b) => b._id === batch._id ? { ...b, isActive: !b.isActive } : b));
      addToast(`Batch ${!batch.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
      addToast('Failed to update batch', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batches</h1>
          <p className="text-dark-muted">Manage student batches & enrollment</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
        >
          <FaPlus /> New Batch
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-dark-card rounded-xl border border-dark-secondary p-6 space-y-4">
          <h3 className="text-lg font-semibold">Create New Batch</h3>
          <div>
            <label className="block text-sm text-dark-muted mb-1">Batch Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Full Stack - Batch 5"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-dark-muted mb-1">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Batch'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-dark-secondary rounded-lg hover:bg-dark-secondary/80 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Batch List */}
      {batches.length > 0 ? (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch._id}
              className="bg-dark-card rounded-xl border border-dark-secondary p-4 flex items-center gap-4 hover:border-dark-accent/50 transition-all"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FaUsers className="text-xl text-purple-500" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-lg">{batch.name}</p>
                <p className="text-dark-muted text-sm truncate">{batch.description || 'No description'}</p>
              </div>

              {/* Stats */}
              <div className="text-center px-3">
                <p className="text-lg font-bold">{batch.courseCount}</p>
                <p className="text-dark-muted text-xs flex items-center gap-1"><FaBook className="text-[10px]" /> Courses</p>
              </div>
              <div className="text-center px-3">
                <p className="text-lg font-bold">{batch.studentCount}</p>
                <p className="text-dark-muted text-xs flex items-center gap-1"><FaUsers className="text-[10px]" /> Students</p>
              </div>

              {/* Status */}
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  batch.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}
              >
                {batch.isActive ? 'Active' : 'Inactive'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleActive(batch)}
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors"
                  title={batch.isActive ? 'Deactivate' : 'Activate'}
                >
                  {batch.isActive
                    ? <FaToggleOn className="text-lg text-green-500" />
                    : <FaToggleOff className="text-lg text-dark-muted" />}
                </button>
                <Link
                  to={`/batches/${batch._id}`}
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors text-blue-500"
                  title="Manage Batch"
                >
                  <FaEye />
                </Link>
                <button
                  onClick={() => handleDelete(batch._id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-12 text-center">
          <FaUsers className="text-6xl text-dark-muted mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No batches yet</h3>
          <p className="text-dark-muted mb-4">Create your first batch to start enrolling students</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
          >
            <FaPlus /> Create Batch
          </button>
        </div>
      )}
    </div>
  );
};

export default Batches;
