import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Shield,
  ArrowRight,
  TrendingUp,
  FileQuestion,
  AlertCircle,
  Play,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { examSphereApi } from '../services/api';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    async function loadExams() {
      setLoading(true);
      const res = await examSphereApi.exams.list();
      setExams(res.data || []);
      setLoading(false);
    }
    loadExams();
  }, []);

  const upcomingExams = exams.filter((e) => e.status !== 'Completed');
  const completedExams = exams.filter((e) => e.status === 'Completed');

  if (loading) {
    return (
      <DashboardLayout currentRole="student">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentRole="student">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Student Assessment Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, Alex Rivera. Review your scheduled exams, launch proctored test sessions, and view grade reports.
            </p>
          </div>

          <Link to="/exam/exam-cs101">
            <Button variant="primary" className="gap-2 shadow-sm font-semibold">
              <Play className="w-4 h-4 fill-current" />
              Launch Active Exam (CS101)
            </Button>
          </Link>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Upcoming Assessments
                </span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  {upcomingExams.length}
                </span>
                <span className="text-xs text-indigo-600 block mt-1 font-medium">
                  1 requires automated proctoring
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Completed Exams
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  {completedExams.length + 3}
                </span>
                <span className="text-xs text-emerald-600 block mt-1 font-medium">
                  All certificates generated
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  GPA / Average Score
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  88.4%
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Top 10% in institution
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Integrity Standing
                </span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-emerald-600">
                  100%
                </span>
                <span className="text-xs text-emerald-600 block mt-1 font-medium">
                  Zero verified infractions
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Exam View */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Assessments</CardTitle>
                <CardDescription>
                  Track deadlines, proctoring requirements, and start official testing windows.
                </CardDescription>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="upcoming">
                    Upcoming ({upcomingExams.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed ({completedExams.length + 1})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent>
            {activeTab === 'upcoming' && (
              <div className="space-y-4">
                {upcomingExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-card-hover transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="default">{exam.category}</Badge>
                        {exam.proctoringEnabled && (
                          <Badge variant="warning" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Proctored (Anti-Cheat)
                          </Badge>
                        )}
                        {exam.codingQuestionsCount > 0 && (
                          <Badge variant="accent" className="gap-1">
                            <Code2 className="w-3 h-3" />
                            {exam.codingQuestionsCount} Coding Challenge{exam.codingQuestionsCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-heading font-semibold text-lg text-slate-900">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {exam.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-mono pt-1">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {exam.durationMinutes} Minutes
                        </span>
                        <span className="flex items-center">
                          <FileQuestion className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {exam.totalQuestions} Questions ({exam.totalMarks} Marks)
                        </span>
                        <span>Instructor: {exam.instructor}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {exam.status === 'Active' ? 'Active Window Open' : 'Scheduled'}
                      </span>
                      <Link to={`/exam/${exam.id}`}>
                        <Button size="sm" variant="primary" className="gap-1.5 shadow-sm">
                          <span>Enter Exam</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {upcomingExams.length === 0 && (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h4 className="font-heading font-semibold text-slate-700">No scheduled exams</h4>
                    <p className="text-xs text-slate-500 mt-1">You are all caught up for this term.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Biology</Badge>
                      <Badge variant="success">Passed</Badge>
                    </div>
                    <h4 className="font-heading font-semibold text-base text-slate-900">
                      BIO102: Molecular Genetics & Gene Expression
                    </h4>
                    <p className="text-xs text-slate-500">
                      Submitted Sep 20, 2026 &bull; Verified auto-evaluation completed
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 uppercase font-semibold block">Score</span>
                      <span className="font-heading font-bold text-xl text-emerald-600">46 / 50</span>
                    </div>
                    <Button size="sm" variant="outline">
                      View Report Card
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
