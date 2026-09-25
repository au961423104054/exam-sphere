import React from 'react';
import { Link } from 'react-router-dom';

const routes = [
  { path: '/login', label: 'Login', desc: 'Candidate & Educator authentication portal' },
  { path: '/register', label: 'Register', desc: 'New user sign up and organization join flow' },
  { path: '/student/dashboard', label: 'Student Dashboard', desc: 'Exam listings, active sessions, and report cards' },
  { path: '/teacher/dashboard', label: 'Teacher Dashboard', desc: 'Exam authoring, proctor controls, and student grading' },
  { path: '/admin/dashboard', label: 'Admin Dashboard', desc: 'Institution management, RBAC, and audit logs' },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-indigo-700 uppercase bg-indigo-100 rounded-full mb-3">
          Phase 1 Initialized
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          ExamSphere Portal
        </h1>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          Full-featured MERN Examination and Automated Proctoring Platform.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Tailwind CSS Verification</h2>
        <div className="flex flex-wrap gap-2">
          <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Tailwind Active
          </span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Vite React Fast Refresh
          </span>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            SPA Routing Ready
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className="group block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
                {route.label}
              </h3>
              <span className="text-gray-400 group-hover:text-indigo-600 font-mono text-xs">
                &rarr;
              </span>
            </div>
            <p className="text-sm text-gray-500">{route.desc}</p>
            <span className="mt-3 inline-block font-mono text-xs text-indigo-600">
              {route.path}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
