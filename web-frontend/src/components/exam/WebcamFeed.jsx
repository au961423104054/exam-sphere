import React, { useState } from 'react';
import { Camera, CameraOff, AlertCircle, RefreshCw, Eye, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';

export function WebcamFeed({ proctor }) {
  const [collapsed, setCollapsed] = useState(false);
  const {
    videoRef,
    permissionStatus,
    errorMessage,
    snapshotCount,
    lastSnapshotTime,
    isShutterClosed,
    startCamera,
    triggerManualSnapshot,
    intervalSeconds,
  } = proctor;

  const isFeedActive = permissionStatus === 'granted' && !isShutterClosed;

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 w-72 bg-slate-900 border rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ${
        isShutterClosed
          ? 'border-rose-500 shadow-rose-950/40 ring-2 ring-rose-500/50'
          : 'border-slate-700/80 shadow-2xl'
      }`}
    >
      {/* Feed Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/90 border-b border-slate-800 text-xs text-slate-200 font-mono">
        <div className="flex items-center space-x-1.5">
          {isFeedActive ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
          <span
            className={`font-semibold ${
              isShutterClosed ? 'text-rose-400 font-bold' : 'text-slate-300'
            }`}
          >
            {isShutterClosed ? 'SHUTTER CLOSED' : 'Proctor Cam'}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            {intervalSeconds}s Frame
          </span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:text-white text-slate-400 transition-colors"
            title={collapsed ? 'Expand feed' : 'Collapse feed'}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      {!collapsed && (
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {/* Live Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${
              permissionStatus === 'granted' ? 'block' : 'hidden'
            }`}
          />

          {/* Shutter Closed / Covered Overlay */}
          {permissionStatus === 'granted' && isShutterClosed && (
            <div className="absolute inset-0 bg-rose-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10 animate-in fade-in">
              <CameraOff className="w-6 h-6 text-rose-400 mb-1 animate-pulse" />
              <span className="text-[11px] font-bold text-white">Camera Shutter Closed</span>
              <span className="text-[9px] text-rose-200 mt-0.5">
                Open webcam physical slider
              </span>
            </div>
          )}

          {/* Fallback & Permission Pending Overlay */}
          {permissionStatus !== 'granted' && (
            <div className="p-4 text-center space-y-2">
              <CameraOff className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-[11px] text-slate-300">
                {errorMessage || 'Camera access required for official proctoring integrity.'}
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={startCamera}
                className="text-[11px] h-7 px-2.5 mx-auto gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Grant Permission</span>
              </Button>
            </div>
          )}

          {/* Privacy Overlay Pill */}
          {isFeedActive && (
            <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono">
              <Eye className="w-3 h-3" />
              <span>LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Snapshots: <strong className="text-slate-200">{snapshotCount}</strong></span>
        {lastSnapshotTime && (
          <span className="text-[10px] text-slate-500">Last: {lastSnapshotTime}</span>
        )}
      </div>
    </div>
  );
}
