const Exam = require('../models/Exam');
const Question = require('../models/Question');
const Submission = require('../models/Submission');
const { shuffleWithSeed } = require('../utils/shuffleHelper');
const { sampleQuestionsByRule } = require('../utils/questionSampler');
const { findExamByIdOrSlug } = require('../utils/examResolver');
const { success, fail } = require('../utils/http');

const Joi = require('joi');

const examSchema = Joi.object({
  title: Joi.string().trim().required(),
  duration: Joi.number().min(1).optional(),
  durationMinutes: Joi.number().min(1).optional(),
  sections: Joi.array().items(Joi.object({
    sectionId: Joi.string().required(),
    name: Joi.string().required(),
    instructions: Joi.string().allow('').optional()
  })).optional(),
  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().allow(null).optional(),
  negativeMarking: Joi.boolean().optional(),
  randomizeOrder: Joi.boolean().optional(),
  totalMarks: Joi.number().min(1).optional(),
  passingMarks: Joi.number().min(0).optional(),
  passMarks: Joi.number().min(0).optional(),
  allowedIpRange: Joi.string().allow('').optional(),
  requireIdentityVerification: Joi.boolean().optional(),
  snapshotIntervalSeconds: Joi.number().min(10).max(300).optional(),
  enableMicrophoneMonitoring: Joi.boolean().optional(),
  questionDistribution: Joi.object().optional(),
  questions: Joi.array().optional()
});

const examFilterForUser = (user) => {
  if (user.role === 'admin') return {};
  if (user.role === 'teacher') {
    return { createdBy: user.id };
  }
  // For students: list exams available to take
  return {};
};

const withQuestions = async (exam, includeAnswers, userId = null) => {
  const questions = await Question.find({ examId: exam._id }).sort({ createdAt: 1 });
  let mapped = questions.map((q) => {
    const obj = q.toObject();
    if (!includeAnswers) {
      delete obj.correctAnswer;
    }
    const visibleCases = (obj.testCases || [])
      .filter((tc) => includeAnswers || !tc.isHidden)
      .map((tc) => ({
        input: tc.input || '',
        expectedOutput: tc.expectedOutput,
        expected: tc.expectedOutput,
        isHidden: !!tc.isHidden
      }));
    const derivedTitle = obj.title || (obj.text?.includes('\n\n') ? obj.text.split('\n\n')[0] : (obj.text ? (obj.text.length > 50 ? obj.text.substring(0, 50) + '...' : obj.text) : 'Question'));
    const derivedDesc = obj.description || (obj.text?.includes('\n\n') ? obj.text.split('\n\n').slice(1).join('\n\n') : obj.text) || obj.text || '';

    return {
      ...obj,
      id: obj._id,
      title: derivedTitle,
      description: derivedDesc,
      text: obj.text || derivedDesc,
      defaultLanguage: obj.language,
      starterTemplates: { [obj.language || 'javascript']: obj.starterCode || '' },
      testCases: visibleCases
    };
  });

  if (!includeAnswers && exam.questionDistribution && exam.questionDistribution.enabled) {
    if (userId) {
      const activeSub = await Submission.findOne({ examId: exam._id, studentId: userId });
      if (activeSub && activeSub.assignedQuestions?.length > 0) {
        const assignedSet = new Set(activeSub.assignedQuestions.map((id) => id.toString()));
        mapped = mapped.filter((q) => assignedSet.has((q.id || q._id).toString()));
      } else {
        mapped = sampleQuestionsByRule(mapped, exam.questionDistribution, userId);
      }
    } else {
      mapped = sampleQuestionsByRule(mapped, exam.questionDistribution, 'default_seed');
    }
  } else if (!includeAnswers && exam.randomizeOrder) {
    mapped = shuffleWithSeed(mapped, userId);
  }

  const examObj = exam.toObject();
  return {
    ...examObj,
    id: examObj._id,
    questions: mapped,
    totalQuestions: mapped.length,
    durationMinutes: examObj.duration,
    passMarks: examObj.passingMarks
  };
};

const listExams = async (req, res) => {
  try {
    const exams = await Exam.find(examFilterForUser(req.user))
      .sort({ startTime: 1, createdAt: -1 })
      .populate('createdBy', 'name email');

    const data = await Promise.all(
      exams.map(async (exam) => {
        const questionCount = await Question.countDocuments({ examId: exam._id });
        const obj = exam.toObject();
        return {
          ...obj,
          id: obj._id,
          totalQuestions: questionCount,
          durationMinutes: obj.duration,
          passMarks: obj.passingMarks,
          status: obj.endTime && new Date(obj.endTime) < new Date() ? 'Completed' : 'Ready'
        };
      })
    );

    return success(res, data);
  } catch (error) {
    return fail(res, 'Failed to list exams', 500, { error: error.message });
  }
};

