import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  trend?: number;
  color: 'cyan' | 'purple' | 'gold' | 'green' | 'red' | 'blue' | 'pink';
  sublabel?: string;
  icon?: LucideIcon;
}

const colorMap: Record<string, string> = {
  cyan: 'border-l-qci-cyan',
  purple: 'border-l-qci-purple',
  gold: 'border-l-qci-gold',
  green: 'border-l-qci-green',
  red: 'border-l-qci-red',
  blue: 'border-l-qci-blue',
  pink: 'border-l-qci-pink',
};
const glowMap: Record<string, string> = {
  cyan: 'glow-cyan', purple: 'glow-purple', gold: 'glow-gold',
  green: 'glow-green', red: 'glow-red', blue: '', pink: '',
};
const iconColorMap: Record<string, string> = {
  cyan: 'text-qci-cyan', purple: 'text-qci-purple', gold: 'text-qci-gold',
  green: 'text-qci-green', red: 'text-qci-red', blue: 'text-qci-blue', pink: 'text-qci-pink',
};

function formatValue(value: number, format?: string): string {
  if (format === 'currency') return `$${value.toLocaleString()}`;
  if (format === 'percent') return `${value}%`;
  return value.toLocaleString();
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, format, trend, color, sublabel, icon: Icon }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <motion.div
      className={`bg-card border border-border rounded-lg p-4 border-l-4 ${colorMap[color]} hover:-translate-y-0.5 transition-transform cursor-default ${glowMap[color]}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-body uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-heading font-bold mt-1">{formatValue(displayValue, format)}</p>
          {sublabel && <p className="text-muted-foreground text-xs mt-1">{sublabel}</p>}
        </div>
        {Icon && <Icon className={`w-5 h-5 ${iconColorMap[color]} mt-1 flex-shrink-0`} />}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-qci-green' : 'text-qci-red'}`}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </motion.div>
  );
};

export default MetricCard;
