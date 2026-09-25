const Submission = require('../models/Submission');
const Question = require('../models/Question');
const codeExecutionService = require('../services/codeExecutionService');

/**
 * Run student code against sample test cases (interactive test execution)
 * POST /api/submissions/:id/run-code
 */
const runCode = async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const { questionId, code, language } = req.body;

    if (!questionId || !code) {
      return res.status(400).json({
        success: false,
        message: 'questionId and code are required in the request body'
      });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check user ownership if authenticated
    if (req.user && req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this submission'
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.type !== 'coding') {
      return res.status(400).json({
        success: false,
        message: `Question type is "${question.type}". Expected "coding"`
      });
    }

    // Filter for visible sample test cases (non-hidden)
    let sampleTestCases = (question.testCases || []).filter((tc) => !tc.isHidden);
    // If no test cases are explicitly marked non-hidden, use all available test cases
    if (sampleTestCases.length === 0 && question.testCases && question.testCases.length > 0) {
      sampleTestCases = question.testCases;
    }

    const targetLanguage = language || question.language || 'javascript';
    const execution = await codeExecutionService.executeCode(
      code,
      targetLanguage,
      sampleTestCases,
      {
        timeLimitMs: question.timeLimitMs,
        memoryLimitMb: question.memoryLimitMb
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Code executed against sample test cases',
      allPassed: execution.allPassed,
      passedCount: execution.passedCount,
      totalCount: execution.totalCount,
      results: execution.results
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to run code',
      error: error.message
    });
  }
};

/**
 * Submit student code, run against all test cases, compute score and save answer
 * POST /api/submissions/:id/submit-code
 */
const submitCode = async (req, res) => {
  try {
    const { id: submissionId } = req.params;
    const { questionId, code, language } = req.body;

    if (!questionId || !code) {
      return res.status(400).json({
        success: false,
        message: 'questionId and code are required in the request body'
      });
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Check user ownership if authenticated
    if (req.user && req.user.role === 'student' && submission.studentId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to submit for this candidate'
      });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    if (question.type !== 'coding') {
      return res.status(400).json({
        success: false,
        message: `Question type is "${question.type}". Expected "coding"`
      });
    }

    const allTestCases = question.testCases || [];
    const targetLanguage = language || question.language || 'javascript';

    // Execute against all test cases in sandboxed environment
    const execution = await codeExecutionService.executeCode(
      code,
      targetLanguage,
      allTestCases,
      {
        timeLimitMs: question.timeLimitMs,
        memoryLimitMb: question.memoryLimitMb
      }
    );

    // Compute marks: proportional to test cases passed
    const totalCount = execution.totalCount;
    const passedCount = execution.passedCount;
    const marksAwarded = totalCount > 0 ? Number(((passedCount / totalCount) * question.marks).toFixed(2)) : 0;

    // Update or add the answer entry in submission
    const existingAnswerIndex = submission.answers.findIndex(
      (a) => a.questionId.toString() === question._id.toString()
    );

    const answerRecord = {
      questionId: question._id,
      code,
      language: targetLanguage,
      marksAwarded,
      testResults: execution.results
    };

    if (existingAnswerIndex >= 0) {
      submission.answers[existingAnswerIndex] = answerRecord;
    } else {
      submission.answers.push(answerRecord);
    }

    // Recalculate total score
    submission.score = Number(
      submission.answers.reduce((acc, ans) => acc + (ans.marksAwarded || 0), 0).toFixed(2)
    );

    await submission.save();

    // Sanitize results for client response: hide inputs and expected outputs for hidden test cases
    const sanitizedResults = execution.results.map((r) => {
      if (r.isHidden) {
        return {
          testCaseIndex: r.testCaseIndex,
          passed: r.passed,
          isHidden: true,
          statusDescription: r.statusDescription,
          time: r.time,
          memory: r.memory,
          error: r.passed ? null : 'Failed hidden test case'
        };
      }
      return r;
    });

    return res.status(200).json({
      success: true,
      message: 'Code submitted and evaluated successfully',
      questionId: question._id,
      marksAwarded,
      totalQuestionMarks: question.marks,
      allPassed: execution.allPassed,
      passedCount,
      totalCount,
      totalSubmissionScore: submission.score,
      results: sanitizedResults
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit code',
      error: error.message
    });
  }
};

module.exports = {
  runCode,
  submitCode
};
