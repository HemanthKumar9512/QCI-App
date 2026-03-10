import React from 'react';

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <div className="flex items-center justify-center p-4">
    <svg width={size} height={size} viewBox="0 0 40 40" className="animate-spin">
      <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--qci-border))" strokeWidth="3" />
      <circle cx="20" cy="20" r="16" fill="none" stroke="hsl(var(--qci-cyan))" strokeWidth="3"
        strokeDasharray="25 75" strokeLinecap="round" />
    </svg>
  </div>
);

export default LoadingSpinner;
