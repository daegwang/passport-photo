'use client';

interface GuidanceOverlayProps {
  width: number;
  height: number;
}

export default function GuidanceOverlay({ width, height }: GuidanceOverlayProps) {
  // US Passport photo specs: 2x2 inches
  // Head should be 1-1⅜ inches from bottom of chin to top of head
  // Eyes should be 1⅛-1⅜ inches from bottom
  
  // Calculate dimensions proportionally
  const aspectRatio = 1; // Square (2x2)
  const guideSize = Math.min(width, height) * 0.75; // 75% of container
  const guideX = (width - guideSize) / 2;
  const guideY = (height - guideSize) / 2;
  
  // Face oval — matches head bounds from guide lines
  const ovalWidth = guideSize * 0.55;
  const ovalX = width / 2;
  // ovalHeight and ovalY computed after guide lines below
  
  // Guide lines — aligned with cropPhoto.ts targets:
  // Eyes at 62.5% from bottom (37.5% from top)
  // Head height ~59.5% of frame
  // Head centered so top ~8% and chin ~67.5% from top
  const eyeLineY = guideY + guideSize * 0.375;  // Eyes at 62.5% from bottom
  const headHeightPct = 0.595;
  const topLineY = eyeLineY - guideSize * 0.25;  // ~top of head (eyes ~40% down within head)
  const chinLineY = topLineY + guideSize * headHeightPct; // chin = top + head height
  const ovalHeight = chinLineY - topLineY + guideSize * 0.05; // slightly taller than head bounds
  const ovalY = (topLineY + chinLineY) / 2; // centered between top and chin
  
  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      <defs>
        {/* Mask to darken area outside the oval */}
        <mask id="faceMask">
          <rect width={width} height={height} fill="white" />
          <ellipse
            cx={ovalX}
            cy={ovalY}
            rx={ovalWidth / 2}
            ry={ovalHeight / 2}
            fill="black"
          />
        </mask>
      </defs>
      
      {/* Darkened area outside oval */}
      <rect
        width={width}
        height={height}
        fill="black"
        opacity="0.5"
        mask="url(#faceMask)"
      />
      
      {/* Face oval guide */}
      <ellipse
        cx={ovalX}
        cy={ovalY}
        rx={ovalWidth / 2}
        ry={ovalHeight / 2}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="3"
        opacity="0.8"
      />
      
      {/* Top of head line */}
      <line
        x1={ovalX - ovalWidth / 2 - 20}
        y1={topLineY}
        x2={ovalX + ovalWidth / 2 + 20}
        y2={topLineY}
        stroke="#10b981"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.7"
      />
      <text
        x={ovalX + ovalWidth / 2 + 30}
        y={topLineY + 5}
        fill="#10b981"
        fontSize="12"
        fontWeight="bold"
      >
        Top
      </text>
      
      {/* Eye line guide */}
      <line
        x1={ovalX - ovalWidth / 2 - 20}
        y1={eyeLineY}
        x2={ovalX + ovalWidth / 2 + 20}
        y2={eyeLineY}
        stroke="#f59e0b"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.7"
      />
      <text
        x={ovalX + ovalWidth / 2 + 30}
        y={eyeLineY + 5}
        fill="#f59e0b"
        fontSize="12"
        fontWeight="bold"
      >
        Eyes
      </text>
      
      {/* Chin line guide */}
      <line
        x1={ovalX - ovalWidth / 2 - 20}
        y1={chinLineY}
        x2={ovalX + ovalWidth / 2 + 20}
        y2={chinLineY}
        stroke="#ef4444"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity="0.7"
      />
      <text
        x={ovalX + ovalWidth / 2 + 30}
        y={chinLineY + 5}
        fill="#ef4444"
        fontSize="12"
        fontWeight="bold"
      >
        Chin
      </text>
      
      {/* Instruction text — responsive font size */}
      <text
        x={width / 2}
        y={guideY - 10}
        textAnchor="middle"
        fill="white"
        fontSize={Math.max(12, Math.min(16, width * 0.035))}
        fontWeight="bold"
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
      >
        Align face with the guides · auto-crops to fit
      </text>
    </svg>
  );
}
