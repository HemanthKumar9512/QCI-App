import React from 'react';
import { useQCIStore } from '@/store/qciStore';

interface PageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children, title, subtitle }) => {
  const collapsed = useQCIStore(s => s.sidebarCollapsed);

  return (
    <main
      className="pt-14 min-h-screen transition-all"
      style={{ marginLeft: collapsed ? 64 : 220 }}
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
};

export default PageWrapper;