const getExam = async (req, res) => {
  try {
    const exam = await findExamByIdOrSlug(req.params.id);
    if (!exam) return fail(res, 'Exam not found', 404);
    const includeAnswers = req.user.role === 'teacher' || req.user.role === 'admin';
    const data = await withQuestions(exam, includeAnswers, req.user?.id);
    return success(res, data);
  } catch (error) {
    return fail(res, 'Failed to retrieve exam', 500, { error: error.message });
  }
};

const createExam = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return fail(res, 'Only teachers and admins can create exams', 403);
    }

    const { error, value } = examSchema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400);
    }

    const {
      title,
      duration,
      durationMinutes,
      sections,
      startTime,
      endTime,
      negativeMarking,
      randomizeOrder,
      totalMarks,
      passingMarks,
      passMarks,
      allowedIpRange,
      requireIdentityVerification,
      snapshotIntervalSeconds,
      enableMicrophoneMonitoring,
      questions = []
    } = value;

    const exam = await Exam.create({
      title,
      createdBy: req.user.id,
      duration: duration || durationMinutes || 60,
      sections: sections || [],
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      negativeMarking: !!negativeMarking,
      randomizeOrder: !!randomizeOrder,
      totalMarks: totalMarks || 100,
      passingMarks: passingMarks || passMarks || 50,
      allowedIpRange: allowedIpRange || '',
      requireIdentityVerification: requireIdentityVerification !== false,
      snapshotIntervalSeconds: snapshotIntervalSeconds || 45,
      enableMicrophoneMonitoring: !!enableMicrophoneMonitoring
    });

    if (Array.isArray(questions) && questions.length) {
      await Question.insertMany(
        questions.map((q) => {
          const resolvedText = q.text || q.prompt || (q.description ? (q.title ? `${q.title}\n\n${q.description}` : q.description) : q.title) || 'Question Prompt';
          const resolvedTitle = q.title || (resolvedText.includes('\n\n') ? resolvedText.split('\n\n')[0] : (resolvedText.length > 60 ? resolvedText.substring(0, 60) + '...' : resolvedText));
          const resolvedDesc = q.description || (resolvedText.includes('\n\n') ? resolvedText.split('\n\n').slice(1).join('\n\n') : resolvedText);
          return {
            examId: exam._id,
            type: q.type || 'mcq',
            title: resolvedTitle,
            description: resolvedDesc,
            text: resolvedText,
            options: q.options || [],
            correctAnswer: q.correctAnswer || null,
            marks: q.marks || 1,
            tags: q.tags || [],
            language: q.language || 'javascript',
            starterCode: q.starterCode || q.starterTemplates?.[q.language] || '',
            testCases: (q.testCases || []).map((tc) => ({
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || tc.expected || '',
              isHidden: !!tc.isHidden
            })),
            timeLimitMs: q.timeLimitMs || 2000,
            memoryLimitMb: q.memoryLimitMb || 128
          };
        })
      );
    }

    const data = await withQuestions(exam, true);
    return success(res, data, 'Exam created', 201);
  } catch (error) {
    return fail(res, 'Failed to create exam', 500, { error: error.message });
  }
};

const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return fail(res, 'Exam not found', 404);
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user.id) {
      return fail(res, 'You can only update exams you created', 403);
    }

    const allowed = [
      'title',
      'duration',
      'sections',
      'startTime',
      'endTime',
      'negativeMarking',
      'randomizeOrder',
      'totalMarks',
      'passingMarks',
      'questionDistribution'
    ];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) exam[key] = req.body[key];
    });
    if (req.body.durationMinutes) exam.duration = req.body.durationMinutes;
    if (req.body.passMarks) exam.passingMarks = req.body.passMarks;
    await exam.save();
    const data = await withQuestions(exam, true);
    return success(res, data, 'Exam updated');
  } catch (error) {
    return fail(res, 'Failed to update exam', 500, { error: error.message });
  }
};

const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return fail(res, 'Exam not found', 404);
    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user.id) {
      return fail(res, 'You can only delete exams you created', 403);
    }
    await Question.deleteMany({ examId: exam._id });
    await Submission.deleteMany({ examId: exam._id });
    await exam.deleteOne();
    return success(res, { id: exam._id }, 'Exam deleted');
  } catch (error) {
    return fail(res, 'Failed to delete exam', 500, { error: error.message });
  }
};

module.exports = {
  listExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  withQuestions
};
