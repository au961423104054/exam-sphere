import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, ShieldCheck, Award } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <Award className="w-4 h-4 text-emerald-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in-75">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-heading font-bold text-sm text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 flex items-start space-x-3 transition-colors ${
                  n.read ? 'bg-white hover:bg-slate-50/60' : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                }`}
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h5
                      className={`text-xs font-semibold truncate ${
                        n.read ? 'text-slate-800' : 'text-slate-950 font-bold'
                      }`}
                    >
                      {n.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {n.timestamp}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-xs pt-1">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => {
                          markAsRead(n.id);
                          setOpen(false);
                        }}
                        className="text-indigo-600 hover:underline font-medium text-[11px]"
                      >
                        View Details &rarr;
                      </Link>
                    ) : (
                      <span />
                    )}

                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-slate-400 hover:text-indigo-600 text-[10px] flex items-center gap-0.5"
                      >
                        <Check className="w-3 h-3" />
                        <span>Read</span>
                      </button>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400">
              ExamSphere Notification Center &bull; Real-Time Alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
