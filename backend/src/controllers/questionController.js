const Joi = require('joi');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const { shuffleWithSeed } = require('../utils/shuffleHelper');
const { sampleQuestionsByRule } = require('../utils/questionSampler');
const { findExamByIdOrSlug } = require('../utils/examResolver');
const { success, fail } = require('../utils/http');
const {
  generateFunctionSignature,
  generateStarterTemplatesAllLanguages,
  generateStarterTemplate
} = require('../services/codeHarnessService');

const questionValidationSchema = Joi.object({
  examId: Joi.string().required(),
  type: Joi.string().valid('mcq', 'tf', 'subjective', 'coding').required(),
  title: Joi.string().trim().allow('').optional(),
  description: Joi.string().trim().allow('').optional(),
  text: Joi.string().trim().allow('').optional(),
  prompt: Joi.string().trim().allow('').optional(),
  options: Joi.array().items(Joi.string()).optional(),
  correctAnswer: Joi.any().optional(),
  marks: Joi.number().min(0).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  language: Joi.string().valid('javascript', 'python', 'java', 'cpp').optional(),
  functionName: Joi.string().trim().allow('').optional(),
  returnType: Joi.string().trim().allow('').optional(),
  className: Joi.string().trim().allow('').optional(),
  parameters: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required()
    })
  ).optional(),
  functionSignature: Joi.string().allow('').optional(),
  starterTemplates: Joi.object().optional(),
  starterCode: Joi.string().allow('').optional(),
  testCases: Joi.array().optional(),
  timeLimitMs: Joi.number().min(100).optional(),
  memoryLimitMb: Joi.number().min(16).optional()
});

const normalizeTestCases = (testCases = []) =>
  testCases.map((tc) => ({
    input: tc.input || '',
    expectedOutput: tc.expectedOutput || tc.expected || '',
    isHidden: !!tc.isHidden
  }));

const createQuestion = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return fail(res, 'Only teachers and admins can create questions', 403);
    }
    const { error, value } = questionValidationSchema.validate(req.body);
    if (error) {
      return fail(res, error.details[0].message, 400);
    }
    const { examId, type } = value;
    const exam = await Exam.findById(examId);
    if (!exam) return fail(res, 'Exam not found', 404);

    const resolvedText =
      value.text ||
      value.prompt ||
      (value.description
        ? value.title
          ? `${value.title}\n\n${value.description}`
          : value.description
        : value.title) ||
      'Question Prompt';
    const resolvedTitle =
      value.title ||
      (resolvedText.includes('\n\n')
        ? resolvedText.split('\n\n')[0]
        : resolvedText.length > 60
        ? resolvedText.substring(0, 60) + '...'
        : resolvedText);
    const resolvedDesc =
      value.description ||
      (resolvedText.includes('\n\n')
        ? resolvedText.split('\n\n').slice(1).join('\n\n')
        : resolvedText);

    let functionName = value.functionName || 'solve';
    let returnType = value.returnType || 'int';
    let className = value.className || 'Solution';
    let parameters = Array.isArray(value.parameters) && value.parameters.length > 0
      ? value.parameters
      : [{ name: 'arr', type: 'int[]' }];
    let functionSignature =
      value.functionSignature ||
      generateFunctionSignature(value.language || 'javascript', { functionName, returnType, className, parameters });
    let starterTemplates =
      value.starterTemplates && Object.keys(value.starterTemplates).length > 0
        ? value.starterTemplates
        : generateStarterTemplatesAllLanguages({ functionName, returnType, className, parameters });
    let starterCode = value.starterCode || starterTemplates[value.language || 'javascript'] || '';

    const question = await Question.create({
      examId,
      type,
      title: resolvedTitle,
      description: resolvedDesc,
      text: resolvedText,
      options: value.options || [],
      correctAnswer: value.correctAnswer || null,
      marks: value.marks || 1,
      tags: value.tags || [],
      language: value.language || 'javascript',
      functionName,
      returnType,
      className,
      parameters,
      functionSignature,
      starterTemplates,
      starterCode,
      testCases: normalizeTestCases(value.testCases),
      timeLimitMs: value.timeLimitMs || 2000,
      memoryLimitMb: value.memoryLimitMb || 128
    });
    return success(res, question, 'Question created', 201);
  } catch (error) {
    return fail(res, 'Failed to create question', 500, { error: error.message });
  }
};

/**
 * Upload and bulk import a question bank from JSON file or JSON payload.
 * Can also apply random question assignment rules (count and type).
 */
