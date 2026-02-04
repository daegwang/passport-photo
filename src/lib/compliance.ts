import { FaceDetectionResult } from './faceDetection';

export interface ComplianceMetrics {
  faceCount: number;
  headHeightPercent: number;
  eyeHeightPercent: number;
  headTiltDegrees: number;
  horizontalCenterOffset: number;
}

export interface ComplianceCheck {
  id: string;
  label: string;
  passed: boolean;
  message: string;
}

export interface ComplianceResult {
  passed: boolean;
  checks: ComplianceCheck[];
  metrics: ComplianceMetrics;
  faceData?: FaceDetectionResult;
}

/**
 * Calculate angle between two points
 */
function calculateAngle(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const deltaY = p2.y - p1.y;
  const deltaX = p2.x - p1.x;
  const angleRad = Math.atan2(deltaY, deltaX);
  return (angleRad * 180) / Math.PI;
}

/**
 * Check US passport photo compliance
 * @param imageWidth - Width of the image in pixels
 * @param imageHeight - Height of the image in pixels
 * @param faces - Detected faces from face detection
 * @returns Compliance result with pass/fail status and detailed checks
 */
export function checkCompliance(
  imageWidth: number,
  imageHeight: number,
  faces: FaceDetectionResult[]
): ComplianceResult {
  const checks: ComplianceCheck[] = [];
  
  const metrics: ComplianceMetrics = {
    faceCount: faces.length,
    headHeightPercent: 0,
    eyeHeightPercent: 0,
    headTiltDegrees: 0,
    horizontalCenterOffset: 0,
  };

  // Check 1: Exactly one face detected
  const faceCountCheck: ComplianceCheck = {
    id: 'face-count',
    label: 'Single Face Detected',
    passed: faces.length === 1,
    message: faces.length === 0
      ? 'No face detected. Please ensure your face is clearly visible.'
      : faces.length > 1
      ? `${faces.length} faces detected. Only one person should be in the photo.`
      : 'One face detected ✓',
  };
  checks.push(faceCountCheck);

  if (faces.length !== 1) {
    return {
      passed: false,
      checks,
      metrics,
    };
  }

  const face = faces[0];
  const { boundingBox, landmarks } = face;

  // Calculate head height
  // Face detection box covers forehead-to-chin; estimate full head (with hair) as ~1.25x
  const headHeightPixels = boundingBox.height * 1.25;
  const headHeightPercent = (headHeightPixels / imageHeight) * 100;
  metrics.headHeightPercent = headHeightPercent;

  // Check 2: Head resolution quality
  // The crop auto-scales the head to 59.5% of 600px output (= 357px target).
  // We need enough source pixels so the crop doesn't upscale too much.
  // Minimum ~150px head height → ~2.4x upscale (acceptable quality).
  // Also check head isn't so large it can't be framed (framing margin check covers this too).
  const minHeadPixels = 150;
  const headSizeCheck: ComplianceCheck = {
    id: 'head-size',
    label: 'Head Size',
    passed: headHeightPixels >= minHeadPixels,
    message:
      headHeightPixels < minHeadPixels
        ? `Face too small (${Math.round(headHeightPixels)}px). Move closer to the camera for better quality.`
        : `Head size sufficient (${Math.round(headHeightPixels)}px) ✓`,
  };
  checks.push(headSizeCheck);

  // Calculate eye position (for metrics only — crop auto-positions eyes at 62.5%)
  const eyeCenterY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const eyeCenterX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const eyeHeightFromBottom = imageHeight - eyeCenterY;
  const eyeHeightPercent = (eyeHeightFromBottom / imageHeight) * 100;
  metrics.eyeHeightPercent = eyeHeightPercent;

  // Check 3: Sufficient margin around face for clean crop
  // Estimate how much source image the crop needs based on head size + target framing
  const estimatedFullHead = boundingBox.height; // already includes 1.25x factor from above
  const targetHeadPercent = 0.595;
  const cropSourceHeight = (estimatedFullHead / targetHeadPercent);
  
  // How much space is needed above eyes (top of hair + headroom)
  const headTop = boundingBox.originY - (estimatedFullHead - boundingBox.height); // top of estimated hair
  const targetEyeFromTop = cropSourceHeight * (1 - 0.625); // eyes at 62.5% from bottom = 37.5% from top
  const neededAboveEyes = targetEyeFromTop;
  const availableAboveEyes = eyeCenterY;
  
  // How much space is needed below eyes (chin + below-chin padding)
  const neededBelowEyes = cropSourceHeight - targetEyeFromTop;
  const availableBelowEyes = imageHeight - eyeCenterY;
  
  const hasEnoughMargin = availableAboveEyes >= neededAboveEyes * 0.95 
    && availableBelowEyes >= neededBelowEyes * 0.95;
  
  const eyeHeightCheck: ComplianceCheck = {
    id: 'eye-height',
    label: 'Framing Margin',
    passed: hasEnoughMargin,
    message: !hasEnoughMargin
      ? availableAboveEyes < neededAboveEyes * 0.95
        ? 'Not enough space above head. Move down or step back from the camera.'
        : 'Not enough space below chin. Move up or step back from the camera.'
      : 'Sufficient framing margin for crop ✓',
  };
  checks.push(eyeHeightCheck);

  // Calculate head tilt from eye alignment
  // atan2 returns ~0° or ~±180° when eyes are level (depending on which eye is left/right)
  // We need the deviation from horizontal, so normalize to 0° = perfectly level
  const eyeAngle = calculateAngle(landmarks.leftEye, landmarks.rightEye);
  const headTiltDegrees = Math.abs(eyeAngle) > 90
    ? 180 - Math.abs(eyeAngle)
    : Math.abs(eyeAngle);
  metrics.headTiltDegrees = headTiltDegrees;

  // Check 4: Head tilt (less than 5 degrees)
  const headTiltCheck: ComplianceCheck = {
    id: 'head-tilt',
    label: 'Head Alignment',
    passed: headTiltDegrees <= 5,
    message:
      headTiltDegrees > 5
        ? `Head is tilted ${headTiltDegrees.toFixed(1)}°. Keep your head level.`
        : `Head alignment correct (tilt: ${headTiltDegrees.toFixed(1)}°) ✓`,
  };
  checks.push(headTiltCheck);

  // Calculate horizontal centering
  const faceCenterX = boundingBox.originX + boundingBox.width / 2;
  const imageCenterX = imageWidth / 2;
  const horizontalOffset = Math.abs(faceCenterX - imageCenterX);
  const horizontalOffsetPercent = (horizontalOffset / imageWidth) * 100;
  metrics.horizontalCenterOffset = horizontalOffsetPercent;

  // Check 5: Face centered horizontally (within 10% of center)
  const centeringCheck: ComplianceCheck = {
    id: 'horizontal-centering',
    label: 'Horizontal Centering',
    passed: horizontalOffsetPercent <= 10,
    message:
      horizontalOffsetPercent > 10
        ? faceCenterX < imageCenterX
          ? `Face too far left. Center yourself in the frame.`
          : `Face too far right. Center yourself in the frame.`
        : `Face centered horizontally ✓`,
  };
  checks.push(centeringCheck);

  const allPassed = checks.every((check) => check.passed);

  return {
    passed: allPassed,
    checks,
    metrics,
    faceData: face,
  };
}

/**
 * Get compliance status summary
 */
export function getComplianceSummary(result: ComplianceResult): string {
  if (result.passed) {
    return 'Photo meets all US passport requirements ✓';
  }

  const failedCount = result.checks.filter((c) => !c.passed).length;
  return `${failedCount} requirement${failedCount > 1 ? 's' : ''} not met`;
}
