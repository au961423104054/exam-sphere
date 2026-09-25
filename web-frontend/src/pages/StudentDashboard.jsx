import React from 'react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
          <p className="text-sm text-gray-500">
            Route: <code className="text-indigo-600 font-mono">/student/dashboard</code>
          </p>
        </div>
        <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-800">
          &larr; Switch Route
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Upcoming Exams</h3>
          <p className="text-3xl font-extrabold text-gray-800 mt-2">0</p>
          <p className="text-xs text-gray-500 mt-1">No scheduled assessments</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Completed</h3>
          <p className="text-3xl font-extrabold text-gray-800 mt-2">0</p>
          <p className="text-xs text-gray-500 mt-1">View submitted records</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase">Average Score</h3>
          <p className="text-3xl font-extrabold text-gray-800 mt-2">--</p>
          <p className="text-xs text-gray-500 mt-1">Grade reports pending</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-dashed border-gray-300 text-center">
        <h4 className="text-base font-medium text-gray-700">Exam-Taking Flow Placeholder</h4>
        <p className="text-sm text-gray-500 mt-1">
          This dashboard view will list active assessments, proctored exam launch pads, and submission histories.
        </p>
      </div>
    </div>
  );
}
