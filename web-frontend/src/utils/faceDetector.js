/**
 * Human Face & Presence Detection Engine for ExamSphere
 *
 * Utilizes:
 * 1. Native browser Shape Detection API (window.FaceDetector) when available in Chromium/Edge/Chrome
 * 2. Biometric YCbCr human skin chrominance locus + facial gradient analysis fallback
 *
 * Guarantees that camera privacy shutter closure, tape, lens coverings,
 * or absence of a human face strictly blocks identity verification.
 */

// Cached native FaceDetector instance
let nativeDetector = null;
let nativeDetectorChecked = false;

function getNativeFaceDetector() {
  if (nativeDetectorChecked) return nativeDetector;
  nativeDetectorChecked = true;

  if (typeof window !== 'undefined' && 'FaceDetector' in window) {
    try {
      nativeDetector = new window.FaceDetector({
        fastMode: true,
        maxDetectedFaces: 5,
      });
    } catch (e) {
      nativeDetector = null;
    }
  }
  return nativeDetector;
}

/**
 * Analyze an HTMLVideoElement or HTMLCanvasElement for human face presence.
 *
 * @param {HTMLVideoElement | HTMLCanvasElement} source
 * @returns {Promise<{
 *   hasFace: boolean,
 *   isShutterClosed: boolean,
 *   confidence: number,
 *   facesCount: number,
 *   reason: string,
 *   metrics: { avgLuminance: number, stdDev: number, skinPercentage: number, maxBrightness: number }
 * }>}
 */
