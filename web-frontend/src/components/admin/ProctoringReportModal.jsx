import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Camera,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Layers,
  FileText,
  X,
  CreditCard,
  School,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { examSphereApi } from '../../services/api';

export function ProctoringReportModal({ submissionId, isOpen = true, onClose, onStatusUpdated }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!submissionId || !isOpen) return;

    async function loadReport() {
      setLoading(true);
      try {
        const res = await examSphereApi.proctor.getReport(submissionId);
        setReport(res.data);
      } catch (err) {
        console.warn('Failed to load proctor report:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [submissionId, isOpen]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await examSphereApi.admin.updateViolationStatus(submissionId, newStatus);
      if (onStatusUpdated) onStatusUpdated(submissionId, newStatus);
      setReport((prev) =>
        prev
          ? {
              ...prev,
              submission: { ...prev.submission, status: newStatus, isFlagged: newStatus === 'flagged-for-review' },
            }
          : prev
      );
    } catch (err) {
      alert(err.message || 'Failed to update submission status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-white">
                Supervised Proctoring Audit Report
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Session ID: {submissionId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Aggregating visual audit logs & filmstrip...</p>
            </div>
          ) : !report ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No audit report found for this session ID.
            </div>
          ) : (
            <>
              {/* Candidate & Assessment Overview Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Candidate Credentials</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{report.submission?.candidateName}</span>
                  <span className="text-slate-500 font-mono text-[11px] truncate block">{report.submission?.candidateEmail}</span>
                  {(report.submission?.collegeId || report.submission?.candidateDetails?.collegeId) && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mt-1">
                      <CreditCard className="w-3 h-3 text-indigo-500" />
                      ID: {report.submission?.collegeId || report.submission?.candidateDetails?.collegeId}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Assessment & Institution</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{report.submission?.examTitle}</span>
                  <span className="text-slate-500 text-[11px] block">
                    Score: <strong>{report.submission?.score}</strong> / {report.submission?.totalMarks}
                  </span>
                  {(report.submission?.collegeName || report.submission?.candidateDetails?.collegeName) && (
                    <span className="text-slate-500 text-[10px] block mt-0.5 truncate flex items-center gap-1">
                      <School className="w-3 h-3 text-slate-400 shrink-0" />
                      {report.submission?.collegeName || report.submission?.candidateDetails?.collegeName}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Session Integrity</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={report.submission?.violationCount > 0 ? 'warning' : 'accent'}>
                      {report.submission?.violationCount || 0} Incident Flags
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">Review Status</span>
                  <div className="mt-1">
                    <Badge variant={report.submission?.isFlagged ? 'destructive' : 'accent'}>
                      {report.submission?.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Identity Verification Section: College ID & Live Webcam Comparison */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Candidate Identity & College ID Verification Gate</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: College ID Card Photo */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                    <div className="w-28 h-20 rounded-lg bg-slate-900 overflow-hidden border border-slate-300 shrink-0">
                      {report.submission?.collegeIdPhotoUrl || report.submission?.candidateDetails?.collegeIdPhotoUrl ? (
                        <img
                          src={report.submission.collegeIdPhotoUrl || report.submission.candidateDetails.collegeIdPhotoUrl}
                          alt="College ID Card"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                          onClick={() => setSelectedPhoto(report.submission.collegeIdPhotoUrl || report.submission.candidateDetails.collegeIdPhotoUrl)}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-400 text-center p-2">
                          <CreditCard className="w-5 h-5 text-slate-500 mb-1" />
                          <span>No College ID photo</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        <span>College ID Card</span>
                      </div>
                      <p className="text-slate-500 text-[11px] font-mono">
                        Roll: {report.submission?.collegeId || report.submission?.candidateDetails?.collegeId || 'N/A'}
                      </p>
                      <p className="text-slate-400 text-[10px] truncate">
                        {report.submission?.collegeName || report.submission?.candidateDetails?.collegeName || 'Institutional verification'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Live Pre-Exam Webcam Face Capture */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20 flex items-center gap-3">
                    <div className="w-28 h-20 rounded-lg bg-slate-900 overflow-hidden border border-emerald-300 shrink-0">
                      {report.submission?.verificationSnapshotUrl || report.submission?.facePhotoUrl ? (
                        <img
                          src={report.submission.verificationSnapshotUrl || report.submission.facePhotoUrl}
                          alt="Live Face Verification"
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transform -scale-x-100"
                          onClick={() => setSelectedPhoto(report.submission.verificationSnapshotUrl || report.submission.facePhotoUrl)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 text-center p-2">
                          No face snapshot
                        </div>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900">Live Webcam Biometrics</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          ✓ VERIFIED
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        Webcam shutter verified open with face detected.
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Verified at: {report.submission?.verifiedAt ? new Date(report.submission.verifiedAt).toLocaleTimeString() : 'Pre-exam'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Continuous Session Filmstrip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>Continuous Monitoring Filmstrip ({report.filmstrip?.length || 0} periodic frames)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Captured every 30-45s</span>
                </div>

                {report.filmstrip && report.filmstrip.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {report.filmstrip.map((frame, idx) => (
                      <div
                        key={frame.id || idx}
                        onClick={() => setSelectedPhoto(frame.snapshotUrl)}
                        className="group relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-300 cursor-pointer hover:border-indigo-500 transition-colors shadow-2xs"
                      >
                        <img
                          src={frame.snapshotUrl}
                          alt={`Frame #${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 text-[9px] font-mono text-white bg-black/70 px-1 rounded">
                          {new Date(frame.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No periodic filmstrip frames recorded yet for this session.
                  </div>
                )}
              </div>

              {/* Violation Incidents Timeline */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Security Incident Timeline ({report.violations?.length || 0})</span>
                </h4>

                {report.violations && report.violations.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden text-xs">
                    {report.violations.map((v, i) => (
                      <div key={v.id || i} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge
                            variant={
                              v.severity === 'high'
                                ? 'destructive'
                                : v.severity === 'medium'
                                ? 'warning'
                                : 'secondary'
                            }
                          >
                            {v.type}
                          </Badge>
                          <span className="text-slate-700 font-medium">{v.type?.replace(/-/g, ' ').toUpperCase()}</span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </span>
                          {v.snapshotUrl && (
                            <button
                              onClick={() => setSelectedPhoto(v.snapshotUrl)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                            >
                              View Snapshot
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Clean Session: No anti-cheat incidents or security violations recorded.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer / Review Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-500">
            Audit logs and webcam snapshots are stored on local storage in compliance with institutional policies.
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('graded')}
              className="text-xs"
            >
              Clear / Dismiss Flags
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={updatingStatus}
              onClick={() => handleUpdateStatus('flagged-for-review')}
              className="text-xs"
            >
              Confirm Security Flag
            </Button>
            <Button variant="primary" size="sm" onClick={onClose} className="text-xs">
              Done
            </Button>
          </div>
        </div>

        {/* Full Image Preview Lightbox */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          >
            <div className="max-w-2xl max-h-[85vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl p-2 relative">
              <img src={selectedPhoto} alt="Snapshot Enlarged" className="max-w-full max-h-[80vh] object-contain" />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/70 text-white rounded-full p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
