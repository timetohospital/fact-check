'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ScrollStepProps {
  children: ReactNode;
  index: number;
  isActive?: boolean;
  className?: string;
}

export default function ScrollStep({
  children,
  index,
  isActive = false,
  className = '',
}: ScrollStepProps) {
  return (
    <motion.div
      className={`scroll-step min-h-[60vh] flex items-center justify-center p-8 ${className}`}
      data-step={index}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: isActive ? 1 : 0.3 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-lg">
        {children}
      </div>
    </motion.div>
  );
}
