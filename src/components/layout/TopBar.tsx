import React from 'react';
import { useQCIStore } from '@/store/qciStore';
import LiveBadge from '@/components/shared/LiveBadge';
import { Activity, Shield, Cpu } from 'lucide-react';

const TopBar: React.FC = () => {
  const metrics = useQCIStore(s => s.metrics);
  const collapsed = useQCIStore(s => s.sidebarCollapsed);

  return (
    <header
      className="fixed top-0 right-0 h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 z-20"
      style={{ left: collapsed ? 64 : 220, transition: 'left 0.2s' }}
    >
      <div className="flex items-center gap-4">
        <LiveBadge />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-3.5 h-3.5 text-qci-cyan" />
          <span>{metrics.totalEvents.toLocaleString()} events</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-qci-red" />
          <span>{metrics.criticalRisk} critical</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Cpu className="w-3.5 h-3.5 text-qci-purple" />
          <span>{metrics.quantumAccuracy}% accuracy</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground font-mono">
        QCI v2.0.0
      </div>
    </header>
  );
};

export default TopBar;
