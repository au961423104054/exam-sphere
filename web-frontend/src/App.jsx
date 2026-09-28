import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, ShieldCheck, User, LogIn, ChevronRight, LogOut } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ExamRunner from './pages/ExamRunner';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';
import { examSphereApi } from './services/api';

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If in active proctored exam view, omit default top navbar to preserve exam integrity/fullscreen
  const isExamView = location.pathname.startsWith('/exam/');
  const isDashboardView =
    location.pathname.startsWith('/student/') ||
    location.pathname.startsWith('/teacher/') ||
    location.pathname.startsWith('/admin/dashboard');

  const currentUser = examSphereApi.auth.getCurrentUser();

  // Role-aware navigation links
  const getNavLinks = () => {
    if (!currentUser) {
      return [{ to: '/', label: 'Overview' }];
    }
    if (currentUser.role === 'admin') {
      return [
        { to: '/', label: 'Overview' },
        { to: '/admin/dashboard', label: 'Admin Console' },
        { to: '/teacher/dashboard', label: 'Teacher Studio' },
      ];
    }
    if (currentUser.role === 'teacher') {
      return [
        { to: '/', label: 'Overview' },
        { to: '/teacher/dashboard', label: 'Teacher Studio' },
        { to: '/exam/exam-cs101', label: 'Preview Exam' },
      ];
    }
    // Default: student
    return [
      { to: '/', label: 'Overview' },
      { to: '/student/dashboard', label: 'My Assessments' },
      { to: '/exam/exam-cs101', label: 'Take Assessment' },
    ];
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    examSphereApi.auth.logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Global Navigation Bar (Hidden during full-screen exam-taking or when inside dashboard layout which has its own sidebar/header) */}
      {!isExamView && !isDashboardView && (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center text-white font-heading font-extrabold text-lg shadow-sm shadow-indigo-500/20 border border-indigo-400/20">
                E
              </span>
              <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
                Exam<span className="text-indigo-600">Sphere</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Auth Actions on Right */}
            <div className="hidden sm:flex items-center space-x-2.5">
              {currentUser ? (
                <div className="flex items-center space-x-2">
                  <Link
                    to={
                      currentUser.role === 'teacher'
                        ? '/teacher/dashboard'
                        : currentUser.role === 'admin'
                        ? '/admin/dashboard'
                        : '/student/dashboard'
                    }
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="capitalize">{currentUser.name || currentUser.role}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2 duration-150 shadow-lg">
              <nav className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 text-center rounded-lg border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Sign Out ({currentUser.name || currentUser.email})
                  </button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 text-center rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700"
                    >
                      Create Candidate Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Student Role-Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:id"
            element={
              <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
                <ExamRunner />
              </ProtectedRoute>
            }
          />

          {/* Teacher Role-Protected Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Role-Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Footer (Hidden in active exam runner and in dashboards that have their own footers) */}
      {!isExamView && !isDashboardView && (
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-sans">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span className="font-heading font-bold text-slate-900">ExamSphere</span>
              <span>&mdash; Modern Online Assessment & Automated Proctoring Platform.</span>
            </div>
            <div className="flex items-center space-x-4 text-slate-400">
              <Link to="/login" className="hover:text-slate-600">Candidate Login</Link>
              <Link to="/admin/login" className="hover:text-slate-600">Admin Console</Link>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
