import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBook, FaGripVertical, FaArrowRight } from 'react-icons/fa';
import { courseAPI } from '../services/api';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await courseAPI.getAll();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will delete all topics in this course.')) {
      return;
    }

    try {
      await courseAPI.delete(id);
      setCourses(courses.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const newCourses = [...courses];
    const draggedCourse = newCourses[draggedIndex];

    // Remove from old position and insert at new position
    newCourses.splice(draggedIndex, 1);
    newCourses.splice(dropIndex, 0, draggedCourse);

    setCourses(newCourses);
    setDraggedIndex(null);

    // Save new order to backend
    try {
      setSaving(true);
      await courseAPI.reorder(newCourses);
    } catch (error) {
      console.error('Failed to save order:', error);
      // Revert on error
      fetchCourses();
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-dark-muted">Manage your course catalog - Drag to reorder</p>
        </div>
        <Link
          to="/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
        >
          <FaPlus /> Add Course
        </Link>
      </div>

      {/* Learning Path Preview */}
      {courses.length > 0 && (
        <div className="bg-gradient-to-r from-dark-accent/10 via-purple-600/10 to-blue-600/10 rounded-xl p-4 border border-dark-accent/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-dark-muted">Learning Path Preview</h2>
            {saving && <span className="text-xs text-dark-accent">Saving...</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {courses.map((course, index) => (
              <div key={course._id} className="flex items-center">
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: `${course.color}20`, color: course.color }}
                >
                  {index + 1}. {course.name}
                </span>
                {index < courses.length - 1 && (
                  <FaArrowRight className="mx-2 text-dark-muted text-xs" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draggable Course Cards */}
      {courses.length > 0 ? (
        <div className="space-y-3">
          {courses.map((course, index) => (
            <div
              key={course._id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-dark-card rounded-xl border border-dark-secondary p-4 flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all
                ${draggedIndex === index ? 'opacity-50 scale-[0.98]' : 'hover:border-dark-accent/50'}`}
            >
              {/* Drag Handle */}
              <div className="text-dark-muted hover:text-white transition-colors">
                <FaGripVertical className="text-lg" />
              </div>

              {/* Order Number */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: `${course.color}20`, color: course.color }}
              >
                {index + 1}
              </div>

              {/* Course Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${course.color}20` }}
              >
                <FaBook className="text-xl" style={{ color: course.color }} />
              </div>

              {/* Course Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-lg">{course.name}</p>
                <p className="text-dark-muted text-sm truncate">{course.description}</p>
              </div>

              {/* Topics Count */}
              <div className="text-center px-4">
                <p className="text-lg font-bold">{course.totalTopics || 0}</p>
                <p className="text-dark-muted text-xs">Topics</p>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  course.isPublished
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}
              >
                {course.isPublished ? 'Published' : 'Draft'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link
                  to={`/courses/${course._id}/topics`}
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors text-blue-500"
                  title="Manage Topics"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaEye />
                </Link>
                <Link
                  to={`/courses/${course._id}/edit`}
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors text-dark-accent"
                  title="Edit Course"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaEdit />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(course._id);
                  }}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                  title="Delete Course"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-12 text-center">
          <FaBook className="text-6xl text-dark-muted mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No courses yet</h3>
          <p className="text-dark-muted mb-4">Create your first course to get started</p>
          <Link
            to="/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
          >
            <FaPlus /> Create Course
          </Link>
        </div>
      )}

      {/* Help Text */}
      {courses.length > 1 && (
        <p className="text-center text-dark-muted text-sm">
          Drag and drop courses to change the learning path order
        </p>
      )}
    </div>
  );
};

export default Courses;
