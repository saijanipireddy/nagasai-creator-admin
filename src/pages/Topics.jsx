import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaGripVertical, FaYoutube, FaFilePdf, FaCode } from 'react-icons/fa';
import { courseAPI, topicAPI } from '../services/api';
import { useToast } from '../components/Toast';

const Topics = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, topicsRes] = await Promise.all([
        courseAPI.getById(courseId),
        courseAPI.getTopics(courseId)
      ]);
      setCourse(courseRes.data);
      setTopics(topicsRes.data);
    } catch (error) {
      addToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('Are you sure you want to delete this topic?')) {
      return;
    }

    try {
      await topicAPI.delete(topicId);
      setTopics(topics.filter((t) => t._id !== topicId));
      addToast('Topic deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete topic', 'error');
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
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/courses"
          className="p-2 hover:bg-dark-secondary rounded-lg transition-colors"
        >
          <FaArrowLeft />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course?.name} - Topics</h1>
          <p className="text-dark-muted">{topics.length} topics</p>
        </div>
        <Link
          to={`/courses/${courseId}/topics/new`}
          className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
        >
          <FaPlus /> Add Topic
        </Link>
      </div>

      {topics.length > 0 ? (
        <div className="space-y-3">
          {topics.map((topic, index) => (
            <div
              key={topic._id}
              className="bg-dark-card rounded-xl border border-dark-secondary p-4 flex items-center gap-4"
            >
              <div className="text-dark-muted cursor-grab">
                <FaGripVertical />
              </div>
              <div className="w-8 h-8 rounded-full bg-dark-secondary flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{topic.title}</h3>
                <div className="flex items-center gap-4 mt-1">
                  {topic.videoUrl && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <FaYoutube /> Video
                    </span>
                  )}
                  {topic.pdfUrl && (
                    <span className="flex items-center gap-1 text-xs text-blue-500">
                      <FaFilePdf /> PDF
                    </span>
                  )}
                  {topic.practice?.length > 0 && (
                    <span className="text-xs text-green-500">
                      {topic.practice.length} questions
                    </span>
                  )}
                  {topic.codingPractice?.title && (
                    <span className="flex items-center gap-1 text-xs text-pink-500">
                      <FaCode /> {topic.codingPractice.language?.toUpperCase()} Practice
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs ${
                  topic.isPublished
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}
              >
                {topic.isPublished ? 'Published' : 'Draft'}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  to={`/courses/${courseId}/topics/${topic._id}/edit`}
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors text-dark-accent"
                >
                  <FaEdit />
                </Link>
                <button
                  onClick={() => handleDelete(topic._id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-12 text-center">
          <h3 className="text-xl font-medium mb-2">No topics yet</h3>
          <p className="text-dark-muted mb-4">Add topics to this course</p>
          <Link
            to={`/courses/${courseId}/topics/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
          >
            <FaPlus /> Add First Topic
          </Link>
        </div>
      )}
    </div>
  );
};

export default Topics;
