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
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { CodeEditor } from '../components/exam/CodeEditor';
import { useProctorIntegrity } from '../hooks/useProctorIntegrity';
import { examSphereApi } from '../services/api';

export default function ExamRunner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(5400); // 90 mins
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

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
    candidateName: 'Alex Rivera',
    candidateEmail: 'alex.rivera@student.mit.edu',
    maxViolations: 3,
    onAutoSubmit: async () => {
      // Auto-submit when violations max out
      const res = await examSphereApi.submissions.submit(id || 'exam-cs101', {
        autoSubmitted: true,
        reason: 'Violation limit reached',
      });
      setSubmissionResult(res.data);
      setIsSubmitted(true);
    },
  });

  // Load exam data
  useEffect(() => {
    async function fetchExam() {
      const res = await examSphereApi.exams.getById(id || 'exam-cs101');
      setExam(res.data);
    }
    fetchExam();
  }, [id]);

  // Exam timer
  useEffect(() => {
    if (isSubmitted || isTerminated) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, isTerminated]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleManualSubmit = async () => {
    setShowSubmitModal(false);
    const res = await examSphereApi.submissions.submit(id || 'exam-cs101', {
      answers: [],
    });
    setSubmissionResult(res.data);
    setIsSubmitted(true);
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
              Candidate: Alex Rivera &bull; Question {currentQuestionIndex + 1} of {exam?.questions?.length || 1}
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
            <h2 className="font-heading font-extrabold text-xl text-white">
              {currentQuestion?.title || 'Coding Challenge'}
            </h2>

            <div className="prose prose-invert prose-sm text-slate-300 leading-relaxed space-y-3 font-sans">
              <div className="whitespace-pre-wrap font-sans text-sm">
                {currentQuestion?.description}
              </div>
            </div>
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

        {/* RIGHT COLUMN: Monaco Code Editor & Test Runner (col-span-7) */}
        <section className="lg:col-span-7 bg-slate-950 p-3 sm:p-4 flex flex-col h-full overflow-hidden">
          <CodeEditor
            question={currentQuestion}
            submissionId="sub-demo-001"
            initialCode={currentQuestion?.starterTemplates?.[currentQuestion?.defaultLanguage || 'javascript']}
          />
        </section>
      </main>

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
    </div>
  );
}
