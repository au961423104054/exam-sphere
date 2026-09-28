const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const User = require('../models/User');
const storageService = require('../services/storageService');
const { notifyResultsPublished } = require('../services/notificationService');
const { isIpAllowed } = require('../utils/ipChecker');
const { findExamByIdOrSlug } = require('../utils/examResolver');
const { sampleQuestionsByRule } = require('../utils/questionSampler');
const { success, fail } = require('../utils/http');
const { executeSubmissionCode } = require('../services/codeExecutionService');

const normalizeLanguage = (language) => {
  if (!language) return 'javascript';
  const key = String(language).toLowerCase();
  if (key === 'typescript' || key === 'ts') return 'javascript';
  return key;
};

const startSubmission = async (req, res) => {
  try {
    const rawExamId = req.body.examId;
    if (!rawExamId) return fail(res, 'examId is required', 400);

    const exam = await findExamByIdOrSlug(rawExamId);
    if (!exam) return fail(res, 'Exam not found', 404);

    const examId = exam._id;

    // 1. Enforce time window
    const now = new Date();
    if (exam.startTime && new Date(exam.startTime) > now) {
      return fail(res, `Assessment has not commenced yet. Starts at ${new Date(exam.startTime).toLocaleString()}`, 403);
    }
    if (exam.endTime && new Date(exam.endTime) < now) {
      return fail(res, `Assessment window has closed. Ended at ${new Date(exam.endTime).toLocaleString()}`, 403);
    }

    // 2. Enforce IP restrictions if configured
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
    const ipCheck = isIpAllowed(clientIp, exam.allowedIpRange);
    if (!ipCheck.allowed) {
      return fail(
        res,
        `Exam access is restricted to authorized institutional network: ${exam.allowedIpRange}. Your IP (${ipCheck.clientIp}) is unauthorized.`,
        403
      );
    }

    let submission = await Submission.findOne({
      examId,
      studentId: req.user.id,
      status: 'in-progress'
    });

    const verificationSnapshotUrl =
      req.body.verificationSnapshotUrl ||
      req.body.snapshotUrl ||
      req.body.verificationUrl ||
      req.body.facePhotoUrl ||
      (req.user?.avatarUrl && req.user.avatarUrl.includes('verification') ? req.user.avatarUrl : null);

    // Extract and process candidate registration & College ID verification details
    const candidateName = req.body.candidateName || req.body.name || req.body.candidateDetails?.name || req.user?.name || '';
    const candidateEmail = req.body.candidateEmail || req.body.email || req.body.candidateDetails?.email || req.user?.email || '';
    const collegeId = req.body.collegeId || req.body.registerNo || req.body.candidateDetails?.collegeId || req.body.candidateDetails?.registerNo || req.body.studentRollNo || req.body.rollNo || '';
    const collegeName = req.body.collegeName || req.body.candidateDetails?.collegeName || req.body.institution || '';
    let collegeIdPhotoUrl = req.body.collegeIdPhotoUrl || req.body.candidateDetails?.collegeIdPhotoUrl || req.body.idPhotoUrl || null;

    const rawCollegeIdPhoto = req.body.collegeIdPhoto || req.body.candidateDetails?.collegeIdPhoto;
    if (rawCollegeIdPhoto && !collegeIdPhotoUrl) {
      try {
        const idUpload = await storageService.uploadSnapshot(rawCollegeIdPhoto, { folder: 'college_ids', req });
        collegeIdPhotoUrl = idUpload.url;
      } catch (err) {
        console.warn('Could not store college ID photo buffer:', err.message);
      }
    }

    // 3. Enforce Identity Verification
    if (exam.requireIdentityVerification) {
      const isAlreadyVerified = submission && submission.identityStatus === 'verified';
      if (!isAlreadyVerified && !verificationSnapshotUrl) {
        return fail(
          res,
          'Identity verification is required before starting this examination. Please register your details and capture reference webcam photo.',
          400,
          { requireIdentityVerification: true }
        );
      }
    }

    const candidateDetails = {
      name: candidateName,
      email: candidateEmail,
      collegeId: collegeId,
      collegeName: collegeName,
      collegeIdPhotoUrl: collegeIdPhotoUrl || submission?.candidateDetails?.collegeIdPhotoUrl || null,
      facePhotoUrl: verificationSnapshotUrl || submission?.candidateDetails?.facePhotoUrl || null
    };

    if (!submission) {
      submission = await Submission.create({
        examId,
        studentId: req.user.id,
        status: 'in-progress',
        candidateDetails,
        verificationSnapshotUrl: verificationSnapshotUrl || null,
        verifiedAt: verificationSnapshotUrl ? new Date() : null,
        identityStatus: verificationSnapshotUrl ? 'verified' : (exam.requireIdentityVerification ? 'pending' : 'bypassed')
      });
    } else {
      submission.candidateDetails = {
        ...(submission.candidateDetails?.toObject ? submission.candidateDetails.toObject() : submission.candidateDetails),
        ...candidateDetails
      };
      if (verificationSnapshotUrl && submission.identityStatus !== 'verified') {
        submission.verificationSnapshotUrl = verificationSnapshotUrl;
        submission.verifiedAt = new Date();
        submission.identityStatus = 'verified';
      }
      await submission.save();
    }

    // Persist details back to User profile if not set
    if (req.user?.id) {
      const userUpdates = {};
      if (collegeId) userUpdates.collegeId = collegeId;
      if (collegeName) userUpdates.collegeName = collegeName;
      if (collegeIdPhotoUrl) userUpdates.idPhotoUrl = collegeIdPhotoUrl;
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(req.user.id, { $set: userUpdates }).catch(() => {});
      }
    }

    // 4. Random Question Bank Assignment by Count & Type
    if (exam.questionDistribution && exam.questionDistribution.enabled) {
      if (!submission.assignedQuestions || submission.assignedQuestions.length === 0) {
        const allQuestions = await Question.find({ examId }).sort({ createdAt: 1 });
        const sampled = sampleQuestionsByRule(
          allQuestions,
          exam.questionDistribution,
          req.user.id || submission._id.toString()
        );
        submission.assignedQuestions = sampled.map((q) => q._id);
        await submission.save();
      }
    }

    return success(
      res,
      {
        submissionId: submission._id,
        id: submission._id,
        examId: exam._id,
        status: submission.status,
        duration: exam.duration,
        violationCount: submission.violationCount,
        verifiedAt: submission.verifiedAt,
        verificationSnapshotUrl: submission.verificationSnapshotUrl,
        snapshotIntervalSeconds: exam.snapshotIntervalSeconds || 45,
        enableMicrophoneMonitoring: exam.enableMicrophoneMonitoring || false
      },
      'Exam attempt started',
      201
    );
  } catch (error) {
    return fail(res, 'Failed to start exam attempt', 500, { error: error.message });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user.id })
      .populate('examId', 'title duration totalMarks passingMarks startTime endTime negativeMarking')
      .sort({ createdAt: -1 });

    const data = submissions.map((sub) => {
      const exam = sub.examId || {};
      const passing = exam.passingMarks || 50;
      return {
        id: sub._id,
        submissionId: sub._id,
        examId: exam._id || sub.examId,
        examTitle: exam.title || 'Assessment',
        score: sub.score,
        totalMarks: exam.totalMarks || 100,
        passingMarks: passing,
        passed: sub.score >= passing,
        status: sub.status,
        violationCount: sub.violationCount,
        submittedAt: sub.submittedAt,
        createdAt: sub.createdAt
      };
    });

    return success(res, data, 'Student submissions retrieved');
  } catch (error) {
    return fail(res, 'Failed to retrieve student submissions', 500, { error: error.message });
  }
};