const uploadQuestionBank = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return fail(res, 'Only teachers and admins can upload question banks', 403);
    }

    const examId = req.body.examId;
    if (!examId) {
      return fail(res, 'Target assessment examId is required', 400);
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return fail(res, 'Assessment not found', 404);
    }

    let rawQuestions = [];

    // 1. Parse from uploaded file if present
    if (req.file && req.file.buffer) {
      const fileContent = req.file.buffer.toString('utf-8').trim();
      const fileName = req.file.originalname || '';

      if (fileName.endsWith('.csv') || fileContent.startsWith('title,') || fileContent.startsWith('"title"')) {
        // Parse CSV
        const lines = fileContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length > 1) {
          const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i];
            const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
            const cleanValues = values.map((v) => v.trim().replace(/^"|"$/g, ''));
            const qObj = {};
            header.forEach((key, idx) => {
              qObj[key] = cleanValues[idx] || '';
            });

            if (qObj.title || qObj.description || qObj.text) {
              if (qObj.options && typeof qObj.options === 'string') {
                qObj.options = qObj.options.split('|').map((o) => o.trim()).filter(Boolean);
              }
              if (qObj.marks) qObj.marks = Number(qObj.marks) || 1;
              rawQuestions.push(qObj);
            }
          }
        }
      } else {
        // Parse JSON
        try {
          const parsed = JSON.parse(fileContent);
          rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
        } catch (jsonErr) {
          return fail(res, `Failed to parse question bank JSON file: ${jsonErr.message}`, 400);
        }
      }
    } else if (req.body.questions) {
      // 2. Parse from request body JSON
      if (Array.isArray(req.body.questions)) {
        rawQuestions = req.body.questions;
      } else if (typeof req.body.questions === 'string') {
        try {
          const parsed = JSON.parse(req.body.questions);
          rawQuestions = Array.isArray(parsed) ? parsed : parsed.questions || [];
        } catch (err) {
          return fail(res, 'Invalid JSON in questions payload', 400);
        }
      }
    }

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return fail(res, 'No valid questions found in uploaded question bank', 400);
    }

    // Normalize questions to match schema
    const documentsToInsert = rawQuestions.map((q, idx) => {
      const type = ['coding', 'mcq', 'tf', 'subjective'].includes(q.type?.toLowerCase())
        ? q.type.toLowerCase()
        : 'mcq';

      const resolvedText =
        q.text ||
        q.prompt ||
        (q.description ? (q.title ? `${q.title}\n\n${q.description}` : q.description) : q.title) ||
        `Question ${idx + 1}`;
      const resolvedTitle =
        q.title ||
        (resolvedText.includes('\n\n')
          ? resolvedText.split('\n\n')[0]
          : resolvedText.length > 60
          ? resolvedText.substring(0, 60) + '...'
          : resolvedText);
      const resolvedDesc =
        q.description ||
        (resolvedText.includes('\n\n') ? resolvedText.split('\n\n').slice(1).join('\n\n') : resolvedText);

      let options = Array.isArray(q.options) ? q.options : [];
      if (type === 'tf' && options.length === 0) {
        options = ['True', 'False'];
      }

      let functionName = q.functionName || 'solve';
      let returnType = q.returnType || 'int';
      let className = q.className || 'Solution';
      let parameters = Array.isArray(q.parameters) && q.parameters.length > 0
        ? q.parameters
        : [{ name: 'arr', type: 'int[]' }];
      let functionSignature =
        q.functionSignature ||
        generateFunctionSignature(q.language || 'javascript', { functionName, returnType, className, parameters });
      let starterTemplates =
        q.starterTemplates && Object.keys(q.starterTemplates).length > 0
          ? q.starterTemplates
          : generateStarterTemplatesAllLanguages({ functionName, returnType, className, parameters });
      let starterCode =
        q.starterCode || q.starterTemplates?.[q.language || 'javascript'] || starterTemplates[q.language || 'javascript'] || '';

      return {
        examId: exam._id,
        type,
        title: resolvedTitle,
        description: resolvedDesc,
        text: resolvedText,
        options,
        correctAnswer: q.correctAnswer || (type === 'tf' ? 'True' : options[0] || null),
        marks: Number(q.marks) || (type === 'coding' ? 25 : 5),
        tags: Array.isArray(q.tags) ? q.tags : [],
        difficulty: q.difficulty || 'Medium',
        language: q.language || 'javascript',
        functionName,
        returnType,
        className,
        parameters,
        functionSignature,
        starterTemplates,
        starterCode,
        testCases: normalizeTestCases(q.testCases || []),
        timeLimitMs: q.timeLimitMs || (q.timeLimitSeconds ? q.timeLimitSeconds * 1000 : 2000),
        memoryLimitMb: q.memoryLimitMb || 128
      };
    });

    const inserted = await Question.insertMany(documentsToInsert);

    // If random question distribution rules were passed in the request, save to the exam
    if (req.body.questionDistribution) {
      let dist = req.body.questionDistribution;
      if (typeof dist === 'string') {
        try {
          dist = JSON.parse(dist);
        } catch (e) {}
      }
      exam.questionDistribution = {
        enabled: dist.enabled !== false,
        totalCount: Number(dist.totalCount) || 0,
        byType: {
          coding: Number(dist.byType?.coding) || 0,
          mcq: Number(dist.byType?.mcq) || 0,
          tf: Number(dist.byType?.tf) || 0,
          subjective: Number(dist.byType?.subjective) || 0
        }
      };
      await exam.save();
    }

    const countsByType = {
      coding: inserted.filter((q) => q.type === 'coding').length,
      mcq: inserted.filter((q) => q.type === 'mcq').length,
      tf: inserted.filter((q) => q.type === 'tf').length,
      subjective: inserted.filter((q) => q.type === 'subjective').length
    };

    return success(
      res,
      {
        totalImported: inserted.length,
        countsByType,
        examId: exam._id,
        questionDistribution: exam.questionDistribution
      },
      `Successfully imported ${inserted.length} questions into question bank`
    );
  } catch (error) {
    return fail(res, 'Failed to import question bank', 500, { error: error.message });
  }
};

