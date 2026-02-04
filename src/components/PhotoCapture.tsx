'use client';

import { useState, useRef, useEffect } from 'react';
import Camera, { type CameraHandle } from './Camera';
import GuidanceOverlay from './GuidanceOverlay';

interface PhotoCaptureProps {
  onPhotoConfirmed: (imageDataUrl: string) => void;
  onBack?: () => void;
}

export default function PhotoCapture({ onPhotoConfirmed, onBack }: PhotoCaptureProps) {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showTips, setShowTips] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<CameraHandle>(null);

  // Detect mobile for flip button
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleCapture = (imageDataUrl: string) => {
    setCapturedPhoto(imageDataUrl);
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleUsePhoto = () => {
    if (capturedPhoto) {
      onPhotoConfirmed(capturedPhoto);
    }
  };

  return (
    <div className="w-full sm:max-w-xl mx-auto px-0 sm:px-4">
      <div className="relative w-full shadow-2xl">
        {capturedPhoto ? (
          /* Preview captured photo */
          <div>
            <div className="aspect-square max-h-[80vh] bg-gray-900 sm:rounded-t-xl overflow-hidden">
              <img
                src={capturedPhoto}
                alt="Captured photo"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Preview buttons */}
            <div className="flex gap-3 px-4 py-3 bg-gray-900 sm:rounded-b-xl">
              <button
                onClick={handleRetake}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold text-base transition-colors active:scale-[0.98]"
              >
                ← Retake
              </button>
              <button
                onClick={handleUsePhoto}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-base transition-colors active:scale-[0.98] shadow-lg"
              >
                Use This Photo →
              </button>
            </div>
          </div>
        ) : (
          /* Camera mode */
          <div ref={containerRef}>
            {/* Camera view — square */}
            <div className="relative aspect-square max-h-[80vh] overflow-hidden sm:rounded-t-xl">
              <Camera ref={cameraRef} onCapture={handleCapture} isActive={!capturedPhoto} />

              {/* Guidance overlay */}
              {containerSize.width > 0 && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                  <GuidanceOverlay
                    width={containerSize.width}
                    height={containerSize.width}
                  />
                </div>
              )}

              {/* Tips button */}
              <button
                onClick={() => setShowTips(!showTips)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-sm font-bold z-20 transition-colors"
                aria-label="Photo tips"
              >
                ?
              </button>

              {showTips && (
                <div className="absolute top-14 right-3 bg-black/80 backdrop-blur-sm text-white rounded-lg p-3 text-xs max-w-[200px] z-20 shadow-lg">
                  <ul className="space-y-1.5">
                    <li>📐 Face within the blue oval</li>
                    <li>👁️ Eyes at the yellow line</li>
                    <li>😐 Neutral expression</li>
                    <li>🚫 No glasses/hats</li>
                    <li>💡 Even lighting</li>
                  </ul>
                  <button
                    onClick={() => setShowTips(false)}
                    className="mt-2 text-white/60 hover:text-white text-[10px] w-full text-center"
                  >
                    tap to dismiss
                  </button>
                </div>
              )}

              {/* Back button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="absolute top-3 left-3 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full text-xs font-medium z-20 transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>

            {/* Controls bar — separate section below camera */}
            <div className="flex items-center justify-center gap-6 py-3 bg-gray-900 sm:rounded-b-xl">
              {/* Upload */}
              <button
                onClick={() => cameraRef.current?.triggerUpload()}
                className="w-11 h-11 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors active:scale-95"
                aria-label="Upload photo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Capture */}
              <button
                onClick={() => cameraRef.current?.capture()}
                className="w-16 h-16 rounded-full bg-white border-4 border-gray-400 hover:border-blue-500 active:scale-95 transition-all shadow-lg p-1"
                aria-label="Take photo"
              >
                <div className="w-full h-full rounded-full bg-white" />
              </button>

              {/* Flip camera */}
              {isMobile ? (
                <button
                  onClick={() => cameraRef.current?.toggleCamera()}
                  className="w-11 h-11 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors active:scale-95"
                  aria-label="Switch camera"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              ) : (
                <div className="w-11 h-11" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
