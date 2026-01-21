'use client';

import type { Difficulty } from '@/lib/types';
import { getDifficultyConfig, getDifficultyClassName } from '@/lib/difficulty';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function DifficultyBadge({
  difficulty,
  showIcon = true,
  showLabel = true,
  size = 'md',
  className = '',
}: DifficultyBadgeProps) {
  const config = getDifficultyConfig(difficulty);
  const difficultyClass = getDifficultyClassName(difficulty);

  return (
    <span
      className={`
        difficulty-badge ${difficultyClass} ${sizeClasses[size]}
        ${className}
      `}
      title={config.description}
    >
      {showIcon && (
        <span className={iconSizes[size]} role="img" aria-label={config.label}>
          {config.icon}
        </span>
      )}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Quick access badges for common use cases
export function BeginnerBadge(props: Omit<DifficultyBadgeProps, 'difficulty'>) {
  return <DifficultyBadge difficulty="beginner" {...props} />;
}

export function IntermediateBadge(props: Omit<DifficultyBadgeProps, 'difficulty'>) {
  return <DifficultyBadge difficulty="intermediate" {...props} />;
}

export function AdvancedBadge(props: Omit<DifficultyBadgeProps, 'difficulty'>) {
  return <DifficultyBadge difficulty="advanced" {...props} />;
}

export function CriticalBadge(props: Omit<DifficultyBadgeProps, 'difficulty'>) {
  return <DifficultyBadge difficulty="critical" {...props} />;
}

// Compact version showing just icon
export function DifficultyIcon({
  difficulty,
  size = 'md',
}: {
  difficulty: Difficulty;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <DifficultyBadge
      difficulty={difficulty}
      showIcon={true}
      showLabel={false}
      size={size}
    />
  );
}

export default DifficultyBadge;