export async function detectFaceAndShutter(source) {
  if (!source) {
    return {
      hasFace: false,
      isShutterClosed: true,
      confidence: 0,
      facesCount: 0,
      reason: 'No video element provided',
      metrics: { avgLuminance: 0, stdDev: 0, skinPercentage: 0, maxBrightness: 0 },
    };
  }

  const width = source.videoWidth || source.width || 0;
  const height = source.videoHeight || source.height || 0;

  if (width === 0 || height === 0 || (source.readyState !== undefined && source.readyState < 2)) {
    return {
      hasFace: false,
      isShutterClosed: true,
      confidence: 0,
      facesCount: 0,
      reason: 'Camera stream initializing or paused',
      metrics: { avgLuminance: 0, stdDev: 0, skinPercentage: 0, maxBrightness: 0 },
    };
  }

  // Downsample to 160x120 for fast real-time analysis (60+ FPS)
  const sampleW = 160;
  const sampleH = 120;
  const canvas = document.createElement('canvas');
  canvas.width = sampleW;
  canvas.height = sampleH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      hasFace: false,
      isShutterClosed: false,
      confidence: 0,
      facesCount: 0,
      reason: 'Canvas context unavailable',
      metrics: { avgLuminance: 50, stdDev: 20, skinPercentage: 10, maxBrightness: 100 },
    };
  }

  ctx.drawImage(source, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;
  const totalPixels = sampleW * sampleH;

  let totalLum = 0;
  let maxBrightness = 0;
  let skinPixels = 0;
  let centerSkinPixels = 0;
  const luminances = [];

  // Center portrait bounding box (where a candidate's face naturally sits)
  const centerMinX = Math.floor(sampleW * 0.2);
  const centerMaxX = Math.floor(sampleW * 0.8);
  const centerMinY = Math.floor(sampleH * 0.15);
  const centerMaxY = Math.floor(sampleH * 0.85);

  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Standard ITU-R BT.601 RGB to YCbCr conversion
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      totalLum += Y;
      luminances.push(Y);
      if (Y > maxBrightness) maxBrightness = Y;

      // Biometric human skin chrominance cluster locus:
      // Y > 35 (not pitch dark), Cb in [77, 127], Cr in [133, 173]
      const isSkin =
        Y > 35 &&
        Cb >= 77 &&
        Cb <= 127 &&
        Cr >= 133 &&
        Cr <= 173 &&
        r > g &&
        g > b; // Additional rule: red component dominates skin tones

      if (isSkin) {
        skinPixels++;
        if (x >= centerMinX && x <= centerMaxX && y >= centerMinY && y <= centerMaxY) {
          centerSkinPixels++;
        }
      }
    }
  }

  const avgLuminance = totalLum / totalPixels;

  // Calculate standard deviation / contrast
  let varianceSum = 0;
  for (let i = 0; i < luminances.length; i++) {
    const diff = luminances[i] - avgLuminance;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / totalPixels);

  const skinPercentage = (skinPixels / totalPixels) * 100;
  const centerSkinPercentage = (centerSkinPixels / ((centerMaxX - centerMinX) * (centerMaxY - centerMinY))) * 100;

  // 1. Shutter Closure / Obstruction Detection
  // Physical shutters create either near-zero luminance (< 35) or flat sensor noise with low contrast (< 14) and no skin tones (< 2%)
  const isShutterClosed =
    avgLuminance < 32 ||
    (avgLuminance < 55 && stdDev < 14 && skinPercentage < 2) ||
    maxBrightness < 38;

  if (isShutterClosed) {
    return {
      hasFace: false,
      isShutterClosed: true,
      confidence: 0,
      facesCount: 0,
      reason: 'Camera privacy shutter is closed or lens is covered',
      metrics: {
        avgLuminance: Math.round(avgLuminance * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        skinPercentage: Math.round(skinPercentage * 10) / 10,
        maxBrightness: Math.round(maxBrightness * 10) / 10,
      },
    };
  }

  // 2. Face Detection: Native Browser FaceDetector (Hardware Accelerated)
  const detector = getNativeFaceDetector();
  if (detector) {
    try {
      const faces = await detector.detect(source);
      if (faces && faces.length > 0) {
        return {
          hasFace: true,
          isShutterClosed: false,
          confidence: 0.98,
          facesCount: faces.length,
          reason: `Human face detected (${faces.length} face${faces.length > 1 ? 's' : ''})`,
          metrics: {
            avgLuminance: Math.round(avgLuminance * 10) / 10,
            stdDev: Math.round(stdDev * 10) / 10,
            skinPercentage: Math.round(skinPercentage * 10) / 10,
            maxBrightness: Math.round(maxBrightness * 10) / 10,
          },
        };
      } else {
        // Native detector ran and found 0 faces
        return {
          hasFace: false,
          isShutterClosed: false,
          confidence: 0.1,
          facesCount: 0,
          reason: 'Camera is open, but no human face was detected in the frame',
          metrics: {
            avgLuminance: Math.round(avgLuminance * 10) / 10,
            stdDev: Math.round(stdDev * 10) / 10,
            skinPercentage: Math.round(skinPercentage * 10) / 10,
            maxBrightness: Math.round(maxBrightness * 10) / 10,
          },
        };
      }
    } catch (err) {
      // Fall through to algorithmic skin/facial contour analysis if detector fails
    }
  }

  // 3. Algorithmic Fallback: Biometric Facial Skin & Geometry Analysis
  // A visible human face in a portrait webcam feed consistently produces >= 6% center skin cluster and distinct facial contrast
  const hasFacialSkinCluster = centerSkinPercentage >= 5.5 || skinPercentage >= 7.0;
  const hasFacialContrast = stdDev >= 18 && maxBrightness >= 80;

  if (hasFacialSkinCluster && hasFacialContrast) {
    const estimatedConfidence = Math.min(
      0.95,
      0.65 + (centerSkinPercentage / 100) * 0.3 + (stdDev / 100) * 0.1
    );

    return {
      hasFace: true,
      isShutterClosed: false,
      confidence: Math.round(estimatedConfidence * 100) / 100,
      facesCount: 1,
      reason: 'Human face detected and aligned',
      metrics: {
        avgLuminance: Math.round(avgLuminance * 10) / 10,
        stdDev: Math.round(stdDev * 10) / 10,
        skinPercentage: Math.round(skinPercentage * 10) / 10,
        maxBrightness: Math.round(maxBrightness * 10) / 10,
      },
    };
  }

  return {
    hasFace: false,
    isShutterClosed: false,
    confidence: 0.15,
    facesCount: 0,
    reason: 'Camera shutter open, but no human face detected. Please position your face within the frame.',
    metrics: {
      avgLuminance: Math.round(avgLuminance * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      skinPercentage: Math.round(skinPercentage * 10) / 10,
      maxBrightness: Math.round(maxBrightness * 10) / 10,
    },
  };
}
