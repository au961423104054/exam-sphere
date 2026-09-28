import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { examSphereApi } from '../../services/api';

/**
 * ProtectedRoute Component
 *
 * Enforces institutional authentication and strict role-based access control:
 * 1. If not signed in (no authenticated user or JWT token), redirects to /login
 *    (or /admin/login for administrative routes).
 * 2. If authenticated but user's role is not permitted, redirects to their
 *    respective role's authorized dashboard.
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const location = useLocation();
  const currentUser = examSphereApi.auth.getCurrentUser();
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');

  // 1. User is not signed in
  if (!currentUser || !token) {
    if (allowedRoles.length === 1 && allowedRoles.includes('admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role-based access validation
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (currentUser.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}
