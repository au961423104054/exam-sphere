import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Lock,
  EyeOff,
  CameraOff,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { CodeEditor } from '../components/exam/CodeEditor';
import { WebcamFeed } from '../components/exam/WebcamFeed';
import { SystemCheckModal } from '../components/exam/SystemCheckModal';
import { useProctorIntegrity } from '../hooks/useProctorIntegrity';
import { useWebcamProctor } from '../hooks/useWebcamProctor';
import { useNotifications } from '../context/NotificationContext';
import { examSphereApi } from '../services/api';

export default function ExamRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(5400); // 90 mins
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showSystemCheck, setShowSystemCheck] = useState(true);
  const [examStarted, setExamStarted] = useState(false);
  const [verificationSnapshotUrl, setVerificationSnapshotUrl] = useState(null);
  const [candidateDetails, setCandidateDetails] = useState(null);

  const currentUser = examSphereApi.auth.getCurrentUser();
  const candidateEmail = currentUser?.email || 'student@examsphere.io';
  const candidateName = currentUser?.name || 'Student Candidate';

  // Webcam periodic snapshot proctoring (continuous 30-45s audit filmstrip)
  const webcamProctor = useWebcamProctor({
    examId: id || 'exam-cs101',
    submissionId,
    candidateEmail,
    intervalSeconds: exam?.snapshotIntervalSeconds || 30,
    enabled: examStarted && !isSubmitted,
    onSnapshotCaptured: ({ count }) => {
      showToast({
        type: 'info',
        title: 'Proctoring Snapshot Uploaded',
        message: `Webcam frame #${count} captured and linked to session audit filmstrip.`,
        duration: 3000,
      });
    },
    onCameraBlocked: ({ avgLuminance }) => {
      recordViolation(
        'camera-blocked',
        `Webcam feed obstructed or pitch black (luminance: ${avgLuminance}). Ensure your face is clearly visible.`,
        'High'
      );
    },
    onCameraRestored: () => {
      showToast({
        type: 'success',
        title: 'Camera Restored',
        message: 'Webcam feed resumed. Camera shutter is open.',
        duration: 3000,
      });
    },
  });

  // Anti-cheat & integrity proctor hook
  const {
    violations,
    violationCount,
    maxViolations,
    isFullscreen,
    enterFullscreen,
    warningModalOpen,
    setWarningModalOpen,
    currentWarning,
    isScreenshotBlurred,
    isTerminated,
    terminationReason,
    recordViolation,
  } = useProctorIntegrity({
    examId: id || 'exam-cs101',
    candidateName: candidateDetails?.name || candidateName,
    candidateEmail: candidateDetails?.email || candidateEmail,
    maxViolations: 3,
    enabled: examStarted && !isSubmitted,
    onAutoSubmit: async () => {
      showToast({
        type: 'destructive',
        title: 'Assessment Auto-Submitted',
        message: 'Security violation threshold exceeded. Your exam has been locked.',
        duration: 8000,
      });
      const answersList = Object.values(answers);
      const subId = submissionId || id || 'exam-cs101';
      const res = await examSphereApi.submissions.finalize(subId, answersList);
      setSubmissionResult(res.data);
      setIsSubmitted(true);
    },
  });

  // Load exam metadata on mount
  useEffect(() => {
    async function fetchExam() {
      try {
        const examIdToLoad = id || 'exam-cs101';
        const res = await examSphereApi.exams.getById(examIdToLoad);
        setExam(res.data);
        if (res.data?.durationMinutes) {
          setTimeLeftSeconds(res.data.durationMinutes * 60);
        }
      } catch (err) {
        console.warn('Failed to load exam details:', err);
      }
    }
    fetchExam();
  }, [id]);

  // Handle successful completion of Admit Card & Identity Verification Gate
  const handleSystemCheckComplete = async ({
    verificationSnapshotUrl: photoUrl,
    candidateDetails: verifiedDetails,
  }) => {
    setVerificationSnapshotUrl(photoUrl);
    if (verifiedDetails) {
      setCandidateDetails(verifiedDetails);
    }
    setShowSystemCheck(false);

    try {
      const examIdToLoad = id || 'exam-cs101';
      const startRes = await examSphereApi.submissions.start(examIdToLoad, photoUrl, verifiedDetails);
      if (startRes?.data?.submissionId || startRes?.data?.id) {
        setSubmissionId(startRes.data.submissionId || startRes.data.id);
      }
      setExamStarted(true);
      enterFullscreen();
      showToast({
        type: 'success',
        title: 'Assessment Started',
        message: `Registered & Verified: ${verifiedDetails?.name || candidateName} (${verifiedDetails?.collegeId || 'ID Verified'}). Continuous proctoring active.`,
        duration: 4000,
      });
    } catch (err) {
      showToast({
        type: 'destructive',
        title: 'Access Denied',
        message: err.response?.data?.message || err.message || 'Failed to start examination session',
        duration: 8000,
      });
    }
  };

  // Exam timer (runs only after examStarted)
  useEffect(() => {
    if (!examStarted || isSubmitted || isTerminated) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, isSubmitted, isTerminated]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Trigger real-time toast alert on proctoring infractions
  useEffect(() => {
    if (currentWarning) {
      showToast({
        type: 'warning',
        title: `Proctoring Warning: ${currentWarning.type}`,
        message: `${currentWarning.details} (${currentWarning.remaining} violation(s) remaining)`,
        duration: 5500,
      });
    }
  }, [currentWarning, showToast]);

  const handleAnswerSelect = async (questionId, option) => {
    const updated = {
      ...answers,
      [questionId]: { questionId, selectedOption: option },
    };
    setAnswers(updated);
    if (submissionId) {
      try {
        await examSphereApi.submissions.saveAnswer(submissionId, {
          questionId,
          selectedOption: option,
        });
      } catch (err) {
        console.warn('Failed to save answer:', err);
      }
    }
  };

  const handleManualSubmit = async () => {
    setShowSubmitModal(false);
    const answersList = Object.values(answers);
    const subId = submissionId || id || 'exam-cs101';
    try {
      const res = await examSphereApi.submissions.finalize(subId, answersList);
      setSubmissionResult(res.data);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting exam:', err);
    }
  };

  const currentQuestion = exam?.questions?.[currentQuestionIndex] || exam?.questions?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative">
      {/* SCREENSHOT DETERRENCE BLUR OVERLAY */}
      {isScreenshotBlurred && (
        <div className="fixed inset-0 z-50 backdrop-blur-2xl bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-75">
          <div className="p-4 bg-rose-500/20 rounded-full border border-rose-500/40 mb-4 animate-bounce">
            <EyeOff className="w-12 h-12 text-rose-400" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-white tracking-tight">
            Security Notice: Screenshot Key Detected
          </h2>
          <p className="max-w-md text-sm text-slate-300 mt-2">
            Screen capture keystrokes are intercepted during official assessments. The exam viewport has been temporarily blurred and this incident has been logged into your supervisor audit log.
          </p>
          <span className="mt-4 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Note: Client-side deterrence & audit logging active (not guaranteed OS-level capture prevention)
          </span>
        </div>
      )}

      {/* TOP INTEGRITY BAR */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Exam title & Question indicator */}
        <div className="flex items-center space-x-3">
          <Link
            to="/student/dashboard"
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-md"
          >
            &larr; Exit
          </Link>
          <div>
            <h1 className="font-heading font-bold text-sm text-white truncate max-w-xs sm:max-w-md">
              {exam?.title || 'CS101: Final Assessment'}
            </h1>
            <span className="text-[11px] text-slate-400 block font-mono">
              Candidate: {candidateDetails?.name || candidateName}
              {candidateDetails?.collegeId ? ` (Reg No: ${candidateDetails.collegeId})` : ''} &bull; Question{' '}
              {currentQuestionIndex + 1} of {exam?.questions?.length || 1}
            </span>
          </div>
        </div>

        {/* Center: Proctoring Status & Fullscreen Enforcer */}
        <div className="flex items-center space-x-2">
          {/* Violation Counter Badge */}
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
              violationCount === 0
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                : violationCount === 1
                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                : 'bg-rose-950/80 text-rose-300 border-rose-700/60 animate-pulse'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {violationCount} / {maxViolations} Violations
            </span>
          </div>

          {/* Fullscreen Button */}
          {!isFullscreen && (
            <button
              onClick={enterFullscreen}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium hover:bg-indigo-600/40 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enforce Fullscreen</span>
            </button>
          )}

          {/* Simulation Test Trigger (For user verification) */}
          <button
            onClick={() => recordViolation('Mock Tab Switch', 'Simulated tab blur trigger for evaluation', 'High')}
            className="text-[10px] text-slate-400 hover:text-amber-300 underline font-mono px-1"
            title="Click to simulate anti-cheat tab-switch trigger"
          >
            [Simulate Blur]
          </button>
        </div>

        {/* Right: Timer & Submit Action */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-sm tracking-wider">{formatTimer(timeLeftSeconds)}</span>
          </div>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowSubmitModal(true)}
            className="text-xs font-semibold gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish Exam</span>
          </Button>
        </div>
      </header>

      {/* MAIN TWO-PANE EXAM ENVIRONMENT */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN: Problem Statement & Question Nav (col-span-5) */}
        <section className="lg:col-span-5 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto space-y-6 max-h-[calc(100vh-60px)]">
          {/* Question Nav Pills */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              {exam?.questions?.map((q, idx) => (
                <button
                  key={q.id || idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                    idx === currentQuestionIndex
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="default">{currentQuestion?.difficulty || 'Medium'}</Badge>
              <Badge variant="secondary">{currentQuestion?.marks || 25} Marks</Badge>
            </div>
          </div>

          {/* Question Title & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentQuestion?.type === 'coding'
                  ? 'Coding Problem'
                  : currentQuestion?.type === 'mcq'
                  ? 'Multiple Choice'
                  : currentQuestion?.type === 'tf'
                  ? 'True / False'
                  : currentQuestion?.type === 'subjective'
                  ? 'Subjective'
                  : 'Question'}
              </span>
            </div>

            <h2 className="font-heading font-extrabold text-xl text-white">
              {currentQuestion?.title ||
                (currentQuestion?.text?.includes('\n\n')
                  ? currentQuestion.text.split('\n\n')[0]
                  : currentQuestion?.text && currentQuestion.text.length > 50
                  ? currentQuestion.text.substring(0, 50) + '...'
                  : currentQuestion?.text) ||
                `Question ${currentQuestionIndex + 1}`}
            </h2>

            <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed space-y-3 font-sans">
              <div className="whitespace-pre-wrap font-sans text-sm leading-6">
                {currentQuestion?.description ||
                  (currentQuestion?.text?.includes('\n\n')
                    ? currentQuestion.text.split('\n\n').slice(1).join('\n\n')
                    : currentQuestion?.text) ||
                  currentQuestion?.prompt ||
                  'No additional question description provided.'}
              </div>
            </div>

            {/* Test Cases / Example Preview in Coding Mode */}
            {currentQuestion?.testCases && currentQuestion.testCases.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block font-mono">
                  Sample Test Cases:
                </span>
                <div className="space-y-2">
                  {currentQuestion.testCases
                    .filter((tc) => !tc.isHidden)
                    .slice(0, 3)
                    .map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1"
                      >
                        <div className="text-slate-400">
                          <span className="text-slate-500">Input:</span>{' '}
                          <span className="text-indigo-300">{tc.input || '(empty)'}</span>
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">Expected Output:</span>{' '}
                          <span className="text-emerald-400">
                            {tc.expectedOutput || tc.expected}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Limits Box */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Time Limit:</span>
              <span className="text-slate-200">{currentQuestion?.timeLimitSeconds || 2} seconds</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Limit:</span>
              <span className="text-slate-200">{currentQuestion?.memoryLimitMb || 128} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Evaluation Mode:</span>
              <span className="text-teal-400">Automated Test Sandbox</span>
            </div>
          </div>

          {/* Integrity Compliance Notice */}
          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Automated proctoring is enabled. Exiting fullscreen, switching tabs, right-clicking, or attempting screenshots will trigger an integrity infraction.
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN: Monaco Code Editor, MCQ / TF Option Selector, or Subjective (col-span-7) */}
        <section className="lg:col-span-7 bg-slate-950 p-3 sm:p-6 flex flex-col h-full overflow-y-auto">
          {currentQuestion?.type === 'mcq' || currentQuestion?.type === 'tf' ? (
            <div className="space-y-4 max-w-xl mx-auto w-full my-auto">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold block">
                  Question Prompt
                </span>
                <p className="text-base text-white font-medium whitespace-pre-wrap leading-relaxed">
                  {currentQuestion?.description || currentQuestion?.text || currentQuestion?.title}
                </p>
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Choose the correct answer:
              </h3>
              <div className="space-y-3">
                {(currentQuestion?.options?.length ? currentQuestion.options : ['True', 'False']).map((opt, i) => {
                  const qKey = currentQuestion._id || currentQuestion.id;
                  const isSelected = answers[qKey]?.selectedOption === opt;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAnswerSelect(qKey, opt)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-sm font-medium">{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : currentQuestion?.type === 'subjective' ? (
            <div className="space-y-4 max-w-2xl mx-auto w-full my-auto">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono uppercase text-indigo-400 font-semibold block">
                  Subjective Question Prompt
                </span>
                <p className="text-base text-white font-medium whitespace-pre-wrap leading-relaxed">
                  {currentQuestion?.description || currentQuestion?.text || currentQuestion?.title}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Candidate Answer:
                </label>
                <textarea
                  rows={8}
                  value={answers[currentQuestion._id || currentQuestion.id]?.answerText || ''}
                  onChange={(e) => {
                    const qKey = currentQuestion._id || currentQuestion.id;
                    setAnswers((prev) => ({
                      ...prev,
                      [qKey]: { questionId: qKey, answerText: e.target.value }
                    }));
                  }}
                  placeholder="Type your response here..."
                  className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-white font-sans text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <CodeEditor
              question={currentQuestion}
              submissionId={submissionId || id || 'sub-demo-001'}
              initialCode={
                answers[currentQuestion?._id || currentQuestion?.id]?.code ||
                currentQuestion?.starterTemplates?.[currentQuestion?.defaultLanguage || currentQuestion?.language || 'javascript'] ||
                currentQuestion?.starterCode
              }
              onCodeChange={(newCode, newLang) => {
                const qKey = currentQuestion._id || currentQuestion.id;
                setAnswers((prev) => ({
                  ...prev,
                  [qKey]: {
                    questionId: qKey,
                    code: newCode,
                    language: newLang,
                  },
                }));
              }}
              onSubmitSuccess={(res) => {
                const qKey = currentQuestion._id || currentQuestion.id;
                setAnswers((prev) => ({
                  ...prev,
                  [qKey]: {
                    questionId: qKey,
                    code: prev[qKey]?.code || '',
                    language: prev[qKey]?.language || 'javascript',
                    marksAwarded: res.marksAwarded,
                    testResults: res.results,
                  },
                }));
              }}
            />
          )}
        </section>
      </main>

      {/* PICTURE-IN-PICTURE WEBCAM PROCTORING FEED */}
      <WebcamFeed proctor={webcamProctor} />

      {/* WARNING MODAL: Triggered on Integrity Infraction */}
      <Dialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-rose-700">Exam Integrity Warning</DialogTitle>
              <span className="text-xs text-slate-500 font-mono">
                Violation #{currentWarning?.currentCount} of {maxViolations} Maximum
              </span>
            </div>
          </div>
          <DialogDescription className="space-y-3 pt-2">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 font-mono">
              <strong>Incident Type:</strong> {currentWarning?.type}
              <br />
              <strong>Detail:</strong> {currentWarning?.details}
            </div>
            <p className="text-sm text-slate-600">
              ExamSphere detected an unauthorized action. Please remain in fullscreen and keep the testing tab active.
            </p>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 font-semibold">
              Warning: You have {currentWarning?.remaining} violation{currentWarning?.remaining === 1 ? '' : 's'} remaining before this exam is automatically locked and submitted.
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              setWarningModalOpen(false);
              enterFullscreen();
            }}
            className="w-full sm:w-auto"
          >
            I Understand, Return to Exam
          </Button>
        </DialogFooter>
      </Dialog>

      {/* AUTO-SUBMIT TERMINATION LOCKDOWN MODAL */}
      <Dialog open={isTerminated} onOpenChange={() => {}}>
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-rose-600 text-white rounded-xl">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <DialogTitle className="text-rose-600 text-xl">Assessment Terminated</DialogTitle>
              <span className="text-xs text-slate-500">Security Threshold Exceeded</span>
            </div>
          </div>
          <DialogDescription className="space-y-4 pt-2">
            <p className="text-sm text-slate-700 leading-relaxed">{terminationReason}</p>

            <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono">
              <span className="font-bold text-slate-600 block mb-1">Itemized Violation Audit:</span>
              {violations.map((v, i) => (
                <div key={v.id || i} className="text-rose-700">
                  [{v.timestamp}] &bull; {v.violationType}: {v.details}
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Your submission and incident audit record have been forwarded to the course instructor and proctor committee.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="primary"
            onClick={() => navigate('/student/dashboard')}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MANUAL CONFIRM SUBMIT MODAL */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogHeader>
          <DialogTitle>Submit Examination?</DialogTitle>
          <DialogDescription className="pt-2 text-sm text-slate-600">
            Are you sure you want to finalize your assessment? Once submitted, your code answers will be auto-evaluated against the test suite and your responses cannot be modified.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowSubmitModal(false)}>
            Keep Working
          </Button>
          <Button variant="destructive" onClick={handleManualSubmit}>
            Yes, Finalize & Submit
          </Button>
        </DialogFooter>
      </Dialog>

      {/* SUBMISSION SUCCESS MODAL */}
      <Dialog open={isSubmitted && !isTerminated} onOpenChange={() => navigate('/student/dashboard')}>
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <DialogTitle className="text-emerald-700 text-xl">Exam Completed!</DialogTitle>
              <span className="text-xs text-slate-500">Assessment Submitted Successfully</span>
            </div>
          </div>
          <DialogDescription className="space-y-4 pt-2">
            <p className="text-sm text-slate-700">
              Your exam code was evaluated against all test cases. The auto-grading engine has calculated your preliminary score.
            </p>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs uppercase font-semibold text-emerald-700 block">Final Score</span>
              <span className="font-heading font-extrabold text-3xl text-emerald-800">
                {submissionResult?.score || 92} / {submissionResult?.totalMarks || 100}
              </span>
              <span className="text-xs text-emerald-600 block mt-1">Passing standard achieved (Grade: A)</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="primary" onClick={() => navigate('/student/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </DialogFooter>
      </Dialog>

      {/* CAMERA SHUTTER CLOSED BLOCKING OVERLAY */}
      {webcamProctor.isShutterClosed && examStarted && !isSubmitted && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center">
              <CameraOff className="w-9 h-9 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-white">
                Camera Shutter Closed or Lens Covered
              </h3>
              <p className="text-xs text-rose-300 font-mono mt-1">
                Assessment Session Suspended
              </p>
            </div>
            <p className="text-sm text-slate-300">
              Your camera feed is obstructed. You cannot continue the assessment while your webcam is blocked.
            </p>
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 font-mono text-left space-y-1">
              <div>&bull; Slide open the physical privacy shutter on your webcam.</div>
              <div>&bull; Ensure room lighting is adequate and your face is visible.</div>
              <div>&bull; The exam will automatically resume as soon as the camera feed is restored.</div>
            </div>
          </div>
        </div>
      )}

      {/* PRE-EXAM SYSTEM DIAGNOSTICS & IDENTITY GATE */}
      <SystemCheckModal
        exam={exam}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        isOpen={showSystemCheck}
        onComplete={handleSystemCheckComplete}
      />
    </div>
  );
}
