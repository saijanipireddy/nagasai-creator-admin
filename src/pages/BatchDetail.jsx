import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft, FaPlus, FaTrash, FaBook, FaUsers, FaToggleOn, FaToggleOff,
  FaSearch, FaTimes, FaCheckCircle, FaClock, FaGift, FaUserPlus, FaEnvelope,
  FaLock, FaPhone, FaUser, FaEye, FaEyeSlash, FaChartBar, FaCalendarAlt,
  FaUnlock, FaMagic
} from 'react-icons/fa';
import { batchAPI, courseAPI } from '../services/api';
import { useToast } from '../components/Toast';

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  // Course assignment
  const [allCourses, setAllCourses] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

  // Student enrollment
  const [allStudents, setAllStudents] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Onboard student
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [showOnboardPassword, setShowOnboardPassword] = useState(false);

  // Topic schedule
  const [selectedScheduleCourse, setSelectedScheduleCourse] = useState(null);
  const [scheduleTopics, setScheduleTopics] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [autoStartDate, setAutoStartDate] = useState('');
  const [autoTopicsPerDay, setAutoTopicsPerDay] = useState(1);
  const [scheduleActionLoading, setScheduleActionLoading] = useState(false);

  useEffect(() => {
    fetchBatch();
  }, [id]);

  const fetchBatch = async () => {
    try {
      const { data } = await batchAPI.getById(id);
      setBatch(data);
    } catch (error) {
      addToast('Failed to load batch', 'error');
      navigate('/batches');
    } finally {
      setLoading(false);
    }
  };

  // ---- Course assignment ----
  const openCourseModal = async () => {
    try {
      const { data } = await courseAPI.getAll();
      setAllCourses(data);
      setShowCourseModal(true);
    } catch {
      addToast('Failed to load courses', 'error');
    }
  };

  const assignedCourseIds = new Set((batch?.courses || []).map((c) => c._id));

  const filteredCourses = allCourses.filter((c) =>
    !assignedCourseIds.has(c._id) &&
    c.name.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const handleAssignCourse = async (courseId) => {
    try {
      await batchAPI.assignCourses(id, [courseId]);
      addToast('Course assigned', 'success');
      setShowCourseModal(false);
      fetchBatch();
    } catch {
      addToast('Failed to assign course', 'error');
    }
  };

  const handleRemoveCourse = async (courseId) => {
    if (!window.confirm('Remove this course from the batch?')) return;
    try {
      await batchAPI.removeCourse(id, courseId);
      setBatch({ ...batch, courses: batch.courses.filter((c) => c._id !== courseId) });
      addToast('Course removed', 'success');
    } catch {
      addToast('Failed to remove course', 'error');
    }
  };

  // ---- Student enrollment ----
  const openStudentModal = async () => {
    try {
      const { data } = await batchAPI.getAllStudents();
      setAllStudents(data);
      setSelectedStudents([]);
      setShowStudentModal(true);
    } catch {
      addToast('Failed to load students', 'error');
    }
  };

  const enrolledStudentIds = new Set((batch?.students || []).map((s) => s._id));

  const filteredStudents = allStudents.filter((s) =>
    !enrolledStudentIds.has(s._id) &&
    (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
     s.email.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const toggleSelectStudent = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleEnrollStudents = async () => {
    if (selectedStudents.length === 0) return;
    try {
      await batchAPI.enrollStudents(id, selectedStudents);
      addToast(`${selectedStudents.length} student(s) enrolled`, 'success');
      setShowStudentModal(false);
      fetchBatch();
    } catch {
      addToast('Failed to enroll students', 'error');
    }
  };

  const handleToggleStudentActive = async (student) => {
    try {
      await batchAPI.updateEnrollment(id, student._id, { isActive: !student.isActive });
      setBatch({
        ...batch,
        students: batch.students.map((s) =>
          s._id === student._id ? { ...s, isActive: !s.isActive } : s
        ),
      });
      addToast(`Access ${!student.isActive ? 'granted' : 'revoked'}`, 'success');
    } catch {
      addToast('Failed to update enrollment', 'error');
    }
  };

  const handleChangePayment = async (student, status) => {
    try {
      await batchAPI.updateEnrollment(id, student._id, { paymentStatus: status, isActive: status === 'paid' || status === 'free' });
      setBatch({
        ...batch,
        students: batch.students.map((s) =>
          s._id === student._id ? { ...s, paymentStatus: status, isActive: status === 'paid' || status === 'free' } : s
        ),
      });
      addToast('Payment status updated', 'success');
    } catch {
      addToast('Failed to update payment', 'error');
    }
  };

  const handleOnboardStudent = async (e) => {
    e.preventDefault();
    setOnboardLoading(true);
    try {
      const { data } = await batchAPI.onboardStudent(onboardForm);
      addToast(`Student "${data.name}" created successfully`, 'success');
      setShowOnboardModal(false);
      setOnboardForm({ name: '', email: '', phone: '', password: '' });
      // Auto-enroll the new student in this batch
      await batchAPI.enrollStudents(id, [data._id]);
      addToast('Student enrolled in this batch', 'success');
      fetchBatch();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to onboard student';
      addToast(msg, 'error');
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the batch?')) return;
    try {
      await batchAPI.removeStudent(id, studentId);
      setBatch({ ...batch, students: batch.students.filter((s) => s._id !== studentId) });
      addToast('Student removed', 'success');
    } catch {
      addToast('Failed to remove student', 'error');
    }
  };

  // ---- Topic Schedule ----
  const fetchSchedule = async (courseId) => {
    setScheduleLoading(true);
    try {
      const { data } = await batchAPI.getSchedule(id, courseId);
      setScheduleTopics(data.topics || []);
    } catch {
      addToast('Failed to load schedule', 'error');
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSelectScheduleCourse = (course) => {
    setSelectedScheduleCourse(course);
    fetchSchedule(course._id);
  };

  const handleAutoSchedule = async () => {
    if (!autoStartDate || !selectedScheduleCourse) return;
    setScheduleActionLoading(true);
    try {
      await batchAPI.autoSchedule(id, {
        courseId: selectedScheduleCourse._id,
        startDate: autoStartDate,
        topicsPerDay: autoTopicsPerDay,
      });
      addToast('Schedule created successfully', 'success');
      fetchSchedule(selectedScheduleCourse._id);
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to create schedule', 'error');
    } finally {
      setScheduleActionLoading(false);
    }
  };

  const handleToggleUnlock = async (topicId, currentlyAccessible) => {
    try {
      await batchAPI.toggleTopicUnlock(id, topicId, !currentlyAccessible);
      addToast(currentlyAccessible ? 'Topic locked' : 'Topic unlocked', 'success');
      // Re-fetch from server to get the correct state (toggle changes unlock_date too)
      fetchSchedule(selectedScheduleCourse._id);
    } catch {
      addToast('Failed to toggle topic', 'error');
    }
  };

  const handleClearSchedule = async () => {
    if (!selectedScheduleCourse) return;
    if (!window.confirm('Remove all schedule restrictions for this course? All topics will become accessible.')) return;
    try {
      await batchAPI.clearSchedule(id, selectedScheduleCourse._id);
      addToast('Schedule cleared', 'success');
      fetchSchedule(selectedScheduleCourse._id);
    } catch {
      addToast('Failed to clear schedule', 'error');
    }
  };

  const handleSingleDateChange = async (topicId, newDate) => {
    try {
      await batchAPI.bulkSchedule(id, {
        courseId: selectedScheduleCourse._id,
        schedule: [{ topicId, unlockDate: newDate }],
      });
      // Re-fetch to get accurate state (bulkSchedule resets is_unlocked to false)
      fetchSchedule(selectedScheduleCourse._id);
    } catch {
      addToast('Failed to update date', 'error');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!batch) return null;

  const paymentIcon = (status) => {
    if (status === 'paid') return <FaCheckCircle className="text-green-500" />;
    if (status === 'free') return <FaGift className="text-blue-500" />;
    return <FaClock className="text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/batches')} className="p-2 hover:bg-dark-secondary rounded-lg transition-colors">
          <FaArrowLeft />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{batch.name}</h1>
          <p className="text-dark-muted">{batch.description || 'No description'}</p>
        </div>
        <Link to={`/batches/${id}/progress`} className="flex items-center gap-2 px-4 py-2 bg-dark-accent text-white rounded-lg hover:bg-dark-accent/80 transition-colors text-sm">
          <FaChartBar /> Student Progress
        </Link>
        <span className={`px-3 py-1 rounded-full text-xs ${batch.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {batch.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-card rounded-lg p-1 border border-dark-secondary w-fit">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'courses' ? 'bg-dark-accent text-white' : 'text-dark-muted hover:text-white'
          }`}
        >
          <FaBook /> Courses ({batch.courses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'students' ? 'bg-dark-accent text-white' : 'text-dark-muted hover:text-white'
          }`}
        >
          <FaUsers /> Students ({batch.students?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'schedule' ? 'bg-dark-accent text-white' : 'text-dark-muted hover:text-white'
          }`}
        >
          <FaCalendarAlt /> Topic Schedule
        </button>
      </div>

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openCourseModal} className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors text-sm">
              <FaPlus /> Assign Course
            </button>
          </div>

          {batch.courses?.length > 0 ? (
            <div className="space-y-2">
              {batch.courses.map((course) => (
                <div key={course._id} className="bg-dark-card rounded-lg border border-dark-secondary p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${course.color}20` }}>
                    <FaBook style={{ color: course.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{course.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${course.isPublished ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <button onClick={() => handleRemoveCourse(course._id)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-dark-card rounded-xl border border-dark-secondary p-8 text-center">
              <FaBook className="text-4xl text-dark-muted mx-auto mb-3" />
              <p className="text-dark-muted">No courses assigned to this batch yet</p>
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowOnboardModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors text-sm">
              <FaUserPlus /> Onboard Student
            </button>
            <button onClick={openStudentModal} className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors text-sm">
              <FaPlus /> Enroll Students
            </button>
          </div>

          {batch.students?.length > 0 ? (
            <div className="bg-dark-card rounded-xl border border-dark-secondary overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-secondary text-dark-muted text-sm">
                    <th className="text-left p-4">Student</th>
                    <th className="text-left p-4">Payment</th>
                    <th className="text-center p-4">Access</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.students.map((student) => (
                    <tr key={student._id} className="border-b border-dark-secondary/50 hover:bg-dark-bg/50 transition-colors">
                      <td className="p-4">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-dark-muted text-sm">{student.email}</p>
                      </td>
                      <td className="p-4">
                        <select
                          value={student.paymentStatus}
                          onChange={(e) => handleChangePayment(student, e.target.value)}
                          className="bg-dark-bg border border-dark-secondary rounded px-2 py-1 text-sm focus:outline-none focus:border-dark-accent"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="free">Free</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleToggleStudentActive(student)}>
                          {student.isActive
                            ? <FaToggleOn className="text-2xl text-green-500 mx-auto" />
                            : <FaToggleOff className="text-2xl text-dark-muted mx-auto" />}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(student._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                          title="Remove student"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-dark-card rounded-xl border border-dark-secondary p-8 text-center">
              <FaUsers className="text-4xl text-dark-muted mx-auto mb-3" />
              <p className="text-dark-muted">No students enrolled in this batch yet</p>
            </div>
          )}
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Course Selector */}
          {!selectedScheduleCourse ? (
            <div className="space-y-3">
              <p className="text-dark-muted text-sm">Select a course to manage its topic schedule for this batch:</p>
              {batch.courses?.length > 0 ? (
                <div className="grid gap-2">
                  {batch.courses.map((course) => (
                    <button
                      key={course._id}
                      onClick={() => handleSelectScheduleCourse(course)}
                      className="bg-dark-card rounded-lg border border-dark-secondary p-4 flex items-center gap-4 hover:border-dark-accent transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${course.color}20` }}>
                        <FaBook style={{ color: course.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{course.name}</p>
                      </div>
                      <FaCalendarAlt className="text-dark-muted" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-dark-card rounded-xl border border-dark-secondary p-8 text-center">
                  <FaBook className="text-4xl text-dark-muted mx-auto mb-3" />
                  <p className="text-dark-muted">Assign courses first before setting up a schedule</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Schedule Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => { setSelectedScheduleCourse(null); setScheduleTopics([]); }}
                  className="p-2 hover:bg-dark-secondary rounded-lg transition-colors"
                >
                  <FaArrowLeft className="text-sm" />
                </button>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedScheduleCourse.color}20` }}>
                  <FaBook style={{ color: selectedScheduleCourse.color }} className="text-sm" />
                </div>
                <h3 className="font-semibold">{selectedScheduleCourse.name}</h3>
                <div className="flex-1" />
                <button
                  onClick={handleClearSchedule}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                >
                  <FaTrash className="text-xs" /> Clear Schedule
                </button>
              </div>

              {/* Auto-Schedule Section */}
              <div className="bg-dark-card rounded-xl border border-dark-secondary p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FaMagic className="text-dark-accent" />
                  <h4 className="font-medium text-sm">Auto-Schedule</h4>
                  <span className="text-dark-muted text-xs">- Set a start date and topics unlock automatically</span>
                </div>
                <div className="flex items-end gap-3 flex-wrap">
                  <div>
                    <label className="block text-xs text-dark-muted mb-1">Start Date</label>
                    <input
                      type="date"
                      value={autoStartDate}
                      onChange={(e) => setAutoStartDate(e.target.value)}
                      onClick={(e) => e.target.showPicker?.()}
                      className="bg-dark-bg border border-dark-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-dark-accent cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-muted mb-1">Topics per day</label>
                    <select
                      value={autoTopicsPerDay}
                      onChange={(e) => setAutoTopicsPerDay(Number(e.target.value))}
                      className="bg-dark-bg border border-dark-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-dark-accent"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} topic{n > 1 ? 's' : ''}/day</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAutoSchedule}
                    disabled={!autoStartDate || scheduleActionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors text-sm disabled:opacity-50"
                  >
                    {scheduleActionLoading ? 'Scheduling...' : 'Apply Schedule'}
                  </button>
                </div>
              </div>

              {/* Topic List with Schedule */}
              {scheduleLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-dark-accent border-t-transparent rounded-full" />
                </div>
              ) : scheduleTopics.length > 0 ? (
                <div className="bg-dark-card rounded-xl border border-dark-secondary overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-secondary text-dark-muted text-sm">
                        <th className="text-left p-3 w-10">#</th>
                        <th className="text-left p-3">Topic</th>
                        <th className="text-left p-3 w-44">Unlock Date</th>
                        <th className="text-center p-3 w-24">Status</th>
                        <th className="text-center p-3 w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleTopics.map((topic, index) => {
                        const hasSchedule = !!topic.schedule;
                        const rawDate = topic.schedule?.unlockDate || '';
                        const isManuallyLocked = rawDate === '2099-12-31';
                        const unlockDate = isManuallyLocked ? today : rawDate;
                        const isLive = topic.isAccessible;

                        return (
                          <tr key={topic._id} className={`border-b border-dark-secondary/50 transition-colors ${isLive ? '' : 'opacity-70'}`}>
                            <td className="p-3 text-dark-muted text-sm">{index + 1}</td>
                            <td className="p-3">
                              <p className="font-medium text-sm">{topic.title}</p>
                            </td>
                            <td className="p-3">
                              <input
                                type="date"
                                value={unlockDate}
                                onChange={(e) => handleSingleDateChange(topic._id, e.target.value)}
                                onClick={(e) => e.target.showPicker?.()}
                                className="bg-dark-bg border border-dark-secondary rounded px-2 py-1 text-sm focus:outline-none focus:border-dark-accent w-full cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              {!hasSchedule ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                                  <FaUnlock className="text-[10px]" /> Open
                                </span>
                              ) : isLive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                                  <FaCheckCircle className="text-[10px]" /> Live
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                                  <FaLock className="text-[10px]" /> Locked
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleUnlock(topic._id, isLive)}
                                className="p-1.5 rounded-lg transition-colors hover:bg-dark-secondary"
                                title={isLive ? 'Lock topic' : 'Unlock topic now'}
                              >
                                {isLive
                                  ? <FaToggleOn className="text-xl text-green-500" />
                                  : <FaToggleOff className="text-xl text-dark-muted" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-dark-card rounded-xl border border-dark-secondary p-8 text-center">
                  <FaCalendarAlt className="text-4xl text-dark-muted mx-auto mb-3" />
                  <p className="text-dark-muted">No topics found for this course</p>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-dark-muted flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Open = No schedule set, always accessible</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Live = Unlocked (date reached or manually unlocked)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Locked = Not yet available to students</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Course Assignment Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-dark-secondary w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-dark-secondary">
              <h3 className="font-semibold text-lg">Assign Course</h3>
              <button onClick={() => setShowCourseModal(false)} className="p-1 hover:bg-dark-secondary rounded-lg"><FaTimes /></button>
            </div>
            <div className="p-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
              {filteredCourses.length > 0 ? filteredCourses.map((course) => (
                <button
                  key={course._id}
                  onClick={() => handleAssignCourse(course._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-secondary transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${course.color}20` }}>
                    <FaBook style={{ color: course.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{course.name}</p>
                  </div>
                </button>
              )) : (
                <p className="text-dark-muted text-center py-4">No courses available to assign</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Enrollment Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-dark-secondary w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-dark-secondary">
              <h3 className="font-semibold text-lg">Enroll Students</h3>
              <button onClick={() => setShowStudentModal(false)} className="p-1 hover:bg-dark-secondary rounded-lg"><FaTimes /></button>
            </div>
            <div className="p-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-1">
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <button
                  key={student._id}
                  onClick={() => toggleSelectStudent(student._id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedStudents.includes(student._id) ? 'bg-dark-accent/20 border border-dark-accent' : 'hover:bg-dark-secondary border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-dark-secondary flex items-center justify-center text-sm font-bold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-dark-muted text-xs">{student.email}</p>
                  </div>
                  {selectedStudents.includes(student._id) && (
                    <FaCheckCircle className="text-dark-accent" />
                  )}
                </button>
              )) : (
                <p className="text-dark-muted text-center py-4">No students available to enroll</p>
              )}
            </div>
            {selectedStudents.length > 0 && (
              <div className="p-4 border-t border-dark-secondary">
                <button
                  onClick={handleEnrollStudents}
                  className="w-full py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors font-medium"
                >
                  Enroll {selectedStudents.length} Student{selectedStudents.length > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboard Student Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card rounded-xl border border-dark-secondary w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-dark-secondary">
              <h3 className="font-semibold text-lg">Onboard New Student</h3>
              <button onClick={() => setShowOnboardModal(false)} className="p-1 hover:bg-dark-secondary rounded-lg"><FaTimes /></button>
            </div>
            <form onSubmit={handleOnboardStudent} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm" />
                  <input
                    type="text"
                    value={onboardForm.name}
                    onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                    placeholder="Enter student name"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Email *</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm" />
                  <input
                    type="email"
                    value={onboardForm.email}
                    onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                    placeholder="Enter student email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Phone Number</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm" />
                  <input
                    type="tel"
                    value={onboardForm.phone}
                    onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password *</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm" />
                  <input
                    type={showOnboardPassword ? 'text' : 'password'}
                    value={onboardForm.password}
                    onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-10 py-2.5 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOnboardPassword(!showOnboardPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white"
                  >
                    {showOnboardPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-dark-muted text-xs mt-1">Share this password with the student for login</p>
              </div>

              <button
                type="submit"
                disabled={onboardLoading}
                className="w-full py-2.5 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {onboardLoading ? 'Creating...' : 'Create & Enroll Student'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetail;
