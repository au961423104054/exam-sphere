const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');

/**
 * Ensures the default CS101 exam exists in the database.
 * Auto-creates it with 4 comprehensive questions if not already seeded.
 */
const ensureDefaultCS101Exam = async () => {
  let existing = await Exam.findOne({
    $or: [{ slug: 'exam-cs101' }, { title: /Data Structures & Algorithms/i }]
  }).populate('createdBy', 'name email');

  if (existing) {
    if (!existing.slug) {
      existing.slug = 'exam-cs101';
      await existing.save();
    }
    return existing;
  }

  // Find or pick an author (teacher or admin or first user)
  let author = await User.findOne({ role: { $in: ['teacher', 'admin'] } });
  if (!author) {
    author = await User.findOne();
  }

  const authorId = author ? author._id : new mongoose.Types.ObjectId();

  const newExam = await Exam.create({
    title: 'CS101: Data Structures & Algorithms Final Assessment',
    slug: 'exam-cs101',
    createdBy: authorId,
    duration: 90,
    sections: [
      { sectionId: 'sec-1', name: 'Algorithmic Problem Solving', instructions: 'Solve the coding problems.' },
      { sectionId: 'sec-2', name: 'Core Computer Science Concepts', instructions: 'Answer objective questions.' }
    ],
    startTime: new Date(Date.now() - 3600 * 1000), // Started 1 hour ago
    endTime: new Date(Date.now() + 30 * 86400 * 1000), // Open for 30 days
    negativeMarking: false,
    randomizeOrder: false,
    totalMarks: 100,
    passingMarks: 50,
    allowedIpRange: '',
    requireIdentityVerification: true,
    snapshotIntervalSeconds: 30,
    enableMicrophoneMonitoring: false
  });

  // Seed default questions for CS101
  const questionsData = [
    {
      examId: newExam._id,
      type: 'coding',
      text: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
      marks: 30,
      language: 'javascript',
      starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      testCases: [
        { input: 'twoSum([2, 7, 11, 15], 9)', expectedOutput: '[0, 1]', isHidden: false },
        { input: 'twoSum([3, 2, 4], 6)', expectedOutput: '[1, 2]', isHidden: false },
        { input: 'twoSum([3, 3], 6)', expectedOutput: '[0, 1]', isHidden: true }
      ]
    },
    {
      examId: newExam._id,
      type: 'coding',
      text: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Brackets must close in the correct order and same type.',
      marks: 30,
      language: 'javascript',
      starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your solution here
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (const char of s) {
    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    } else if (stack.pop() !== map[char]) {
      return false;
    }
  }
  return stack.length === 0;
}`,
      testCases: [
        { input: 'isValid("()")', expectedOutput: 'true', isHidden: false },
        { input: 'isValid("()[]{}")', expectedOutput: 'true', isHidden: false },
        { input: 'isValid("(]")', expectedOutput: 'false', isHidden: false },
        { input: 'isValid("{[]}")', expectedOutput: 'true', isHidden: true }
      ]
    },
    {
      examId: newExam._id,
      type: 'mcq',
      text: 'What is the average time complexity of searching for an element in a balanced Binary Search Tree (BST)?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctAnswer: 'O(log n)',
      marks: 20
    },
    {
      examId: newExam._id,
      type: 'tf',
      text: 'In JavaScript, primitive data types (string, number, boolean) are immutable and passed by value.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      marks: 20
    }
  ];

  await Question.insertMany(questionsData);
  return await Exam.findById(newExam._id).populate('createdBy', 'name email');
};

/**
 * Resolves an exam either by MongoDB ObjectId, slug (e.g. 'exam-cs101'),
 * or title regex match, preventing CastError crashes on string IDs.
 */
const findExamByIdOrSlug = async (idOrSlug) => {
  if (!idOrSlug) return null;

  // 1. Try valid ObjectId
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    const byId = await Exam.findById(idOrSlug).populate('createdBy', 'name email');
    if (byId) return byId;
  }

  // 2. Try slug match
  const bySlug = await Exam.findOne({ slug: idOrSlug }).populate('createdBy', 'name email');
  if (bySlug) return bySlug;

  // 3. Try title regex match
  const cleanTerm = String(idOrSlug).replace(/^exam-/i, '').replace(/-/g, '.*');
  const byTitle = await Exam.findOne({
    title: { $regex: new RegExp(cleanTerm, 'i') }
  }).populate('createdBy', 'name email');
  if (byTitle) return byTitle;

  // 4. Default fallback for CS101 assessment
  if (idOrSlug === 'exam-cs101' || String(idOrSlug).toLowerCase().includes('cs101')) {
    return await ensureDefaultCS101Exam();
  }

  return null;
};

module.exports = {
  findExamByIdOrSlug,
  ensureDefaultCS101Exam
};
