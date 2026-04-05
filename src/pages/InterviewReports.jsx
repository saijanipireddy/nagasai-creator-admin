import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUserGraduate,
  FaClipboardList,
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaShieldAlt,
  FaEye,
  FaDesktop,
  FaCopy,
  FaExchangeAlt,
} from 'react-icons/fa';
import { interviewAPI } from '../services/api';
import { useToast } from '../components/Toast';

const recommendationColors = {
  STRONG_HIRE: 'bg-green-500/20 text-green-400',
  HIRE: 'bg-emerald-500/20 text-emerald-400',
  MAYBE: 'bg-yellow-500/20 text-yellow-400',
  NO_HIRE: 'bg-orange-500/20 text-orange-400',
  STRONG_NO_HIRE: 'bg-red-500/20 text-red-400',
  PENDING: 'bg-gray-500/20 text-gray-400',
};

const recommendationLabels = {
  STRONG_HIRE: 'Strong Hire',
  HIRE: 'Hire',
  MAYBE: 'Maybe',
  NO_HIRE: 'No Hire',
  STRONG_NO_HIRE: 'Strong No Hire',
  PENDING: 'Pending',
};

const statusIcons = {
  completed: <FaCheckCircle className="text-green-500" />,
  in_progress: <FaClock className="text-yellow-500" />,
  pending: <FaClock className="text-gray-500" />,
  abandoned: <FaTimesCircle className="text-red-500" />,
};

