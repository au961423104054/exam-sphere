import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Code2,
  Clock,
  Cpu,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileText,
  CheckSquare,
  BookOpen,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function TeacherCodingQuestionBuilder({
  onSaveQuestion,
  onCancel,
  exams = [],
  initialExamId = '',
}) {
  const [selectedExamId, setSelectedExamId] = useState(
    initialExamId || (exams.length > 0 ? exams[0]?.id || exams[0]?._id : '')
  );
  const [questionType, setQuestionType] = useState('coding'); // 'coding' | 'mcq' | 'tf' | 'subjective'
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [marks, setMarks] = useState(25);

  // Coding specific state
  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(128);
  const [defaultLanguage, setDefaultLanguage] = useState('javascript');
  const [functionName, setFunctionName] = useState('findLargest');
  const [returnType, setReturnType] = useState('int');
  const [className, setClassName] = useState('Solution');
  const [parameters, setParameters] = useState([
    { id: 'p-1', name: 'arr', type: 'int[]' },
  ]);

  const generateSignaturePreview = (lang) => {
    const pStr = parameters.map((p) => p.name || 'arg').join(', ');
    if (lang === 'java') {
      const jParams = parameters.map((p) => `${p.type || 'int'} ${p.name || 'arg'}`).join(', ');
      return `public ${returnType || 'int'} ${functionName || 'solve'}(${jParams})`;
    }
    if (lang === 'cpp') {
      const cParams = parameters.map((p) => `${p.type || 'vector<int>&'} ${p.name || 'arg'}`).join(', ');
      return `${returnType || 'int'} ${functionName || 'solve'}(${cParams})`;
    }
    if (lang === 'python') {
      return `def ${functionName || 'solve'}(${pStr}):`;
    }
    return `function ${functionName || 'solve'}(${pStr})`;
  };

  const generateTemplateForLang = (lang) => {
    const sig = generateSignaturePreview(lang);
    if (lang === 'java') {
      return `class ${className || 'Solution'} {\n    ${sig} {\n        // Write your solution here\n        return 0;\n    }\n}`;
    }
    if (lang === 'cpp') {
      return `class ${className || 'Solution'} {\npublic:\n    ${sig} {\n        // Write your solution here\n        return 0;\n    }\n};`;
    }
    if (lang === 'python') {
      return `${sig}\n    # Write your solution here\n    pass`;
    }
    return `/**\n * @return {${returnType}}\n */\n${sig} {\n  // Write your solution here\n  return 0;\n}`;
  };

  const [starterCode, setStarterCode] = useState(
    `/**\n * @param {number[]} arr\n * @return {number}\n */\nfunction findLargest(arr) {\n  // Write your solution here\n  return 0;\n}`
  );
  const [testCases, setTestCases] = useState([
    { id: 'tc-1', input: 'arr = [3, 9, 2, 5, 1]', expectedOutput: '9', isHidden: false },
    { id: 'tc-2', input: 'arr = [-5, -2, -10]', expectedOutput: '-2', isHidden: false },
    { id: 'tc-3', input: 'arr = [42]', expectedOutput: '42', isHidden: true },
  ]);

  // MCQ specific state
  const [mcqOptions, setMcqOptions] = useState([
    { id: 'opt-0', text: '' },
    { id: 'opt-1', text: '' },
    { id: 'opt-2', text: '' },
    { id: 'opt-3', text: '' },
  ]);
  const [correctMcqIndex, setCorrectMcqIndex] = useState(0);

  // True/False specific state
  const [tfCorrectAnswer, setTfCorrectAnswer] = useState('True');

  // Subjective specific state
  const [rubricGuidelines, setRubricGuidelines] = useState('');

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!selectedExamId && exams.length > 0) {
      setSelectedExamId(exams[0]?.id || exams[0]?._id || '');
    }
  }, [exams, selectedExamId]);

  // Adjust default marks when type changes
  const handleTypeChange = (type) => {
    setQuestionType(type);
    if (type === 'coding') {
      setMarks(25);
    } else if (type === 'mcq') {
      setMarks(5);
    } else if (type === 'tf') {
      setMarks(2);
    } else if (type === 'subjective') {
      setMarks(10);
    }
  };

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: `tc-${Date.now()}`,
        input: '',
        expectedOutput: '',
        isHidden: false,
      },
    ]);
  };

  const handleRemoveTestCase = (id) => {
    setTestCases(testCases.filter((tc) => tc.id !== id));
  };

  const handleTestCaseChange = (id, field, value) => {
    setTestCases(
      testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
    );
  };

  const handleMcqOptionChange = (index, value) => {
    const updated = [...mcqOptions];
    updated[index].text = value;
    setMcqOptions(updated);
  };

  const handleAddMcqOption = () => {
    if (mcqOptions.length >= 6) return;
    setMcqOptions([...mcqOptions, { id: `opt-${Date.now()}`, text: '' }]);
  };

  const handleRemoveMcqOption = (index) => {
    if (mcqOptions.length <= 2) return;
    const updated = mcqOptions.filter((_, idx) => idx !== index);
    setMcqOptions(updated);
    if (correctMcqIndex >= updated.length) {
      setCorrectMcqIndex(0);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() && !description.trim()) return;

    const resolvedTitle = title.trim() || description.trim().split('\n')[0].substring(0, 60);
    const resolvedDesc = description.trim() || title.trim();

    let questionPayload = {
      id: `q-${Date.now()}`,
      examId: selectedExamId,
      type: questionType,
      title: resolvedTitle,
      description: resolvedDesc,
      text: `${resolvedTitle}\n\n${resolvedDesc}`,
      difficulty,
      marks: Number(marks) || 1,
    };

    if (questionType === 'coding') {
      const cleanParams = parameters.map((p) => ({
        name: p.name.trim() || 'arg',
        type: p.type.trim() || 'int[]',
      }));

      const templates = {
        javascript: generateTemplateForLang('javascript'),
        python: generateTemplateForLang('python'),
        java: generateTemplateForLang('java'),
        cpp: generateTemplateForLang('cpp'),
      };
      if (starterCode) {
        templates[defaultLanguage] = starterCode;
      }

      questionPayload = {
        ...questionPayload,
        functionName: functionName.trim() || 'solve',
        returnType: returnType.trim() || 'int',
        className: className.trim() || 'Solution',
        parameters: cleanParams,
        functionSignature: generateSignaturePreview(defaultLanguage),
        timeLimitSeconds: Number(timeLimit) || 2,
        timeLimitMs: (Number(timeLimit) || 2) * 1000,
        memoryLimitMb: Number(memoryLimit) || 128,
        defaultLanguage,
        starterCode: starterCode || templates[defaultLanguage],
        starterTemplates: templates,
        testCases: testCases.map((tc) => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          isHidden: !!tc.isHidden,
        })),
      };
    } else if (questionType === 'mcq') {
      const optionsArray = mcqOptions.map((o) => o.text.trim()).filter(Boolean);
      const correctAnswer = optionsArray[correctMcqIndex] || optionsArray[0] || '';
      questionPayload = {
        ...questionPayload,
        options: optionsArray,
        correctAnswer,
      };
    } else if (questionType === 'tf') {
      questionPayload = {
        ...questionPayload,
        options: ['True', 'False'],
        correctAnswer: tfCorrectAnswer,
      };
    } else if (questionType === 'subjective') {
      questionPayload = {
        ...questionPayload,
        guidelines: rubricGuidelines.trim(),
      };
    }

    if (onSaveQuestion) {
      onSaveQuestion(questionPayload);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              {questionType === 'coding' ? (
                <Code2 className="w-5 h-5" />
              ) : questionType === 'mcq' ? (
                <CheckSquare className="w-5 h-5" />
              ) : questionType === 'tf' ? (
                <HelpCircle className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <CardTitle>Author & Assign Question</CardTitle>
              <CardDescription>
                Assign custom questions, choose problem type, and configure automated test suites or answer keys.
              </CardDescription>
            </div>
          </div>
          <Badge variant="accent">
            {questionType === 'coding'
              ? 'Monaco Powered'
              : questionType === 'mcq'
              ? 'Multiple Choice'
              : questionType === 'tf'
              ? 'True / False'
              : 'Subjective'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Target Assessment & Question Type Selection */}
          <div className="grid gap-4 sm:grid-cols-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700 flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Assign to Assessment *
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                required
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {exams.length === 0 ? (
                  <option value="">No assessments created yet</option>
                ) : (
                  exams.map((exam) => (
                    <option key={exam.id || exam._id} value={exam.id || exam._id}>
                      {exam.title} ({exam.durationMinutes || exam.duration || 60} mins)
                    </option>
                  ))
                )}
              </select>
              <span className="text-[11px] text-slate-500 block">
                The question will be added to the selected assessment question bank.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Question Type *
              </label>
              <select
                value={questionType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800"
              >
                <option value="coding">Coding Challenge (Monaco, Test Cases, Limits)</option>
                <option value="mcq">Multiple Choice Question (MCQ)</option>
                <option value="tf">True / False Question</option>
                <option value="subjective">Subjective / Essay Response</option>
              </select>
              <span className="text-[11px] text-slate-500 block">
                Select the evaluation format for candidates.
              </span>
            </div>
          </div>

          {/* Title and Difficulty & Marks */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700">Question Title *</label>
              <Input
                placeholder={
                  questionType === 'coding'
                    ? 'e.g. Longest Substring Without Repeating Characters'
                    : questionType === 'mcq'
                    ? 'e.g. Asymptotic Complexity of Binary Search'
                    : questionType === 'tf'
                    ? 'e.g. TCP Handshake Protocol'
                    : 'e.g. Explain Difference Between Process and Thread'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Marks
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Question Description / Statement */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-700">
              {questionType === 'coding'
                ? 'Problem Statement, Examples & Constraints *'
                : 'Question Statement / Prompt *'}
            </label>
            <textarea
              rows={questionType === 'coding' ? 4 : 3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                questionType === 'coding'
                  ? 'Describe the algorithmic challenge, provide example inputs/outputs, and list constraints...'
                  : 'Enter the complete question prompt that candidates will read during the exam...'
              }
              required
              className="w-full p-3 border border-slate-300 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* DYNAMIC FORM SECTION 1: CODING QUESTION */}
          {questionType === 'coding' && (
            <div className="space-y-6">
              {/* FUNCTIONAL SIGNATURE & METHOD DEFINITION */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-600" />
                      Functional Solution Contract & Signature
                    </h4>
                    <p className="text-xs text-slate-500">
                      Configure the exact method signature. Candidates will implement only this function body; driver harness code is handled in the background.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStarterCode(generateTemplateForLang(defaultLanguage));
                    }}
                    className="text-xs gap-1 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Sync Template from Signature
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase text-slate-700">
                      Method / Function Name *
                    </label>
                    <Input
                      placeholder="e.g. findLargest"
                      value={functionName}
                      onChange={(e) => setFunctionName(e.target.value)}
                      className="h-9 font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase text-slate-700">
                      Return Type *
                    </label>
                    <Input
                      placeholder="e.g. int, int[], String, boolean, void"
                      value={returnType}
                      onChange={(e) => setReturnType(e.target.value)}
                      className="h-9 font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase text-slate-700">
                      Enclosing Class (Java / C++)
                    </label>
                    <Input
                      placeholder="e.g. Solution"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Parameters List */}
                <div className="space-y-2 pt-2 border-t border-indigo-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-slate-700">
                      Function Parameters
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setParameters([
                          ...parameters,
                          { id: `p-${Date.now()}`, name: `arg${parameters.length + 1}`, type: 'int' },
                        ])
                      }
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Parameter
                    </button>
                  </div>

                  <div className="space-y-2">
                    {parameters.map((param, pIdx) => (
                      <div key={param.id || pIdx} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-[11px] font-mono text-slate-400 w-12 shrink-0">
                          #{pIdx + 1}
                        </span>
                        <div className="flex-1">
                          <Input
                            placeholder="Parameter Name (e.g. arr)"
                            value={param.name}
                            onChange={(e) => {
                              const updated = [...parameters];
                              updated[pIdx].name = e.target.value;
                              setParameters(updated);
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder="Type (e.g. int[], string, boolean)"
                            value={param.type}
                            onChange={(e) => {
                              const updated = [...parameters];
                              updated[pIdx].type = e.target.value;
                              setParameters(updated);
                            }}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={parameters.length <= 1}
                          onClick={() => setParameters(parameters.filter((_, idx) => idx !== pIdx))}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Signature Preview */}
                <div className="p-2.5 bg-slate-900 rounded-lg text-slate-300 font-mono text-xs flex items-center justify-between border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                      Generated Signature
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {generateSignaturePreview(defaultLanguage)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Candidate Editor Preview
                  </span>
                </div>
              </div>

              {/* Resource Constraints */}
              <div className="grid gap-4 sm:grid-cols-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-700 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Time Limit (Seconds)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-700 flex items-center">
                    <Cpu className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    Memory Limit (MB)
                  </label>
                  <Input
                    type="number"
                    min="64"
                    max="512"
                    step="32"
                    value={memoryLimit}
                    onChange={(e) => setMemoryLimit(e.target.value)}
                  />
                </div>
              </div>

              {/* Starter Template Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase text-slate-700">
                    Starter Code Template
                  </label>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python 3</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <textarea
                  rows={5}
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Test Cases Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Validation Test Cases</h4>
                    <p className="text-xs text-slate-500">
                      Provide input/output pairs. Hidden test cases evaluate submissions without student visibility.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddTestCase}
                    className="gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Case
                  </Button>
                </div>

                <div className="space-y-3">
                  {testCases.map((tc, index) => (
                    <div
                      key={tc.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white grid gap-3 sm:grid-cols-12 items-center"
                    >
                      <div className="sm:col-span-1 text-xs font-semibold text-slate-400">
                        #{index + 1}
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                          Input
                        </label>
                        <Input
                          placeholder='s = "abcabcbb"'
                          value={tc.input}
                          onChange={(e) => handleTestCaseChange(tc.id, 'input', e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                          Expected Output
                        </label>
                        <Input
                          placeholder="3"
                          value={tc.expectedOutput}
                          onChange={(e) => handleTestCaseChange(tc.id, 'expectedOutput', e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-start sm:justify-center">
                        <label className="flex items-center space-x-1.5 text-xs text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => handleTestCaseChange(tc.id, 'isHidden', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Hidden</span>
                        </label>
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          disabled={testCases.length <= 1}
                          onClick={() => handleRemoveTestCase(tc.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM SECTION 2: MCQ QUESTION */}
          {questionType === 'mcq' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Options & Answer Key</h4>
                  <p className="text-xs text-slate-500">
                    Define the choices and select the radio button for the correct answer.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddMcqOption}
                  disabled={mcqOptions.length >= 6}
                  className="gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {mcqOptions.map((opt, index) => (
                  <div key={opt.id} className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-slate-200">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correct-mcq"
                        checked={correctMcqIndex === index}
                        onChange={() => setCorrectMcqIndex(index)}
                        className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 text-xs font-bold font-mono flex items-center justify-center">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </label>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + index)} text`}
                      value={opt.text}
                      onChange={(e) => handleMcqOptionChange(index, e.target.value)}
                      required
                      className="flex-1 h-9 text-sm"
                    />
                    {correctMcqIndex === index && (
                      <Badge variant="success" className="text-[10px]">
                        Correct Answer
                      </Badge>
                    )}
                    <button
                      type="button"
                      disabled={mcqOptions.length <= 2}
                      onClick={() => handleRemoveMcqOption(index)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors disabled:opacity-20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DYNAMIC FORM SECTION 3: TRUE / FALSE QUESTION */}
          {questionType === 'tf' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Correct Answer</h4>
              <p className="text-xs text-slate-500">
                Select whether the statement is True or False.
              </p>
              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-slate-800">
                  <input
                    type="radio"
                    name="tf-answer"
                    value="True"
                    checked={tfCorrectAnswer === 'True'}
                    onChange={() => setTfCorrectAnswer('True')}
                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-slate-800">
                  <input
                    type="radio"
                    name="tf-answer"
                    value="False"
                    checked={tfCorrectAnswer === 'False'}
                    onChange={() => setTfCorrectAnswer('False')}
                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM SECTION 4: SUBJECTIVE QUESTION */}
          {questionType === 'subjective' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-700 block">
                Evaluation Guidelines / Key Grading Points (Optional)
              </label>
              <textarea
                rows={3}
                value={rubricGuidelines}
                onChange={(e) => setRubricGuidelines(e.target.value)}
                placeholder="List key keywords, criteria, or rubric points the teacher will check during manual evaluation..."
                className="w-full p-3 border border-slate-300 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedExamId}
              className="gap-2"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Assigned to Assessment!
                </>
              ) : (
                `Assign ${
                  questionType === 'coding'
                    ? 'Coding'
                    : questionType === 'mcq'
                    ? 'MCQ'
                    : questionType === 'tf'
                    ? 'True/False'
                    : 'Subjective'
                } Question`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
