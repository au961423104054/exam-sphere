import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Building2,
  Users,
  AlertOctagon,
  LogOut,
  Bell,
  Menu,
  X,
  FileCode,
  CheckCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { examSphereApi } from '../services/api';

export function DashboardLayout({ children, currentRole = 'student' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Active user data
  const user = examSphereApi.auth.getCurrentUser() || {
    name: currentRole === 'admin' ? 'Sarah Connor' : currentRole === 'teacher' ? 'Prof. Alan Turing' : 'Alex Rivera',
    email: `${currentRole}@examsphere.edu`,
    role: currentRole,
    organization: 'MIT Department of EECS',
  };

  const handleRoleSwitch = (newRole) => {
    examSphereApi.auth.login(`${newRole}@examsphere.edu`, 'password');
    if (newRole === 'admin') navigate('/admin/dashboard');
    else if (newRole === 'teacher') navigate('/teacher/dashboard');
    else navigate('/student/dashboard');
  };

  const handleLogout = () => {
    examSphereApi.auth.logout();
    navigate('/login');
  };

  // Role-specific navigation links
  const studentLinks = [
    { to: '/student/dashboard', label: 'My Assessments', icon: BookOpen },
    { to: '/exam/exam-cs101', label: 'Take CS101 Exam', icon: FileCode, badge: 'Proctored' },
    { to: '/login', label: 'Candidate Login', icon: Users },
  ];

  const teacherLinks = [
    { to: '/teacher/dashboard', label: 'Exam Authoring', icon: LayoutDashboard },
    { to: '/exam/exam-cs101', label: 'Preview Exam Flow', icon: FileCode },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Console', icon: ShieldCheck },
    { to: '/admin/login', label: 'Admin Login Screen', icon: Users },
  ];

  const navLinks = currentRole === 'admin' ? adminLinks : currentRole === 'teacher' ? teacherLinks : studentLinks;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white font-heading">
            E
          </div>
          <span className="font-heading font-bold text-lg">ExamSphere</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:flex md:flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md font-heading font-extrabold text-white text-lg">
              E
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-white tracking-tight">
                Exam<span className="text-indigo-400">Sphere</span>
              </span>
              <span className="block text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Portal v1.2
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-heading">
              {currentRole.toUpperCase()} Navigation
            </div>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-400 font-semibold border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700/50 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Demo Switcher (Simulate Roles) */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 block mb-2 font-medium">Switch Active Role Demo:</span>
            <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
              <button
                onClick={() => handleRoleSwitch('student')}
                className={`py-1.5 rounded transition-colors ${
                  currentRole === 'student' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => handleRoleSwitch('teacher')}
                className={`py-1.5 rounded transition-colors ${
                  currentRole === 'teacher' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Teacher
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`py-1.5 rounded transition-colors ${
                  currentRole === 'admin' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* User Card in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <span className="inline-block text-[10px] text-slate-400 capitalize font-mono">
                {user.role} &bull; {user.organization.split(' ')[0]}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded-lg text-xs text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors border border-rose-900/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-subtle px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-indigo-600 transition-colors">ExamSphere</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="capitalize font-semibold text-slate-900">{currentRole} Portal</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Backend Connectivity Status Pill */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Contract API Ready</span>
            </div>

            {/* Notification Bell */}
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-150 rounded-lg transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full" />
            </button>

            {/* Active User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/"
                    className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Portal Home
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Viewport */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
