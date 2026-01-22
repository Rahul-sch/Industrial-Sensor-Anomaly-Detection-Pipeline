'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { SM2Quality } from '@/lib/spaced-repetition';

interface FlashcardKeyboardOptions {
  // Card navigation
  onNext?: () => void;
  onPrevious?: () => void;
  onFlip?: () => void;

  // SM-2 review actions
  onReview?: (quality: SM2Quality) => void;

  // Deck controls
  onShuffle?: () => void;
  onReset?: () => void;

  // Mode controls
  onExit?: () => void;

  // State
  isFlipped?: boolean;
  enabled?: boolean;
}

interface KeyBinding {
  key: string;
  description: string;
  action: () => void;
  requiresFlip?: boolean;
}

export function useFlashcardKeyboard({
  onNext,
  onPrevious,
  onFlip,
  onReview,
  onShuffle,
  onReset,
  onExit,
  isFlipped = false,
  enabled = true,
}: FlashcardKeyboardOptions) {
  // Track modifier keys
  const modifiersRef = useRef({ ctrl: false, shift: false, alt: false });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Update modifier tracking
      modifiersRef.current = {
        ctrl: event.ctrlKey || event.metaKey,
        shift: event.shiftKey,
        alt: event.altKey,
      };

      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const { key } = event;
      const modifiers = modifiersRef.current;

      // Navigation
      switch (key) {
        case ' ':
        case 'Enter':
          event.preventDefault();
          onFlip?.();
          break;

        case 'ArrowRight':
        case 'l':
        case 'j':
          event.preventDefault();
          onNext?.();
          break;

        case 'ArrowLeft':
        case 'h':
        case 'k':
          event.preventDefault();
          onPrevious?.();
          break;

        // SM-2 Quality ratings (only when flipped)
        case '1':
          if (isFlipped && onReview) {
            event.preventDefault();
            onReview(0); // Again
          }
          break;

        case '2':
          if (isFlipped && onReview) {
            event.preventDefault();
            onReview(1); // Hard
          }
          break;

        case '3':
          if (isFlipped && onReview) {
            event.preventDefault();
            onReview(3); // Good
          }
          break;

        case '4':
          if (isFlipped && onReview) {
            event.preventDefault();
            onReview(5); // Easy
          }
          break;

        // Alternative ratings using letters
        case 'a':
          if (isFlipped && onReview && !modifiers.ctrl) {
            event.preventDefault();
            onReview(0); // Again
          }
          break;

        case 'd':
          if (isFlipped && onReview && !modifiers.ctrl) {
            event.preventDefault();
            onReview(1); // Hard (Difficult)
          }
          break;

        case 'g':
          if (isFlipped && onReview && !modifiers.ctrl) {
            event.preventDefault();
            onReview(3); // Good
          }
          break;

        case 'e':
          if (isFlipped && onReview && !modifiers.ctrl) {
            event.preventDefault();
            onReview(5); // Easy
          }
          break;

        // Deck controls
        case 's':
          if (modifiers.shift && onShuffle) {
            event.preventDefault();
            onShuffle();
          }
          break;

        case 'r':
          if (modifiers.shift && onReset) {
            event.preventDefault();
            onReset();
          }
          break;

        // Exit
        case 'Escape':
          event.preventDefault();
          onExit?.();
          break;

        case 'q':
          if (!modifiers.ctrl) {
            event.preventDefault();
            onExit?.();
          }
          break;
      }
    },
    [enabled, isFlipped, onNext, onPrevious, onFlip, onReview, onShuffle, onReset, onExit]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Return key bindings for help display
  const keyBindings: KeyBinding[] = [
    { key: 'Space / Enter', description: 'Flip card', action: () => onFlip?.() },
    { key: '← / h / k', description: 'Previous card', action: () => onPrevious?.() },
    { key: '→ / l / j', description: 'Next card', action: () => onNext?.() },
    {
      key: '1 / a',
      description: 'Again (forgot)',
      action: () => onReview?.(0),
      requiresFlip: true,
    },
    {
      key: '2 / d',
      description: 'Hard (struggled)',
      action: () => onReview?.(1),
      requiresFlip: true,
    },
    {
      key: '3 / g',
      description: 'Good (knew it)',
      action: () => onReview?.(3),
      requiresFlip: true,
    },
    {
      key: '4 / e',
      description: 'Easy (perfect)',
      action: () => onReview?.(5),
      requiresFlip: true,
    },
    { key: 'Shift+S', description: 'Shuffle deck', action: () => onShuffle?.() },
    { key: 'Shift+R', description: 'Reset deck', action: () => onReset?.() },
    { key: 'Esc / q', description: 'Exit review', action: () => onExit?.() },
  ];

  return { keyBindings };
}

// Keyboard shortcut help component
export function KeyboardShortcutsHelp({
  bindings,
  className = '',
}: {
  bindings: KeyBinding[];
  className?: string;
}) {
  return (
    <div className={`p-4 bg-[var(--background-secondary)] rounded-lg ${className}`}>
      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Keyboard Shortcuts
      </h4>
      <div className="space-y-2">
        {bindings.map((binding, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-[var(--foreground-muted)]">{binding.description}</span>
            <kbd className="px-2 py-0.5 bg-[var(--background-tertiary)] text-[var(--foreground)] rounded text-xs font-mono">
              {binding.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact keyboard hints
export function KeyboardHints({ isFlipped }: { isFlipped: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4 text-xs text-[var(--foreground-muted)]">
      <span>
        <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">Space</kbd> flip
      </span>
      <span>
        <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">←→</kbd> navigate
      </span>
      {isFlipped && (
        <span>
          <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">1-4</kbd> rate
        </span>
      )}
      <span>
        <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">Esc</kbd> exit
      </span>
    </div>
  );
}

export default useFlashcardKeyboard;
