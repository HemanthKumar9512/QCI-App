import React from 'react';
import type { RiskLevel } from '@/types/customer';

const colorMap: Record<RiskLevel, string> = {
  critical: 'bg-qci-red/15 text-qci-red',
  high: 'bg-qci-gold/15 text-qci-gold',
  medium: 'bg-qci-blue/15 text-qci-blue',
  low: 'bg-qci-green/15 text-qci-green',
};

const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => (
  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-semibold capitalize ${colorMap[level]}`}>
    {level}
  </span>
);

export default RiskBadge;
