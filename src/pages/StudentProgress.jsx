import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaChartBar, FaUsers, FaCheck, FaTimes, FaCode, FaBookOpen, FaSpinner, FaTrophy } from 'react-icons/fa';
import { batchAPI } from '../services/api';

const StudentProgress = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [batchName, setBatchName] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [progressRes, batchRes] = await Promise.all([
          batchAPI.getProgress(id),
          batchAPI.getById(id),
        ]);
        setData(progressRes.data);
        setBatchName(batchRes.data.name || 'Batch');
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const loadStudentDetail = async (studentId) => {
    setSelectedStudent(studentId);
    setDetailLoading(true);
    try {
      const res = await batchAPI.getStudentProgress(id, studentId);
      setStudentDetail(res.data);
    } catch {
      setStudentDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!data?.students) return [];
    if (!search) return data.students;
    const q = search.toLowerCase();
    return data.students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [data, search]);

  const stats = useMemo(() => {
    if (!data?.students?.length) return { total: 0, avgProgress: 0, avgQuiz: 0, active: 0 };
    const students = data.students;
    return {
      total: students.length,
      avgProgress: Math.round(students.reduce((s, st) => s + st.progress, 0) / students.length),
      avgQuiz: Math.round(students.reduce((s, st) => s + st.avgQuizScore, 0) / students.length),
      active: students.filter(s => s.isActive).length,
    };
  }, [data]);

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
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(`/batches/${id}`)} className="p-2 hover:bg-dark-secondary rounded-lg transition-colors">
          <FaArrowLeft className="text-dark-muted" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Student Progress</h1>
          <p className="text-dark-muted text-sm">{batchName} — {stats.total} students</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total, icon: FaUsers, color: 'text-blue-400' },
          { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: FaChartBar, color: 'text-green-400' },
          { label: 'Avg Quiz Score', value: `${stats.avgQuiz}%`, icon: FaTrophy, color: 'text-yellow-400' },
          { label: 'Active Students', value: stats.active, icon: FaCheck, color: 'text-emerald-400' },
        ].map(card => (
          <div key={card.label} className="bg-dark-card border border-dark-secondary rounded-xl p-4">
            <div className="flex items-center gap-3">
              <card.icon className={`text-xl ${card.color}`} />
              <div>
                <p className="text-dark-muted text-xs">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-dark-card border border-dark-secondary rounded-lg text-sm focus:outline-none focus:border-dark-accent"
        />
      </div>

      {/* Student Table */}
      <div className="bg-dark-card border border-dark-secondary rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-secondary text-dark-muted text-left">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Quiz Avg</th>
                <th className="px-4 py-3 font-medium">Coding</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => (
                <tr
                  key={student._id}
                  onClick={() => loadStudentDetail(student._id)}
                  className={`border-b border-dark-secondary/50 hover:bg-dark-secondary/30 cursor-pointer transition-colors ${selectedStudent === student._id ? 'bg-dark-secondary/50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-dark-muted text-xs">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-dark-secondary rounded-full h-2 max-w-[120px]">
                        <div
                          className={`h-2 rounded-full ${student.progress >= 80 ? 'bg-green-500' : student.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-dark-muted w-12">{student.progress}%</span>
                    </div>
                    <p className="text-xs text-dark-muted mt-0.5">{student.topicsCompleted}/{student.totalTopics} topics</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${student.avgQuizScore >= 80 ? 'text-green-400' : student.avgQuizScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {student.avgQuizScore}%
                    </span>
                    <p className="text-xs text-dark-muted">{student.quizzesTaken} quizzes</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <FaCode className="text-dark-muted" />
                      <span>{student.codingPassed}/{student.codingTotal}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {student.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full">
                        <FaCheck className="text-[10px]" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full">
                        <FaTimes className="text-[10px]" /> Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-dark-muted">
                    {search ? 'No students match your search' : 'No students enrolled'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Panel */}
      {selectedStudent && (
        <div className="bg-dark-card border border-dark-secondary rounded-xl p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-xl text-dark-accent" />
            </div>
          ) : studentDetail ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{studentDetail.student.name}</h2>
                  <p className="text-dark-muted text-sm">{studentDetail.student.email}</p>
                </div>
                <button onClick={() => { setSelectedStudent(null); setStudentDetail(null); }} className="p-2 hover:bg-dark-secondary rounded-lg">
                  <FaTimes className="text-dark-muted" />
                </button>
              </div>

              {/* Per-course breakdown */}
              <div className="space-y-4">
                {studentDetail.courses.map(course => (
                  <div key={course._id} className="bg-dark-secondary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{course.icon || '📚'}</span>
                        <h3 className="font-medium">{course.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-dark-secondary rounded-full h-2 w-24">
                          <div
                            className={`h-2 rounded-full ${course.progress >= 80 ? 'bg-green-500' : course.progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-dark-muted">{course.completedTopics}/{course.totalTopics}</span>
                      </div>
                    </div>

                    {/* Topics list */}
                    <div className="space-y-1.5">
                      {course.topics.map(topic => (
                        <div key={topic._id} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-dark-secondary/50">
                          <div className="flex items-center gap-2">
                            {topic.completions.length > 0 ? (
                              <FaCheck className="text-green-400 text-xs" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-dark-muted" />
                            )}
                            <span className={topic.completions.length > 0 ? '' : 'text-dark-muted'}>{topic.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-dark-muted">
                            {topic.practiceScore && (
                              <span className={topic.practiceScore.percentage >= 80 ? 'text-green-400' : 'text-yellow-400'}>
                                Quiz: {topic.practiceScore.percentage}%
                              </span>
                            )}
                            {topic.codingSubmission && (
                              <span className={topic.codingSubmission.passed ? 'text-green-400' : 'text-red-400'}>
                                {topic.codingSubmission.passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Attempts */}
              {studentDetail.recentAttempts.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Recent Quiz Attempts</h3>
                  <div className="space-y-1">
                    {studentDetail.recentAttempts.slice(0, 10).map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-dark-secondary/30 rounded px-3 py-1.5">
                        <span>Attempt #{a.attemptNumber}</span>
                        <div className="flex items-center gap-3">
                          <span>{a.score}/{a.total} ({a.percentage}%)</span>
                          <span className={a.passed ? 'text-green-400' : 'text-red-400'}>
                            {a.passed ? 'Passed' : 'Failed'}
                          </span>
                          <span className="text-dark-muted text-xs">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-dark-muted text-center py-4">Failed to load student details</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentProgress;
