'use client';

import { useRef, useEffect } from 'react';
import { exportAsPNG, exportAsPrintSheet } from '@/lib/exportPhoto';

interface ExportPanelProps {
  photoCanvas: HTMLCanvasElement | null;
}

export default function ExportPanel({ photoCanvas }: ExportPanelProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!photoCanvas || !previewCanvasRef.current) return;
    const ctx = previewCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(photoCanvas, 0, 0, 300, 300);
  }, [photoCanvas]);

  const handleDownloadPNG = () => {
    if (!photoCanvas) return;
    exportAsPNG(photoCanvas);
  };

  const handleDownloadPDF = () => {
    if (!photoCanvas) return;
    exportAsPrintSheet(photoCanvas);
  };

  if (!photoCanvas) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Take a photo first to see export options</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Export Your Photo</h2>

      <div className="mb-6">
        <div className="flex justify-center">
          <canvas
            ref={previewCanvasRef}
            width={300}
            height={300}
            className="border-2 border-gray-700 rounded-lg shadow-md"
          />
        </div>
      </div>

      <div className="bg-blue-950/50 rounded-lg p-4 mb-6 border border-blue-800">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">Photo Specifications</h3>
        <ul className="text-sm text-blue-400 space-y-1">
          <li>✓ Size: 2×2 inches (51×51 mm)</li>
          <li>✓ Resolution: 300 DPI (600×600 pixels)</li>
          <li>✓ Format: PNG (digital) or PDF (printing)</li>
        </ul>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleDownloadPNG}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Photo (PNG)
        </button>

        <button
          onClick={handleDownloadPDF}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md"
        >
          <div className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download Print Sheet (PDF)
          </div>
          <p className="text-xs text-green-200 mt-1">4×6" sheet with 4 photos — print at any drugstore (~$0.35)</p>
        </button>
      </div>
    </div>
  );
}
