import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChurnGaugeProps {
  score: number; // 0-1
  size?: number;
}

const ChurnGauge: React.FC<ChurnGaugeProps> = ({ score, size = 160 }) => {
  const clampedScore = Math.max(0, Math.min(1, score));
  const angle = clampedScore * 180;
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Arc path
  const startAngle = Math.PI;
  const endAngle = 0;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // Color based on score
  const getColor = (s: number) => {
    if (s < 0.25) return 'hsl(160, 84%, 39%)';
    if (s < 0.5) return 'hsl(217, 91%, 60%)';
    if (s < 0.75) return 'hsl(38, 92%, 50%)';
    return 'hsl(0, 84%, 60%)';
  };

  const getRiskLabel = (s: number) => {
    if (s < 0.25) return 'Low Risk';
    if (s < 0.5) return 'Medium Risk';
    if (s < 0.75) return 'High Risk';
    return 'Critical';
  };

  const needleAngle = 180 + angle;
  const needleLen = r - 8;
  const nx = cx + needleLen * Math.cos((needleAngle * Math.PI) / 180);
  const ny = cy + needleLen * Math.sin((needleAngle * Math.PI) / 180);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background arc */}
        <path d={arcPath} fill="none" stroke="hsl(var(--qci-border))" strokeWidth="8" strokeLinecap="round" />
        {/* Colored arc */}
        <path
          d={arcPath}
          fill="none"
          stroke={getColor(clampedScore)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * r}`}
          strokeDashoffset={`${Math.PI * r * (1 - clampedScore)}`}
        />
        {/* Needle */}
        <motion.line
          x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={getColor(clampedScore)} strokeWidth="2.5" strokeLinecap="round"
          initial={{ x2: cx - needleLen, y2: cy }}
          animate={{ x2: nx, y2: ny }}
          transition={{ type: 'spring', stiffness: 60, damping: 12 }}
        />
        <circle cx={cx} cy={cy} r="4" fill={getColor(clampedScore)} />
        {/* Percentage */}
        <text x={cx} y={cy - 12} textAnchor="middle" fill="hsl(var(--qci-text))"
          style={{ fontSize: size * 0.16, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          {Math.round(clampedScore * 100)}%
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill={getColor(clampedScore)}
          style={{ fontSize: size * 0.08, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
          {getRiskLabel(clampedScore)}
        </text>
      </svg>
    </div>
  );
};

export default ChurnGauge;