const saveSingleAnswer = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return fail(res, 'Submission not found', 404);
    if (req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403);
    }
    if (submission.status !== 'in-progress' && submission.status !== 'flagged-for-review') {
      return fail(res, 'This attempt can no longer be updated', 400);
    }

    const { questionId, selectedOption, answerText, code, language } = req.body;
    if (!questionId) return fail(res, 'questionId is required', 400);

    const idx = submission.answers.findIndex((a) => a.questionId.toString() === String(questionId));
    const record = {
      questionId,
      selectedOption: selectedOption ?? null,
      answerText: answerText || '',
      code: code || '',
      language: language || '',
      marksAwarded: idx >= 0 ? submission.answers[idx].marksAwarded : 0,
      testResults: idx >= 0 ? submission.answers[idx].testResults : []
    };

    if (idx >= 0) submission.answers[idx] = record;
    else submission.answers.push(record);

    await submission.save();
    return success(res, { questionId, saved: true }, 'Answer saved successfully');
  } catch (error) {
    return fail(res, 'Failed to save answer', 500, { error: error.message });
  }
};

const saveAnswers = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return fail(res, 'Submission not found', 404);
    if (req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403);
    }
    if (submission.status !== 'in-progress' && submission.status !== 'flagged-for-review') {
      return fail(res, 'This attempt can no longer be updated', 400);
    }

    const incoming = Array.isArray(req.body.answers) ? req.body.answers : [req.body];
    incoming.forEach((ans) => {
      if (!ans.questionId) return;
      const idx = submission.answers.findIndex((a) => a.questionId.toString() === String(ans.questionId));
      const record = {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption ?? null,
        answerText: ans.answerText || '',
        code: ans.code || '',
        language: ans.language || '',
        marksAwarded: idx >= 0 ? submission.answers[idx].marksAwarded : 0,
        testResults: idx >= 0 ? submission.answers[idx].testResults : []
      };
      if (idx >= 0) submission.answers[idx] = record;
      else submission.answers.push(record);
    });

    await submission.save();
    return success(res, submission, 'Answers saved');
  } catch (error) {
    return fail(res, 'Failed to save answers', 500, { error: error.message });
  }
};

