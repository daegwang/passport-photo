import { FaceDetectionResult } from './faceDetection';

/**
 * Crop image to US passport photo specifications
 * Output: 600x600px (2x2 inches at 300 DPI)
 * 
 * @param image - Source image element
 * @param faceData - Face detection result with landmarks
 * @returns Canvas with cropped passport photo
 */
export function cropToPassport(
  image: HTMLImageElement | HTMLCanvasElement,
  faceData: FaceDetectionResult
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Passport photo specs: 600x600px (2x2" at 300 DPI)
  const outputSize = 600;
  canvas.width = outputSize;
  canvas.height = outputSize;

  const sourceWidth = image.width;
  const sourceHeight = image.height;

  const { boundingBox, landmarks } = faceData;

  // Calculate eye center position
  const eyeCenterY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const eyeCenterX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;

  // Target eye position: 56-69% from bottom, we'll use 62.5% (midpoint)
  const targetEyeHeightFromBottom = outputSize * 0.625;
  const targetEyeY = outputSize - targetEyeHeightFromBottom;

  // Target head height: 50-69% of frame, we'll use 59.5% (good balance)
  const targetHeadHeightPercent = 0.595;
  const targetHeadHeight = outputSize * targetHeadHeightPercent;

  // Face detection bounding box covers forehead-to-chin, NOT full head with hair.
  // Estimate full head height (including hair) as ~1.25x the face bounding box.
  const currentHeadHeight = boundingBox.height * 1.25;
  const scale = targetHeadHeight / currentHeadHeight;

  // Calculate source crop dimensions (what we'll take from the original image)
  const sourceCropWidth = outputSize / scale;
  const sourceCropHeight = outputSize / scale;

  // Calculate where to position the crop on the source image
  // Center the face horizontally
  let sourceCropX = eyeCenterX - sourceCropWidth / 2;
  
  // Position vertically so eyes are at the right height
  let sourceCropY = eyeCenterY - (outputSize - targetEyeHeightFromBottom) / scale;

  // Ensure we don't crop outside the source image boundaries
  sourceCropX = Math.max(0, Math.min(sourceCropX, sourceWidth - sourceCropWidth));
  sourceCropY = Math.max(0, Math.min(sourceCropY, sourceHeight - sourceCropHeight));

  // Handle edge cases where the crop area is larger than the source
  const actualCropWidth = Math.min(sourceCropWidth, sourceWidth - sourceCropX);
  const actualCropHeight = Math.min(sourceCropHeight, sourceHeight - sourceCropY);

  // Fill with white background (passport photo standard)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, outputSize, outputSize);

  // Draw the cropped and scaled image
  ctx.drawImage(
    image,
    sourceCropX,
    sourceCropY,
    actualCropWidth,
    actualCropHeight,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas;
}

/**
 * Convert canvas to data URL
 * @param canvas - Canvas element
 * @param format - Image format ('image/jpeg' or 'image/png')
 * @param quality - JPEG quality (0-1)
 * @returns Data URL string
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.95
): string {
  return canvas.toDataURL(format, quality);
}

/**
 * Convert canvas to Blob
 * @param canvas - Canvas element
 * @param format - Image format ('image/jpeg' or 'image/png')
 * @param quality - JPEG quality (0-1)
 * @returns Promise resolving to Blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Download canvas as image file
 * @param canvas - Canvas element
 * @param filename - Download filename
 * @param format - Image format
 * @param quality - JPEG quality (0-1)
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string = 'passport-photo.jpg',
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.95
): void {
  const dataURL = canvasToDataURL(canvas, format, quality);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  link.click();
}

/**
 * Create a preview-sized version of the cropped photo
 * @param canvas - Source canvas
 * @param maxSize - Maximum dimension for preview
 * @returns Smaller canvas for preview
 */
export function createPreview(
  canvas: HTMLCanvasElement,
  maxSize: number = 300
): HTMLCanvasElement {
  const previewCanvas = document.createElement('canvas');
  const ctx = previewCanvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get preview canvas context');
  }

  const scale = maxSize / canvas.width;
  previewCanvas.width = canvas.width * scale;
  previewCanvas.height = canvas.height * scale;

  ctx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);

  return previewCanvas;
}
