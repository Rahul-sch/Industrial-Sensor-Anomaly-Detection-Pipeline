/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak.
 * This algorithm calculates optimal review intervals based on
 * how well you remember each flashcard.
 *
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect; correct answer remembered after seeing it
 * 2 - Incorrect; correct answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect response
 */

// SM-2 Quality rating type (0-5)
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

export interface SM2Input {
  quality: SM2Quality;    // 0-5 rating of recall quality
  interval: number;       // Current interval in days
  easeFactor: number;     // Current ease factor (default 2.5)
  repetitions: number;    // Number of successful repetitions
}

export interface SM2Result {
  interval: number;       // New interval in days
  easeFactor: number;     // New ease factor
  repetitions: number;    // Updated repetition count
  nextReviewDate: Date;   // When to review next
}

// Minimum ease factor to prevent cards from becoming too hard
const MIN_EASE_FACTOR = 1.3;

// Default ease factor for new cards
export const DEFAULT_EASE_FACTOR = 2.5;

// Default interval for new cards (in days)
export const DEFAULT_INTERVAL = 1;

/**
 * Calculate the next review using the SM-2 algorithm
 */
export function calculateSM2({
  quality,
  interval,
  easeFactor,
  repetitions,
}: SM2Input): SM2Result {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, quality));

  let newInterval: number;
  let newRepetitions: number;
  let newEaseFactor: number;

  // If quality < 3, the response was incorrect
  // Reset to the beginning of learning phase
  if (q < 3) {
    newRepetitions = 0;
    newInterval = 1;
    newEaseFactor = easeFactor; // Keep ease factor unchanged
  } else {
    // Correct response - advance to next interval
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }

    newRepetitions = repetitions + 1;

    // Update ease factor using SM-2 formula
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor =
      easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

    // Ensure ease factor doesn't go below minimum
    newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    interval: newInterval,
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

/**
 * Get cards that are due for review
 */
export function getCardsForReview<T extends { nextReview: string }>(
  cards: T[],
  targetDate: Date = new Date()
): T[] {
  const targetTime = targetDate.getTime();

  return cards.filter((card) => {
    const reviewTime = new Date(card.nextReview).getTime();
    return reviewTime <= targetTime;
  });
}

/**
 * Sort cards by priority (overdue first, then by ease factor)
 */
export function sortCardsByPriority<
  T extends { nextReview: string; easeFactor?: number }
>(cards: T[]): T[] {
  const now = Date.now();

  return [...cards].sort((a, b) => {
    const aTime = new Date(a.nextReview).getTime();
    const bTime = new Date(b.nextReview).getTime();

    // First, sort by how overdue they are
    const aOverdue = now - aTime;
    const bOverdue = now - bTime;

    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue; // More overdue first
    }

    // Then by ease factor (harder cards first)
    const aEase = a.easeFactor ?? DEFAULT_EASE_FACTOR;
    const bEase = b.easeFactor ?? DEFAULT_EASE_FACTOR;

    return aEase - bEase;
  });
}

/**
 * Determine card status based on interval and repetitions
 */
export function getCardStatus(
  interval: number,
  repetitions: number
): 'new' | 'learning' | 'review' | 'mastered' {
  if (repetitions === 0) {
    return 'new';
  } else if (repetitions < 3) {
    return 'learning';
  } else if (interval >= 21) {
    return 'mastered';
  }
  return 'review';
}

/**
 * Calculate review statistics
 */
export interface ReviewStats {
  newCards: number;
  learningCards: number;
  reviewCards: number;
  masteredCards: number;
  dueToday: number;
  overdueCards: number;
}

export function calculateReviewStats<
  T extends {
    nextReview: string;
    interval: number;
    repetitions?: number;
  }
>(cards: T[]): ReviewStats {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const stats: ReviewStats = {
    newCards: 0,
    learningCards: 0,
    reviewCards: 0,
    masteredCards: 0,
    dueToday: 0,
    overdueCards: 0,
  };

  for (const card of cards) {
    const status = getCardStatus(card.interval, card.repetitions ?? 0);

    switch (status) {
      case 'new':
        stats.newCards++;
        break;
      case 'learning':
        stats.learningCards++;
        break;
      case 'review':
        stats.reviewCards++;
        break;
      case 'mastered':
        stats.masteredCards++;
        break;
    }

    const reviewDate = new Date(card.nextReview);
    if (reviewDate <= todayEnd) {
      stats.dueToday++;
    }
    if (reviewDate < now) {
      stats.overdueCards++;
    }
  }

  return stats;
}

/**
 * Convert quality button to SM-2 quality score
 * UI typically shows: Again (0), Hard (3), Good (4), Easy (5)
 */
export type QualityButton = 'again' | 'hard' | 'good' | 'easy';

export function qualityButtonToScore(button: QualityButton): number {
  switch (button) {
    case 'again':
      return 0;
    case 'hard':
      return 3;
    case 'good':
      return 4;
    case 'easy':
      return 5;
  }
}

/**
 * Get human-readable interval description
 */
export function formatInterval(days: number): string {
  if (days < 1) {
    return 'Today';
  } else if (days === 1) {
    return '1 day';
  } else if (days < 7) {
    return `${days} days`;
  } else if (days < 14) {
    return '1 week';
  } else if (days < 30) {
    const weeks = Math.round(days / 7);
    return `${weeks} weeks`;
  } else if (days < 60) {
    return '1 month';
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} months`;
  } else {
    const years = Math.round(days / 365);
    return years === 1 ? '1 year' : `${years} years`;
  }
}

/**
 * Preview what intervals would be after each quality rating
 */
export interface IntervalPreview {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export function previewIntervals(
  currentInterval: number,
  currentEaseFactor: number,
  currentRepetitions: number
): IntervalPreview {
  const getInterval = (quality: SM2Quality) =>
    calculateSM2({
      quality,
      interval: currentInterval,
      easeFactor: currentEaseFactor,
      repetitions: currentRepetitions,
    }).interval;

  return {
    again: getInterval(0),
    hard: getInterval(3),
    good: getInterval(4),
    easy: getInterval(5),
  };
}
