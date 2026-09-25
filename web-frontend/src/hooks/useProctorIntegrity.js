import { useState, useEffect, useCallback, useRef } from 'react';
import { examSphereApi } from '../services/api';

/**
 * Custom hook for client-side exam integrity & automated proctoring.
 * Tracks tab switching, window blur, fullscreen exits, contextmenu, copy/paste, and screenshot attempts.
 */
export function useProctorIntegrity({
  examId = 'exam-active',
  candidateName = 'Candidate',
  candidateEmail = 'candidate@student.edu',
  maxViolations = 3,
  onAutoSubmit,
  enabled = true,
}) {
  const [violations, setViolations] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [currentWarning, setCurrentWarning] = useState(null);
  const [isScreenshotBlurred, setIsScreenshotBlurred] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState(null);

  const violationCountRef = useRef(0);
  const isTerminatedRef = useRef(false);
  const lastBlurTimeRef = useRef(0);

  // Record an incident
  const recordViolation = useCallback(
    async (violationType, details, severity = 'Medium') => {
      if (!enabled || isTerminatedRef.current) return;

      const now = Date.now();
      // Debounce window blur events within 1.5 seconds to prevent double triggers
      if (violationType.includes('Blur') && now - lastBlurTimeRef.current < 1500) {
        return;
      }
      if (violationType.includes('Blur')) {
        lastBlurTimeRef.current = now;
      }

      violationCountRef.current += 1;
      const currentCount = violationCountRef.current;

      const newViolation = {
        id: `viol-${Date.now()}`,
        violationType,
        details,
        severity,
        timestamp: new Date().toLocaleTimeString(),
        count: currentCount,
      };

      setViolations((prev) => [...prev, newViolation]);

      // Fire API proctor logging
      try {
        await examSphereApi.proctor.logViolation({
          examId,
          candidateName,
          candidateEmail,
          violationType,
          details,
          severity,
          violationCount: currentCount,
        });
      } catch (err) {
        console.error('Failed to dispatch violation log:', err);
      }

      // Check violation threshold
      if (currentCount >= maxViolations) {
        isTerminatedRef.current = true;
        setIsTerminated(true);
        setTerminationReason(
          `Security Threshold Exceeded: You have triggered ${currentCount} integrity violations. Exam has been locked and automatically submitted for administrative review.`
        );
        setWarningModalOpen(false);
        if (onAutoSubmit) {
          onAutoSubmit(newViolation);
        }
      } else {
        // Show active warning modal
        setCurrentWarning({
          type: violationType,
          details,
          currentCount,
          remaining: maxViolations - currentCount,
        });
        setWarningModalOpen(true);
      }
    },
    [enabled, examId, candidateName, candidateEmail, maxViolations, onAutoSubmit]
  );

  // Request Fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('Fullscreen request denied or blocked by user gesture:', err);
    }
  }, []);

  // Exit Fullscreen programmatically
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Error exiting fullscreen:', err);
    }
  }, []);

  // Setup security listeners
  useEffect(() => {
    if (!enabled || isTerminated) return;

    // 1. Fullscreen change listener
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && !isTerminatedRef.current) {
        recordViolation(
          'Fullscreen Exit',
          'Candidate exited enforced full-screen testing window.',
          'High'
        );
      }
    };

    // 2. Tab switch (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.hidden && !isTerminatedRef.current) {
        recordViolation(
          'Tab Switch / Application Hidden',
          'Browser tab was moved to background or another tab was selected.',
          'High'
        );
      }
    };

    // 3. Window blur
    const handleWindowBlur = () => {
      if (!document.hidden && !isTerminatedRef.current) {
        recordViolation(
          'Window Focus Lost',
          'Candidate navigated away or clicked outside the active test window.',
          'Medium'
        );
      }
    };

    // 4. Disable context menu (right click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      recordViolation(
        'Unauthorized Right-Click / Context Menu',
        'Attempted to open the browser inspect / context menu.',
        'Low'
      );
      return false;
    };

    // 5. Disable copy, cut, paste
    const handleClipboardEvent = (e) => {
      e.preventDefault();
      recordViolation(
        `Clipboard Action (${e.type.toUpperCase()})`,
        `Unauthorized ${e.type} action intercepted inside exam viewport.`,
        'Low'
      );
      return false;
    };

    // 6. Screenshot deterrence (PrintScreen detection)
    const handleKeyDown = (e) => {
      // PrintScreen key or common capture combos (Win+Shift+S triggers blur)
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        setIsScreenshotBlurred(true);
        recordViolation(
          'Screenshot Attempt (PrintScreen)',
          'PrintScreen keystroke detected; screen blurred temporarily for deterrence.',
          'High'
        );
        setTimeout(() => {
          setIsScreenshotBlurred(false);
        }, 2500);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleClipboardEvent);
    document.addEventListener('cut', handleClipboardEvent);
    document.addEventListener('paste', handleClipboardEvent);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboardEvent);
      document.removeEventListener('cut', handleClipboardEvent);
      document.removeEventListener('paste', handleClipboardEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, isTerminated, recordViolation]);

  return {
    violations,
    violationCount: violations.length,
    maxViolations,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    warningModalOpen,
    setWarningModalOpen,
    currentWarning,
    isScreenshotBlurred,
    isTerminated,
    terminationReason,
    recordViolation,
  };
}
