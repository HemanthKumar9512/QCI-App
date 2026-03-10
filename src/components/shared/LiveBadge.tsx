import React from 'react';

const LiveBadge: React.FC<{ label?: string }> = ({ label = 'LIVE' }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-qci-green/10 text-qci-green text-xs font-mono font-semibold">
    <span className="w-1.5 h-1.5 rounded-full bg-qci-green animate-pulse-glow" />
    {label}
  </span>
);

export default LiveBadge;
