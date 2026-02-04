'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Instructions from '@/components/Instructions';
import PhotoCapture from '@/components/PhotoCapture';
import ComplianceReport from '@/components/ComplianceReport';
import ExportPanel from '@/components/ExportPanel';
import AnnotatedPhoto from '@/components/AnnotatedPhoto';
import { processPassportPhoto, type ProcessingResult } from '@/lib/passportPhotoProcessor';

type Step = 'instructions' | 'capture' | 'processing' | 'results';

/** Canvas-based passport photo preview — avoids Tailwind img resets */
function PassportPreviewCanvas({ sourceCanvas }: { sourceCanvas: HTMLCanvasElement }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(sourceCanvas, 0, 0, 256, 256);
  }, [sourceCanvas]);

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={256}
      className="rounded w-48 h-48 sm:w-64 sm:h-64"
    />
  );
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('instructions');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process photo when captured
  const handlePhotoConfirmed = async (imageDataUrl: string) => {
    setCapturedPhoto(imageDataUrl);
    setCurrentStep('processing');
    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Load image from data URL
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageDataUrl;
      });

      // Process the photo (face detection + compliance + crop)
      const result = await processPassportPhoto(img);
      setProcessingResult(result);
      setCurrentStep('results');
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError(
        error instanceof Error ? error.message : 'An error occurred while processing your photo'
      );
      setCurrentStep('results');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setProcessingResult(null);
    setProcessingError(null);
    setCurrentStep('capture');
  };

  const handleStartOver = () => {
    setCapturedPhoto(null);
    setProcessingResult(null);
    setProcessingError(null);
    setCurrentStep('instructions');
  };

  // Calculate step completion
  const getStepStatus = (step: Step) => {
    const stepOrder: Step[] = ['instructions', 'capture', 'processing', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <h1 className="text-lg sm:text-2xl font-bold text-white text-center">
            PassportPhoto 📸
          </h1>
        </div>
      </header>

      {/* Step Bar */}
      {(() => {
        const steps = [
          { id: 'instructions' as const, label: 'Setup', num: 1 },
          { id: 'capture' as const, label: 'Photo', num: 2 },
          { id: 'processing' as const, label: 'Review', num: 3 },
          { id: 'results' as const, label: 'Export', num: 4 },
        ];
        const currentIndex = steps.findIndex(s => s.id === currentStep);
        // Progress: 0% at step 0, 100% at last step
        const progressPercent = (currentIndex / (steps.length - 1)) * 100;

        return (
          <div className="bg-gray-900/80 border-b border-gray-800/50 py-3 sm:py-4">
            <div className="max-w-md mx-auto px-6">
              {/* Steps row with connecting line */}
              <div className="relative flex justify-between">
                {/* Background track (circle center to circle center) */}
                <div className="absolute top-[14px] sm:top-[16px] h-[2px] bg-gray-700/80 rounded-full" style={{ left: 14, right: 14 }} />
                {/* Animated progress fill */}
                <div
                  className="absolute top-[14px] sm:top-[16px] h-[2px] bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ left: 14, width: `calc((100% - 28px) * ${progressPercent / 100})` }}
                />

                {steps.map((step) => {
                  const status = getStepStatus(step.id);
                  const isCompleted = status === 'completed';
                  const isActive = status === 'active';

                  return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`
                          w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300
                          ${isActive
                            ? 'bg-blue-500 text-white ring-[3px] ring-blue-500/30'
                            : isCompleted
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800 text-gray-500 border-2 border-gray-600'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : step.num}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs mt-1 font-medium transition-colors whitespace-nowrap
                          ${isActive ? 'text-blue-400' : isCompleted ? 'text-blue-400/70' : 'text-gray-600'}
                        `}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Step Content */}
      <div className={`max-w-5xl mx-auto ${currentStep === 'capture' ? '' : 'px-4 pt-4 sm:pt-6'}`}>
          {/* Step 1: Instructions */}
          {currentStep === 'instructions' && (
            <div>
              <Instructions />
              <div className="mt-3 text-center">
                <button
                  onClick={() => setCurrentStep('capture')}
                  className="w-full max-w-lg mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                >
                  📸 Start Taking Photo
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Capture Photo */}
          {currentStep === 'capture' && (
            <PhotoCapture
              onPhotoConfirmed={handlePhotoConfirmed}
              onBack={() => setCurrentStep('instructions')}
            />
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && (
            <div className="bg-gray-900 rounded-2xl shadow-xl p-12 text-center border border-gray-800">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-500 mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Processing Your Photo...
              </h2>
              <p className="text-gray-400">
                Detecting face, checking compliance, and preparing your passport photo
              </p>
              <div className="mt-6 space-y-2 text-sm text-gray-500">
                <p>✓ Loading face detection model</p>
                <p>✓ Analyzing face position and size</p>
                <p>✓ Checking US passport requirements</p>
                <p>✓ Cropping to specifications</p>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === 'results' && (
            <div className="space-y-8">
              {/* Error State */}
              {processingError && (
                <div className="bg-red-950 border-2 border-red-800 rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-red-300 mb-3">
                    Processing Error
                  </h2>
                  <p className="text-red-400 mb-6">{processingError}</p>
                  <button
                    onClick={handleRetake}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Success State */}
              {processingResult && !processingError && (
                <>
                  {/* Photo Preview */}
                  <div className="bg-gray-900 rounded-2xl shadow-xl p-4 sm:p-8 border border-gray-800">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
                      Your Passport Photo
                    </h2>
                    <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center justify-center">
                      {/* Analysis */}
                      <div className="flex flex-col items-center">
                        <p className="text-sm font-semibold text-gray-400 mb-2 text-center">Analysis</p>
                        <AnnotatedPhoto
                          imageSrc={capturedPhoto || ''}
                          compliance={processingResult.compliance}
                        />
                      </div>

                      {/* Cropped passport photo — rendered via canvas to avoid img CSS resets */}
                      {processingResult.croppedCanvas && (
                        <>
                          <div className="text-3xl text-gray-600 rotate-90 md:rotate-0">→</div>
                          <div className="flex flex-col items-center">
                            <p className="text-sm font-semibold text-gray-400 mb-2 text-center">
                              Passport Photo (2×2&quot;)
                            </p>
                            <div className="bg-white p-2 rounded-lg shadow-lg">
                              <PassportPreviewCanvas sourceCanvas={processingResult.croppedCanvas} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Compliance Report */}
                  <ComplianceReport result={processingResult.compliance} />

                  {/* Action Buttons */}
                  <div className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
                    {processingResult.compliance.passed ? (
                      /* Passed - Show Export Options */
                      <div className="space-y-6">
                        <ExportPanel photoCanvas={processingResult.croppedCanvas || null} />
                        
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
                          <button
                            onClick={handleRetake}
                            className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-semibold transition-colors"
                          >
                            ← Retake Photo
                          </button>
                          <button
                            onClick={handleStartOver}
                            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded-lg font-semibold transition-colors"
                          >
                            Start Over
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Failed - Show Retake */
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-4">
                          Photo Needs Adjustment
                        </h3>
                        <p className="text-gray-400 mb-6">
                          Please review the requirements above and take a new photo
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button
                            onClick={handleRetake}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg"
                          >
                            Retake Photo
                          </button>
                          <button
                            onClick={handleStartOver}
                            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-semibold text-lg transition-colors"
                          >
                            Back to Instructions
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
      </div>

      {/* Footer — hide during capture */}
      <footer className={`max-w-7xl mx-auto px-4 py-1 sm:py-3 text-center ${currentStep === 'capture' ? 'hidden' : ''}`}>
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 max-w-lg mx-auto">
          <p className="font-semibold text-gray-300 mb-2">
            📌 Important Notice
          </p>
          <p className="text-sm text-gray-400">
            This tool helps you create passport-compliant photos using US State Department guidelines.
            While we check for technical compliance, official acceptance is determined by the passport agency.
            Always verify current requirements at{' '}
            <a
              href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline font-medium"
            >
              travel.state.gov
            </a>
          </p>
          <p className="text-xs text-gray-600 mt-4">
            PassportPhoto • Free & Open Source • No data stored or uploaded
          </p>
        </div>
      </footer>
    </main>
  );
}
