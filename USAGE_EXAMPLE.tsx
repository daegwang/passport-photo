/**
 * USAGE EXAMPLE - Copy this into your Next.js page
 * 
 * This is a complete, working example showing how to use the passport photo system.
 * Place this in app/passport-photo/page.tsx or pages/passport-photo.tsx
 */

'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { processPassportPhoto, ProcessingResult } from '@/lib/passportPhotoProcessor';
import ComplianceReport from '@/components/ComplianceReport';
import { Download, Upload, Camera, Image as ImageIcon } from 'lucide-react';

export default function PassportPhotoPage() {
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Process photo
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const processed = await processPassportPhoto(file);
      setResult(processed);
    } catch (err) {
      console.error('Processing failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to process photo. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result?.croppedDataURL) return;

    const link = document.createElement('a');
    link.href = result.croppedDataURL;
    link.download = `passport-photo-${Date.now()}.jpg`;
    link.click();
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            US Passport Photo Tool
          </h1>
          <p className="text-lg text-gray-600">
            Validate and crop your photo to meet official requirements
          </p>
        </div>

        {/* Upload Area */}
        {!result && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="max-w-md mx-auto">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="mb-2 text-sm text-gray-500 font-semibold">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, or JPEG (MAX. 10MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {loading && (
                <div className="mt-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                  <p className="mt-2 text-gray-600">Analyzing photo...</p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {result && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Original & Cropped Photos */}
            <div className="space-y-6">
              {/* Original Photo */}
              {previewUrl && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Original Photo
                  </h3>
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Cropped Photo */}
              {result.croppedDataURL && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Passport Photo (2×2″, 600×600px)
                  </h3>
                  <div className="flex justify-center mb-4">
                    <img
                      src={result.croppedDataURL}
                      alt="Cropped passport photo"
                      className="w-64 h-64 border-4 border-gray-300 rounded-lg shadow-md"
                    />
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download Photo
                  </button>
                </div>
              )}
            </div>

            {/* Right: Compliance Report */}
            <div>
              <ComplianceReport result={result.compliance} />
              
              <button
                onClick={handleReset}
                className="w-full mt-6 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                Upload Another Photo
              </button>
            </div>
          </div>
        )}

        {/* Requirements Info */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            US Passport Photo Requirements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Photo Specifications</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Size: 2×2 inches (51×51mm)</li>
                <li>• Taken within last 6 months</li>
                <li>• Color photo, clear and sharp</li>
                <li>• Plain white or off-white background</li>
                <li>• Full face, front view</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Your Appearance</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Neutral expression, both eyes open</li>
                <li>• Head covers 50-69% of frame</li>
                <li>• Eyes 56-69% from bottom</li>
                <li>• No glasses, hats, or headphones</li>
                <li>• Even lighting, no shadows</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
