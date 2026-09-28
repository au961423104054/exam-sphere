/**
 * Camera Shutter and Lens Obstruction Detection Utility
 *
 * Accurately detects when a user's physical camera shutter/privacy slider is closed,
 * the lens is taped/covered, or the video feed is pitch black.
 */

export function analyzeVideoFrame(videoElement, options = {}) {
  const {
    sampleWidth = 80,
    sampleHeight = 60,
    luminanceThreshold = 35,       // Average luminance below 35 indicates dark/covered
    flatNoiseStdDevThreshold = 14, // Low standard deviation indicates uniform sensor noise
    lowContrastLumThreshold = 55,  // Low brightness combined with flat contrast
    maxBrightnessThreshold = 42,   // Highest pixel brightness across the whole frame
  } = options;

  if (!videoElement) {
    return {
      isShutterClosed: true,
      reason: 'No video element provided',
      avgLuminance: 0,
      stdDev: 0,
      maxBrightness: 0,
    };
  }

  // Stream not rendering valid dimensions yet
  if (
    videoElement.videoWidth === 0 ||
    videoElement.videoHeight === 0 ||
    videoElement.readyState < 2
  ) {
    return {
      isShutterClosed: true,
      reason: 'Video stream initializing or paused',
      avgLuminance: 0,
      stdDev: 0,
      maxBrightness: 0,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { isShutterClosed: false, avgLuminance: 100, stdDev: 50, maxBrightness: 200 };
  }

  try {
    ctx.drawImage(videoElement, 0, 0, sampleWidth, sampleHeight);
    const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
    const d = imgData.data;

    let totalLuminance = 0;
    let maxBrightness = 0;
    const luminances = [];

    // Sample every 4th pixel (16 bytes) for high performance
    for (let i = 0; i < d.length; i += 16) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      totalLuminance += lum;
      luminances.push(lum);
      if (lum > maxBrightness) maxBrightness = lum;
    }

    const count = luminances.length;
    if (count === 0) {
      return { isShutterClosed: true, reason: 'Empty frame', avgLuminance: 0, stdDev: 0, maxBrightness: 0 };
    }

    const avgLuminance = totalLuminance / count;

    let varianceSum = 0;
    for (let i = 0; i < count; i++) {
      const diff = luminances[i] - avgLuminance;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / count);

    // A physical shutter creates either near-zero luminance or flat sensor noise
    const isShutterClosed =
      avgLuminance < luminanceThreshold ||
      (avgLuminance < lowContrastLumThreshold && stdDev < flatNoiseStdDevThreshold) ||
      maxBrightness < maxBrightnessThreshold;

    return {
      isShutterClosed,
      reason: isShutterClosed
        ? 'Camera shutter is closed or lens is covered'
        : 'Camera stream active and clear',
      avgLuminance: Math.round(avgLuminance * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      maxBrightness: Math.round(maxBrightness * 10) / 10,
    };
  } catch (err) {
    console.warn('[cameraShutterDetector] Error analyzing frame:', err);
    return { isShutterClosed: true, reason: err.message, avgLuminance: 0, stdDev: 0, maxBrightness: 0 };
  }
}
