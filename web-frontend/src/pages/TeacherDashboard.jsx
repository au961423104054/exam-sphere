import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Users,
  Code2,
  ShieldAlert,
  Sparkles,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Layers,
  UploadCloud,
  Download,
  Shuffle,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  CreditCard,
  Search,
  AlertTriangle,
  Edit3,
  Trash2,
  Sliders,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { Input } from '../components/ui/Input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { TeacherCodingQuestionBuilder } from '../components/teacher/TeacherCodingQuestionBuilder';
import { ProctoringReportModal } from '../components/admin/ProctoringReportModal';
import { examSphereApi } from '../services/api';

const defaultBankQuestions = [
  {
    id: 'bank-q-1',
    _id: 'bank-q-1',
    type: 'coding',
    title: 'Two Sum Problem',
    difficulty: 'Easy',
    marks: 25,
    description: 'Hash table & array lookup with 3 test cases. Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    language: 'javascript',
    timeLimitSeconds: 2,
    memoryLimitMb: 128,
    starterCode: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
    testCases: [
      { id: 'tc-1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
      { id: 'tc-2', input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
      { id: 'tc-3', input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true },
    ],
  },
  {
    id: 'bank-q-2',
    _id: 'bank-q-2',
    type: 'coding',
    title: 'Reverse Linked List',
    difficulty: 'Medium',
    marks: 25,
    description: 'Pointer reversal with 1 test case. Given the head of a singly linked list, reverse the list, and return the reversed list.',
    language: 'javascript',
    timeLimitSeconds: 2,
    memoryLimitMb: 128,
    starterCode: 'function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}',
    testCases: [
      { id: 'tc-1', input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]', isHidden: false },
    ],
  },
  {
    id: 'bank-q-3',
    _id: 'bank-q-3',
    type: 'mcq',
    title: 'Time Complexity of Binary Search',
    difficulty: 'Easy',
    marks: 5,
    description: 'What is the average time complexity of searching an element in a balanced binary search tree?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: 'O(log n)',
  },
  {
    id: 'bank-q-4',
    _id: 'bank-q-4',
    type: 'tf',
    title: 'JavaScript Immutability',
    difficulty: 'Easy',
    marks: 2,
    description: 'In JavaScript, primitive data types (such as numbers and strings) are immutable.',
    options: ['True', 'False'],
    correctAnswer: 'True',
  },
  {
    id: 'bank-q-5',
    _id: 'bank-q-5',
    type: 'subjective',
    title: 'Database Normalization',
    difficulty: 'Medium',
    marks: 10,
    description: 'Explain the difference between 2nd Normal Form (2NF) and 3rd Normal Form (3NF) with a brief schema example.',
    guidelines: 'Candidate should mention partial dependency vs transitive dependency.',
  },
];

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [violations, setViolations] = useState([]);
  const [violationSearchQuery, setViolationSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('exams');
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [createdQuestions, setCreatedQuestions] = useState([]);
  const [bankQuestions, setBankQuestions] = useState(defaultBankQuestions);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankTypeFilter, setBankTypeFilter] = useState('all');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState('all');

  // Edit Question Suite Modal State
  const [editSuiteModalOpen, setEditSuiteModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [suiteTitle, setSuiteTitle] = useState('');
  const [suiteDescription, setSuiteDescription] = useState('');
  const [suiteType, setSuiteType] = useState('coding');
  const [suiteDifficulty, setSuiteDifficulty] = useState('Medium');
  const [suiteMarks, setSuiteMarks] = useState(25);
  const [suiteLanguage, setSuiteLanguage] = useState('javascript');
  const [suiteTimeLimit, setSuiteTimeLimit] = useState(2);
  const [suiteMemoryLimit, setSuiteMemoryLimit] = useState(128);
  const [suiteStarterCode, setSuiteStarterCode] = useState('');
  const [suiteTestCases, setSuiteTestCases] = useState([]);
  const [suiteOptions, setSuiteOptions] = useState([]);
  const [suiteCorrectAnswer, setSuiteCorrectAnswer] = useState('');
  const [suiteGuidelines, setSuiteGuidelines] = useState('');
  const [savingSuite, setSavingSuite] = useState(false);
  const [suiteSuccessMsg, setSuiteSuccessMsg] = useState('');

  // Create Exam Modal State with Access Controls
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState(60);
  const [newTotalMarks, setNewTotalMarks] = useState(100);
  const [newPassingMarks, setNewPassingMarks] = useState(50);
  const [newNegativeMarking, setNewNegativeMarking] = useState(false);
  const [newAllowedIpRange, setNewAllowedIpRange] = useState('');
  const [newRequireVerification, setNewRequireVerification] = useState(true);
  const [newRandomizeOrder, setNewRandomizeOrder] = useState(false);
  const [newSnapshotInterval, setNewSnapshotInterval] = useState(45);
  const [savingExam, setSavingExam] = useState(false);
  const [selectedReportSubId, setSelectedReportSubId] = useState(null);

  // Edit Exam Duration & Settings Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editTotalMarks, setEditTotalMarks] = useState(100);
  const [editPassingMarks, setEditPassingMarks] = useState(50);
  const [savingEditExam, setSavingEditExam] = useState(false);
  const [targetExamForQuestion, setTargetExamForQuestion] = useState('');

  // Question Bank Upload & Random Assignment State
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [targetExamForBank, setTargetExamForBank] = useState('');
  const [bankFile, setBankFile] = useState(null);
  const [bankParsedSummary, setBankParsedSummary] = useState(null);
  const [randomDistEnabled, setRandomDistEnabled] = useState(true);
  const [quotaCoding, setQuotaCoding] = useState(2);
  const [quotaMcq, setQuotaMcq] = useState(5);
  const [quotaTf, setQuotaTf] = useState(3);
  const [quotaSubjective, setQuotaSubjective] = useState(1);
  const [uploadingBank, setUploadingBank] = useState(false);
  const [bankUploadSuccess, setBankUploadSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [examsRes, violRes] = await Promise.all([
          examSphereApi.exams.list().catch(() => ({ data: [] })),
          examSphereApi.proctor.getViolations().catch(() => ({ data: [] })),
        ]);
        const loadedExams = examsRes.data || [];
        setExams(loadedExams);
        setViolations(violRes.data || []);

        if (loadedExams.length > 0) {
          try {
            const firstExamId = loadedExams[0]?.id || loadedExams[0]?._id;
            const qRes = await examSphereApi.questions.listByExam(firstExamId).catch(() => ({ data: [] }));
            if (qRes?.data && Array.isArray(qRes.data) && qRes.data.length > 0) {
              setBankQuestions((prev) => {
                const existingIds = new Set(prev.map((q) => q.id || q._id));
                const newItems = qRes.data.filter((q) => !existingIds.has(q.id || q._id));
                return [...newItems, ...prev];
              });
            }
          } catch (qErr) {
            console.warn('Could not load exam questions:', qErr);
          }
        }
      } catch (err) {
        console.error('Failed to load exams/violations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSavingExam(true);
    try {
      const res = await examSphereApi.exams.create({
        title: newTitle.trim(),
        duration: Number(newDuration) || 60,
        totalMarks: Number(newTotalMarks) || 100,
        passingMarks: Number(newPassingMarks) || 50,
        negativeMarking: !!newNegativeMarking,
        allowedIpRange: newAllowedIpRange.trim(),
        requireIdentityVerification: !!newRequireVerification,
        randomizeOrder: !!newRandomizeOrder,
        snapshotIntervalSeconds: Number(newSnapshotInterval) || 45,
      });

      if (res.data) {
        setExams((prev) => [res.data, ...prev]);
      }
      setCreateModalOpen(false);
      setNewTitle('');
      setNewAllowedIpRange('');
    } catch (err) {
      console.error('Error creating exam:', err);
    } finally {
      setSavingExam(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await examSphereApi.exams.delete(examId);
      setExams((prev) => prev.filter((e) => (e.id || e._id) !== examId));
    } catch (err) {
      console.error('Error deleting exam:', err);
    }
  };

  const handleOpenBankModal = (examId) => {
    const selectedId = examId || exams[0]?.id || exams[0]?._id || '';
    setTargetExamForBank(selectedId);
    const ex = exams.find((e) => (e.id || e._id) === selectedId);
    if (ex?.questionDistribution) {
      setRandomDistEnabled(ex.questionDistribution.enabled !== false);
      setQuotaCoding(ex.questionDistribution.byType?.coding ?? 2);
      setQuotaMcq(ex.questionDistribution.byType?.mcq ?? 5);
      setQuotaTf(ex.questionDistribution.byType?.tf ?? 3);
      setQuotaSubjective(ex.questionDistribution.byType?.subjective ?? 1);
    } else {
      setRandomDistEnabled(true);
      setQuotaCoding(2);
      setQuotaMcq(5);
      setQuotaTf(3);
      setQuotaSubjective(1);
    }
    setBankFile(null);
    setBankParsedSummary(null);
    setBankUploadSuccess('');
    setBankModalOpen(true);
  };

  const handleDownloadTemplate = () => {
    const sampleBank = [
      {
        type: 'coding',
        title: 'Reverse a String',
        description: 'Write a function reverseString(str) that takes a string and returns its reversed form.',
        marks: 25,
        difficulty: 'Easy',
        language: 'javascript',
        starterCode: 'function reverseString(str) {\n  // Your code here\n  return str;\n}',
        testCases: [
          { input: '"hello"', expectedOutput: '"olleh"', isHidden: false },
          { input: '"exam"', expectedOutput: '"maxe"', isHidden: false },
          { input: '"antigravity"', expectedOutput: '"ytivargitna"', isHidden: true }
        ]
      },
      {
        type: 'coding',
        title: 'Two Sum Problem',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        marks: 25,
        difficulty: 'Medium',
        language: 'javascript',
        starterCode: 'function twoSum(nums, target) {\n  // Your code here\n}',
        testCases: [
          { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
          { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false }
        ]
      },
      {
        type: 'mcq',
        title: 'Time Complexity of Binary Search',
        description: 'What is the average time complexity of searching an element in a balanced binary search tree?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 'O(log n)',
        marks: 5,
        difficulty: 'Easy'
      },
      {
        type: 'mcq',
        title: 'HTTP Status Code for Not Found',
        description: 'Which HTTP status code is returned when a requested resource is not found?',
        options: ['200', '401', '404', '500'],
        correctAnswer: '404',
        marks: 5,
        difficulty: 'Easy'
      },
      {
        type: 'tf',
        title: 'JavaScript Immutability',
        description: 'In JavaScript, primitive data types (such as numbers and strings) are immutable.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        marks: 3,
        difficulty: 'Easy'
      },
      {
        type: 'subjective',
        title: 'Database Normalization',
        description: 'Explain the difference between 2nd Normal Form (2NF) and 3rd Normal Form (3NF) with a brief schema example.',
        marks: 10,
        difficulty: 'Medium',
        guidelines: 'Candidate should mention partial dependency vs transitive dependency.'
      }
    ];

    const blob = new Blob([JSON.stringify(sampleBank, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'examsphere_question_bank_template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBankFile(file);
    setBankUploadSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) return;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          const list = Array.isArray(parsed) ? parsed : parsed.questions || [];
          const codingCount = list.filter((q) => q.type === 'coding').length;
          const mcqCount = list.filter((q) => q.type === 'mcq').length;
          const tfCount = list.filter((q) => q.type === 'tf').length;
          const subjCount = list.filter((q) => q.type === 'subjective').length;
          setBankParsedSummary({
            total: list.length,
            coding: codingCount,
            mcq: mcqCount,
            tf: tfCount,
            subjective: subjCount,
          });
          if (quotaCoding > codingCount) setQuotaCoding(codingCount);
          if (quotaMcq > mcqCount) setQuotaMcq(mcqCount);
          if (quotaTf > tfCount) setQuotaTf(tfCount);
          if (quotaSubjective > subjCount) setQuotaSubjective(subjCount);
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          setBankParsedSummary({
            total: Math.max(0, lines.length - 1),
            coding: 0,
            mcq: Math.max(0, lines.length - 1),
            tf: 0,
            subjective: 0,
          });
        }
      } catch (err) {
        console.warn('Could not parse question bank preview:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadBank = async (e) => {
    e.preventDefault();
    if (!targetExamForBank) {
      alert('Please select an assessment to associate with this question bank.');
      return;
    }
    if (!bankFile) {
      alert('Please select a question bank file to upload (.json or .csv).');
      return;
    }

    setUploadingBank(true);
    setBankUploadSuccess('');
    try {
      const questionDistribution = {
        enabled: randomDistEnabled,
        totalCount:
          (Number(quotaCoding) || 0) +
          (Number(quotaMcq) || 0) +
          (Number(quotaTf) || 0) +
          (Number(quotaSubjective) || 0),
        byType: {
          coding: Number(quotaCoding) || 0,
          mcq: Number(quotaMcq) || 0,
          tf: Number(quotaTf) || 0,
          subjective: Number(quotaSubjective) || 0,
        },
      };

      const res = await examSphereApi.questions.uploadBank({
        examId: targetExamForBank,
        file: bankFile,
        questionDistribution,
      });

      if (res.success) {
        const imported = res.data?.totalImported || bankParsedSummary?.total || 'All';
        setBankUploadSuccess(`Successfully uploaded ${imported} questions! Random distribution quotas applied.`);

        // Refresh exam list
        const updatedExamsRes = await examSphereApi.exams.list();
        if (updatedExamsRes?.data) {
          setExams(updatedExamsRes.data);
        }

        try {
          const qRes = await examSphereApi.questions.listByExam(targetExamForBank);
          if (qRes?.data && Array.isArray(qRes.data) && qRes.data.length > 0) {
            setBankQuestions((prev) => {
              const existingIds = new Set(prev.map((q) => q.id || q._id));
              const newItems = qRes.data.filter((q) => !existingIds.has(q.id || q._id));
              return [...newItems, ...prev];
            });
          }
        } catch (qErr) {
          console.warn('Could not refresh bank questions after upload:', qErr);
        }

        setTimeout(() => {
          setBankModalOpen(false);
          setBankFile(null);
          setBankParsedSummary(null);
          setBankUploadSuccess('');
        }, 1500);
      } else {
        alert(res.message || 'Failed to upload question bank');
      }
    } catch (err) {
      console.error('Error uploading question bank:', err);
      alert(err.response?.data?.message || err.message || 'Question bank upload failed');
    } finally {
      setUploadingBank(false);
    }
  };

  const handleOpenEditModal = (exam) => {
    setEditingExamId(exam.id || exam._id);
    setEditTitle(exam.title || '');
    setEditDuration(exam.durationMinutes || exam.duration || 60);
    setEditTotalMarks(exam.totalMarks || 100);
    setEditPassingMarks(exam.passMarks || exam.passingMarks || 50);
    if (exam.questionDistribution) {
      setRandomDistEnabled(exam.questionDistribution.enabled !== false);
      setQuotaCoding(exam.questionDistribution.byType?.coding ?? 2);
      setQuotaMcq(exam.questionDistribution.byType?.mcq ?? 5);
      setQuotaTf(exam.questionDistribution.byType?.tf ?? 3);
      setQuotaSubjective(exam.questionDistribution.byType?.subjective ?? 1);
    } else {
      setRandomDistEnabled(false);
      setQuotaCoding(2);
      setQuotaMcq(5);
      setQuotaTf(3);
      setQuotaSubjective(1);
    }
    setEditModalOpen(true);
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    if (!editingExamId) return;

    setSavingEditExam(true);
    try {
      const questionDistribution = {
        enabled: randomDistEnabled,
        totalCount:
          (Number(quotaCoding) || 0) +
          (Number(quotaMcq) || 0) +
          (Number(quotaTf) || 0) +
          (Number(quotaSubjective) || 0),
        byType: {
          coding: Number(quotaCoding) || 0,
          mcq: Number(quotaMcq) || 0,
          tf: Number(quotaTf) || 0,
          subjective: Number(quotaSubjective) || 0,
        },
      };

      await examSphereApi.exams.update(editingExamId, {
        title: editTitle.trim(),
        duration: Number(editDuration) || 60,
        durationMinutes: Number(editDuration) || 60,
        totalMarks: Number(editTotalMarks) || 100,
        passingMarks: Number(editPassingMarks) || 50,
        questionDistribution,
      });

      setExams((prev) =>
        prev.map((exam) => {
          if ((exam.id || exam._id) === editingExamId) {
            return {
              ...exam,
              title: editTitle.trim(),
              duration: Number(editDuration) || 60,
              durationMinutes: Number(editDuration) || 60,
              totalMarks: Number(editTotalMarks) || 100,
              passingMarks: Number(editPassingMarks) || 50,
              passMarks: Number(editPassingMarks) || 50,
              questionDistribution,
            };
          }
          return exam;
        })
      );
      setEditModalOpen(false);
    } catch (err) {
      console.error('Error updating exam duration & settings:', err);
    } finally {
      setSavingEditExam(false);
    }
  };

  const handleSaveQuestion = async (newQuestion) => {
    try {
      const targetExamId = newQuestion.examId || exams[0]?.id || exams[0]?._id;
      if (targetExamId) {
        const payload = {
          examId: targetExamId,
          type: newQuestion.type || 'coding',
          title: newQuestion.title,
          description: newQuestion.description,
          text: newQuestion.text || `${newQuestion.title}\n\n${newQuestion.description || ''}`,
          marks: newQuestion.marks || (newQuestion.type === 'coding' ? 25 : 5),
          difficulty: newQuestion.difficulty || 'Medium',
        };

        if (newQuestion.type === 'coding') {
          payload.language = newQuestion.defaultLanguage || 'javascript';
          payload.starterCode =
            newQuestion.starterCode ||
            newQuestion.starterTemplates?.[newQuestion.defaultLanguage] ||
            '';
          payload.testCases = (newQuestion.testCases || []).map((tc) => ({
            input: tc.input || '',
            expectedOutput: tc.expectedOutput || '',
            isHidden: !!tc.isHidden,
          }));
          payload.timeLimitMs = (newQuestion.timeLimitSeconds || 2) * 1000;
          payload.memoryLimitMb = newQuestion.memoryLimitMb || 128;
        } else if (newQuestion.type === 'mcq') {
          payload.options = newQuestion.options || [];
          payload.correctAnswer = newQuestion.correctAnswer || '';
        } else if (newQuestion.type === 'tf') {
          payload.options = ['True', 'False'];
          payload.correctAnswer = newQuestion.correctAnswer || 'True';
        } else if (newQuestion.type === 'subjective') {
          payload.guidelines = newQuestion.guidelines || '';
        }

        await examSphereApi.questions.create(payload);

        // Increment question count in local exam state
        setExams((prev) =>
          prev.map((ex) =>
            (ex.id || ex._id) === targetExamId
              ? {
                  ...ex,
                  totalQuestions: (ex.totalQuestions || 0) + 1,
                  codingQuestionsCount:
                    newQuestion.type === 'coding'
                      ? (ex.codingQuestionsCount || 0) + 1
                      : ex.codingQuestionsCount || 0,
                }
              : ex
          )
        );
      }
    } catch (err) {
      console.error('Failed to persist question to API:', err);
    }

    setCreatedQuestions((prev) => [newQuestion, ...prev]);
    setBankQuestions((prev) => [newQuestion, ...prev]);
    setShowQuestionBuilder(false);
    setActiveTab('questions');
  };

  const handleOpenEditSuite = (q) => {
    setEditingQuestion(q);
    setSuiteTitle(q.title || '');
    setSuiteDescription(q.description || q.text || '');
    setSuiteType(q.type || 'coding');
    setSuiteDifficulty(q.difficulty || 'Medium');
    setSuiteMarks(q.marks || (q.type === 'coding' ? 25 : q.type === 'mcq' ? 5 : 10));
    setSuiteLanguage(q.language || 'javascript');
    setSuiteTimeLimit(q.timeLimitSeconds || (q.timeLimitMs ? Math.round(q.timeLimitMs / 1000) : 2));
    setSuiteMemoryLimit(q.memoryLimitMb || 128);
    setSuiteStarterCode(q.starterCode || '');
    setSuiteSuccessMsg('');

    if (Array.isArray(q.testCases) && q.testCases.length > 0) {
      setSuiteTestCases(
        q.testCases.map((tc, idx) => ({
          id: tc.id || tc._id || `tc-${idx}-${Date.now()}`,
          input: typeof tc.input === 'object' ? JSON.stringify(tc.input) : (tc.input ?? ''),
          expectedOutput: typeof tc.expectedOutput === 'object' ? JSON.stringify(tc.expectedOutput) : (tc.expectedOutput ?? ''),
          isHidden: !!tc.isHidden,
        }))
      );
    } else {
      setSuiteTestCases([
        { id: `tc-${Date.now()}-1`, input: '', expectedOutput: '', isHidden: false },
      ]);
    }

    if (Array.isArray(q.options) && q.options.length > 0) {
      setSuiteOptions(
        q.options.map((opt, idx) => ({
          id: `opt-${idx}`,
          text: typeof opt === 'string' ? opt : (opt.text || ''),
        }))
      );
    } else {
      setSuiteOptions([
        { id: 'opt-0', text: '' },
        { id: 'opt-1', text: '' },
        { id: 'opt-2', text: '' },
        { id: 'opt-3', text: '' },
      ]);
    }

    setSuiteCorrectAnswer(
      q.correctAnswer ||
      (q.options?.[0] ? (typeof q.options[0] === 'string' ? q.options[0] : q.options[0].text) : '')
    );
    setSuiteGuidelines(q.guidelines || '');
    setEditSuiteModalOpen(true);
  };

  const handleAddSuiteTestCase = () => {
    setSuiteTestCases((prev) => [
      ...prev,
      { id: `tc-${Date.now()}`, input: '', expectedOutput: '', isHidden: false },
    ]);
  };

  const handleRemoveSuiteTestCase = (id) => {
    setSuiteTestCases((prev) => prev.filter((tc) => tc.id !== id));
  };

  const handleUpdateSuiteTestCase = (id, field, value) => {
    setSuiteTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
  };

  const handleAddSuiteOption = () => {
    setSuiteOptions((prev) => [
      ...prev,
      { id: `opt-${Date.now()}`, text: '' },
    ]);
  };

  const handleRemoveSuiteOption = (id) => {
    setSuiteOptions((prev) => prev.filter((opt) => opt.id !== id));
  };

  const handleUpdateSuiteOption = (id, text) => {
    setSuiteOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const handleSaveSuite = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;
    if (!suiteTitle.trim()) {
      alert('Please enter a question title.');
      return;
    }

    setSavingSuite(true);
    try {
      const qId = editingQuestion.id || editingQuestion._id;
      const updatedQuestion = {
        ...editingQuestion,
        title: suiteTitle.trim(),
        description: suiteDescription.trim(),
        text: suiteDescription.trim(),
        type: suiteType,
        difficulty: suiteDifficulty,
        marks: Number(suiteMarks) || (suiteType === 'coding' ? 25 : 5),
      };

      if (suiteType === 'coding') {
        updatedQuestion.language = suiteLanguage;
        updatedQuestion.timeLimitSeconds = Number(suiteTimeLimit) || 2;
        updatedQuestion.timeLimitMs = (Number(suiteTimeLimit) || 2) * 1000;
        updatedQuestion.memoryLimitMb = Number(suiteMemoryLimit) || 128;
        updatedQuestion.starterCode = suiteStarterCode;
        updatedQuestion.testCases = suiteTestCases.map((tc) => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          isHidden: !!tc.isHidden,
        }));
      } else if (suiteType === 'mcq') {
        updatedQuestion.options = suiteOptions.map((o) => o.text).filter(Boolean);
        updatedQuestion.correctAnswer = suiteCorrectAnswer;
      } else if (suiteType === 'tf') {
        updatedQuestion.options = ['True', 'False'];
        updatedQuestion.correctAnswer = suiteCorrectAnswer || 'True';
      } else if (suiteType === 'subjective') {
        updatedQuestion.guidelines = suiteGuidelines;
      }

      // If persistent 24-char hex MongoDB ObjectId, send to API
      const isMongoId = typeof qId === 'string' && /^[0-9a-fA-F]{24}$/.test(qId);
      if (isMongoId) {
        try {
          await examSphereApi.questions.update(qId, {
            title: updatedQuestion.title,
            description: updatedQuestion.description,
            text: updatedQuestion.text,
            type: updatedQuestion.type,
            marks: updatedQuestion.marks,
            difficulty: updatedQuestion.difficulty,
            language: updatedQuestion.language,
            starterCode: updatedQuestion.starterCode,
            timeLimitMs: updatedQuestion.timeLimitMs,
            memoryLimitMb: updatedQuestion.memoryLimitMb,
            testCases: updatedQuestion.testCases,
            options: updatedQuestion.options,
            correctAnswer: updatedQuestion.correctAnswer,
            guidelines: updatedQuestion.guidelines,
          });
        } catch (apiErr) {
          console.warn('API update failed, updated locally:', apiErr);
        }
      }

      setBankQuestions((prev) =>
        prev.map((q) => ((q.id || q._id) === qId ? { ...q, ...updatedQuestion } : q))
      );
      setCreatedQuestions((prev) =>
        prev.map((q) => ((q.id || q._id) === qId ? { ...q, ...updatedQuestion } : q))
      );

      setSuiteSuccessMsg('Question suite updated successfully!');
      setTimeout(() => {
        setEditSuiteModalOpen(false);
        setSuiteSuccessMsg('');
      }, 700);
    } catch (err) {
      console.error('Error saving suite:', err);
      alert('Failed to save question suite: ' + (err.message || 'Unknown error'));
    } finally {
      setSavingSuite(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to remove this question from the Question Bank?')) return;
    try {
      const isMongoId = typeof qId === 'string' && /^[0-9a-fA-F]{24}$/.test(qId);
      if (isMongoId) {
        try {
          await examSphereApi.questions.delete(qId);
        } catch (err) {
          console.warn('Failed to delete question on server:', err);
        }
      }
      setBankQuestions((prev) => prev.filter((q) => (q.id || q._id) !== qId));
      setCreatedQuestions((prev) => prev.filter((q) => (q.id || q._id) !== qId));
    } catch (err) {
      console.error('Error deleting question:', err);
    }
  };

  const filteredBankQuestions = bankQuestions.filter((q) => {
    const matchesSearch =
      !bankSearchQuery.trim() ||
      (q.title || '').toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      (q.description || q.text || '').toLowerCase().includes(bankSearchQuery.toLowerCase());

    const matchesType =
      bankTypeFilter === 'all' || (q.type || 'coding') === bankTypeFilter;

    const matchesDiff =
      bankDifficultyFilter === 'all' || (q.difficulty || 'Medium').toLowerCase() === bankDifficultyFilter.toLowerCase();

    return matchesSearch && matchesType && matchesDiff;
  });

  if (loading) {
    return (
      <DashboardLayout currentRole="teacher">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole="teacher">
      <div className="space-y-8">
        {/* Welcome & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Educator Portal & Assessment Studio
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Author scheduled assessments, construct programming questions, and monitor live test integrity.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuestionBuilder(true);
                setActiveTab('create-coding');
              }}
              className="gap-2"
            >
              <Code2 className="w-4 h-4 text-indigo-600" />
              <span>New Coding Question</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setCreateModalOpen(true)}
              className="gap-2 shadow-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assessment</span>
            </Button>
            <Link to="/exam/exam-cs101">
              <Button variant="outline" className="gap-2 shadow-sm font-semibold">
                <Layers className="w-4 h-4" />
                <span>Preview Student Exam</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Published Exams
                </span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  {exams.length}
                </span>
                <span className="text-xs text-indigo-600 block mt-1 font-medium">
                  2 active assessment windows
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Candidates
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  184
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Enrolled across 3 courses
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Coding Challenges
                </span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  {bankQuestions.length}
                </span>
                <span className="text-xs text-teal-600 block mt-1 font-medium">
                  Monaco execution enabled
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab('violations')}
            className="hover:shadow-card-hover transition-all cursor-pointer border-amber-200 hover:border-rose-400 group"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Proctoring Alerts
                </span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-rose-600">
                  {violations.length} Flagged
                </span>
                <span className="text-xs text-rose-600 block mt-1 font-medium group-hover:underline">
                  {violations.length > 0 ? 'Click to inspect violators →' : 'No violations recorded'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Authoring & Management */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="exams">Course Assessments ({exams.length})</TabsTrigger>
              <TabsTrigger value="create-coding">Question Authoring Studio</TabsTrigger>
              <TabsTrigger value="questions">Question Bank ({bankQuestions.length})</TabsTrigger>
              <TabsTrigger value="violations" className="flex items-center gap-1.5 text-rose-700 data-[state=active]:bg-rose-600 data-[state=active]:text-white">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Violations ({violations.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Assessments */}
            <TabsContent value="exams" className="space-y-4">
              <div className="grid gap-4">
                {exams.map((exam) => (
                  <Card key={exam.id || exam._id} className="hover:border-indigo-300 transition-all">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{exam.category || 'General'}</Badge>
                          <Badge variant={exam.status === 'Active' ? 'success' : 'secondary'}>
                            {exam.status || 'Ready'}
                          </Badge>
                          {exam.codingQuestionsCount > 0 && (
                            <Badge variant="accent">
                              {exam.codingQuestionsCount} Coding Problem
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-slate-600 font-mono">
                            {exam.totalQuestions || 0} Questions
                          </Badge>
                          {exam.questionDistribution?.enabled && (
                            <Badge variant="accent" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 font-mono text-[11px]">
                              <Shuffle className="w-3 h-3 text-purple-600" />
                              Random Quota ({exam.questionDistribution.byType?.coding || 0} Coding, {exam.questionDistribution.byType?.mcq || 0} MCQ, {exam.questionDistribution.byType?.tf || 0} TF, {exam.questionDistribution.byType?.subjective || 0} Subj)
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-heading font-semibold text-lg text-slate-900">
                          {exam.title}
                        </h3>
                        <p className="text-sm text-slate-500">{exam.description || 'Comprehensive evaluation assessment with proctoring.'}</p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1">
                          <span className="flex items-center font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {exam.durationMinutes || exam.duration || 60} mins duration
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1" />
                            Total Marks: {exam.totalMarks || 100}
                          </span>
                          <span className="flex items-center">
                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                            Pass: {exam.passMarks || exam.passingMarks || 50}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-slate-700 hover:bg-slate-100"
                          onClick={() => {
                            setTargetExamForQuestion(exam.id || exam._id);
                            setActiveTab('create-coding');
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Question
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-teal-700 hover:text-teal-800 hover:bg-teal-50 border-teal-200"
                          onClick={() => handleOpenBankModal(exam.id || exam._id)}
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          Upload Bank
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                          onClick={() => handleOpenEditModal(exam)}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Edit Settings
                        </Button>
                        <Link to={`/exam/${exam.id || exam._id}`}>
                          <Button size="sm" variant="outline">
                            Preview Flow
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 hover:bg-rose-50 border-rose-200"
                          onClick={() => handleDeleteExam(exam.id || exam._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: Question Authoring Studio */}
            <TabsContent value="create-coding">
              <TeacherCodingQuestionBuilder
                onSaveQuestion={handleSaveQuestion}
                exams={exams}
                initialExamId={targetExamForQuestion}
              />
            </TabsContent>

            {/* TAB 3: Question Bank */}
            <TabsContent value="questions" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Authored Programming & Exam Questions</CardTitle>
                    <CardDescription>
                      Monaco-compatible coding challenges and question bank items ready to be assigned.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      JSON Template
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => handleOpenBankModal(exams[0]?.id || exams[0]?._id)} className="gap-1.5 text-xs">
                      <UploadCloud className="w-3.5 h-3.5" />
                      Upload Question Bank
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <Input
                        placeholder="Search question bank by title or problem statement..."
                        value={bankSearchQuery}
                        onChange={(e) => setBankSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                        {['all', 'coding', 'mcq', 'tf', 'subjective'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setBankTypeFilter(t)}
                            className={`px-2.5 py-1 rounded-md transition-all capitalize ${
                              bankTypeFilter === t
                                ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t === 'all' ? 'All Types' : t === 'tf' ? 'True/False' : t}
                          </button>
                        ))}
                      </div>
                      <select
                        value={bankDifficultyFilter}
                        onChange={(e) => setBankDifficultyFilter(e.target.value)}
                        className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Bank Items */}
                  {filteredBankQuestions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-lg">
                      <Code2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">No questions found</p>
                      <p className="text-xs text-slate-400 mt-1">Try clearing filters or author a new question.</p>
                    </div>
                  ) : (
                    filteredBankQuestions.map((q) => {
                      const qId = q.id || q._id;
                      const isCoding = (q.type || 'coding') === 'coding';
                      const isMcq = q.type === 'mcq';
                      const isTf = q.type === 'tf';
                      const isSubj = q.type === 'subjective';

                      return (
                        <div
                          key={qId}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="font-heading font-semibold text-sm text-slate-900 truncate">
                                {q.title}
                              </span>
                              <Badge
                                variant={
                                  q.difficulty === 'Easy'
                                    ? 'success'
                                    : q.difficulty === 'Medium'
                                    ? 'warning'
                                    : 'destructive'
                                }
                              >
                                {q.difficulty || 'Medium'}
                              </Badge>
                              <Badge variant="secondary">{q.marks || 25} Marks</Badge>
                              <Badge variant="default" className="capitalize">
                                {isCoding ? 'Coding' : isMcq ? 'MCQ' : isTf ? 'True/False' : 'Subjective'}
                              </Badge>
                              {isCoding && (
                                <Badge variant="outline" className="text-slate-600 bg-slate-50 font-mono text-[10px]">
                                  {q.language || 'javascript'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {q.description || q.text || 'No problem statement provided.'}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              {isCoding && (
                                <span>
                                  Test Cases: <strong className="text-slate-600">{q.testCases?.length || 0}</strong>
                                </span>
                              )}
                              {isMcq && (
                                <span>
                                  Options: <strong className="text-slate-600">{q.options?.length || 0}</strong>
                                </span>
                              )}
                              {q.timeLimitSeconds && (
                                <span>
                                  Timeout: <strong className="text-slate-600">{q.timeLimitSeconds}s</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEditSuite(q)}
                              className="gap-1.5 text-xs text-slate-700 hover:text-indigo-600 hover:border-indigo-400"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Edit Suite</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteQuestion(qId)}
                              className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs px-2.5"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: Proctoring Violations */}
            <TabsContent value="violations" className="space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-base font-bold text-slate-900">
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                      <span>Flagged Candidate Examination Violations</span>
                      <Badge variant="destructive" className="ml-2 text-xs">
                        {violations.length} Flagged
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Review students who violated examination rules (tab switching, fullscreen exit, developer tools, copy-paste, or multiple faces).
                    </CardDescription>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      placeholder="Filter candidate or exam..."
                      value={violationSearchQuery}
                      onChange={(e) => setViolationSearchQuery(e.target.value)}
                      className="pl-8 h-8 text-xs bg-slate-50"
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {violations.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                      <p className="text-sm font-semibold text-slate-800">No Examination Violations</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        All student assessment sessions are operating within integrity thresholds without security flags.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-5 py-3">Candidate & Credentials</th>
                            <th className="px-4 py-3">Assessment</th>
                            <th className="px-4 py-3">Violations Count</th>
                            <th className="px-4 py-3">Specific Violation Flags</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {violations
                            .filter((v) => {
                              if (!violationSearchQuery.trim()) return true;
                              const q = violationSearchQuery.toLowerCase();
                              return (
                                v.studentName?.toLowerCase().includes(q) ||
                                v.studentEmail?.toLowerCase().includes(q) ||
                                v.registerNo?.toLowerCase().includes(q) ||
                                v.examTitle?.toLowerCase().includes(q)
                              );
                            })
                            .map((v) => (
                              <tr key={v.id || v.submissionId} className="hover:bg-rose-50/20 transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                                      {v.studentName?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-900 block text-xs">
                                        {v.studentName}
                                      </span>
                                      <span className="text-slate-500 font-mono text-[11px] block truncate">
                                        {v.studentEmail}
                                      </span>
                                      {v.registerNo && v.registerNo !== 'N/A' && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded mt-0.5">
                                          <CreditCard className="w-2.5 h-2.5" />
                                          Reg: {v.registerNo}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3.5">
                                  <span className="font-semibold text-slate-800 block text-xs">
                                    {v.examTitle}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                    {v.submittedAt || v.timestamp
                                      ? new Date(v.submittedAt || v.timestamp).toLocaleString()
                                      : 'Recently active'}
                                  </span>
                                </td>

                                <td className="px-4 py-3.5">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                    <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                                    {v.violationCount} Violations
                                  </span>
                                </td>

                                <td className="px-4 py-3.5">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {v.flags && v.flags.length > 0 ? (
                                      v.flags.map((flag, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                                        >
                                          {flag}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">
                                        Tab switch logged
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      v.status === 'flagged-for-review'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : v.status === 'terminated'
                                        ? 'bg-red-200 text-red-900 border border-red-300'
                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                    }`}
                                  >
                                    {v.status || 'Flagged for Review'}
                                  </span>
                                </td>

                                <td className="px-5 py-3.5 text-right">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => setSelectedReportSubId(v.submissionId || v.id)}
                                    className="text-xs h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium gap-1"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Audit Report</span>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* CREATE EXAM DIALOG MODAL */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogHeader>
            <DialogTitle>Create New Assessment</DialogTitle>
            <DialogDescription>
              Configure the assessment window, total duration, marks, and proctoring rules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Assessment Title *
              </label>
              <Input
                placeholder="e.g. Data Structures & Algorithms Midterm"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Duration (Minutes)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="360"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Total Marks
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newTotalMarks}
                  onChange={(e) => setNewTotalMarks(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Passing Marks
                </label>
                <Input
                  type="number"
                  min="1"
                  value={newPassingMarks}
                  onChange={(e) => setNewPassingMarks(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNegativeMarking}
                    onChange={(e) => setNewNegativeMarking(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Enable Negative Marking (25%)</span>
                </label>
              </div>
            </div>

            {/* Commercial Proctoring & Access Control Extensions */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Proctoring & Network Access Controls
              </span>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Allowed IP Range or Subnet (Optional, e.g. 192.168.1.0/24 or 127.0.0.1)
                </label>
                <Input
                  type="text"
                  placeholder="Leave empty for public access"
                  value={newAllowedIpRange}
                  onChange={(e) => setNewAllowedIpRange(e.target.value)}
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Filmstrip Interval (seconds)
                  </label>
                  <Input
                    type="number"
                    min="15"
                    max="180"
                    value={newSnapshotInterval}
                    onChange={(e) => setNewSnapshotInterval(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRequireVerification}
                      onChange={(e) => setNewRequireVerification(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Require Identity Photo</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRandomizeOrder}
                      onChange={(e) => setNewRandomizeOrder(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Randomize Questions</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingExam}>
                {savingExam ? 'Creating...' : 'Create Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* EDIT EXAM DURATION & SETTINGS DIALOG MODAL */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogHeader>
            <DialogTitle>Edit Assessment Duration & Settings</DialogTitle>
            <DialogDescription>
              Adjust the exam duration, passing thresholds, and assessment configuration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateExam} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Assessment Title *
              </label>
              <Input
                placeholder="Assessment Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <div className="col-span-1">
                <label className="text-xs font-semibold text-indigo-900 block mb-1 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Duration (Mins) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="360"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  required
                  className="font-bold text-indigo-950 bg-white"
                />
                <span className="text-[10px] text-indigo-600 block mt-1">Timer for test takers</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Total Marks
                </label>
                <Input
                  type="number"
                  min="1"
                  value={editTotalMarks}
                  onChange={(e) => setEditTotalMarks(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Passing Marks
                </label>
                <Input
                  type="number"
                  min="1"
                  value={editPassingMarks}
                  onChange={(e) => setEditPassingMarks(e.target.value)}
                  required
                  className="bg-white"
                />
              </div>
            </div>

            {/* Random Question Assignment Configuration */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                    Random Question Assignment
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Assign a randomized question subset per candidate from the question bank
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={randomDistEnabled}
                    onChange={(e) => setRandomDistEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {randomDistEnabled && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    Questions per candidate by type quota:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 block mb-1">Coding</label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaCoding}
                        onChange={(e) => setQuotaCoding(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 block mb-1">MCQ</label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaMcq}
                        onChange={(e) => setQuotaMcq(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 block mb-1">True / False</label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaTf}
                        onChange={(e) => setQuotaTf(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-600 block mb-1">Subjective</label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaSubjective}
                        onChange={(e) => setQuotaSubjective(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs bg-white font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-indigo-900 bg-indigo-50 px-2.5 py-1.5 rounded font-mono">
                    <span>Total questions per candidate:</span>
                    <span className="font-bold">
                      {(Number(quotaCoding) || 0) +
                        (Number(quotaMcq) || 0) +
                        (Number(quotaTf) || 0) +
                        (Number(quotaSubjective) || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={savingEditExam} className="gap-2">
                {savingEditExam ? 'Saving...' : 'Update Assessment'}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* QUESTION BANK UPLOAD & RANDOM DISTRIBUTION DIALOG MODAL */}
        <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>Upload Question Bank & Configure Random Distribution</span>
            </DialogTitle>
            <DialogDescription>
              Upload questions in bulk via JSON or CSV. When enabled, ExamSphere will randomly assign questions to candidates according to the question counts and types configured below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadBank} className="space-y-4">
            {/* Target Assessment Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Assessment *
              </label>
              <select
                value={targetExamForBank}
                onChange={(e) => {
                  setTargetExamForBank(e.target.value);
                  const ex = exams.find((x) => (x.id || x._id) === e.target.value);
                  if (ex?.questionDistribution) {
                    setRandomDistEnabled(ex.questionDistribution.enabled !== false);
                    setQuotaCoding(ex.questionDistribution.byType?.coding ?? 2);
                    setQuotaMcq(ex.questionDistribution.byType?.mcq ?? 5);
                    setQuotaTf(ex.questionDistribution.byType?.tf ?? 3);
                    setQuotaSubjective(ex.questionDistribution.byType?.subjective ?? 1);
                  }
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              >
                <option value="" disabled>Select an assessment</option>
                {exams.map((ex) => (
                  <option key={ex.id || ex._id} value={ex.id || ex._id}>
                    {ex.title} ({ex.durationMinutes || ex.duration || 60} mins)
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-5 text-center transition-all bg-slate-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="bank-file-upload"
              />
              <label
                htmlFor="bank-file-upload"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-indigo-600 hover:underline">
                    Click to browse question bank file
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Supports JSON (coding test cases, MCQs, True/False, Subjective) or CSV
                  </span>
                </div>
              </label>

              {bankFile && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-900 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>{bankFile.name} ({(bankFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 font-medium"
                >
                  <Download className="w-3 h-3" />
                  Download Sample JSON Template
                </button>
              </div>
            </div>

            {/* Parsed Preview if available */}
            {bankParsedSummary && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Detected in File: {bankParsedSummary.total} Questions
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    Coding: {bankParsedSummary.coding}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    MCQ: {bankParsedSummary.mcq}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    True/False: {bankParsedSummary.tf}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    Subjective: {bankParsedSummary.subjective}
                  </span>
                </div>
              </div>
            )}

            {/* Random Assignment Configuration */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                    Random Question Assignment Rules
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Randomly sample questions for each candidate by question count and type
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={randomDistEnabled}
                    onChange={(e) => setRandomDistEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {randomDistEnabled && (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <span className="text-[11px] font-semibold text-slate-700 block">
                    Questions per candidate by type:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Coding
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaCoding}
                        onChange={(e) => setQuotaCoding(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        MCQ
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaMcq}
                        onChange={(e) => setQuotaMcq(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        True / False
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaTf}
                        onChange={(e) => setQuotaTf(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 block mb-1">
                        Subjective
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={quotaSubjective}
                        onChange={(e) => setQuotaSubjective(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-indigo-900 bg-indigo-50/70 px-3 py-2 rounded-lg font-mono">
                    <span>Total per candidate:</span>
                    <span className="font-bold">
                      {(Number(quotaCoding) || 0) +
                        (Number(quotaMcq) || 0) +
                        (Number(quotaTf) || 0) +
                        (Number(quotaSubjective) || 0)}{' '}
                      questions
                    </span>
                  </div>
                </div>
              )}
            </div>

            {bankUploadSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{bankUploadSuccess}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setBankModalOpen(false)}
                disabled={uploadingBank}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={uploadingBank || !bankFile || !targetExamForBank}
                className="gap-2"
              >
                {uploadingBank ? (
                  <>
                    <UploadCloud className="w-4 h-4 animate-pulse" />
                    <span>Importing Bank...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Save Rules</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* EDIT QUESTION SUITE MODAL */}
        <Dialog
          open={editSuiteModalOpen}
          onOpenChange={setEditSuiteModalOpen}
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Edit Question Suite</DialogTitle>
                  <DialogDescription className="text-xs">
                    Configure question parameters, test case validation suites, and grading specifications.
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="default" className="capitalize text-xs font-mono">
                {suiteType}
              </Badge>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveSuite} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Question Title *
                </label>
                <Input
                  value={suiteTitle}
                  onChange={(e) => setSuiteTitle(e.target.value)}
                  placeholder="e.g. Reverse Linked List"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Question Type
                </label>
                <select
                  value={suiteType}
                  onChange={(e) => setSuiteType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-medium capitalize"
                >
                  <option value="coding">Coding Challenge</option>
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="tf">True / False</option>
                  <option value="subjective">Subjective / Essay</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Difficulty
                </label>
                <select
                  value={suiteDifficulty}
                  onChange={(e) => setSuiteDifficulty(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-medium"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Marks
                </label>
                <Input
                  type="number"
                  min="1"
                  value={suiteMarks}
                  onChange={(e) => setSuiteMarks(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              {suiteType === 'coding' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Language
                    </label>
                    <select
                      value={suiteLanguage}
                      onChange={(e) => setSuiteLanguage(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-medium"
                    >
                      <option value="javascript">JavaScript (Node.js)</option>
                      <option value="python">Python 3</option>
                      <option value="cpp">C++ (GCC)</option>
                      <option value="java">Java 17</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Time Limit (sec)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={suiteTimeLimit}
                      onChange={(e) => setSuiteTimeLimit(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Problem Statement / Description */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Problem Statement / Prompt *
              </label>
              <textarea
                value={suiteDescription}
                onChange={(e) => setSuiteDescription(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-normal leading-relaxed"
                placeholder="Detailed instructions and requirements for the candidate..."
                required
              />
            </div>

            {/* CODING SPECIFIC: Starter Code & Test Cases */}
            {suiteType === 'coding' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                      Starter Code Template / Signature
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">{suiteLanguage}</span>
                  </div>
                  <textarea
                    value={suiteStarterCode}
                    onChange={(e) => setSuiteStarterCode(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-lg border border-slate-800 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-normal"
                    placeholder={`function solution() {\n  // Candidate code\n}`}
                  />
                </div>

                {/* Test Cases Suite */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verification Test Suite ({suiteTestCases.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Hidden test cases are evaluated during final evaluation and not displayed upfront.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddSuiteTestCase}
                      className="gap-1 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Test Case
                    </Button>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {suiteTestCases.map((tc, index) => (
                      <div
                        key={tc.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">
                            Test Case #{index + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tc.isHidden}
                                onChange={(e) =>
                                  handleUpdateSuiteTestCase(tc.id, 'isHidden', e.target.checked)
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>Hidden (Private)</span>
                            </label>
                            {suiteTestCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSuiteTestCase(tc.id)}
                                className="text-slate-400 hover:text-rose-600 transition-colors"
                                title="Remove test case"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <span className="text-[11px] font-mono text-slate-500 block mb-0.5">Input:</span>
                            <Input
                              value={tc.input}
                              onChange={(e) =>
                                handleUpdateSuiteTestCase(tc.id, 'input', e.target.value)
                              }
                              placeholder="e.g. [2,7,11,15], 9"
                              className="h-8 font-mono text-xs bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[11px] font-mono text-slate-500 block mb-0.5">Expected Output:</span>
                            <Input
                              value={tc.expectedOutput}
                              onChange={(e) =>
                                handleUpdateSuiteTestCase(tc.id, 'expectedOutput', e.target.value)
                              }
                              placeholder="e.g. [0,1]"
                              className="h-8 font-mono text-xs bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MCQ SPECIFIC: Options & Correct Answer */}
            {suiteType === 'mcq' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Multiple Choice Options
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddSuiteOption}
                    className="gap-1 text-xs text-indigo-600 border-indigo-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {suiteOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={suiteCorrectAnswer === opt.text && opt.text.trim() !== ''}
                        onChange={() => setSuiteCorrectAnswer(opt.text)}
                        title="Mark as correct answer"
                        className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          handleUpdateSuiteOption(opt.id, e.target.value);
                          if (suiteCorrectAnswer === opt.text) {
                            setSuiteCorrectAnswer(e.target.value);
                          }
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="h-9 text-xs"
                      />
                      {suiteOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSuiteOption(opt.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  Select the radio button next to the option that represents the correct answer.
                </p>
              </div>
            )}

            {/* TRUE / FALSE SPECIFIC */}
            {suiteType === 'tf' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Correct Answer
                </label>
                <div className="flex items-center gap-4">
                  {['True', 'False'].map((val) => (
                    <label
                      key={val}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-xs font-semibold transition-all ${
                        suiteCorrectAnswer === val
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tfAnswer"
                        value={val}
                        checked={suiteCorrectAnswer === val}
                        onChange={(e) => setSuiteCorrectAnswer(e.target.value)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{val}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* SUBJECTIVE SPECIFIC */}
            {suiteType === 'subjective' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Evaluation Rubric & Model Guidelines
                </label>
                <textarea
                  value={suiteGuidelines}
                  onChange={(e) => setSuiteGuidelines(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Key concepts, terminology, or grading points the candidate must include..."
                />
              </div>
            )}

            {suiteSuccessMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{suiteSuccessMsg}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditSuiteModalOpen(false)}
                disabled={savingSuite}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={savingSuite}
                className="gap-2"
              >
                {savingSuite ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Suite...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Suite Changes</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Dialog>

        {/* TEACHER PROCTORING AUDIT REPORT MODAL */}
        <ProctoringReportModal
          submissionId={selectedReportSubId}
          isOpen={!!selectedReportSubId}
          onClose={() => setSelectedReportSubId(null)}
        />
      </div>
    </DashboardLayout>
  );
}
