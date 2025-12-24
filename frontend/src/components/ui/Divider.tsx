import React from 'react';
import { cn } from '@/lib/utils';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className,
  label,
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn('w-px h-full bg-gray-200', className)}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div className={cn('relative flex items-center py-4', className)}>
        <div className="flex-grow border-t border-gray-200" />
        <span className="px-4 text-sm text-gray-500 font-medium">{label}</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>
    );
  }

  return (
    <div
      className={cn('divider', className)}
      role="separator"
      aria-orientation="horizontal"
    />
  );
};

export default Divider;