const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('examId', 'title totalMarks passingMarks duration')
      .populate('studentId', 'name email');
    if (!submission) return fail(res, 'Submission not found', 404);
    if (req.user.role === 'student' && submission.studentId._id.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403);
    }
    return success(res, submission);
  } catch (error) {
    return fail(res, 'Failed to retrieve submission', 500, { error: error.message });
  }
};

const resolveQuestion = async (body, submission) => {
  if (body.questionId) {
    return Question.findById(body.questionId);
  }
  const questions = await Question.find({ examId: submission.examId, type: 'coding' });
  return questions[0] || null;
};

const runCode = async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const { code, language, testCases } = req.body;

    if (!code) {
      return fail(res, 'code is required in the request body', 400);
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) return fail(res, 'Submission not found', 404);

    if (req.user && req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
      return fail(res, 'Forbidden: You do not have permission to access this submission', 403);
    }

    const question = await resolveQuestion(req.body, submission);
    if (!question) return fail(res, 'Question not found. Provide questionId.', 404);
    if (question.type !== 'coding') {
      return fail(res, `Question type is "${question.type}". Expected "coding"`, 400);
    }

    // Only sample (non-hidden) test cases are executed for Run Code
    let sampleTestCases = (question.testCases || []).filter((tc) => !tc.isHidden);
    if (sampleTestCases.length === 0 && question.testCases && question.testCases.length > 0) {
      sampleTestCases = [question.testCases[0]];
    }
    if (Array.isArray(testCases) && testCases.length) {
      sampleTestCases = testCases
        .map((tc) => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || tc.expected || '',
          isHidden: !!tc.isHidden
        }))
        .filter((tc) => !tc.isHidden);
    }

    const targetLanguage = normalizeLanguage(language || question.language);

    const execResult = await executeSubmissionCode({
      question,
      candidateCode: code,
      language: targetLanguage,
      testCases: sampleTestCases
    });

    return success(
      res,
      {
        allPassed: execResult.allPassed,
        passedCount: execResult.passedCount,
        totalCount: sampleTestCases.length,
        results: execResult.results,
        runtimeMs: execResult.runtimeMs,
        stdout: execResult.stdout,
        compilationError: execResult.compilationError,
        questionId: question._id,
        message: execResult.compilationError
          ? `Compilation / Syntax Error: ${execResult.compilationError}`
          : execResult.allPassed
          ? 'All sample test cases passed successfully.'
          : `${execResult.passedCount} of ${sampleTestCases.length} sample test cases passed.`
      },
      'Code executed against sample test cases'
    );
  } catch (error) {
    return fail(res, 'Failed to run code', 500, { error: error.message });
  }
};

