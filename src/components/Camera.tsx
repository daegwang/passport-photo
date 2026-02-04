'use client';

import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

export interface CameraHandle {
  capture: () => void;
  toggleCamera: () => void;
  triggerUpload: () => void;
  isMobile: boolean;
  isReady: boolean;
}

interface CameraProps {
  onCapture: (imageDataUrl: string) => void;
  isActive: boolean;
}

const Camera = forwardRef<CameraHandle, CameraProps>(({ onCapture, isActive }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    const startCamera = async () => {
      try {
        setError('');
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1080 },
            height: { ideal: 1080 },
            facingMode: facingMode === 'environment' ? { exact: 'environment' } : 'user',
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Unable to access camera. Please check permissions or use file upload.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive, facingMode]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropSize = Math.min(vw, vh);
    const sx = (vw - cropSize) / 2;
    const sy = (vh - cropSize) / 2;

    canvas.width = cropSize;
    canvas.height = cropSize;

    if (facingMode === 'user') {
      context.translate(cropSize, 0);
      context.scale(-1, 1);
    }

    context.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, cropSize, cropSize);
    context.setTransform(1, 0, 0, 1, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(imageDataUrl);
  }, [onCapture, facingMode]);

  const toggleCameraFn = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target?.result as string;
      onCapture(imageDataUrl);
    };
    reader.readAsDataURL(file);
  }, [onCapture]);

  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    capture: capturePhoto,
    toggleCamera: toggleCameraFn,
    triggerUpload: () => fileInputRef.current?.click(),
    isMobile,
    isReady: !!stream && !error,
  }), [capturePhoto, toggleCameraFn, isMobile, stream, error]);

  const isFrontCamera = facingMode === 'user';

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
});

Camera.displayName = 'Camera';
export default Camera;
