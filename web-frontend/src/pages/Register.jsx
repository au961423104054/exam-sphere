import React from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-md border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create an Account</h2>
        <p className="text-sm text-gray-500 mt-1">
          Placeholder view for Route: <code className="text-indigo-600 font-mono">/register</code>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Jane Doe"
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Role
          </label>
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-400 text-sm"
          >
            <option>Student Candidate</option>
            <option>Educator / Teacher</option>
          </select>
        </div>
        <button
          type="button"
          disabled
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-md shadow opacity-75 cursor-not-allowed"
        >
          Create Account (Phase 1 Placeholder)
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
        <div>
          Already registered?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Sign In
          </Link>
        </div>
        <div>
          <Link to="/" className="text-gray-400 hover:text-gray-600 text-xs">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
