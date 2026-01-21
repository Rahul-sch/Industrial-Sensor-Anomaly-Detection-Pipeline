'use client';

import { useMemo } from 'react';
import { previewIntervals, type SM2Quality } from '@/lib/spaced-repetition';

interface FlashCardReviewButtonsProps {
  onReview: (quality: SM2Quality) => void;
  currentInterval?: number;
  currentEaseFactor?: number;
  currentRepetitions?: number;
  disabled?: boolean;
  showIntervals?: boolean;
  className?: string;
}

interface ReviewButton {
  quality: SM2Quality;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  key: string;
}

const REVIEW_BUTTONS: ReviewButton[] = [
  {
    quality: 0,
    label: 'Again',
    shortLabel: '1',
    description: "Complete blackout, didn't know at all",
    color: 'var(--accent-red)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    hoverColor: 'rgba(239, 68, 68, 0.25)',
    key: '1',
  },
  {
    quality: 1,
    label: 'Hard',
    shortLabel: '2',
    description: 'Incorrect, but upon seeing answer, remembered',
    color: 'var(--accent-orange)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    hoverColor: 'rgba(249, 115, 22, 0.25)',
    key: '2',
  },
  {
    quality: 3,
    label: 'Good',
    shortLabel: '3',
    description: 'Correct with some hesitation',
    color: 'var(--accent-cyan)',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    hoverColor: 'rgba(6, 182, 212, 0.25)',
    key: '3',
  },
  {
    quality: 5,
    label: 'Easy',
    shortLabel: '4',
    description: 'Perfect response, no hesitation',
    color: 'var(--accent-green)',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    hoverColor: 'rgba(16, 185, 129, 0.25)',
    key: '4',
  },
];

export function FlashCardReviewButtons({
  onReview,
  currentInterval = 0,
  currentEaseFactor = 2.5,
  currentRepetitions = 0,
  disabled = false,
  showIntervals = true,
  className = '',
}: FlashCardReviewButtonsProps) {
  // Calculate preview intervals for each button
  const intervals = useMemo(() => {
    return previewIntervals(currentInterval, currentEaseFactor, currentRepetitions);
  }, [currentInterval, currentEaseFactor, currentRepetitions]);

  // Format interval for display
  const formatInterval = (days: number): string => {
    if (days < 1) {
      const minutes = Math.round(days * 24 * 60);
      if (minutes < 60) return `${minutes}m`;
      return `${Math.round(minutes / 60)}h`;
    }
    if (days === 1) return '1d';
    if (days < 7) return `${Math.round(days)}d`;
    if (days < 30) return `${Math.round(days / 7)}w`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${Math.round(days / 365)}y`;
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Instruction */}
      <p className="text-center text-sm text-[var(--foreground-muted)]">
        How well did you know this?{' '}
        <span className="text-xs opacity-70">(Press 1-4 or click)</span>
      </p>

      {/* Buttons */}
      <div className="flex gap-2 justify-center">
        {REVIEW_BUTTONS.map((button) => {
          const interval = intervals[button.quality];

          return (
            <button
              key={button.quality}
              onClick={() => onReview(button.quality)}
              disabled={disabled}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all min-w-[80px] group"
              style={{
                backgroundColor: button.bgColor,
                border: `1px solid ${button.color}30`,
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = button.hoverColor;
                  e.currentTarget.style.borderColor = button.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = button.bgColor;
                e.currentTarget.style.borderColor = `${button.color}30`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title={button.description}
            >
              {/* Keyboard shortcut badge */}
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${button.color}20`,
                  color: button.color,
                }}
              >
                {button.shortLabel}
              </span>

              {/* Label */}
              <span
                className="font-semibold text-sm"
                style={{ color: button.color }}
              >
                {button.label}
              </span>

              {/* Preview interval */}
              {showIntervals && interval !== undefined && (
                <span className="text-xs text-[var(--foreground-muted)]">
                  {formatInterval(interval)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="text-center text-xs text-[var(--foreground-muted)] mt-1">
        <span className="opacity-70">
          Again = Reset · Hard = Struggled · Good = Knew it · Easy = Perfect
        </span>
      </div>
    </div>
  );
}

// Compact version for inline use
export function CompactReviewButtons({
  onReview,
  disabled = false,
}: {
  onReview: (quality: SM2Quality) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {REVIEW_BUTTONS.map((button) => (
        <button
          key={button.quality}
          onClick={() => onReview(button.quality)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: button.bgColor,
            color: button.color,
          }}
          title={`${button.label}: ${button.description}`}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}

// Hook for keyboard shortcuts
export function useReviewKeyboard(
  onReview: (quality: SM2Quality) => void,
  enabled: boolean = true
) {
  // This will be implemented in the keyboard hook file
  // For now, just return the mapping
  return {
    keyMap: {
      '1': 0 as SM2Quality,
      '2': 1 as SM2Quality,
      '3': 3 as SM2Quality,
      '4': 5 as SM2Quality,
    },
  };
}

export default FlashCardReviewButtons;
