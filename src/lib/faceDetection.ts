import { FaceDetector, FilesetResolver, Detection } from '@mediapipe/tasks-vision';

export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
}

export interface FaceDetectionResult {
  boundingBox: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  landmarks: FaceLandmarks;
  confidence: number;
}

let faceDetector: FaceDetector | null = null;
let isLoading = false;
let loadError: Error | null = null;

/**
 * Initialize MediaPipe Face Detector
 * Uses CDN for WASM files
 */
export async function initializeFaceDetector(): Promise<void> {
  if (faceDetector) return;
  if (isLoading) {
    // Wait for existing initialization
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return;
  }

  isLoading = true;
  loadError = null;

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5,
    });
  } catch (error) {
    loadError = error as Error;
    throw new Error(`Failed to initialize face detector: ${(error as Error).message}`);
  } finally {
    isLoading = false;
  }
}

/**
 * Extract landmarks from MediaPipe detection
 */
function extractLandmarks(detection: Detection, imageWidth: number, imageHeight: number): FaceLandmarks {
  const keypoints = detection.keypoints || [];
  
  // MediaPipe BlazeFace provides 6 keypoints:
  // 0: right eye, 1: left eye, 2: nose tip, 3: mouth center, 4: right ear, 5: left ear
  const landmarks: FaceLandmarks = {
    rightEye: { x: 0, y: 0 },
    leftEye: { x: 0, y: 0 },
    nose: { x: 0, y: 0 },
    mouth: { x: 0, y: 0 },
  };

  if (keypoints.length >= 4) {
    landmarks.rightEye = {
      x: keypoints[0].x * imageWidth,
      y: keypoints[0].y * imageHeight,
    };
    landmarks.leftEye = {
      x: keypoints[1].x * imageWidth,
      y: keypoints[1].y * imageHeight,
    };
    landmarks.nose = {
      x: keypoints[2].x * imageWidth,
      y: keypoints[2].y * imageHeight,
    };
    landmarks.mouth = {
      x: keypoints[3].x * imageWidth,
      y: keypoints[3].y * imageHeight,
    };
  }

  return landmarks;
}

/**
 * Detect faces in an image
 * @param imageElement - HTMLImageElement, HTMLCanvasElement, or HTMLVideoElement
 * @returns Array of detected faces with bounding boxes and landmarks
 */
export async function detectFaces(
  imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
): Promise<FaceDetectionResult[]> {
  if (!faceDetector) {
    await initializeFaceDetector();
  }

  if (!faceDetector) {
    throw new Error('Face detector not initialized');
  }

  try {
    const detections = faceDetector.detect(imageElement);
    
    const imageWidth = imageElement instanceof HTMLVideoElement 
      ? imageElement.videoWidth 
      : imageElement.width;
    const imageHeight = imageElement instanceof HTMLVideoElement 
      ? imageElement.videoHeight 
      : imageElement.height;

    return detections.detections.map((detection) => {
      const box = detection.boundingBox;
      
      return {
        boundingBox: {
          originX: box?.originX || 0,
          originY: box?.originY || 0,
          width: box?.width || 0,
          height: box?.height || 0,
        },
        landmarks: extractLandmarks(detection, imageWidth, imageHeight),
        confidence: detection.categories?.[0]?.score || 0,
      };
    });
  } catch (error) {
    throw new Error(`Face detection failed: ${(error as Error).message}`);
  }
}

/**
 * Get loading state
 */
export function isDetectorLoading(): boolean {
  return isLoading;
}

/**
 * Get load error if any
 */
export function getLoadError(): Error | null {
  return loadError;
}

/**
 * Clean up detector (call when component unmounts)
 */
export function disposeFaceDetector(): void {
  if (faceDetector) {
    faceDetector.close();
    faceDetector = null;
  }
}
