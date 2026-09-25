import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ExamRunner from './pages/ExamRunner';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();

  // If in active proctored exam view, omit default top navbar to preserve exam integrity/fullscreen
  const isExamView = location.pathname.startsWith('/exam/');

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/student/dashboard', label: 'Student Portal' },
    { to: '/teacher/dashboard', label: 'Teacher Studio' },
    { to: '/exam/exam-cs101', label: 'Exam Taking (Monaco + AntiCheat)' },
    { to: '/admin/dashboard', label: 'Admin Console' },
    { to: '/admin/login', label: 'Admin Login' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Global Navigation Bar (Hidden during full-screen exam-taking) */}
      {!isExamView && (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-subtle">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2.5">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white font-heading font-extrabold text-lg shadow-sm">
                E
              </span>
              <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
                Exam<span className="text-indigo-600">Sphere</span>
              </span>
            </Link>

            <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      )}

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/exam/:id" element={<ExamRunner />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Footer (Hidden in active exam runner) */}
      {!isExamView && (
        <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 font-sans">
          <p>
            ExamSphere &copy; {new Date().getFullYear()} &mdash; Modern Full-Featured MERN Examination & Automated Proctoring Platform.
          </p>
        </footer>
      )}
    </div>
  );
}
