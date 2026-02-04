'use client';

import { useState } from 'react';

export default function Instructions() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Quick checklist */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
          Quick Checklist
        </h2>
        <ul className="text-left text-sm sm:text-base text-gray-300 space-y-2 mb-5">
          <li className="flex items-center gap-2">☐ White wall or sheet behind you</li>
          <li className="flex items-center gap-2">☐ Good, even lighting (face a window)</li>
          <li className="flex items-center gap-2">☐ Remove glasses, hats, headphones</li>
          <li className="flex items-center gap-2">☐ Neutral expression, eyes open</li>
          <li className="flex items-center gap-2">☐ Stand ~4 feet from the wall</li>
        </ul>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
        >
          {showDetails ? 'Hide details ▲' : 'More details & baby tips ▼'}
        </button>

        {showDetails && (
          <div className="mt-4 text-left space-y-4 border-t border-gray-700 pt-4">
            <div>
              <h3 className="font-semibold text-gray-200 text-sm mb-2">📋 US Passport Requirements</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>✓ 2×2 inches, white background</li>
                <li>✓ Head 1–1⅜" from top to chin</li>
                <li>✓ Photo taken within last 6 months</li>
                <li>✓ Color photo, neutral expression</li>
              </ul>
            </div>

            <div className="bg-pink-950/50 rounded-lg p-3 border border-pink-800">
              <h3 className="font-semibold text-gray-200 text-sm mb-2">👶 Baby Photo Tips</h3>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Lay baby on white sheet, photo from above</li>
                <li>• Try when alert & content (after feeding)</li>
                <li>• Eyes open, no hands in frame</li>
                <li>• Take many photos — you only need one!</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
