'use client';

import { ReactNode } from 'react';

interface StickyChartProps {
  children: ReactNode;
  className?: string;
}

export default function StickyChart({ children, className = '' }: StickyChartProps) {
  return (
    <div
      className={`sticky top-[10vh] h-[80vh] flex items-center justify-center ${className}`}
    >
      <div className="w-full max-w-2xl flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
