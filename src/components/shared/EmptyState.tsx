import React from 'react';

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
      <span className="text-lg">∅</span>
    </div>
    <p className="text-sm">{message}</p>
  </div>
);

export default EmptyState;
