import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto mt-20 text-center px-4">
      <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</h2>
      <p className="text-gray-500 mt-2 text-sm">
        The route you are looking for does not exist in this ExamSphere view.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-md shadow"
        >
          Return to Hub
        </Link>
      </div>
    </div>
  );
}
