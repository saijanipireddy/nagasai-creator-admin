import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBriefcase, FaExternalLinkAlt, FaLinkedin } from 'react-icons/fa';
import { jobAPI } from '../services/api';
import { useToast } from '../components/Toast';

const JOB_TYPE_LABELS = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  'internship': 'Internship',
  'contract': 'Contract',
  'remote': 'Remote',
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await jobAPI.getAll();
      setJobs(data);
    } catch (error) {
      addToast('Failed to fetch jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await jobAPI.delete(id);
      setJobs(jobs.filter((j) => j._id !== id));
      addToast('Job deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete job', 'error');
    }
  };

  const handleToggleActive = async (job) => {
    try {
      await jobAPI.update(job._id, { isActive: !job.isActive });
      setJobs(jobs.map((j) => j._id === job._id ? { ...j, isActive: !j.isActive } : j));
      addToast(`Job ${job.isActive ? 'deactivated' : 'activated'}`, 'success');
    } catch (error) {
      addToast('Failed to update job', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs Board</h1>
          <p className="text-dark-muted">Manage job postings for students</p>
        </div>
        <Link
          to="/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
        >
          <FaPlus /> Add Job
        </Link>
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="bg-dark-card rounded-xl border border-dark-secondary p-4 flex items-center gap-4 hover:border-dark-accent/50 transition-all"
            >
              {/* Company Logo or Icon */}
              <div className="w-12 h-12 rounded-lg bg-dark-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {job.companyLogo ? (
                  <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
                ) : (
                  <FaBriefcase className="text-xl text-dark-accent" />
                )}
              </div>

              {/* Job Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-lg">{job.designation}</p>
                <p className="text-dark-muted text-sm">{job.companyName}{job.location ? ` - ${job.location}` : ''}</p>
              </div>

              {/* Job Type Badge */}
              <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 whitespace-nowrap">
                {JOB_TYPE_LABELS[job.jobType] || job.jobType}
              </span>

              {/* Status Badge */}
              <button
                onClick={() => handleToggleActive(job)}
                className={`px-3 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                  job.isActive
                    ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                }`}
              >
                {job.isActive ? 'Active' : 'Inactive'}
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {job.companyLinkedin && (
                  <a
                    href={job.companyLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-dark-secondary rounded-lg transition-colors text-blue-400"
                    title="Company LinkedIn"
                  >
                    <FaLinkedin />
                  </a>
                )}
                <a
                  href={job.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors text-green-400"
                  title="Apply Link"
                >
                  <FaExternalLinkAlt />
                </a>
                <Link
                  to={`/jobs/${job._id}/edit`}
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors text-dark-accent"
                  title="Edit Job"
                >
                  <FaEdit />
                </Link>
                <button
                  onClick={() => handleDelete(job._id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                  title="Delete Job"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-12 text-center">
          <FaBriefcase className="text-6xl text-dark-muted mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No job postings yet</h3>
          <p className="text-dark-muted mb-4">Post your first job opportunity for students</p>
          <Link
            to="/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
          >
            <FaPlus /> Create Job
          </Link>
        </div>
      )}
    </div>
  );
};

export default Jobs;
