'use client';

import React from 'react';
import { ComplianceResult, getComplianceSummary } from '@/lib/compliance';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ComplianceReportProps {
  result: ComplianceResult;
  className?: string;
}

export default function ComplianceReport({ result, className = '' }: ComplianceReportProps) {
  const summary = getComplianceSummary(result);

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 p-6 ${className}`}>
      {/* Overall Status */}
      <div className="mb-6">
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            result.passed
              ? 'bg-green-950/50 border-2 border-green-800'
              : 'bg-red-950/50 border-2 border-red-800'
          }`}
        >
          {result.passed ? (
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
          )}
          <div>
            <h3
              className={`text-lg font-semibold ${
                result.passed ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {result.passed ? 'Photo Approved!' : 'Adjustments Needed'}
            </h3>
            <p
              className={`text-sm ${
                result.passed ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {summary}
            </p>
          </div>
        </div>
      </div>

      {/* Individual Checks */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Requirements
        </h4>
        {result.checks.map((check) => (
          <div
            key={check.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              check.passed
                ? 'bg-green-950/30 hover:bg-green-950/50'
                : 'bg-red-950/30 hover:bg-red-950/50'
            }`}
          >
            {check.passed ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h5
                className={`text-sm font-medium ${
                  check.passed ? 'text-green-300' : 'text-red-300'
                }`}
              >
                {check.label}
              </h5>
              <p
                className={`text-sm mt-1 ${
                  check.passed ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {check.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics (Debug/Advanced Info) */}
      {result.metrics && (
        <details className="mt-6">
          <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-300">
            Technical Metrics
          </summary>
          <div className="mt-3 p-4 bg-gray-800 rounded-lg text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Faces Detected:</span>
              <span className="font-mono text-gray-200">{result.metrics.faceCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Head Height:</span>
              <span className="font-mono text-gray-200">
                {result.metrics.headHeightPercent.toFixed(1)}%
                <span className="text-gray-500 ml-2">(target: 50-69%)</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Eye Height:</span>
              <span className="font-mono text-gray-200">
                {result.metrics.eyeHeightPercent.toFixed(1)}%
                <span className="text-gray-500 ml-2">(target: 56-69%)</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Head Tilt:</span>
              <span className="font-mono text-gray-200">
                {result.metrics.headTiltDegrees.toFixed(1)}°
                <span className="text-gray-500 ml-2">(max: 5°)</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Horizontal Offset:</span>
              <span className="font-mono text-gray-200">
                {result.metrics.horizontalCenterOffset.toFixed(1)}%
                <span className="text-gray-500 ml-2">(max: 10%)</span>
              </span>
            </div>
          </div>
        </details>
      )}

      {/* Helpful Tips for Failed Checks */}
      {!result.passed && (
        <div className="mt-6 p-4 bg-blue-950/50 border border-blue-800 rounded-lg">
          <h5 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Tips for Better Results
          </h5>
          <ul className="text-sm text-blue-400 space-y-1 ml-6 list-disc">
            <li>Ensure good, even lighting on your face</li>
            <li>Use a plain white or off-white background</li>
            <li>Look directly at the camera with a neutral expression</li>
            <li>Remove glasses, hats, and headphones</li>
            <li>Keep your head straight and level</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function ComplianceReportCompact({ result }: ComplianceReportProps) {
  const passedCount = result.checks.filter((c) => c.passed).length;
  const totalCount = result.checks.length;

  return (
    <div className="flex items-center gap-2">
      {result.passed ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600" />
      )}
      <span
        className={`text-sm font-medium ${
          result.passed ? 'text-green-900' : 'text-red-900'
        }`}
      >
        {passedCount}/{totalCount} checks passed
      </span>
    </div>
  );
}
