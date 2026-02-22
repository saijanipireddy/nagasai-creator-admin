import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaList, FaCheckCircle, FaEdit, FaPlus } from 'react-icons/fa';
import { courseAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalTopics: 0,
    publishedCourses: 0,
    draftCourses: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, coursesRes] = await Promise.all([
        courseAPI.getStats(),
        courseAPI.getAll()
      ]);
      setStats(statsRes.data);
      setRecentCourses(coursesRes.data.slice(0, 5));
    } catch (error) {
      // Error handled silently — UI shows empty state
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Courses', value: stats.totalCourses, icon: FaBook, color: '#e94560' },
    { label: 'Total Topics', value: stats.totalTopics, icon: FaList, color: '#4ade80' },
    { label: 'Published', value: stats.publishedCourses, icon: FaCheckCircle, color: '#60a5fa' },
    { label: 'Drafts', value: stats.draftCourses, icon: FaEdit, color: '#fbbf24' }
  ];

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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-dark-muted">Welcome to Naga sai LMS Admin</p>
        </div>
        <Link
          to="/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
        >
          <FaPlus /> Add Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-dark-card p-6 rounded-xl border border-dark-secondary"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-dark-muted text-sm">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon className="text-xl" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Courses</h2>
          <Link to="/courses" className="text-dark-accent text-sm hover:underline">
            View All
          </Link>
        </div>

        {recentCourses.length > 0 ? (
          <div className="space-y-3">
            {recentCourses.map((course) => (
              <Link
                key={course._id}
                to={`/courses/${course._id}/edit`}
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg hover:bg-dark-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${course.color}20` }}
                  >
                    <FaBook style={{ color: course.color }} />
                  </div>
                  <div>
                    <p className="font-medium">{course.name}</p>
                    <p className="text-dark-muted text-sm">{course.totalTopics || 0} topics</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    course.isPublished
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}
                >
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-dark-muted">
            <FaBook className="text-4xl mx-auto mb-2 opacity-50" />
            <p>No courses yet</p>
            <Link to="/courses/new" className="text-dark-accent hover:underline">
              Create your first course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
