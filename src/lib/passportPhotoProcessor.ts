/**
 * Integration example: Complete passport photo processing workflow
 * This file demonstrates how to use all the modules together
 */

import { detectFaces, initializeFaceDetector, FaceDetectionResult } from './faceDetection';
import { checkCompliance, ComplianceResult } from './compliance';
import { cropToPassport, canvasToDataURL, canvasToBlob } from './cropPhoto';

export interface ProcessingResult {
  compliance: ComplianceResult;
  croppedCanvas?: HTMLCanvasElement;
  croppedDataURL?: string;
  croppedBlob?: Blob;
  originalImage?: HTMLImageElement;
}

/**
 * Process a passport photo from upload to final output
 * @param imageFile - Uploaded image file
 * @returns Processing result with compliance check and cropped photo
 */
export async function processPassportPhoto(
  imageFile: File | HTMLImageElement
): Promise<ProcessingResult> {
  // Step 1: Load image if it's a file
  let imageElement: HTMLImageElement;

  if (imageFile instanceof File) {
    imageElement = await loadImageFromFile(imageFile);
  } else {
    imageElement = imageFile;
  }

  // Step 2: Initialize face detector
  await initializeFaceDetector();

  // Step 3: Detect faces
  const faces = await detectFaces(imageElement);

  // Step 4: Check compliance
  const compliance = checkCompliance(imageElement.width, imageElement.height, faces);

  // Step 5: If compliant, crop the photo
  let croppedCanvas: HTMLCanvasElement | undefined;
  let croppedDataURL: string | undefined;
  let croppedBlob: Blob | undefined;

  if (compliance.passed && compliance.faceData) {
    croppedCanvas = cropToPassport(imageElement, compliance.faceData);
    croppedDataURL = canvasToDataURL(croppedCanvas, 'image/jpeg', 0.95);
    croppedBlob = await canvasToBlob(croppedCanvas, 'image/jpeg', 0.95);
  }

  return {
    compliance,
    croppedCanvas,
    croppedDataURL,
    croppedBlob,
    originalImage: imageElement,
  };
}

/**
 * Load image from File object
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Process photo and get only compliance check (without cropping)
 * Useful for real-time validation during camera capture
 */
export async function checkPhotoCompliance(
  imageElement: HTMLImageElement | HTMLCanvasElement
): Promise<ComplianceResult> {
  await initializeFaceDetector();
  const faces = await detectFaces(imageElement);
  return checkCompliance(imageElement.width, imageElement.height, faces);
}

/**
 * Get user-friendly error message from compliance result
 */
export function getComplianceErrorMessage(compliance: ComplianceResult): string | null {
  if (compliance.passed) return null;

  const failedChecks = compliance.checks.filter((c) => !c.passed);
  if (failedChecks.length === 0) return null;

  // Return the most critical failure
  const criticalCheck = failedChecks.find((c) => c.id === 'face-count') || failedChecks[0];
  return criticalCheck.message;
}
