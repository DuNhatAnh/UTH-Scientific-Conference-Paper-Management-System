
import React from 'react';

interface AIBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
}

export const AIBadge: React.FC<AIBadgeProps> = ({ label = "AI Analysis", size = "md" }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-semibold ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}`}>
      <span className="material-symbols-outlined text-[14px] animate-pulse">auto_awesome</span>
      <span>{label}</span>
    </div>
  );
};