const listByExam = async (req, res) => {
  try {
    const exam = await findExamByIdOrSlug(req.params.examId);
    const targetExamId = exam ? exam._id : req.params.examId;
    let questions = await Question.find({ examId: targetExamId }).sort({ createdAt: 1 });
    const isStudent = req.user.role === 'student';

    // If student and random question distribution from bank is enabled
    if (isStudent && exam?.questionDistribution?.enabled) {
      const activeSubmission = await Submission.findOne({
        examId: targetExamId,
        studentId: req.user.id
      });

      if (activeSubmission && activeSubmission.assignedQuestions?.length > 0) {
        const assignedSet = new Set(activeSubmission.assignedQuestions.map((id) => id.toString()));
        questions = questions.filter((q) => assignedSet.has(q._id.toString()));
      } else {
        // Deterministically sample using candidate identifier as seed
        questions = sampleQuestionsByRule(
          questions,
          exam.questionDistribution,
          req.user.id || req.user.email
        );
      }
    } else if (isStudent && exam?.randomizeOrder) {
      questions = shuffleWithSeed(questions, req.user.id || req.user.email);
    }

    let data = questions.map((q) => {
      const obj = typeof q.toObject === 'function' ? q.toObject() : q;
      if (!obj.title) {
        obj.title = obj.text
          ? obj.text.includes('\n\n')
            ? obj.text.split('\n\n')[0]
            : obj.text.length > 60
            ? obj.text.substring(0, 60) + '...'
            : obj.text
          : 'Question';
      }
      if (!obj.description) {
        obj.description =
          obj.text && obj.text.includes('\n\n')
            ? obj.text.split('\n\n').slice(1).join('\n\n')
            : obj.text || obj.prompt || '';
      }
      if (!obj.text) {
        obj.text = obj.description || obj.title || '';
      }
      if (isStudent) {
        delete obj.correctAnswer;
        obj.testCases = (obj.testCases || [])
          .filter((tc) => !tc.isHidden)
          .map((tc) => ({
            input: tc.input || '',
            expectedOutput: tc.expectedOutput,
            isHidden: false
          }));
      }
      return { ...obj, id: obj._id };
    });

    return success(res, data);
  } catch (error) {
    return fail(res, 'Failed to list questions', 500, { error: error.message });
  }
};

const getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return fail(res, 'Question not found', 404);
    const obj = question.toObject();
    if (req.user.role === 'student') {
      delete obj.correctAnswer;
      obj.testCases = (obj.testCases || [])
        .filter((tc) => !tc.isHidden)
        .map((tc) => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput,
          isHidden: false
        }));
    }
    return success(res, { ...obj, id: obj._id });
  } catch (error) {
    return fail(res, 'Failed to retrieve question', 500, { error: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return fail(res, 'Only teachers and admins can update questions', 403);
    }
    const question = await Question.findById(req.params.id);
    if (!question) return fail(res, 'Question not found', 404);
    const fields = [
      'title',
      'description',
      'text',
      'type',
      'options',
      'correctAnswer',
      'marks',
      'tags',
      'difficulty',
      'language',
      'functionName',
      'returnType',
      'className',
      'parameters',
      'functionSignature',
      'starterTemplates',
      'starterCode',
      'timeLimitMs',
      'memoryLimitMb'
    ];
    fields.forEach((key) => {
      if (req.body[key] !== undefined) question[key] = req.body[key];
    });
    if (question.type === 'coding') {
      if (!question.functionSignature) {
        question.functionSignature = generateFunctionSignature(question.language || 'javascript', {
          functionName: question.functionName,
          returnType: question.returnType,
          className: question.className,
          parameters: question.parameters
        });
      }
      if (!question.starterTemplates || Object.keys(question.starterTemplates).length === 0) {
        question.starterTemplates = generateStarterTemplatesAllLanguages({
          functionName: question.functionName,
          returnType: question.returnType,
          className: question.className,
          parameters: question.parameters
        });
      }
    }
    if (req.body.testCases) question.testCases = normalizeTestCases(req.body.testCases);
    await question.save();
    return success(res, question, 'Question updated');
  } catch (error) {
    return fail(res, 'Failed to update question', 500, { error: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return fail(res, 'Only teachers and admins can delete questions', 403);
    }
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return fail(res, 'Question not found', 404);
    return success(res, { id: question._id }, 'Question deleted');
  } catch (error) {
    return fail(res, 'Failed to delete question', 500, { error: error.message });
  }
};

module.exports = {
  createQuestion,
  uploadQuestionBank,
  listByExam,
  getQuestion,
  updateQuestion,
  deleteQuestion
};
