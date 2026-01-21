'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { quizzes, quizQuestions } from '@/content/quizzes/quiz-data';

interface QuizAttempt {
  quizId: string;
  score: number;
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
  timestamp: string;
  answers: { questionId: string; correct: boolean }[];
}

interface QuizStats {
  quizId: string;
  bestScore: number;
  attempts: number;
  lastAttempt: string | null;
  averageScore: number;
  averageTime: number;
  passed: boolean;
}

interface QuestionStats {
  questionId: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

interface QuizProgressState {
  // Per-quiz stats
  quizStats: Record<string, QuizStats>;

  // Per-question stats
  questionStats: Record<string, QuestionStats>;

  // Recent attempts (last 10)
  recentAttempts: QuizAttempt[];

  // Derived data
  totalQuizzesTaken: number;
  totalQuizzesPassed: number;
  overallAccuracy: number;

  // Actions
  recordAttempt: (attempt: QuizAttempt) => void;
  getQuizStats: (quizId: string) => QuizStats | null;
  getQuestionStats: (questionId: string) => QuestionStats | null;
  getRecommendedQuiz: () => string | null;
  getWeakTopics: () => string[];
  resetQuizProgress: (quizId: string) => void;
  resetAllProgress: () => void;
  recalculateStats: () => void;
}

const DEFAULT_QUIZ_STATS: Omit<QuizStats, 'quizId'> = {
  bestScore: 0,
  attempts: 0,
  lastAttempt: null,
  averageScore: 0,
  averageTime: 0,
  passed: false,
};

export const useQuizProgress = create<QuizProgressState>()(
  persist(
    (set, get) => ({
      quizStats: {},
      questionStats: {},
      recentAttempts: [],
      totalQuizzesTaken: 0,
      totalQuizzesPassed: 0,
      overallAccuracy: 0,

      recordAttempt: (attempt: QuizAttempt) => {
        const state = get();

        // Update quiz stats
        const existingStats = state.quizStats[attempt.quizId] || {
          ...DEFAULT_QUIZ_STATS,
          quizId: attempt.quizId,
        };

        const newAttempts = existingStats.attempts + 1;
        const newAverageScore =
          (existingStats.averageScore * existingStats.attempts + attempt.score) / newAttempts;
        const newAverageTime =
          (existingStats.averageTime * existingStats.attempts + attempt.timeSpent) / newAttempts;

        const quiz = quizzes.find((q) => q.id === attempt.quizId);
        const passingScore = quiz?.passingScore || 70;
        const passed = existingStats.passed || attempt.score >= passingScore;

        const newQuizStats: QuizStats = {
          quizId: attempt.quizId,
          bestScore: Math.max(existingStats.bestScore, attempt.score),
          attempts: newAttempts,
          lastAttempt: attempt.timestamp,
          averageScore: Math.round(newAverageScore),
          averageTime: Math.round(newAverageTime),
          passed,
        };

        // Update question stats
        const newQuestionStats = { ...state.questionStats };
        attempt.answers.forEach(({ questionId, correct }) => {
          const existing = newQuestionStats[questionId] || {
            questionId,
            attempts: 0,
            correct: 0,
            accuracy: 0,
          };

          const newAttempts = existing.attempts + 1;
          const newCorrect = existing.correct + (correct ? 1 : 0);

          newQuestionStats[questionId] = {
            questionId,
            attempts: newAttempts,
            correct: newCorrect,
            accuracy: Math.round((newCorrect / newAttempts) * 100),
          };
        });

        // Update recent attempts (keep last 10)
        const newRecentAttempts = [attempt, ...state.recentAttempts].slice(0, 10);

        set({
          quizStats: {
            ...state.quizStats,
            [attempt.quizId]: newQuizStats,
          },
          questionStats: newQuestionStats,
          recentAttempts: newRecentAttempts,
        });

        // Recalculate overall stats
        get().recalculateStats();
      },

      getQuizStats: (quizId: string) => {
        return get().quizStats[quizId] || null;
      },

      getQuestionStats: (questionId: string) => {
        return get().questionStats[questionId] || null;
      },

      getRecommendedQuiz: () => {
        const state = get();

        // Priority 1: Quizzes never taken
        const untakenQuizzes = quizzes.filter((q) => !state.quizStats[q.id]);
        if (untakenQuizzes.length > 0) {
          // Return easiest untaken quiz
          const sorted = [...untakenQuizzes].sort((a, b) => {
            const diffOrder = { beginner: 0, intermediate: 1, advanced: 2, critical: 3 };
            return diffOrder[a.difficulty] - diffOrder[b.difficulty];
          });
          return sorted[0].id;
        }

        // Priority 2: Quizzes not passed
        const failedQuizzes = quizzes.filter(
          (q) => state.quizStats[q.id] && !state.quizStats[q.id].passed
        );
        if (failedQuizzes.length > 0) {
          // Return one with best score (closest to passing)
          const sorted = [...failedQuizzes].sort(
            (a, b) => (state.quizStats[b.id]?.bestScore || 0) - (state.quizStats[a.id]?.bestScore || 0)
          );
          return sorted[0].id;
        }

        // Priority 3: Quizzes with lowest average (for practice)
        const allStats = Object.values(state.quizStats);
        if (allStats.length > 0) {
          const sorted = [...allStats].sort((a, b) => a.averageScore - b.averageScore);
          return sorted[0].quizId;
        }

        return quizzes[0]?.id || null;
      },

      getWeakTopics: () => {
        const state = get();
        const topicAccuracy: Record<string, { correct: number; total: number }> = {};

        // Aggregate question stats by category
        Object.entries(state.questionStats).forEach(([questionId, stats]) => {
          const question = quizQuestions.find((q) => q.id === questionId);
          if (!question) return;

          const category = question.category;
          if (!topicAccuracy[category]) {
            topicAccuracy[category] = { correct: 0, total: 0 };
          }

          topicAccuracy[category].correct += stats.correct;
          topicAccuracy[category].total += stats.attempts;
        });

        // Find topics with accuracy below 70%
        const weakTopics = Object.entries(topicAccuracy)
          .filter(([_, stats]) => {
            const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 100;
            return accuracy < 70 && stats.total >= 3; // At least 3 attempts
          })
          .map(([topic]) => topic);

        return weakTopics;
      },

      resetQuizProgress: (quizId: string) => {
        set((state) => {
          const newQuizStats = { ...state.quizStats };
          delete newQuizStats[quizId];

          return { quizStats: newQuizStats };
        });
        get().recalculateStats();
      },

      resetAllProgress: () => {
        set({
          quizStats: {},
          questionStats: {},
          recentAttempts: [],
          totalQuizzesTaken: 0,
          totalQuizzesPassed: 0,
          overallAccuracy: 0,
        });
      },

      recalculateStats: () => {
        const state = get();

        const allStats = Object.values(state.quizStats);
        const totalTaken = allStats.length;
        const totalPassed = allStats.filter((s) => s.passed).length;

        let totalCorrect = 0;
        let totalAttempts = 0;

        Object.values(state.questionStats).forEach((stats) => {
          totalCorrect += stats.correct;
          totalAttempts += stats.attempts;
        });

        const overallAccuracy = totalAttempts > 0
          ? Math.round((totalCorrect / totalAttempts) * 100)
          : 0;

        set({
          totalQuizzesTaken: totalTaken,
          totalQuizzesPassed: totalPassed,
          overallAccuracy,
        });
      },
    }),
    {
      name: 'ithena-quiz-progress',
      storage: createJSONStorage(() => localStorage),
      onRehydrate: () => (state) => {
        state?.recalculateStats();
      },
    }
  )
);

// Selector hooks
export const useQuizzesTaken = () => useQuizProgress((s) => s.totalQuizzesTaken);
export const useQuizzesPassed = () => useQuizProgress((s) => s.totalQuizzesPassed);
export const useOverallQuizAccuracy = () => useQuizProgress((s) => s.overallAccuracy);
export const useRecentAttempts = () => useQuizProgress((s) => s.recentAttempts);
export const useRecommendedQuiz = () => useQuizProgress((s) => s.getRecommendedQuiz());
export const useWeakTopics = () => useQuizProgress((s) => s.getWeakTopics());

// Hook to get stats for a specific quiz
export function useQuizStatsFor(quizId: string): QuizStats | null {
  return useQuizProgress((s) => s.quizStats[quizId] || null);
}

// Hook to get accuracy for a specific question
export function useQuestionAccuracy(questionId: string): number {
  return useQuizProgress((s) => s.questionStats[questionId]?.accuracy || 0);
}

export default useQuizProgress;
