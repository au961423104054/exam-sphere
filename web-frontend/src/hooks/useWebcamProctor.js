import { useState, useEffect, useRef, useCallback } from 'react';
import { examSphereApi } from '../services/api';
import { analyzeVideoFrame } from '../utils/cameraShutterDetector';

/**
 * Custom hook to manage webcam media stream, permissions,
 * real-time physical shutter detection, and automatic periodic snapshot uploads.
 */
export function useWebcamProctor({
  examId = 'exam-active',
  submissionId = null,
  candidateEmail = 'alex.rivera@student.mit.edu',
  intervalSeconds = 30,
  enabled = true,
  onSnapshotCaptured,
  onCameraBlocked,
  onCameraRestored,
}) {
  const [stream, setStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted' | 'denied' | 'prompt' | 'unsupported'
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [lastSnapshotTime, setLastSnapshotTime] = useState(null);
  const [lastSnapshotBase64, setLastSnapshotBase64] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isShutterClosed, setIsShutterClosed] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalTimerRef = useRef(null);
  const consecutiveBlockedRef = useRef(0);

  // Request camera access and start video stream
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unsupported');
      setErrorMessage('Browser does not support webcam media access.');
      return;
    }

    try {
      setErrorMessage(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      setStream(mediaStream);
      setPermissionStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => console.warn('Video play error:', err));
      }
    } catch (err) {
      console.warn('Webcam permission error:', err);
      setPermissionStatus('denied');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Webcam permission was declined. Please allow camera access in browser settings.'
          : `Camera error: ${err.message}`
      );
    }
  }, []);

  // Stop video stream and release hardware tracks
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
  }, [stream]);

  // Capture a frame to canvas and dispatch upload
  const captureAndUploadSnapshot = useCallback(async () => {
    if (!videoRef.current || permissionStatus !== 'granted') return;

    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      // Analyze image frame for shutter closure / darkness
      const frameAnalysis = analyzeVideoFrame(video);
      const { isShutterClosed: shutterBlocked, avgLuminance } = frameAnalysis;

      if (shutterBlocked) {
        setIsShutterClosed(true);
        if (onCameraBlocked) {
          onCameraBlocked({
            avgLuminance,
            isShutterClosed: true,
            reason: 'Camera shutter closed or covered during assessment snapshot',
          });
        }
      }

      // Create off-screen canvas if not present
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      canvas.width = 320;
      canvas.height = 240;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/jpeg', 0.65);
      const timestamp = new Date().toISOString();

      setLastSnapshotBase64(imageBase64);
      setLastSnapshotTime(new Date().toLocaleTimeString());
      setSnapshotCount((prev) => prev + 1);

      // Upload via periodic snapshot endpoint if submission is known
      if (submissionId) {
        await examSphereApi.proctor.uploadPeriodicSnapshot({
          submissionId,
          examId,
          imageBase64,
          timestamp,
          metadata: {
            avgLuminance,
            isShutterClosed: shutterBlocked,
            cameraBlocked: shutterBlocked,
          },
        });
      } else {
        await examSphereApi.proctor.uploadSnapshot({
          examId,
          candidateEmail,
          imageBase64,
          timestamp,
          metadata: {
            avgLuminance,
            isShutterClosed: shutterBlocked,
          },
        });
      }

      if (onSnapshotCaptured) {
        onSnapshotCaptured({ timestamp, count: snapshotCount + 1, imageBase64, avgLuminance, isShutterClosed: shutterBlocked });
      }
    } catch (err) {
      console.error('Failed to capture proctoring webcam frame:', err);
    }
  }, [examId, submissionId, candidateEmail, permissionStatus, onSnapshotCaptured, onCameraBlocked, snapshotCount]);

  // Attach stream to video element when ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Handle auto-initialization
  useEffect(() => {
    if (!enabled) return;

    startCamera();

    return () => {
      stopCamera();
    };
  }, [enabled, startCamera, stopCamera]);

  // Real-time camera shutter watchdog (evaluates every 1.5 seconds)
  useEffect(() => {
    if (permissionStatus !== 'granted' || !enabled) return;

    const watchdogTimer = setInterval(() => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.readyState >= 2) {
        const frame = analyzeVideoFrame(video);

        if (frame.isShutterClosed) {
          consecutiveBlockedRef.current += 1;
          // Two consecutive samples (~3s) confirm shutter closure
          if (consecutiveBlockedRef.current >= 2) {
            setIsShutterClosed(true);
            if (onCameraBlocked) {
              onCameraBlocked({
                avgLuminance: frame.avgLuminance,
                isShutterClosed: true,
                reason: 'Physical camera shutter closed or covered',
              });
            }
          }
        } else {
          if (consecutiveBlockedRef.current >= 2 && onCameraRestored) {
            onCameraRestored({ avgLuminance: frame.avgLuminance });
          }
          consecutiveBlockedRef.current = 0;
          setIsShutterClosed(false);
        }
      }
    }, 1500);

    return () => clearInterval(watchdogTimer);
  }, [permissionStatus, enabled, onCameraBlocked, onCameraRestored]);

  // Periodic snapshot interval timer
  useEffect(() => {
    if (permissionStatus !== 'granted' || !enabled) return;

    const initialWarmupTimeout = setTimeout(() => {
      captureAndUploadSnapshot();
    }, 3000);

    intervalTimerRef.current = setInterval(() => {
      captureAndUploadSnapshot();
    }, intervalSeconds * 1000);

    return () => {
      clearTimeout(initialWarmupTimeout);
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [permissionStatus, enabled, intervalSeconds, captureAndUploadSnapshot]);

  return {
    videoRef,
    stream,
    permissionStatus,
    errorMessage,
    snapshotCount,
    lastSnapshotTime,
    lastSnapshotBase64,
    isShutterClosed,
    startCamera,
    stopCamera,
    triggerManualSnapshot: captureAndUploadSnapshot,
    intervalSeconds,
  };
}
