import React, { useState } from 'react';
import { Plus, Trash2, Code2, Clock, Cpu, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export function TeacherCodingQuestionBuilder({ onSaveQuestion, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [marks, setMarks] = useState(25);
  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(128);
  const [defaultLanguage, setDefaultLanguage] = useState('javascript');
  const [starterCode, setStarterCode] = useState(
    `/**\n * @param {string} s\n * @return {number}\n */\nfunction solution(s) {\n  // Write your code here\n  return 0;\n}`
  );

  const [testCases, setTestCases] = useState([
    { id: 'tc-1', input: 's = "abcabcbb"', expectedOutput: '3', isHidden: false },
    { id: 'tc-2', input: 's = "bbbbb"', expectedOutput: '1', isHidden: false },
    { id: 'tc-3', input: 's = "pwwkew"', expectedOutput: '3', isHidden: true },
  ]);

  const [isSaved, setIsSaved] = useState(false);

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

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const questionPayload = {
      id: `q-${Date.now()}`,
      type: 'coding',
      title,
      description,
      difficulty,
      marks: Number(marks),
      timeLimitSeconds: Number(timeLimit),
      memoryLimitMb: Number(memoryLimit),
      defaultLanguage,
      starterTemplates: {
        [defaultLanguage]: starterCode,
      },
      testCases,
    };

    if (onSaveQuestion) {
      onSaveQuestion(questionPayload);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Create Coding Question</CardTitle>
              <CardDescription>
                Define algorithmic problems, starter boilerplate, automated test suites, and hardware limits.
              </CardDescription>
            </div>
          </div>
          <Badge variant="accent">Monaco Powered</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          {/* Title and Difficulty */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700">Problem Title</label>
              <Input
                placeholder="e.g. Longest Substring Without Repeating Characters"
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
                <option value="Easy">Easy (Green)</option>
                <option value="Medium">Medium (Amber)</option>
                <option value="Hard">Hard (Rose)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-700">
              Problem Description & Constraints
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the challenge, provide example inputs/outputs, and list algorithmic constraints..."
              className="w-full p-3 border border-slate-300 rounded-lg text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Resource Constraints & Marks */}
          <div className="grid gap-4 sm:grid-cols-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-700 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Question Marks
              </label>
              <Input
                type="number"
                min="5"
                max="100"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>
          </div>

          {/* Starter Template Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-slate-700">Starter Code Template</label>
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
                <p className="text-xs text-slate-500">Provide input/output pairs. Hidden test cases evaluate submissions without student visibility.</p>
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
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Input</label>
                    <Input
                      placeholder='nums = [2,7,11,15], target = 9'
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(tc.id, 'input', e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">Expected Output</label>
                    <Input
                      placeholder='[0, 1]'
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

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" className="gap-2">
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Saved to Assessment!
                </>
              ) : (
                'Save Coding Question'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
