'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FlashCardProgress } from '@/lib/types';
import type { SM2Quality } from '@/lib/spaced-repetition';
import { calculateSM2, getCardsForReview, sortCardsByPriority } from '@/lib/spaced-repetition';
import { flashcardData } from '@/content/flashcards/flashcard-data';

interface FlashcardProgressState {
  // Per-card progress tracking
  cardProgress: Record<string, FlashCardProgress>;

  // Derived stats
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  dueToday: number;

  // Actions
  reviewCard: (cardId: string, quality: SM2Quality) => void;
  getCardProgress: (cardId: string) => FlashCardProgress | null;
  getCardsForReview: () => string[];
  getCardsByStatus: (status: 'new' | 'learning' | 'mastered') => string[];
  resetCardProgress: (cardId: string) => void;
  resetAllProgress: () => void;
  recalculateStats: () => void;
}

const DEFAULT_CARD_PROGRESS: Omit<FlashCardProgress, 'cardId'> = {
  interval: 0,
  easeFactor: 2.5,
  repetitions: 0,
  nextReview: new Date().toISOString(),
  lastReview: null,
  reviewCount: 0,
  correctCount: 0,
};

function createDefaultProgress(cardId: string): FlashCardProgress {
  return {
    cardId,
    ...DEFAULT_CARD_PROGRESS,
  };
}

function getCardStatus(progress: FlashCardProgress): 'new' | 'learning' | 'mastered' {
  if (progress.reviewCount === 0) return 'new';
  if (progress.interval >= 21) return 'mastered'; // 3+ weeks interval = mastered
  return 'learning';
}

export const useFlashcardProgress = create<FlashcardProgressState>()(
  persist(
    (set, get) => ({
      cardProgress: {},
      totalCards: flashcardData.length,
      masteredCards: 0,
      learningCards: 0,
      newCards: flashcardData.length,
      dueToday: 0,

      reviewCard: (cardId: string, quality: SM2Quality) => {
        const state = get();
        const existingProgress = state.cardProgress[cardId] || createDefaultProgress(cardId);

        // Calculate new SM-2 values
        const sm2Result = calculateSM2({
          quality,
          interval: existingProgress.interval,
          easeFactor: existingProgress.easeFactor,
          repetitions: existingProgress.repetitions,
        });

        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + sm2Result.interval);

        const newProgress: FlashCardProgress = {
          cardId,
          interval: sm2Result.interval,
          easeFactor: sm2Result.easeFactor,
          repetitions: sm2Result.repetitions,
          nextReview: nextReviewDate.toISOString(),
          lastReview: new Date().toISOString(),
          reviewCount: existingProgress.reviewCount + 1,
          correctCount: existingProgress.correctCount + (quality >= 3 ? 1 : 0),
        };

        set((state) => ({
          cardProgress: {
            ...state.cardProgress,
            [cardId]: newProgress,
          },
        }));

        // Recalculate stats after review
        get().recalculateStats();
      },

      getCardProgress: (cardId: string) => {
        const state = get();
        return state.cardProgress[cardId] || null;
      },

      getCardsForReview: () => {
        const state = get();
        const now = new Date();
        const dueCards: string[] = [];

        // Check all cards
        for (const card of flashcardData) {
          const progress = state.cardProgress[card.id];
          if (!progress) {
            // New card - always due
            dueCards.push(card.id);
          } else {
            const nextReview = new Date(progress.nextReview);
            if (nextReview <= now) {
              dueCards.push(card.id);
            }
          }
        }

        // Sort by priority (using SM-2 helper)
        const progressRecords = dueCards.map((id) => ({
          cardId: id,
          ...(state.cardProgress[id] || createDefaultProgress(id)),
        }));

        const sorted = sortCardsByPriority(progressRecords);
        return sorted.map((p) => p.cardId);
      },

      getCardsByStatus: (status: 'new' | 'learning' | 'mastered') => {
        const state = get();
        const result: string[] = [];

        for (const card of flashcardData) {
          const progress = state.cardProgress[card.id];
          if (!progress) {
            if (status === 'new') result.push(card.id);
          } else {
            const cardStatus = getCardStatus(progress);
            if (cardStatus === status) result.push(card.id);
          }
        }

        return result;
      },

      resetCardProgress: (cardId: string) => {
        set((state) => {
          const newProgress = { ...state.cardProgress };
          delete newProgress[cardId];
          return { cardProgress: newProgress };
        });
        get().recalculateStats();
      },

      resetAllProgress: () => {
        set({
          cardProgress: {},
          masteredCards: 0,
          learningCards: 0,
          newCards: flashcardData.length,
          dueToday: 0,
        });
      },

      recalculateStats: () => {
        const state = get();
        const now = new Date();

        let mastered = 0;
        let learning = 0;
        let newCount = 0;
        let due = 0;

        for (const card of flashcardData) {
          const progress = state.cardProgress[card.id];

          if (!progress) {
            newCount++;
            due++; // New cards are always due
          } else {
            const status = getCardStatus(progress);
            if (status === 'mastered') mastered++;
            else if (status === 'learning') learning++;
            else newCount++;

            const nextReview = new Date(progress.nextReview);
            if (nextReview <= now) due++;
          }
        }

        set({
          masteredCards: mastered,
          learningCards: learning,
          newCards: newCount,
          dueToday: due,
        });
      },
    }),
    {
      name: 'ithena-flashcard-progress',
      storage: createJSONStorage(() => localStorage),
      onRehydrate: () => (state) => {
        // Recalculate stats after rehydration
        state?.recalculateStats();
      },
    }
  )
);

// Selectors for specific data
export const useCardsDueToday = () => useFlashcardProgress((state) => state.dueToday);
export const useMasteredCards = () => useFlashcardProgress((state) => state.masteredCards);
export const useLearningCards = () => useFlashcardProgress((state) => state.learningCards);
export const useNewCards = () => useFlashcardProgress((state) => state.newCards);
export const useFlashcardStats = () =>
  useFlashcardProgress((state) => ({
    total: state.totalCards,
    mastered: state.masteredCards,
    learning: state.learningCards,
    new: state.newCards,
    dueToday: state.dueToday,
  }));

// Hook to get a single card's progress
export function useCardProgress(cardId: string): FlashCardProgress | null {
  return useFlashcardProgress((state) => state.cardProgress[cardId] || null);
}

// Hook to get review accuracy for a card
export function useCardAccuracy(cardId: string): number {
  const progress = useFlashcardProgress((state) => state.cardProgress[cardId]);
  if (!progress || progress.reviewCount === 0) return 0;
  return Math.round((progress.correctCount / progress.reviewCount) * 100);
}

export default useFlashcardProgress;
