'use client';

import { useEffect, useState } from 'react';

interface StreakCounterProps {
  days?: number;
  streak?: number; // Alias for days
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs gap-1',
    flame: 'text-sm',
  },
  md: {
    container: 'px-3 py-1.5 text-sm gap-1.5',
    flame: 'text-lg',
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    flame: 'text-2xl',
  },
};

export function StreakCounter({
  days: daysProp,
  streak,
  showLabel = true,
  size = 'md',
  animate = true,
  className = '',
}: StreakCounterProps) {
  // Support both 'days' and 'streak' props
  const days = daysProp ?? streak ?? 0;
  const config = sizeConfig[size];

  // Determine flame intensity based on streak length
  const getFlameEmoji = () => {
    if (days >= 30) return '🔥'; // Strong flame for 30+ days
    if (days >= 14) return '🔥'; // Medium flame for 14+ days
    if (days >= 7) return '🔥';  // Getting warmer at 7 days
    if (days >= 1) return '🔥';  // Starting flame
    return '❄️';                  // Frozen if no streak
  };

  // Get gradient colors based on streak
  const getGradient = () => {
    if (days >= 30) {
      return 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(249, 115, 22, 0.25))';
    }
    if (days >= 14) {
      return 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.2))';
    }
    if (days >= 7) {
      return 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 191, 36, 0.15))';
    }
    if (days >= 1) {
      return 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(249, 115, 22, 0.1))';
    }
    return 'var(--background-tertiary)';
  };

  // Get border color
  const getBorderColor = () => {
    if (days >= 30) return 'rgba(239, 68, 68, 0.4)';
    if (days >= 14) return 'rgba(249, 115, 22, 0.4)';
    if (days >= 7) return 'rgba(249, 115, 22, 0.3)';
    if (days >= 1) return 'rgba(251, 191, 36, 0.3)';
    return 'var(--background-tertiary)';
  };

  // Get text color
  const getTextColor = () => {
    if (days >= 30) return 'var(--accent-red)';
    if (days >= 7) return 'var(--accent-orange)';
    if (days >= 1) return 'var(--accent-yellow)';
    return 'var(--foreground-muted)';
  };

  return (
    <div
      className={`streak-counter ${config.container} ${className}`}
      style={{
        background: getGradient(),
        borderColor: getBorderColor(),
        color: getTextColor(),
      }}
    >
      <span className={`${config.flame} ${animate ? 'streak-flame' : ''}`}>
        {getFlameEmoji()}
      </span>
      <span className="font-bold">{days}</span>
      {showLabel && (
        <span className="text-[var(--foreground-muted)] font-normal">
          {days === 1 ? 'day' : 'days'}
        </span>
      )}
    </div>
  );
}

// Celebration version for milestones
export function StreakMilestone({
  days,
  onDismiss,
}: {
  days: number;
  onDismiss?: () => void;
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onDismiss]);

  if (!show) return null;

  const getMilestoneMessage = () => {
    if (days >= 100) return 'Century Streak! You are unstoppable!';
    if (days >= 30) return 'Month-long streak! Amazing dedication!';
    if (days >= 14) return 'Two weeks strong! Keep it up!';
    if (days >= 7) return 'One week streak! You\'re on fire!';
    if (days >= 3) return 'Three day streak! Getting warmed up!';
    return 'Streak started! Keep going!';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className="bg-[var(--background-secondary)] border border-[var(--accent-orange)] rounded-2xl p-8 text-center shadow-2xl animate-fade-in pointer-events-auto"
        style={{
          boxShadow: '0 0 60px rgba(249, 115, 22, 0.3)',
        }}
      >
        <div className="text-6xl mb-4">🔥</div>
        <div className="text-4xl font-bold text-[var(--accent-orange)] mb-2">
          {days} Day Streak!
        </div>
        <div className="text-[var(--foreground-muted)]">
          {getMilestoneMessage()}
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setShow(false);
              onDismiss();
            }}
            className="mt-4 px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

// Compact inline version
export function InlineStreak({ days }: { days: number }) {
  if (days === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[var(--accent-orange)]">
      <span className="streak-flame text-sm">🔥</span>
      <span className="font-semibold">{days}</span>
    </span>
  );
}

export default StreakCounter;
