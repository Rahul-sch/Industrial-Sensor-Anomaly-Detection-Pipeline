'use client';

import { useState, useCallback } from 'react';
import type { FlashCard as FlashCardType } from '@/lib/types';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';

interface FlashCardProps {
  card: FlashCardType;
  isFlipped?: boolean;
  onFlip?: () => void;
  showDifficulty?: boolean;
  showCategory?: boolean;
  className?: string;
}

export function FlashCard({
  card,
  isFlipped: controlledFlipped,
  onFlip,
  showDifficulty = true,
  showCategory = true,
  className = '',
}: FlashCardProps) {
  // Support both controlled and uncontrolled modes
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped ?? internalFlipped;

  const handleFlip = useCallback(() => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped((prev) => !prev);
    }
  }, [onFlip]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      }
    },
    [handleFlip]
  );

  return (
    <div
      className={`flashcard ${isFlipped ? 'flipped' : ''} ${className}`}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? 'Show question' : 'Show answer'}
    >
      <div className="flashcard-inner">
        {/* Front - Question */}
        <div className="flashcard-front flex-col gap-4">
          {/* Meta info */}
          {(showDifficulty || showCategory) && (
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              {showDifficulty && (
                <DifficultyBadge difficulty={card.difficulty} size="sm" />
              )}
              {showCategory && (
                <span className="text-xs text-[var(--foreground-muted)] uppercase tracking-wide">
                  {card.category}
                </span>
              )}
            </div>
          )}

          {/* Question */}
          <p className="text-xl font-medium text-[var(--foreground)] leading-relaxed">
            {card.front}
          </p>

          {/* Hint to flip */}
          <p className="absolute bottom-4 text-xs text-[var(--foreground-muted)]">
            Click or press Space to reveal
          </p>
        </div>

        {/* Back - Answer */}
        <div className="flashcard-back flex-col gap-4 text-left">
          {/* Answer */}
          <div className="text-base text-[var(--foreground)] leading-relaxed overflow-y-auto max-h-full">
            {formatAnswer(card.back)}
          </div>

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1 justify-center">
              {card.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple markdown-like formatting for answers
function formatAnswer(text: string): React.ReactNode {
  const lines = text.split('\n');

  return lines.map((line, i) => {
    // Code blocks
    if (line.startsWith('```')) {
      return null; // Skip code fence markers
    }

    // Inline code
    const withCode = line.replace(
      /`([^`]+)`/g,
      '<code class="text-[var(--accent-cyan)] bg-[var(--code-bg)] px-1 py-0.5 rounded text-sm">$1</code>'
    );

    // Bold
    const withBold = withCode.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="text-[var(--foreground)] font-semibold">$1</strong>'
    );

    // List items
    if (line.trim().startsWith('(') || line.trim().match(/^\d+\)/)) {
      return (
        <div key={i} className="pl-4 mb-1">
          <span dangerouslySetInnerHTML={{ __html: withBold }} />
        </div>
      );
    }

    return (
      <p key={i} className="mb-2">
        <span dangerouslySetInnerHTML={{ __html: withBold }} />
      </p>
    );
  });
}

// Compact preview card for lists
export function FlashCardPreview({
  card,
  onClick,
}: {
  card: FlashCardType;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-lg hover:border-[var(--accent-cyan)] transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <DifficultyBadge difficulty={card.difficulty} size="sm" />
        <span className="text-xs text-[var(--foreground-muted)]">
          {card.category}
        </span>
      </div>
      <p className="text-sm text-[var(--foreground)] line-clamp-2">
        {card.front}
      </p>
    </button>
  );
}

export default FlashCard;
