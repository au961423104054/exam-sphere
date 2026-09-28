import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  School,
  KeyRound,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { examSphereApi } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student'); // 'student' | 'teacher'
  const [email, setEmail] = useState('candidate@examsphere.io');
  const [password, setPassword] = useState('Password@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request code, 2 = reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Load remembered credentials on mount
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem('examsphere_remember_me');
      const savedEmail = localStorage.getItem('examsphere_saved_email');
      if (savedRemember === 'true' && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      } else if (savedRemember === 'false') {
        setRememberMe(false);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setLoading(true);

    try {
      // Persist or clear Remember Me
      if (rememberMe) {
        localStorage.setItem('examsphere_remember_me', 'true');
        localStorage.setItem('examsphere_saved_email', email);
      } else {
        localStorage.setItem('examsphere_remember_me', 'false');
        localStorage.removeItem('examsphere_saved_email');
      }

      const res = await examSphereApi.auth.login(email, password);
      const user = res.data?.user;
      if (user?.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    if (!rememberMe || !localStorage.getItem('examsphere_saved_email')) {
      if (selectedRole === 'student') {
        setEmail('candidate@examsphere.io');
        setPassword('Password@123');
      } else {
        setEmail('teacher@examsphere.edu');
        setPassword('teacher123');
      }
    }
    setError('');
  };

  // Open Forgot Password Modal
  const openForgotModal = () => {
    setForgotEmail(email || 'candidate@examsphere.io');
    setForgotStep(1);
    setForgotError('');
    setForgotSuccess('');
    setForgotToken('');
    setForgotCode('');
    setNewPassword('');
    setConfirmPassword('');
    setIsForgotOpen(true);
  };

  // Request Reset Token / Code
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await examSphereApi.auth.forgotPassword(forgotEmail);
      const data = res.data || {};
      if (data.resetToken) {
        setForgotToken(data.resetToken);
      }
      if (data.resetCode) {
        setForgotCode(data.resetCode);
      }
      setForgotSuccess(
        res.message || 'Verification reset code generated! Check your email or use the code below.'
      );
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Unable to process reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Submit New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please verify both fields.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await examSphereApi.auth.resetPassword({
        email: forgotEmail,
        token: forgotToken || forgotCode,
        newPassword,
      });

      setForgotSuccess(res.message || 'Password updated successfully!');
      // Update form password and email
      setPassword(newPassword);
      setEmail(forgotEmail);
      setStatusMessage('Password updated! You can now sign in with your new password.');

      // Auto close after brief delay
      setTimeout(() => {
        setIsForgotOpen(false);
      }, 1800);
    } catch (err) {
      setForgotError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-50 min-h-[calc(100vh-64px)]">
      {/* Ambient background glow (PlaceRise inspired) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-slate-900 tracking-tight">
            Sign In to Exam<span className="text-indigo-600">Sphere</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Secure institutional assessment & automated proctoring platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-6">
          {/* Institutional Role Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 font-heading mb-2">
              Select Your Portal Role
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleRoleSelect('student')}
                className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                  role === 'student'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${role === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block leading-snug">Candidate</span>
                  <span className="text-[11px] text-slate-500">Student Portal</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('teacher')}
                className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                  role === 'teacher'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className={`p-2 rounded-lg ${role === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block leading-snug">Educator</span>
                  <span className="text-[11px] text-slate-500">Teacher Studio</span>
                </div>
              </button>
            </div>
          </div>

          {/* Success / Status Notification */}
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 font-heading">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 font-heading">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 transition duration-150 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">
                  Remember me on this workstation
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full h-11 rounded-xl shadow-md font-semibold text-sm gap-2"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Institutional Admin Switch Notice */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Supervisor or Admin?</span>
            <Link
              to="/admin/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center space-y-2 text-xs text-slate-500">
          <div>
            Need an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2">
              Create an account
            </Link>
          </div>
          <div>
            <Link to="/" className="text-slate-400 hover:text-slate-600 transition-colors">
              &larr; Back to ExamSphere Home
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900">
                    Reset Account Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {forgotStep === 1 ? 'Step 1: Request reset verification' : 'Step 2: Set new password'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {forgotSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{forgotSuccess}</p>
                    {forgotCode && (
                      <p className="mt-1 text-[11px] font-mono text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded inline-block">
                        Code: {forgotCode}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {forgotError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter your registered institutional email address. We will generate a secure verification code to reset your account password.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 font-heading">
                      Account Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="candidate@examsphere.io"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2.5 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsForgotOpen(false)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={forgotLoading}
                      size="sm"
                      className="gap-1.5"
                    >
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 font-heading">
                      Verification Code / Token
                    </label>
                    <input
                      type="text"
                      value={forgotCode || forgotToken}
                      onChange={(e) => setForgotCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 font-heading">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 font-heading">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Request new code</span>
                    </button>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsForgotOpen(false)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        loading={forgotLoading}
                        size="sm"
                      >
                        Update Password
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

