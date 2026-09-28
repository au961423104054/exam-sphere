import React, { useState, useEffect, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Terminal,
  Moon,
  Sun,
  Lock,
  Code2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  Cpu,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { examSphereApi } from '../../services/api';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript (Node.js)' },
  { id: 'python', label: 'Python 3.11' },
  { id: 'java', label: 'Java (OpenJDK 17)' },
  { id: 'cpp', label: 'C++ (G++ 13)' },
  { id: 'typescript', label: 'TypeScript 5.x' },
];

/**
 * Generate display signature for the non-editable header bar
 */
function getSystemSignatureDisplay(lang, question) {
  const fnName = question?.functionName || 'solve';
  const retType = question?.returnType || 'int';
  const className = question?.className || 'Solution';
  const params = question?.parameters || [{ name: 'arr', type: 'int[]' }];

  if (lang === 'java') {
    const pStr = params.map((p) => `${p.type || 'int'} ${p.name || 'arg'}`).join(', ');
    return {
      header: `class ${className} {\n    public ${retType} ${fnName}(${pStr}) {`,
      footer: `    }\n}`,
    };
  }

  if (lang === 'cpp') {
    const pStr = params.map((p) => `${p.type || 'vector<int>&'} ${p.name || 'arr'}`).join(', ');
    return {
      header: `class ${className} {\npublic:\n    ${retType} ${fnName}(${pStr}) {`,
      footer: `    }\n};`,
    };
  }

  if (lang === 'python') {
    const pStr = params.map((p) => p.name || 'arr').join(', ');
    return {
      header: `def ${fnName}(${pStr}):`,
      footer: ``,
    };
  }

  // JavaScript
  const pStr = params.map((p) => p.name || 'arr').join(', ');
  return {
    header: `function ${fnName}(${pStr}) {`,
    footer: `}`,
  };
}