const submitCode = async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const { code, language } = req.body;

    if (!code) return fail(res, 'code is required in the request body', 400);

    const submission = await Submission.findById(submissionId);
    if (!submission) return fail(res, 'Submission not found', 404);

    if (req.user && req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403);
    }

    const question = await resolveQuestion(req.body, submission);
    if (!question) return fail(res, 'Question not found. Provide questionId.', 404);
    if (question.type !== 'coding') {
      return fail(res, `Question type is "${question.type}". Expected "coding"`, 400);
    }

    const allTestCases = question.testCases || [];
    const targetLanguage = normalizeLanguage(language || question.language);

    const execResult = await executeSubmissionCode({
      question,
      candidateCode: code,
      language: targetLanguage,
      testCases: allTestCases
    });

    const totalCount = allTestCases.length;
    const passedCount = execResult.passedCount || 0;
    const questionMarks = question.marks || 1;
    const marksAwarded = totalCount > 0
      ? Number(((passedCount / totalCount) * questionMarks).toFixed(2))
      : 0;

    // Secure results: redact hidden test case details
    const sanitizedResults = execResult.results.map((r) => {
      if (r.isHidden) {
        return {
          testCaseIndex: r.testCaseIndex,
          passed: r.passed,
          input: '[Hidden Test Case]',
          expectedOutput: '[Hidden Test Case]',
          actualOutput: r.passed ? '[Hidden Output Matched]' : '[Output Mismatch]',
          error: r.error ? 'Runtime Error in Hidden Test Case' : null,
          executionTimeMs: r.executionTimeMs,
          isHidden: true
        };
      }
      return r;
    });

    const existingAnswerIndex = submission.answers.findIndex(
      (a) => a.questionId.toString() === question._id.toString()
    );

    const answerRecord = {
      questionId: question._id,
      code,
      language: targetLanguage,
      marksAwarded,
      testResults: sanitizedResults
    };

    if (existingAnswerIndex >= 0) submission.answers[existingAnswerIndex] = answerRecord;
    else submission.answers.push(answerRecord);

    submission.score = Number(
      submission.answers.reduce((acc, ans) => acc + (ans.marksAwarded || 0), 0).toFixed(2)
    );
    await submission.save();

    return success(
      res,
      {
        questionId: question._id,
        marksAwarded,
        totalQuestionMarks: questionMarks,
        allPassed: execResult.allPassed,
        passedCount,
        totalCount,
        totalSubmissionScore: submission.score,
        results: sanitizedResults,
        runtimeMs: execResult.runtimeMs,
        compilationError: execResult.compilationError,
        message: execResult.compilationError
          ? `Submission saved with compilation error: ${execResult.compilationError}`
          : execResult.allPassed
          ? `All ${totalCount} test cases passed! Marks awarded: ${marksAwarded}/${questionMarks}`
          : `${passedCount} of ${totalCount} test cases passed. Marks awarded: ${marksAwarded}/${questionMarks}`
      },
      'Code evaluated and submitted successfully'
    );
  } catch (error) {
    return fail(res, 'Failed to submit code', 500, { error: error.message });
  }
};

