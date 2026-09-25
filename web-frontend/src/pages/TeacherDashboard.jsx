import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { TeacherCodingQuestionBuilder } from '../components/teacher/TeacherCodingQuestionBuilder';
import { examSphereApi } from '../services/api';

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('exams');
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [createdQuestions, setCreatedQuestions] = useState([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await examSphereApi.exams.list();
      setExams(res.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveQuestion = (newQuestion) => {
    setCreatedQuestions((prev) => [newQuestion, ...prev]);
    // Switch to questions list view
    setShowQuestionBuilder(false);
    setActiveTab('questions');
  };

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
            <Link to="/exam/exam-cs101">
              <Button variant="primary" className="gap-2 shadow-sm font-semibold">
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
                  {3 + createdQuestions.length}
                </span>
                <span className="text-xs text-teal-600 block mt-1 font-medium">
                  Monaco execution enabled
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Proctoring Alerts
                </span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-amber-600">
                  3 Flagged
                </span>
                <span className="text-xs text-amber-600 block mt-1 font-medium">
                  Requires teacher audit
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Authoring & Management */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="exams">Course Assessments ({exams.length})</TabsTrigger>
              <TabsTrigger value="create-coding">Coding Question Studio</TabsTrigger>
              <TabsTrigger value="questions">Question Bank ({3 + createdQuestions.length})</TabsTrigger>
            </TabsList>

            {/* TAB 1: Assessments */}
            <TabsContent value="exams" className="space-y-4">
              <div className="grid gap-4">
                {exams.map((exam) => (
                  <Card key={exam.id} className="hover:border-indigo-300 transition-all">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{exam.category}</Badge>
                          <Badge variant={exam.status === 'Active' ? 'success' : 'secondary'}>
                            {exam.status}
                          </Badge>
                          {exam.codingQuestionsCount > 0 && (
                            <Badge variant="accent">
                              {exam.codingQuestionsCount} Coding Problem
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-heading font-semibold text-lg text-slate-900">
                          {exam.title}
                        </h3>
                        <p className="text-sm text-slate-500">{exam.description}</p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1">
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {exam.durationMinutes} min
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1" />
                            64 Submissions
                          </span>
                          <span className="flex items-center">
                            <BarChart3 className="w-3.5 h-3.5 mr-1" />
                            Avg: 78.5%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link to={`/exam/${exam.id}`}>
                          <Button size="sm" variant="outline">
                            Preview Flow
                          </Button>
                        </Link>
                        <Button size="sm" variant="primary">
                          Manage Exam
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: Coding Question Creator */}
            <TabsContent value="create-coding">
              <TeacherCodingQuestionBuilder onSaveQuestion={handleSaveQuestion} />
            </TabsContent>

            {/* TAB 3: Question Bank */}
            <TabsContent value="questions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Authored Programming Questions</CardTitle>
                  <CardDescription>
                    Monaco-compatible coding challenges ready to be added to exam templates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Default sample questions */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-heading font-semibold text-sm text-slate-900">Two Sum Problem</span>
                        <Badge variant="success">Easy</Badge>
                        <Badge variant="secondary">25 Marks</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Hash table & array lookup with 3 test cases</p>
                    </div>
                    <Button size="sm" variant="outline">Edit Suite</Button>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-heading font-semibold text-sm text-slate-900">Reverse Linked List</span>
                        <Badge variant="warning">Medium</Badge>
                        <Badge variant="secondary">25 Marks</Badge>
                      </div>
                      <p className="text-xs text-slate-500">Pointer reversal with 1 test case</p>
                    </div>
                    <Button size="sm" variant="outline">Edit Suite</Button>
                  </div>

                  {/* Dynamically created questions */}
                  {createdQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/30 flex items-center justify-between animate-in fade-in"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-heading font-semibold text-sm text-slate-900">{q.title}</span>
                          <Badge variant="default">{q.difficulty}</Badge>
                          <Badge variant="secondary">{q.marks} Marks</Badge>
                          <Badge variant="accent">New</Badge>
                        </div>
                        <p className="text-xs text-slate-500">{q.description.substring(0, 70)}...</p>
                      </div>
                      <Button size="sm" variant="outline">Edit Suite</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
