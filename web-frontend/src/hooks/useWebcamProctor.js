import { useState, useEffect, useRef, useCallback } from 'react';
import { examSphereApi } from '../services/api';

/**
 * Custom hook to manage webcam media stream, permissions,
 * and automatic periodic snapshot uploads to /api/proctor/snapshot every N seconds.
 */
export function useWebcamProctor({
  examId = 'exam-active',
  candidateEmail = 'alex.rivera@student.mit.edu',
  intervalSeconds = 30,
  enabled = true,
  onSnapshotCaptured,
}) {
  const [stream, setStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted' | 'denied' | 'prompt' | 'unsupported'
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [lastSnapshotTime, setLastSnapshotTime] = useState(null);
  const [lastSnapshotBase64, setLastSnapshotBase64] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalTimerRef = useRef(null);

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

      // Upload via proctor snapshot endpoint
      await examSphereApi.proctor.uploadSnapshot({
        examId,
        candidateEmail,
        imageBase64,
        timestamp,
      });

      if (onSnapshotCaptured) {
        onSnapshotCaptured({ timestamp, count: snapshotCount + 1, imageBase64 });
      }
    } catch (err) {
      console.error('Failed to capture proctoring webcam frame:', err);
    }
  }, [examId, candidateEmail, permissionStatus, onSnapshotCaptured, snapshotCount]);

  // Attach stream to video element when ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Handle auto-initialization and snapshot interval timer
  useEffect(() => {
    if (!enabled) return;

    startCamera();

    return () => {
      stopCamera();
    };
  }, [enabled, startCamera, stopCamera]);

  // Snapshot timer when camera is granted
  useEffect(() => {
    if (permissionStatus !== 'granted' || !enabled) return;

    // Capture first baseline frame after short warm-up (3s)
    const initialWarmupTimeout = setTimeout(() => {
      captureAndUploadSnapshot();
    }, 3000);

    // Setup periodic snapshot timer every N seconds
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
    startCamera,
    stopCamera,
    triggerManualSnapshot: captureAndUploadSnapshot,
    intervalSeconds,
  };
}
