import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { jobAPI, uploadAPI } from '../services/api';
import { useToast } from '../components/Toast';

const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'contract', label: 'Contract' },
  { value: 'remote', label: 'Remote' },
];

const JobForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    designation: '',
    description: '',
    companyLogo: '',
    companyLinkedin: '',
    applyLink: '',
    jobType: 'full-time',
    location: '',
    isActive: true,
  });

  useEffect(() => {
    if (isEdit) {
      const fetchJob = async () => {
        try {
          const { data } = await jobAPI.getById(id);
          setForm({
            companyName: data.companyName || '',
            designation: data.designation || '',
            description: data.description || '',
            companyLogo: data.companyLogo || '',
            companyLinkedin: data.companyLinkedin || '',
            applyLink: data.applyLink || '',
            jobType: data.jobType || 'full-time',
            location: data.location || '',
            isActive: data.isActive !== undefined ? data.isActive : true,
          });
        } catch (error) {
          addToast('Failed to load job', 'error');
          navigate('/jobs');
        } finally {
          setLoading(false);
        }
      };
      fetchJob();
    }
  }, [id, isEdit, navigate, addToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const { data } = await uploadAPI.uploadFile(file);
      setForm((prev) => ({ ...prev, companyLogo: data.url }));
      addToast('Logo uploaded', 'success');
    } catch (error) {
      addToast('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.companyName.trim() || !form.designation.trim() || !form.applyLink.trim()) {
      addToast('Please fill in required fields', 'error');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await jobAPI.update(id, form);
        addToast('Job updated successfully', 'success');
      } else {
        await jobAPI.create(form);
        addToast('Job created successfully', 'success');
      }
      navigate('/jobs');
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to save job', 'error');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/jobs')}
          className="p-2 hover:bg-dark-secondary rounded-lg transition-colors"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Job' : 'New Job Posting'}</h1>
          <p className="text-dark-muted">
            {isEdit ? 'Update job details' : 'Create a new job opportunity for students'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-dark-card rounded-xl border border-dark-secondary p-6 space-y-5">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="e.g. Google, Microsoft, TCS"
            className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors"
          />
        </div>

        {/* Designation */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Designation / Role <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="e.g. Software Engineer, Data Analyst"
            className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Brief description about the role, requirements, etc."
            className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors resize-none"
          />
        </div>

        {/* Two-column row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Job Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Job Type</label>
            <select
              name="jobType"
              value={form.jobType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors"
            >
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Hyderabad, Remote, Bangalore"
              className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors"
            />
          </div>
        </div>

        {/* Apply Link */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Apply Link <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            name="applyLink"
            value={form.applyLink}
            onChange={handleChange}
            placeholder="https://company.com/careers/job-id"
            className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors"
          />
        </div>

        {/* Company LinkedIn */}
        <div>
          <label className="block text-sm font-medium mb-2">Company LinkedIn</label>
          <input
            type="url"
            name="companyLinkedin"
            value={form.companyLinkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/company/..."
            className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors"
          />
        </div>

        {/* Company Logo */}
        <div>
          <label className="block text-sm font-medium mb-2">Company Logo</label>
          <div className="flex items-center gap-4">
            {form.companyLogo && (
              <img
                src={form.companyLogo}
                alt="Logo preview"
                className="w-12 h-12 rounded-lg object-cover border border-dark-secondary"
              />
            )}
            <div className="flex-1">
              <input
                type="text"
                name="companyLogo"
                value={form.companyLogo}
                onChange={handleChange}
                placeholder="Logo URL or upload below"
                className="w-full px-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent transition-colors mb-2"
              />
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-secondary rounded-lg text-sm cursor-pointer hover:bg-dark-secondary/80 transition-colors">
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dark-accent"></div>
          </label>
          <span className="text-sm font-medium">Active (visible to students)</span>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="px-5 py-2.5 border border-dark-secondary rounded-lg hover:bg-dark-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors disabled:opacity-50"
          >
            <FaSave />
            {saving ? 'Saving...' : isEdit ? 'Update Job' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