const gradeMcqTf = async (submission) => {
  const exam = await Exam.findById(submission.examId);
  const questions = await Question.find({ examId: submission.examId });
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));
  let score = 0;
  const negativeMarking = exam ? !!exam.negativeMarking : false;

  for (let i = 0; i < submission.answers.length; i++) {
    const ans = submission.answers[i];
    const question = byId.get(ans.questionId.toString());
    if (!question) continue;
    if (question.type === 'coding') {
      if ((ans.marksAwarded === undefined || ans.marksAwarded === 0) && ans.code) {
        try {
          const execRes = await executeSubmissionCode({
            question,
            candidateCode: ans.code,
            language: ans.language || question.language,
            testCases: question.testCases || []
          });
          const totalTc = (question.testCases || []).length;
          if (totalTc > 0) {
            ans.marksAwarded = Number(((execRes.passedCount / totalTc) * (question.marks || 1)).toFixed(2));
          }
        } catch (e) {
          console.warn('Coding evaluation during final exam submit failed:', e.message);
        }
      }
      score += ans.marksAwarded || 0;
      continue;
    }
    if (question.type === 'subjective') {
      continue;
    }
    const selected = ans.selectedOption ?? ans.answerText;
    const correct = question.correctAnswer;
    
    // Check if unanswered
    if (selected === null || selected === undefined || String(selected).trim() === '') {
      ans.marksAwarded = 0;
      continue;
    }

    const passed = String(selected).trim().toLowerCase() === String(correct).trim().toLowerCase();
    let marksAwarded = 0;
    if (passed) {
      marksAwarded = question.marks || 1;
    } else if (negativeMarking) {
      marksAwarded = -Math.abs((question.marks || 1) * 0.25);
    }
    score += marksAwarded;
    ans.marksAwarded = marksAwarded;
  }

  submission.score = Math.max(0, Number(score.toFixed(2)));
  return submission;
};

const submitExam = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return fail(res, 'Submission not found', 404);
    if (req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
      return fail(res, 'Forbidden', 403);
    }

    const incoming = req.body.answers || [];
    incoming.forEach((ans) => {
      if (!ans.questionId) return;
      const idx = submission.answers.findIndex((a) => a.questionId.toString() === String(ans.questionId));
      const record = {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption ?? null,
        answerText: ans.answerText || '',
        code: ans.code || '',
        language: ans.language || '',
        marksAwarded: idx >= 0 ? submission.answers[idx].marksAwarded : 0,
        testResults: idx >= 0 ? submission.answers[idx].testResults : []
      };
      if (idx >= 0) submission.answers[idx] = record;
      else submission.answers.push(record);
    });

    await gradeMcqTf(submission);
    if (submission.status !== 'flagged-for-review') {
      submission.status = 'graded';
    }
    submission.submittedAt = new Date();
    await submission.save();

    const exam = await Exam.findById(submission.examId);
    try {
      await notifyResultsPublished({
        studentId: submission.studentId,
        exam,
        submission
      });
    } catch (e) {
      console.warn('Result notification skipped:', e.message);
    }

    const passingThreshold = exam?.passingMarks || 50;
    return success(res, {
      submissionId: submission._id,
      score: submission.score,
      totalMarks: exam?.totalMarks || 100,
      status: submission.status,
      passed: submission.score >= passingThreshold,
      autoGraded: true,
      submittedAt: submission.submittedAt,
      violationCount: submission.violationCount,
      proctorSummary: {
        totalViolations: submission.violationCount,
        status: submission.status === 'flagged-for-review' ? 'Flagged for Review' : 'Verified'
      }
    }, 'Exam finalized and submitted');
  } catch (error) {
    return fail(res, 'Failed to finalize exam submission', 500, { error: error.message });
  }
};

module.exports = {
  startSubmission,
  saveSingleAnswer,
  saveAnswers,
  getMySubmissions,
  getSubmission,
  runCode,
  submitCode,
  submitExam,
  finalizeSubmission: submitExam
};
