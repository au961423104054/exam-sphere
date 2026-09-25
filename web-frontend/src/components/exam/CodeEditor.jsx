import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle2, XCircle, RotateCcw, Terminal, Moon, Sun, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { examSphereApi } from '../../services/api';

const SUPPORTED_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript (Node.js)' },
  { id: 'python', label: 'Python 3.11' },
  { id: 'cpp', label: 'C++ (G++ 13)' },
  { id: 'java', label: 'Java (OpenJDK 17)' },
  { id: 'typescript', label: 'TypeScript 5.x' },
];

export function CodeEditor({
  question,
  submissionId = 'sub-demo-001',
  onCodeChange,
  initialCode,
}) {
  const defaultLang = question?.defaultLanguage || 'javascript';
  const [language, setLanguage] = useState(defaultLang);
  const [theme, setTheme] = useState('vs-dark');
  const [code, setCode] = useState(
    initialCode ||
      question?.starterTemplates?.[defaultLang] ||
      '// Write your solution here\n'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcases'); // 'testcases' | 'stdout'

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const starter = question?.starterTemplates?.[newLang] || `// Solution in ${newLang}\n`;
    setCode(starter);
    if (onCodeChange) onCodeChange(starter, newLang);
  };

  const handleResetCode = () => {
    const starter = question?.starterTemplates?.[language] || '// Write your solution here\n';
    setCode(starter);
    if (onCodeChange) onCodeChange(starter, language);
  };

  const handleEditorChange = (value) => {
    setCode(value);
    if (onCodeChange) onCodeChange(value, language);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setExecutionResult(null);
    try {
      const res = await examSphereApi.submissions.runCode(submissionId, {
        language,
        code,
        testCases: question?.testCases || [],
      });
      setExecutionResult(res.data);
    } catch (err) {
      setExecutionResult({
        allPassed: false,
        results: [],
        stdout: `Execution Failed: ${err.message}`,
        runtimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-sm gap-2">
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
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Toggle Editor Theme"
          >
            {theme === 'vs-dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Run Code Button */}
          <Button
            size="sm"
            onClick={handleRunCode}
            loading={isRunning}
            className="bg-teal-600 hover:bg-teal-700 text-white font-mono text-xs shadow-sm font-semibold"
          >
            <Play className="w-3.5 h-3.5 fill-current mr-1" />
            Run Code
          </Button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 min-h-[340px] relative">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          theme={theme}
          value={code}
          onChange={handleEditorChange}
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            folding: true,
            tabSize: 2,
            smoothScrolling: true,
          }}
        />
      </div>

      {/* Output / Test Cases Panel */}
      <div className="bg-slate-950 border-t border-slate-800 flex flex-col max-h-72">
        {/* Console Navigation Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-850 text-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveConsoleTab('testcases')}
              className={`flex items-center space-x-1.5 pb-1 border-b-2 font-medium transition-colors ${
                activeConsoleTab === 'testcases'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Test Results</span>
              {executionResult && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    executionResult.allPassed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
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
              <span>Standard Output</span>
            </button>
          </div>

          {executionResult?.runtimeMs !== undefined && (
            <span className="text-[11px] text-slate-400 font-mono">
              Runtime: <strong className="text-slate-200">{executionResult.runtimeMs}ms</strong>
            </span>
          )}
        </div>

        {/* Console Content Area */}
        <div className="p-4 overflow-y-auto text-xs font-mono">
          {!executionResult && !isRunning && (
            <div className="text-slate-500 py-4 text-center">
              Click &ldquo;Run Code&rdquo; above to execute your solution against test cases.
            </div>
          )}

          {isRunning && (
            <div className="flex items-center justify-center space-x-2 py-6 text-slate-400">
              <svg className="animate-spin h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Compiling and executing test cases...</span>
            </div>
          )}

          {executionResult && activeConsoleTab === 'testcases' && (
            <div className="space-y-3">
              {executionResult.results.map((result, idx) => (
                <div
                  key={result.testCaseId || idx}
                  className={`p-3 rounded-lg border text-xs ${
                    result.passed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {result.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-200">
                        Test Case {idx + 1}
                      </span>
                      {result.isHidden && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          Hidden
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {result.executionTimeMs} ms
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Input:</span>
                      <div className="bg-slate-900 p-1.5 rounded text-slate-300 overflow-x-auto">
                        {result.input}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Expected:</span>
                      <div className="bg-slate-900 p-1.5 rounded text-slate-300 overflow-x-auto">
                        {result.expectedOutput}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block mb-0.5">Actual Output:</span>
                      <div
                        className={`p-1.5 rounded overflow-x-auto ${
                          result.passed
                            ? 'bg-slate-900 text-emerald-400'
                            : 'bg-rose-950/40 text-rose-300'
                        }`}
                      >
                        {result.actualOutput}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {executionResult && activeConsoleTab === 'stdout' && (
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap">
              {executionResult.stdout || 'Process completed with empty stdout.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
