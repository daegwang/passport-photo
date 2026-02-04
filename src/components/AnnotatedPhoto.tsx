'use client';

import { useRef, useEffect } from 'react';
import { ComplianceResult } from '@/lib/compliance';

interface AnnotatedPhotoProps {
  imageSrc: string;
  compliance: ComplianceResult;
  className?: string;
}

/**
 * Draws the original photo with visual annotations showing
 * what was measured for each compliance check.
 */
export default function AnnotatedPhoto({ imageSrc, compliance, className = '' }: AnnotatedPhotoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Size canvas to image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      const face = compliance.faceData;
      if (!face) return;

      const { boundingBox, landmarks } = face;
      const lineWidth = Math.max(2, img.width * 0.004);
      const fontSize = Math.max(12, img.width * 0.028);
      const smallFontSize = Math.max(10, img.width * 0.022);

      // Helper: draw a dashed line with label
      const drawLine = (
        x1: number, y1: number, x2: number, y2: number,
        color: string, label: string, labelSide: 'left' | 'right' = 'right',
        passed: boolean = true
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([lineWidth * 3, lineWidth * 2]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label background
        ctx.font = `bold ${smallFontSize}px system-ui, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const padding = 6;
        const labelX = labelSide === 'right' ? x2 + 10 : x1 - textWidth - padding * 2 - 10;
        const labelY = (y1 + y2) / 2 - smallFontSize / 2 - padding;

        // Badge
        ctx.fillStyle = passed ? color : '#ef4444';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(labelX, labelY, textWidth + padding * 2, smallFontSize + padding * 2, 4);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label text
        ctx.fillStyle = 'white';
        ctx.fillText(label, labelX + padding, labelY + smallFontSize + padding - 2);
        ctx.restore();
      };

      // --- 1. BOUNDING BOX (face detection area) ---
      ctx.save();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
      ctx.strokeRect(boundingBox.originX, boundingBox.originY, boundingBox.width, boundingBox.height);
      ctx.setLineDash([]);
      ctx.restore();

      // --- 2. ESTIMATED HEAD (1.25x bounding box) ---
      const estimatedHeadHeight = boundingBox.height * 1.25;
      const headTop = boundingBox.originY - (estimatedHeadHeight - boundingBox.height);
      const headBottom = boundingBox.originY + boundingBox.height;
      const headLeft = boundingBox.originX - boundingBox.width * 0.15;
      const headRight = boundingBox.originX + boundingBox.width * 1.15;

      const headCheck = compliance.checks.find(c => c.id === 'head-size');

      // Top of head line
      drawLine(
        headLeft, headTop, headRight, headTop,
        '#10b981', `Head top`, 'right', headCheck?.passed ?? true
      );

      // Chin line  
      drawLine(
        headLeft, headBottom, headRight, headBottom,
        '#10b981', `Chin`, 'right', headCheck?.passed ?? true
      );

      // Head height bracket
      ctx.save();
      ctx.strokeStyle = headCheck?.passed ? '#10b981' : '#ef4444';
      ctx.lineWidth = lineWidth;
      const bracketX = headRight + 8;
      ctx.beginPath();
      ctx.moveTo(bracketX, headTop);
      ctx.lineTo(bracketX + 12, headTop);
      ctx.lineTo(bracketX + 12, headBottom);
      ctx.lineTo(bracketX, headBottom);
      ctx.stroke();

      // Head height label (show pixel height)
      ctx.font = `bold ${smallFontSize}px system-ui, sans-serif`;
      ctx.fillStyle = headCheck?.passed ? '#10b981' : '#ef4444';
      const headPx = Math.round(estimatedHeadHeight);
      ctx.fillText(
        `${headPx}px`,
        bracketX + 18,
        (headTop + headBottom) / 2 + smallFontSize / 3
      );
      if (!headCheck?.passed) {
        ctx.fillStyle = 'rgba(100,100,100,0.7)';
        ctx.font = `${smallFontSize * 0.8}px system-ui, sans-serif`;
        ctx.fillText(
          `(need ≥150px)`,
          bracketX + 18,
          (headTop + headBottom) / 2 + smallFontSize / 3 + smallFontSize
        );
      }
      ctx.restore();

      // --- 3. EYE LINE ---
      const eyeCenterY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
      const eyeCheck = compliance.checks.find(c => c.id === 'eye-height');

      drawLine(
        headLeft - 20, eyeCenterY, headRight + 5, eyeCenterY,
        '#f59e0b', `Eyes ${compliance.metrics.eyeHeightPercent.toFixed(0)}%`,
        'left', eyeCheck?.passed ?? true
      );

      // Eye dots
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      [landmarks.leftEye, landmarks.rightEye].forEach(eye => {
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, lineWidth * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // --- 4. HEAD TILT ---
      const tiltCheck = compliance.checks.find(c => c.id === 'head-tilt');
      const tiltDeg = compliance.metrics.headTiltDegrees;

      // Draw line through both eyes showing the tilt
      const eyeDx = landmarks.rightEye.x - landmarks.leftEye.x;
      const eyeDy = landmarks.rightEye.y - landmarks.leftEye.y;
      const eyeDist = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);
      const extend = eyeDist * 0.3;
      const nx = eyeDx / eyeDist;
      const ny = eyeDy / eyeDist;

      ctx.save();
      ctx.strokeStyle = tiltCheck?.passed ? 'rgba(139, 92, 246, 0.7)' : '#ef4444';
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(landmarks.leftEye.x - nx * extend, landmarks.leftEye.y - ny * extend);
      ctx.lineTo(landmarks.rightEye.x + nx * extend, landmarks.rightEye.y + ny * extend);
      ctx.stroke();
      ctx.restore();

      // Tilt label near the eye line
      const tiltLabelX = landmarks.rightEye.x + nx * extend + 10;
      const tiltLabelY = landmarks.rightEye.y + ny * extend;
      ctx.save();
      ctx.font = `bold ${smallFontSize}px system-ui, sans-serif`;
      const tiltText = `Tilt: ${tiltDeg.toFixed(1)}°`;
      const tiltTextW = ctx.measureText(tiltText).width;
      ctx.fillStyle = tiltCheck?.passed ? 'rgba(139, 92, 246, 0.85)' : '#ef4444';
      ctx.beginPath();
      ctx.roundRect(tiltLabelX, tiltLabelY - smallFontSize, tiltTextW + 12, smallFontSize + 10, 4);
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillText(tiltText, tiltLabelX + 6, tiltLabelY);
      ctx.restore();

      // --- 5. CENTER LINE ---
      const centerCheck = compliance.checks.find(c => c.id === 'horizontal-centering');
      const imageCenterX = img.width / 2;
      const faceCenterX = boundingBox.originX + boundingBox.width / 2;

      // Image center line (thin, gray)
      ctx.save();
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(imageCenterX, headTop - 20);
      ctx.lineTo(imageCenterX, headBottom + 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Face center line
      ctx.save();
      ctx.strokeStyle = centerCheck?.passed ? 'rgba(6, 182, 212, 0.7)' : '#ef4444';
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
      ctx.beginPath();
      ctx.moveTo(faceCenterX, headTop - 20);
      ctx.lineTo(faceCenterX, headBottom + 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Offset label
      if (Math.abs(faceCenterX - imageCenterX) > 5) {
        const offsetPct = compliance.metrics.horizontalCenterOffset.toFixed(1);
        ctx.save();
        ctx.font = `bold ${smallFontSize}px system-ui, sans-serif`;
        const offsetText = `↔ ${offsetPct}%`;
        const offsetW = ctx.measureText(offsetText).width;
        const midX = (imageCenterX + faceCenterX) / 2 - offsetW / 2;
        ctx.fillStyle = centerCheck?.passed ? 'rgba(6, 182, 212, 0.85)' : '#ef4444';
        ctx.beginPath();
        ctx.roundRect(midX - 6, headBottom + 25, offsetW + 12, smallFontSize + 10, 4);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText(offsetText, midX, headBottom + 25 + smallFontSize + 2);
        ctx.restore();
      }

      // --- 6. NOSE + MOUTH dots ---
      ctx.save();
      ctx.fillStyle = 'rgba(236, 72, 153, 0.6)';
      [landmarks.nose, landmarks.mouth].forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, lineWidth * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // --- LEGEND ---
      const legendY = img.height - fontSize * 6;
      const legendX = 10;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(legendX, legendY, fontSize * 12, fontSize * 5.5, 8);
      ctx.fill();

      ctx.font = `bold ${smallFontSize}px system-ui, sans-serif`;
      const legendItems = [
        { color: '#10b981', label: '— Head bounds' },
        { color: '#f59e0b', label: '— Eye line' },
        { color: '#8b5cf6', label: '— Head tilt' },
        { color: '#06b6d4', label: '— Center offset' },
      ];
      legendItems.forEach((item, i) => {
        const y = legendY + 18 + i * (smallFontSize + 8);
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX + 10, y - 6, 16, 3);
        ctx.fillStyle = 'white';
        ctx.fillText(item.label, legendX + 32, y);
      });
      ctx.restore();
    };

    img.src = imageSrc;
  }, [imageSrc, compliance]);

  return (
    <canvas
      ref={canvasRef}
      style={{ aspectRatio: 'auto' }}
      className={`w-full max-w-md rounded-lg shadow-md border-2 border-gray-200 object-contain ${className}`}
    />
  );
}
