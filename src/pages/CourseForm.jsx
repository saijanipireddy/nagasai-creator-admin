import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner } from 'react-icons/fa';
import { courseAPI } from '../services/api';
import { useToast } from '../components/Toast';

const iconOptions = [
  'FaHtml5', 'FaCss3Alt', 'FaJs', 'FaNodeJs', 'FaReact', 'FaPython',
  'FaJava', 'FaDatabase', 'FaGitAlt', 'FaDocker', 'FaAws', 'FaLinux'
];

const colorOptions = [
  '#e34c26', '#264de4', '#f7df1e', '#68a063', '#61dafb', '#3776ab',
  '#b07219', '#47a248', '#f05032', '#2496ed', '#ff9900', '#fcc624'
];

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'FaBook',
    color: '#e94560',
    order: 0,
    isPublished: false
  });

  useEffect(() => {
    if (isEditing) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const { data } = await courseAPI.getById(id);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        icon: data.icon || 'FaBook',
        color: data.color || '#e94560',
        order: data.order || 0,
        isPublished: data.isPublished || false
      });
    } catch (error) {
      addToast('Failed to load course', 'error');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await courseAPI.update(id, formData);
      } else {
        await courseAPI.create(formData);
      }
      navigate('/courses');
    } catch (error) {
      addToast('Failed to save course', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-dark-muted hover:text-white transition-colors"
        >
          <FaArrowLeft /> Back to Courses
        </Link>
      </div>

      <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? 'Edit Course' : 'Create New Course'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Course Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
              placeholder="e.g., HTML Fundamentals"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent resize-none"
              placeholder="Brief description of the course"
              required
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium mb-2">Icon</label>
            <select
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
            >
              {iconOptions.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Theme Color</label>
            <div className="flex items-center gap-3 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-card scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                title="Custom color"
              />
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium mb-2">Display Order</label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
              min={0}
            />
          </div>

          {/* Published */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="w-5 h-5 rounded accent-dark-accent"
            />
            <label htmlFor="isPublished" className="text-sm font-medium">
              Publish this course (visible to students)
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  {isEditing ? 'Update Course' : 'Create Course'}
                </>
              )}
            </button>
            <Link
              to="/courses"
              className="px-6 py-3 bg-dark-secondary rounded-lg hover:bg-dark-secondary/80 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
