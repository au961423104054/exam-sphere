import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Lock, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { examSphereApi } from '../../services/api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@examsphere.edu');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await examSphereApi.auth.login(email, password);
      const user = res.data?.user;

      if (!user || user.role !== 'admin') {
        setErrorMessage(
          'Access Denied: Administrative privileges required. Non-admin users must authenticate through the candidate or educator login.'
        );
        examSphereApi.auth.logout();
        setLoading(false);
        return;
      }

      navigate('/admin/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdmin = () => {
    setEmail('admin@examsphere.edu');
    setPassword('admin123');
    examSphereApi.auth.login('admin@examsphere.edu', 'admin123').then(() => {
      navigate('/admin/dashboard');
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-slate-100 font-sans">
      <div className="w-full max-w-md space-y-8">
        {/* Header Icon */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-indigo-700 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl border border-indigo-400/30 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl text-white tracking-tight">
            Security & Administration
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Restricted access portal for institution administrators and proctoring supervisors.
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
          <CardHeader className="border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                RBAC-Gated Access
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                Port 443 / TLS
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-heading">
                  Admin Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@examsphere.edu"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-heading">
                  Security Passkey
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-semibold shadow-lg"
              >
                <span>Authorize & Enter Console</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Quick Demo Login Button */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleDemoAdmin}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono transition-colors flex items-center justify-center space-x-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Instant Demo Login (Sarah Connor &bull; Admin)</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-300 transition-colors">
            &larr; Return to ExamSphere Portal Home
          </Link>
        </div>
      </div>
    </div>
  );
}
