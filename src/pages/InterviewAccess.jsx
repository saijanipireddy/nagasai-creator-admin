import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaTimes, FaUserGraduate, FaSearch, FaCheck } from 'react-icons/fa';
import { interviewAPI, batchAPI } from '../services/api';
import { useToast } from '../components/Toast';

const SKILL_OPTIONS = [
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'Next.js',
  'Node.js', 'Express.js', 'NestJS', 'Python', 'Django', 'Flask', 'Java', 'Spring Boot',
  'C', 'C++', 'C#', '.NET', 'PHP', 'Laravel', 'Ruby', 'Ruby on Rails', 'Go', 'Rust',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
  'Git', 'Docker', 'AWS', 'Azure', 'Linux', 'Data Structures', 'Algorithms',
  'System Design', 'OOP', 'DBMS', 'Computer Networks', 'Operating Systems',
];

const InterviewAccess = () => {
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGrant, setShowGrant] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [granting, setGranting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchAccess();
  }, []);

  const fetchAccess = async () => {
    try {
      const { data } = await interviewAPI.getAllAccess();
      setAccessList(data);
    } catch {
      addToast('Failed to fetch interview access list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await batchAPI.getAllStudents();
      setStudents(data);
    } catch {
      addToast('Failed to fetch students', 'error');
    }
  };

  const handleOpenGrant = () => {
    setShowGrant(true);
    setSelectedStudent(null);
    setSelectedSkills([]);
    setSkillSearch('');
    setStudentSearch('');
    setMaxAttempts(1);
    setExpiresInDays(7);
    fetchStudents();
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!selectedStudent || selectedSkills.length === 0) {
      addToast('Select a student and at least one skill', 'error');
      return;
    }
    try {
      setGranting(true);
      await interviewAPI.grantAccess({
        studentId: selectedStudent._id,
        skills: selectedSkills,
        maxAttempts,
        expiresInDays,
      });
      addToast('Interview access granted successfully', 'success');
      setShowGrant(false);
      fetchAccess();
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to grant access', 'error');
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Revoke this interview access?')) return;
    try {
      await interviewAPI.revokeAccess(id);
      setAccessList((prev) => prev.map((a) => (a._id === id ? { ...a, status: 'expired' } : a)));
      addToast('Access revoked', 'success');
    } catch {
      addToast('Failed to revoke access', 'error');
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredSkills = SKILL_OPTIONS.filter((s) =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const statusColor = {
    active: 'bg-green-500/20 text-green-500',
    expired: 'bg-red-500/20 text-red-500',
    completed: 'bg-blue-500/20 text-blue-500',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Interview Access</h1>
          <p className="text-dark-muted">Grant and manage student interview access based on skills</p>
        </div>
        <button
          onClick={handleOpenGrant}
          className="flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors"
        >
          <FaPlus /> Grant Access
        </button>
      </div>

      {/* Grant Access Modal */}
      {showGrant && (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Grant Interview Access</h2>
            <button onClick={() => setShowGrant(false)} className="p-2 hover:bg-dark-secondary rounded-lg">
              <FaTimes />
            </button>
          </div>

          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Student *</label>
            {selectedStudent ? (
              <div className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg border border-green-500/30">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FaCheck className="text-green-500 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedStudent.name}</p>
                  <p className="text-dark-muted text-xs">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-dark-muted hover:text-white text-sm"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted text-sm" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full pl-9 pr-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent text-sm"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 bg-dark-bg rounded-lg border border-dark-secondary p-2">
                  {filteredStudents.length === 0 ? (
                    <p className="text-dark-muted text-sm text-center py-4">No students found</p>
                  ) : (
                    filteredStudents.slice(0, 50).map((s) => (
                      <button
                        key={s._id}
                        onClick={() => setSelectedStudent(s)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-dark-secondary rounded-lg text-left transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <FaUserGraduate className="text-purple-500 text-xs" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-dark-muted text-xs">{s.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Skill Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Skills * <span className="text-dark-muted">({selectedSkills.length} selected)</span>
            </label>
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              placeholder="Filter skills..."
              className="w-full px-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent text-sm mb-2"
            />
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-dark-accent/20 text-dark-accent rounded-full text-xs cursor-pointer hover:bg-dark-accent/30"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill} <FaTimes className="text-[10px]" />
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {filteredSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedSkills.includes(skill)
                      ? 'bg-dark-accent text-white'
                      : 'bg-dark-bg border border-dark-secondary text-dark-muted hover:border-dark-accent hover:text-white'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Max Attempts</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expires In (days)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 7)}
                className="w-full px-4 py-2 bg-dark-bg border border-dark-secondary rounded-lg focus:outline-none focus:border-dark-accent text-sm"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleGrant}
            disabled={granting || !selectedStudent || selectedSkills.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-dark-accent rounded-lg hover:bg-dark-accent/80 transition-colors disabled:opacity-50"
          >
            {granting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Granting...
              </>
            ) : (
              <>
                <FaPlus /> Grant Interview Access
              </>
            )}
          </button>
        </div>
      )}

      {/* Access List */}
      {accessList.length > 0 ? (
        <div className="space-y-3">
          {accessList.map((access) => (
            <div
              key={access._id}
              className="bg-dark-card rounded-xl border border-dark-secondary p-4 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <FaUserGraduate className="text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{access.studentName}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[access.status]}`}>
                    {access.status}
                  </span>
                </div>
                <p className="text-dark-muted text-xs mb-2">{access.studentEmail}</p>
                <div className="flex flex-wrap gap-1.5">
                  {access.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 bg-dark-secondary rounded text-xs text-dark-muted"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-dark-muted">
                  <span>Attempts: {access.attemptsUsed}/{access.maxAttempts}</span>
                  <span>
                    Expires: {access.expiresAt ? new Date(access.expiresAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              {access.status === 'active' && (
                <button
                  onClick={() => handleRevoke(access._id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 flex-shrink-0"
                  title="Revoke access"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-12 text-center">
          <FaUserGraduate className="text-6xl text-dark-muted mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No interview access granted yet</h3>
          <p className="text-dark-muted mb-4">
            Grant interview access to students to enable AI-powered technical interviews
          </p>
          <button
            onClick={handleOpenGrant}
            className="inline-flex items-center gap-2 px-4 py-2 bg-dark-accent rounded-lg hover:bg-dark-accent/80"
          >
            <FaPlus /> Grant Access
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewAccess;
