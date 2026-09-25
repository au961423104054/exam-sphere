import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Building2,
  Users,
  Layers,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { examSphereApi } from '../../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [violations, setViolations] = useState([]);
  const [activeTab, setActiveTab] = useState('violations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolation, setSelectedViolation] = useState(null);

  // Authenticate role
  useEffect(() => {
    const user = examSphereApi.auth.getCurrentUser();
    if (!user || user.role !== 'admin') {
      // Auto-assign admin if testing, or redirect
      examSphereApi.auth.login('admin@examsphere.edu', 'admin123');
    }
  }, [navigate]);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      const [metricsRes, orgsRes, usersRes, examsRes, violationsRes] = await Promise.all([
        examSphereApi.admin.getOverviewMetrics(),
        examSphereApi.admin.getOrganizations(),
        examSphereApi.admin.getUsers(),
        examSphereApi.exams.list(),
        examSphereApi.admin.getViolations(),
      ]);

      setMetrics(metricsRes.data);
      setOrganizations(orgsRes.data || []);
      setUsers(usersRes.data || []);
      setExams(examsRes.data || []);
      setViolations(violationsRes.data || []);
      setLoading(false);
    }
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    await examSphereApi.admin.updateUserRole(userId, newRole);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleDismissViolation = (violationId) => {
    setViolations((prev) =>
      prev.map((v) => (v.id === violationId ? { ...v, status: 'Dismissed' } : v))
    );
    setSelectedViolation(null);
  };

  const handleConfirmViolation = (violationId) => {
    setViolations((prev) =>
      prev.map((v) => (v.id === violationId ? { ...v, status: 'Confirmed Cheating' } : v))
    );
    setSelectedViolation(null);
  };

  if (loading) {
    return (
      <DashboardLayout currentRole="admin">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout currentRole="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
                <Lock className="w-4 h-4" />
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                System Administration & Proctoring Hub
              </h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Supervise institution tenants, RBAC roles, live assessments, and proctoring integrity infractions.
            </p>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Managed Users
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  {metrics?.totalUsers || 1845}
                </span>
                <span className="text-xs text-blue-600 block mt-1 font-medium">
                  Active across 4 universities
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Partner Institutions
                </span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  {organizations.length}
                </span>
                <span className="text-xs text-purple-600 block mt-1 font-medium">
                  Multi-tenant enabled
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Supervised Exams
                </span>
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-slate-900">
                  {exams.length}
                </span>
                <span className="text-xs text-teal-600 block mt-1 font-medium">
                  With automated anti-cheat
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-card-hover transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Flagged Incidents
                </span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading text-3xl font-extrabold text-rose-600">
                  {violations.length}
                </span>
                <span className="text-xs text-rose-600 block mt-1 font-medium">
                  Tab-switch, screenshot, blur
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Navigation Tabs */}
        <Card>
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-100 flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="violations" className="gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Flagged Violations ({violations.length})</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>User Directory & RBAC ({users.length})</span>
                </TabsTrigger>
                <TabsTrigger value="orgs" className="gap-2">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Institutions ({organizations.length})</span>
                </TabsTrigger>
                <TabsTrigger value="exams" className="gap-2">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>All Exams ({exams.length})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            {/* TAB 1: FLAGGED VIOLATIONS */}
            {activeTab === 'violations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Showing real-time automated proctoring flags captured by client-side integrity hooks and socket events.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Candidate</th>
                        <th className="px-4 py-3">Exam Session</th>
                        <th className="px-4 py-3">Violation Event</th>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Severity</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-xs">
                      {violations.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {v.candidateName}
                            <span className="block font-mono text-[10px] text-slate-400 font-normal">
                              {v.candidateEmail}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                            {v.examTitle}
                          </td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-800">
                            {v.violationType}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            {v.timestamp}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                v.severity === 'High'
                                  ? 'destructive'
                                  : v.severity === 'Medium'
                                  ? 'warning'
                                  : 'secondary'
                              }
                            >
                              {v.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[11px]">
                            <span
                              className={`px-2 py-0.5 rounded-full ${
                                v.status.includes('Confirmed')
                                  ? 'bg-rose-100 text-rose-800'
                                  : v.status.includes('Dismissed')
                                  ? 'bg-slate-100 text-slate-600'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedViolation(v)}
                              className="text-xs h-7 px-2.5"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: USER DIRECTORY & RBAC */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <Input
                      placeholder="Search users or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    Showing {filteredUsers.length} user accounts
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Institution</th>
                        <th className="px-4 py-3">Current Role (RBAC)</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Role Elevation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans text-xs">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">{u.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{u.organization}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                u.role === 'admin'
                                  ? 'destructive'
                                  : u.role === 'teacher'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {u.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">{u.status}</td>
                          <td className="px-4 py-3 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-mono focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="student">student</option>
                              <option value="teacher">teacher</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: ORGANIZATIONS */}
            {activeTab === 'orgs' && (
              <div className="grid gap-4 sm:grid-cols-2">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-heading font-semibold text-base text-slate-900">
                          {org.name}
                        </h4>
                      </div>
                      <Badge variant="accent">{org.plan}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Total Users:</span>
                        <strong className="text-slate-800 text-sm">{org.totalUsers}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Active Assessments:</span>
                        <strong className="text-slate-800 text-sm">{org.activeExams}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>Domain: <code className="font-mono text-indigo-600">{org.domain}</code></span>
                      <span className="text-emerald-600 font-semibold">{org.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 4: ALL EXAMS */}
            {activeTab === 'exams' && (
              <div className="space-y-3">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-heading font-semibold text-sm text-slate-900">{exam.title}</span>
                        <Badge variant="default">{exam.category}</Badge>
                        {exam.proctoringEnabled && (
                          <Badge variant="warning">Proctored</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Instructor: {exam.instructor} &bull; {exam.durationMinutes} Minutes &bull; {exam.totalMarks} Total Marks
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/exam/${exam.id}`)}>
                      Audit Exam Flow
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* VIOLATION INSPECTION MODAL */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-rose-700">Integrity Violation Detail</DialogTitle>
              <span className="text-xs text-slate-500 font-mono">
                Incident ID: {selectedViolation?.id}
              </span>
            </div>
          </div>
          <DialogDescription className="space-y-4 pt-2">
            <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700">
              <div><strong>Candidate:</strong> {selectedViolation?.candidateName} ({selectedViolation?.candidateEmail})</div>
              <div><strong>Assessment:</strong> {selectedViolation?.examTitle}</div>
              <div><strong>Violation Type:</strong> {selectedViolation?.violationType}</div>
              <div><strong>Recorded At:</strong> {selectedViolation?.timestamp}</div>
              <div><strong>Severity:</strong> {selectedViolation?.severity}</div>
              <div><strong>System Log:</strong> {selectedViolation?.details}</div>
            </div>

            {selectedViolation?.snapshotUrl && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 uppercase">Automated Snapshot Capture:</span>
                <img
                  src={selectedViolation.snapshotUrl}
                  alt="Candidate webcam snapshot"
                  className="w-full h-44 object-cover rounded-lg border border-slate-200"
                />
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => handleDismissViolation(selectedViolation?.id)}
          >
            Dismiss Incident
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleConfirmViolation(selectedViolation?.id)}
          >
            Confirm Infraction
          </Button>
        </DialogFooter>
      </Dialog>
    </DashboardLayout>
  );
}