export function CodeEditor({
  question,
  submissionId = 'sub-demo-001',
  onCodeChange,
  onSubmitSuccess,
  initialCode,
}) {
  const defaultLang = question?.defaultLanguage || question?.language || 'javascript';
  const [language, setLanguage] = useState(defaultLang);
  const [theme, setTheme] = useState('vs-dark');

  // Starter template resolution
  const resolvedStarterCode = useMemo(() => {
    if (initialCode) return initialCode;
    if (question?.starterTemplates?.[language]) return question.starterTemplates[language];
    if (question?.starterCode) return question.starterCode;

    // Default functional template
    const fnName = question?.functionName || 'solve';
    if (language === 'python') {
      return `def ${fnName}(${(question?.parameters || [{ name: 'arr' }]).map((p) => p.name).join(', ')}):\n    # Write your solution here\n    pass\n`;
    }
    if (language === 'java') {
      return `class Solution {\n    public ${question?.returnType || 'int'} ${fnName}(${(question?.parameters || [{ name: 'arr', type: 'int[]' }]).map((p) => `${p.type} ${p.name}`).join(', ')}) {\n        // Write your solution here\n        return 0;\n    }\n}\n`;
    }
    if (language === 'cpp') {
      return `class Solution {\npublic:\n    ${question?.returnType || 'int'} ${fnName}(${(question?.parameters || [{ name: 'arr', type: 'vector<int>&' }]).map((p) => `${p.type} ${p.name}`).join(', ')}) {\n        // Write your solution here\n        return 0;\n    }\n};\n`;
    }
    return `function ${fnName}(${(question?.parameters || [{ name: 'arr' }]).map((p) => p.name).join(', ')}) {\n  // Write your solution here\n  return 0;\n}\n`;
  }, [language, question, initialCode]);

  const [code, setCode] = useState(resolvedStarterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcases'); // 'testcases' | 'stdout' | 'diagnostics'
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);

  // Sync when question changes
  useEffect(() => {
    const newLang = question?.defaultLanguage || question?.language || 'javascript';
    setLanguage(newLang);
    const starter = question?.starterTemplates?.[newLang] || question?.starterCode || resolvedStarterCode;
    setCode(starter);
    setExecutionResult(null);
  }, [question?._id, question?.id]);

  const signatureSpec = getSystemSignatureDisplay(language, question);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const starter =
      question?.starterTemplates?.[newLang] ||
      (newLang === 'python'
        ? `def ${question?.functionName || 'solve'}(${(question?.parameters || [{ name: 'arr' }]).map((p) => p.name).join(', ')}):\n    # Write your solution here\n    pass\n`
        : `// Solution in ${newLang}\n`);
    setCode(starter);
    if (onCodeChange) onCodeChange(starter, newLang);
  };

  const handleResetCode = () => {
    const starter = question?.starterTemplates?.[language] || resolvedStarterCode;
    setCode(starter);
    if (onCodeChange) onCodeChange(starter, language);
  };

  const handleEditorChange = (value) => {
    setCode(value);
    if (onCodeChange) onCodeChange(value, language);
  };

  // Run Code (Sample Test Cases Only)
  const handleRunCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    setActiveConsoleTab('testcases');
    try {
      const res = await examSphereApi.submissions.runCode(submissionId, {
        language,
        code,
        questionId: question?._id || question?.id,
        testCases: (question?.testCases || []).filter((tc) => !tc.isHidden),
      });

      const data = res.data || res;
      setExecutionResult({
        ...data,
        isSubmissionRun: false,
        totalCases: data.totalCount || data.results?.length || 0,
        passedCases: data.passedCount || data.results?.filter((r) => r.passed).length || 0,
      });
    } catch (err) {
      setExecutionResult({
        allPassed: false,
        results: [],
        stdout: `Execution Failed: ${err.message}`,
        compilationError: err.message,
        runtimeMs: 0,
        isSubmissionRun: false,
      });
      setActiveConsoleTab('stdout');
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Solution (Evaluates All Test Cases including Hidden)
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setExecutionResult(null);
    setActiveConsoleTab('testcases');
    try {
      const res = await examSphereApi.submissions.submitCode(submissionId, {
        language,
        code,
        questionId: question?._id || question?.id,
      });

      const data = res.data || res;
      setExecutionResult({
        ...data,
        isSubmissionRun: true,
        totalCases: data.totalCount || data.results?.length || 0,
        passedCases: data.passedCount || data.results?.filter((r) => r.passed).length || 0,
      });

      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
    } catch (err) {
      setExecutionResult({
        allPassed: false,
        results: [],
        stdout: `Submission Error: ${err.message}`,
        compilationError: err.message,
        runtimeMs: 0,
        isSubmissionRun: true,
      });
      setActiveConsoleTab('stdout');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Visible test cases for the problem description
  const visibleCases = (question?.testCases || []).filter((tc) => !tc.isHidden);
  const totalHiddenCasesCount = (question?.testCases || []).filter((tc) => tc.isHidden).length;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl font-sans">
      {/* 1. MANDATORY NOTICE BANNER: FUNCTIONAL CODE ONLY */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 px-4 py-2.5 border-b border-indigo-900/40 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-1 rounded bg-teal-500/20 text-teal-300 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-teal-300 mr-2">
              Functional Solution Code Only:
            </span>
            <span className="text-slate-300 font-medium">
              Write your solution inside the provided function. Driver code and input handling are managed automatically.
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 shrink-0">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
            {question?.timeLimitSeconds || (question?.timeLimitMs ? question.timeLimitMs / 1000 : 2)}s Limit
          </span>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            <Cpu className="w-3 h-3 inline mr-1 text-slate-400" />
            {question?.memoryLimitMb || 128} MB
          </span>
        </div>
      </div>

      {/* 2. SPECIFICATION BAR: Function, Return Type & Parameters */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Method:</span>
            <span className="text-indigo-300 font-bold">
              {question?.functionName || 'solve'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
            <span className="text-slate-400">Returns:</span>
            <span className="text-emerald-400 font-semibold">
              {question?.returnType || 'int'}
            </span>
          </div>

          {question?.className && (language === 'java' || language === 'cpp') && (
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 font-mono">
              <span className="text-slate-400">Class:</span>
              <span className="text-amber-300 font-semibold">{question.className}</span>
            </div>
          )}

          {Array.isArray(question?.parameters) && question.parameters.length > 0 && (
            <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 font-mono text-[11px] text-slate-300">
              <span className="text-slate-400">Params:</span>
              <span>
                {question.parameters.map((p) => `${p.name} (${p.type})`).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Driver Status Pill */}
        <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
          <Lock className="w-3 h-3 text-teal-400" />
          <span>Harness: <strong className="text-slate-300">Server-Side Background Driver</strong></span>
        </div>
      </div>

      {/* 3. TOOLBAR: Language, Reset, Theme, and Execution Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-sm gap-2">
        <div className="flex items-center space-x-3">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>

          {/* Reset Template */}
          <button
            onClick={handleResetCode}
            title="Reset code to starter template"
            className="flex items-center space-x-1 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Template</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Toggle Editor Theme"
          >
            {theme === 'vs-dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Run Code Button */}
          <Button
            size="sm"
            onClick={handleRunCode}
            loading={isRunning}
            disabled={isSubmitting}
            className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 font-mono text-xs shadow-sm font-semibold gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Sample Cases
          </Button>

          {/* Submit Solution Button */}
          <Button
            size="sm"
            onClick={handleSubmitCode}
            loading={isSubmitting}
            disabled={isRunning}
            className="bg-teal-600 hover:bg-teal-700 text-white font-mono text-xs shadow-sm font-semibold gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Solution
          </Button>
        </div>
      </div>

      {/* 4. VISUALLY DISTINGUISHED STRUCTURE & MONACO CANVAS */}
      <div className="flex flex-col flex-1 min-h-[360px] relative bg-slate-900">
        {/* System-Generated Non-Editable Structure Badge */}
        <div className="px-4 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400/90 font-semibold uppercase tracking-wider text-[10px]">
              System Generated / Non-Editable Structure
            </span>
          </div>
          <span className="text-slate-500 text-[10px]">
            Input parsing & test-case invocation handled automatically
          </span>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            theme={theme}
            value={code}
            onChange={handleEditorChange}
            options={{
              fontSize: 13,
              fontFamily: '"JetBrains Mono", Consolas, "Fira Code", monospace',
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              lineNumbers: 'on',
              folding: true,
              tabSize: language === 'python' ? 4 : 2,
              smoothScrolling: true,
            }}
          />
        </div>

        {/* Footer demarcation indicating editable candidate boundary */}
        <div className="px-4 py-1 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>&uarr; Editable Candidate Solution Area</span>
          <span>{language.toUpperCase()} &bull; Monaco Engine</span>
        </div>
      </div>

      {/* 5. TEST CASES / EXECUTION RESULTS CONSOLE */}
      <div className="bg-slate-950 border-t border-slate-800 flex flex-col max-h-72">
        {/* Console Header Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800 text-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveConsoleTab('testcases')}
              className={`flex items-center space-x-1.5 pb-1 border-b-2 font-medium transition-colors ${
                activeConsoleTab === 'testcases'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Test Cases</span>
              {executionResult && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    executionResult.allPassed
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {executionResult.passedCases} / {executionResult.totalCases}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveConsoleTab('stdout')}
              className={`flex items-center space-x-1.5 pb-1 border-b-2 font-medium transition-colors ${
                activeConsoleTab === 'stdout'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Console & Output</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono">
            {executionResult?.marksAwarded !== undefined && (
              <span className="text-emerald-400 font-bold">
                Score: {executionResult.marksAwarded} / {executionResult.totalQuestionMarks || question?.marks || 25} Marks
              </span>
            )}
            {executionResult?.runtimeMs !== undefined && (
              <span className="text-slate-400">
                Runtime: <strong className="text-slate-200">{executionResult.runtimeMs}ms</strong>
              </span>
            )}
          </div>
        </div>

        {/* Console Content Area */}
        <div className="p-4 overflow-y-auto text-xs font-mono">
          {!executionResult && !isRunning && !isSubmitting && (
            <div className="text-slate-500 py-4 text-center space-y-1">
              <p>Click &ldquo;Run Sample Cases&rdquo; to test your functional solution, or &ldquo;Submit Solution&rdquo; to evaluate against all test cases.</p>
              <p className="text-[11px] text-slate-600">
                Driver code and hidden test case evaluation are executed server-side.
              </p>
            </div>
          )}

          {(isRunning || isSubmitting) && (
            <div className="flex items-center justify-center space-x-2 py-6 text-slate-400">
              <svg className="animate-spin h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>
                {isSubmitting
                  ? 'Assembling driver harness and executing full test suite...'
                  : 'Compiling functional code with background harness...'}
              </span>
            </div>
          )}

          {/* Test Case Results View */}
          {executionResult && activeConsoleTab === 'testcases' && (
            <div className="space-y-3">
              {/* Submission Score Summary Banner */}
              {executionResult.isSubmissionRun && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    executionResult.allPassed
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-800 text-amber-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {executionResult.allPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-white">
                        {executionResult.allPassed
                          ? 'All Test Cases Passed Successfully!'
                          : `${executionResult.passedCases} of ${executionResult.totalCases} Test Cases Passed`}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {executionResult.message || 'Solution evaluated and recorded into examination attempt.'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={executionResult.allPassed ? 'success' : 'accent'}>
                    +{executionResult.marksAwarded || 0} Marks
                  </Badge>
                </div>
              )}

              {/* Case Tabs Selector */}
              {executionResult.results?.length > 0 && (
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
                  {executionResult.results.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTestCaseTab(idx)}
                      className={`px-2.5 py-1 rounded text-xs font-mono flex items-center space-x-1.5 transition-colors ${
                        activeTestCaseTab === idx
                          ? 'bg-slate-800 text-white font-bold'
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          r.passed ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span>Case {idx + 1}</span>
                      {r.isHidden && (
                        <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">
                          Hidden
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Active Test Case Detail */}
              {executionResult.results?.[activeTestCaseTab] && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    executionResult.results[activeTestCaseTab].passed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {executionResult.results[activeTestCaseTab].passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-200">
                        Test Case {activeTestCaseTab + 1}:{' '}
                        {executionResult.results[activeTestCaseTab].passed ? 'Passed' : 'Failed'}
                      </span>
                      {executionResult.results[activeTestCaseTab].isHidden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                          Hidden Examination Case
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {executionResult.results[activeTestCaseTab].executionTimeMs || 0} ms
                    </span>
                  </div>

                  {executionResult.results[activeTestCaseTab].isHidden ? (
                    <div className="p-3 bg-slate-900/90 rounded border border-slate-800 text-slate-400 text-[11px] space-y-1">
                      <p className="font-semibold text-slate-300">
                        Hidden Test Case Content Concealed
                      </p>
                      <p>
                        Input values and expected outputs for this case are protected server-side to maintain examination integrity.
                      </p>
                      <p className="text-slate-500">
                        Result:{' '}
                        <strong
                          className={
                            executionResult.results[activeTestCaseTab].passed
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }
                        >
                          {executionResult.results[activeTestCaseTab].passed
                            ? 'Passed'
                            : 'Failed / Mismatched Output'}
                        </strong>
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Input:</span>
                        <div className="bg-slate-900 p-2 rounded text-slate-300 overflow-x-auto">
                          {executionResult.results[activeTestCaseTab].input}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Expected Output:</span>
                        <div className="bg-slate-900 p-2 rounded text-slate-300 overflow-x-auto">
                          {executionResult.results[activeTestCaseTab].expectedOutput}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block mb-0.5">Actual Functional Output:</span>
                        <div
                          className={`p-2 rounded overflow-x-auto ${
                            executionResult.results[activeTestCaseTab].passed
                              ? 'bg-slate-900 text-emerald-400'
                              : 'bg-rose-950/40 text-rose-300'
                          }`}
                        >
                          {executionResult.results[activeTestCaseTab].actualOutput ||
                            executionResult.results[activeTestCaseTab].error ||
                            '(Empty Output)'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Console / Stdout View */}
          {executionResult && activeConsoleTab === 'stdout' && (
            <div className="space-y-2">
              {executionResult.compilationError && (
                <div className="bg-rose-950/40 p-3 rounded-lg border border-rose-800 text-rose-200 whitespace-pre-wrap font-mono text-xs">
                  <div className="font-bold text-rose-300 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Compilation / Diagnostics:
                  </div>
                  {executionResult.compilationError}
                </div>
              )}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap">
                {executionResult.stdout || 'Program completed with empty stdout stream.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
