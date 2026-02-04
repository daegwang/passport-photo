/**
 * Passport Photo Processing Library
 * Barrel export for convenient imports
 */

// Face Detection
export {
  detectFaces,
  initializeFaceDetector,
  isDetectorLoading,
  getLoadError,
  disposeFaceDetector,
  type FaceDetectionResult,
  type FaceLandmarks,
} from './faceDetection';

// Compliance Checking
export {
  checkCompliance,
  getComplianceSummary,
  type ComplianceResult,
  type ComplianceCheck,
  type ComplianceMetrics,
} from './compliance';

// Photo Cropping
export {
  cropToPassport,
  canvasToDataURL,
  canvasToBlob,
  downloadCanvas,
  createPreview,
} from './cropPhoto';

// Integration Helper
export {
  processPassportPhoto,
  checkPhotoCompliance,
  getComplianceErrorMessage,
  type ProcessingResult,
} from './passportPhotoProcessor';
