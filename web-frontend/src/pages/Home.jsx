import React from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight,
  Terminal,
  Sparkles,
  Lock,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const primaryFeatures = [
  {
    title: 'Monaco Code Editor & Runner',
    desc: 'Integrated VS Code Monaco editor with language switcher (JS, Python, Java, C++), real-time test case runner, stdout logs, and execution benchmarking.',
    icon: Code2,
    badge: 'Coding Questions',
    to: '/exam/exam-cs101',
    badgeVariant: 'accent',
  },
  {
    title: 'Anti-Cheat Proctoring Engine',
    desc: 'Client-side exam integrity tracking: enforced fullscreen, tab switch detection, clipboard blocking, and PrintScreen screenshot deterrence blur.',
    icon: ShieldAlert,
    badge: 'Proctoring Active',
    to: '/exam/exam-cs101',
    badgeVariant: 'warning',
  },
  {
    title: 'Teacher Assessment Studio',
    desc: 'Create programming problems, starter code boilerplate, automated test suites (inputs/expected outputs/hidden tests), and resource limits.',
    icon: LayoutDashboard,
    badge: 'Educator Flow',
    to: '/teacher/dashboard',
    badgeVariant: 'default',
  },
  {
    title: 'Supervised Admin Console',
    desc: 'Role-gated security panel with platform-wide user management, searchable user RBAC elevation, and flagged violation review logs.',
    icon: ShieldCheck,
    badge: 'Role Gated',
    to: '/admin/dashboard',
    badgeVariant: 'destructive',
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Commercial-Grade Proctoring &bull; Identity Verification &bull; Code Runner</span>
        </div>

        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
          Exam<span className="text-indigo-600">Sphere</span> Enterprise Assessment
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          Full-featured MERN exam portal featuring algorithmic coding challenges, automated biometric identity & system checks, continuous monitoring filmstrips, and role-based administration.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/login">
            <Button size="lg" variant="primary" className="gap-2 shadow-md font-semibold">
              <Lock className="w-4 h-4" />
              <span>Sign In to Portal</span>
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" variant="outline" className="gap-2 font-semibold">
              <ArrowRight className="w-4 h-4 text-indigo-600" />
              <span>Create Candidate Account</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Design System & Token Showcase Bar */}
      <Card className="border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-white to-teal-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase text-indigo-700 tracking-wider">
                Cohesive Design System Active
              </span>
              <h3 className="font-heading font-bold text-lg text-slate-900 mt-0.5">
                Plus Jakarta Sans &bull; Inter &bull; JetBrains Mono
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Documented in <code className="font-mono text-indigo-600 font-semibold">/shared/design-system.md</code> for Web & Mobile App parity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>Primary (#4F46E5)</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-teal-600 text-white text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>Accent (#0D9488)</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-slate-800 text-white text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>Slate Scale</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Capabilities Grid */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-2xl text-slate-900">
          Core Engine Modules
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {primaryFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card key={feat.title} className="hover:shadow-card-hover hover:border-indigo-300 transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant={feat.badgeVariant}>{feat.badge}</Badge>
                  </div>
                  <CardTitle>{feat.title}</CardTitle>
                  <CardDescription>{feat.desc}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to={feat.to}>
                    <Button size="sm" variant="outline" className="w-full justify-between group">
                      <span>Explore Component</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