/* ------------------------------------------------------------------ */
/*  LIST VIEW                                                         */
/* ------------------------------------------------------------------ */
const InterviewList = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data } = await interviewAPI.getAllInterviews();
      setInterviews(data);
    } catch {
      addToast('Failed to fetch interviews', 'error');
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold">Interview Reports</h1>
        <p className="text-dark-muted">View all AI interview results and detailed reports</p>
      </div>

      {interviews.length > 0 ? (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Link
              key={interview._id}
              to={`/interviews/report/${interview._id}`}
              className="block bg-dark-card rounded-xl border border-dark-secondary p-4 hover:border-dark-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <FaClipboardList className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{interview.studentName}</p>
                    {statusIcons[interview.status]}
                    <span className="text-xs text-dark-muted capitalize">{interview.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-dark-muted text-xs mb-2">{interview.studentEmail}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {interview.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-dark-secondary rounded text-xs text-dark-muted">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-dark-muted">
                    <span>
                      Questions: {interview.questionsAnswered}/{interview.maxQuestions}
                    </span>
                    {interview.startedAt && (
                      <span>Started: {new Date(interview.startedAt).toLocaleString()}</span>
                    )}
                    {interview.proctoringData && interview.proctoringData.totalWarnings > 0 && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <FaExclamationTriangle className="text-[10px]" />
                        {interview.proctoringData.totalWarnings} warning{interview.proctoringData.totalWarnings > 1 ? 's' : ''}
                      </span>
                    )}
                    {interview.proctoringData?.autoTerminated && (
                      <span className="text-red-400 font-medium">Auto-terminated</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {interview.report ? (
                    <>
                      <p className="text-2xl font-bold">{interview.report.overallScore}</p>
                      <p className="text-xs text-dark-muted">/10</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                          recommendationColors[interview.report.recommendation]
                        }`}
                      >
                        {recommendationLabels[interview.report.recommendation]}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-dark-muted">No report yet</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-12 text-center">
          <FaClipboardList className="text-6xl text-dark-muted mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No interviews yet</h3>
          <p className="text-dark-muted">
            Interviews will appear here once students start their AI interviews
          </p>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  DETAIL VIEW                                                       */
/* ------------------------------------------------------------------ */
const InterviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await interviewAPI.getReport(id);
      setData(res.data);
    } catch {
      addToast('Failed to fetch interview report', 'error');
      navigate('/interviews/reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const { interview, responses, report } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/interviews/reports')}
          className="p-2 hover:bg-dark-secondary rounded-lg"
        >
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{interview.studentName}'s Interview</h1>
          <p className="text-dark-muted text-sm">
            {interview.skills.join(', ')} &bull; {interview.questionsAnswered} questions answered
          </p>
        </div>
      </div>

      {/* Report Summary */}
      {report && (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaChartBar className="text-dark-accent" /> Report Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-dark-bg rounded-lg p-4 text-center">
              <p className="text-4xl font-bold">{report.overallScore}</p>
              <p className="text-dark-muted text-sm">/10 Overall</p>
            </div>
            <div className="bg-dark-bg rounded-lg p-4 text-center">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  recommendationColors[report.recommendation]
                }`}
              >
                {recommendationLabels[report.recommendation]}
              </span>
              <p className="text-dark-muted text-sm mt-2">Recommendation</p>
            </div>
            <div className="bg-dark-bg rounded-lg p-4 text-center">
              <p className="text-4xl font-bold">{interview.questionsAnswered}</p>
              <p className="text-dark-muted text-sm">Questions Answered</p>
            </div>
          </div>

          {/* Skill Scores */}
          {report.skillScores && Object.keys(report.skillScores).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Skill-wise Scores</h3>
              <div className="space-y-2">
                {Object.entries(report.skillScores).map(([skill, score]) => (
                  <div key={skill} className="flex items-center gap-3">
                    <span className="text-sm text-dark-muted w-32 truncate">{skill}</span>
                    <div className="flex-1 bg-dark-bg rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-dark-accent"
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{score}/10</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {report.strengths?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-green-400">Strengths</h3>
                <ul className="space-y-1">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-dark-muted flex items-start gap-2">
                      <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0 text-xs" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.weaknesses?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-orange-400">Areas to Improve</h3>
                <ul className="space-y-1">
                  {report.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-dark-muted flex items-start gap-2">
                      <FaTimesCircle className="text-orange-500 mt-0.5 flex-shrink-0 text-xs" /> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {report.detailedFeedback && (
            <div className="bg-dark-bg rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Detailed Feedback</h3>
              <p className="text-sm text-dark-muted whitespace-pre-wrap">{report.detailedFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Proctoring Report */}
      {interview.proctoringData && (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-dark-accent" /> Proctoring Report
          </h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className={`bg-dark-bg rounded-lg p-3 text-center ${
              interview.proctoringData.tabSwitchCount > 0 ? 'ring-1 ring-yellow-500/30' : ''
            }`}>
              <FaExchangeAlt className={`mx-auto mb-1 ${
                interview.proctoringData.tabSwitchCount > 0 ? 'text-yellow-400' : 'text-dark-muted'
              }`} />
              <p className="text-2xl font-bold">{interview.proctoringData.tabSwitchCount || 0}</p>
              <p className="text-dark-muted text-xs">Tab Switches</p>
            </div>
            <div className={`bg-dark-bg rounded-lg p-3 text-center ${
              interview.proctoringData.fullscreenExitCount > 0 ? 'ring-1 ring-yellow-500/30' : ''
            }`}>
              <FaDesktop className={`mx-auto mb-1 ${
                interview.proctoringData.fullscreenExitCount > 0 ? 'text-yellow-400' : 'text-dark-muted'
              }`} />
              <p className="text-2xl font-bold">{interview.proctoringData.fullscreenExitCount || 0}</p>
              <p className="text-dark-muted text-xs">Fullscreen Exits</p>
            </div>
            <div className={`bg-dark-bg rounded-lg p-3 text-center ${
              interview.proctoringData.faceNotDetectedCount > 0 ? 'ring-1 ring-orange-500/30' : ''
            }`}>
              <FaEye className={`mx-auto mb-1 ${
                interview.proctoringData.faceNotDetectedCount > 0 ? 'text-orange-400' : 'text-dark-muted'
              }`} />
              <p className="text-2xl font-bold">{interview.proctoringData.faceNotDetectedCount || 0}</p>
              <p className="text-dark-muted text-xs">Face Not Detected</p>
            </div>
            <div className={`bg-dark-bg rounded-lg p-3 text-center ${
              interview.proctoringData.copyPasteAttempts > 0 ? 'ring-1 ring-red-500/30' : ''
            }`}>
              <FaCopy className={`mx-auto mb-1 ${
                interview.proctoringData.copyPasteAttempts > 0 ? 'text-red-400' : 'text-dark-muted'
              }`} />
              <p className="text-2xl font-bold">{interview.proctoringData.copyPasteAttempts || 0}</p>
              <p className="text-dark-muted text-xs">Copy/Paste Blocked</p>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            interview.proctoringData.totalWarnings === 0
              ? 'bg-green-500/10 ring-1 ring-green-500/20'
              : interview.proctoringData.totalWarnings <= 3
              ? 'bg-yellow-500/10 ring-1 ring-yellow-500/20'
              : 'bg-red-500/10 ring-1 ring-red-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <FaShieldAlt className={`text-sm ${
                interview.proctoringData.totalWarnings === 0 ? 'text-green-400' :
                interview.proctoringData.totalWarnings <= 3 ? 'text-yellow-400' : 'text-red-400'
              }`} />
              <span className="text-sm font-medium">
                {interview.proctoringData.totalWarnings === 0
                  ? 'Clean Session - No violations'
                  : `${interview.proctoringData.totalWarnings} total violation${interview.proctoringData.totalWarnings > 1 ? 's' : ''} detected`}
              </span>
            </div>
            {interview.proctoringData.autoTerminated && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                Auto-Terminated
              </span>
            )}
            {interview.proctoringData.interviewDuration && (
              <span className="text-dark-muted text-xs">
                Duration: {Math.floor(interview.proctoringData.interviewDuration / 60)}m {interview.proctoringData.interviewDuration % 60}s
              </span>
            )}
          </div>

          {/* Warning Timeline */}
          {interview.proctoringData.warnings && interview.proctoringData.warnings.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 text-dark-muted">Warning Timeline</h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {interview.proctoringData.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs bg-dark-bg rounded p-2">
                    <FaExclamationTriangle className={`mt-0.5 flex-shrink-0 ${
                      w.type === 'faceNotDetected' ? 'text-orange-400' :
                      w.type === 'copyPaste' ? 'text-red-400' :
                      'text-yellow-400'
                    }`} />
                    <span className="text-dark-muted flex-1">{w.message}</span>
                    <span className="text-dark-muted/60 flex-shrink-0">
                      {new Date(w.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question-by-Question Breakdown */}
      {responses.length > 0 && (
        <div className="bg-dark-card rounded-xl border border-dark-secondary p-6">
          <h2 className="text-lg font-bold mb-4">Question-by-Question Breakdown</h2>
          <div className="space-y-4">
            {responses.map((r) => (
              <div key={r._id} className="bg-dark-bg rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-dark-secondary rounded text-xs text-dark-muted">
                      Q{r.questionIndex + 1}
                    </span>
                    {r.skillTested && (
                      <span className="px-2 py-0.5 bg-dark-accent/20 rounded text-xs text-dark-accent">
                        {r.skillTested}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      r.score >= 7 ? 'text-green-400' : r.score >= 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}
                  >
                    {r.score}/10
                  </span>
                </div>
                <p className="text-sm mb-2">
                  <span className="text-dark-muted">Q: </span>
                  {r.question}
                </p>
                <p className="text-sm mb-2">
                  <span className="text-dark-muted">A: </span>
                  {r.answer}
                </p>
                {r.feedback && (
                  <p className="text-xs text-dark-muted bg-dark-secondary/50 rounded p-2 mt-2">
                    {r.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  ROUTER COMPONENT                                                  */
/* ------------------------------------------------------------------ */
const InterviewReports = () => {
  const { id } = useParams();
  return id ? <InterviewDetail /> : <InterviewList />;
};

export default InterviewReports;
