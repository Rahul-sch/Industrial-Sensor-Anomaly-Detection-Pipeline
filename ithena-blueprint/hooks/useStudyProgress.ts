import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProgress, StudySession } from '@/lib/types';

const INITIAL_PROGRESS: UserProgress = {
  totalTimeSpentMinutes: 0,
  streakDays: 0,
  lastActiveDate: '',
  articlesRead: [],
  articlesInProgress: [],
  flashcardsReviewed: 0,
  flashcardsMastered: 0,
  quizzesCompleted: 0,
  quizzesPassed: 0,
  averageQuizScore: 0,
  sessions: [],
  achievements: [],
};

interface StudyProgressState extends UserProgress {
  // Actions
  startSession: (mode: StudySession['mode'], contentId: string) => string;
  endSession: (sessionId: string, completed: boolean) => void;
  markArticleRead: (articleSlug: string) => void;
  markArticleInProgress: (articleSlug: string) => void;
  incrementFlashcardsReviewed: () => void;
  incrementFlashcardsMastered: () => void;
  recordQuizScore: (score: number, passed: boolean) => void;
  unlockAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  addTimeSpent: (minutes: number) => void;
  reset: () => void;
}

// Helper to get today's date string
const getTodayString = () => new Date().toISOString().split('T')[0];

// Helper to check if two dates are consecutive
const areConsecutiveDays = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

// Helper to check if date is today
const isToday = (dateString: string): boolean => {
  return dateString === getTodayString();
};

export const useStudyProgress = create<StudyProgressState>()(
  persist(
    (set, get) => ({
      ...INITIAL_PROGRESS,

      startSession: (mode, contentId) => {
        const sessionId = `session-${Date.now()}`;
        const session: StudySession = {
          id: sessionId,
          startTime: new Date().toISOString(),
          endTime: null,
          mode,
          contentId,
          timeSpentSeconds: 0,
          completed: false,
        };

        set((state) => ({
          sessions: [...state.sessions.slice(-99), session], // Keep last 100 sessions
        }));

        // Update streak when starting a session
        get().updateStreak();

        return sessionId;
      },

      endSession: (sessionId, completed) => {
        set((state) => {
          const sessions = state.sessions.map((s) => {
            if (s.id === sessionId) {
              const endTime = new Date();
              const startTime = new Date(s.startTime);
              const timeSpentSeconds = Math.floor(
                (endTime.getTime() - startTime.getTime()) / 1000
              );
              return {
                ...s,
                endTime: endTime.toISOString(),
                timeSpentSeconds,
                completed,
              };
            }
            return s;
          });

          // Calculate time spent in minutes
          const session = sessions.find((s) => s.id === sessionId);
          const additionalMinutes = session
            ? Math.floor(session.timeSpentSeconds / 60)
            : 0;

          return {
            sessions,
            totalTimeSpentMinutes: state.totalTimeSpentMinutes + additionalMinutes,
          };
        });
      },

      markArticleRead: (articleSlug) => {
        set((state) => {
          if (state.articlesRead.includes(articleSlug)) return state;
          return {
            articlesRead: [...state.articlesRead, articleSlug],
            articlesInProgress: state.articlesInProgress.filter(
              (s) => s !== articleSlug
            ),
          };
        });
      },

      markArticleInProgress: (articleSlug) => {
        set((state) => {
          if (
            state.articlesInProgress.includes(articleSlug) ||
            state.articlesRead.includes(articleSlug)
          ) {
            return state;
          }
          return {
            articlesInProgress: [...state.articlesInProgress, articleSlug],
          };
        });
      },

      incrementFlashcardsReviewed: () => {
        set((state) => ({
          flashcardsReviewed: state.flashcardsReviewed + 1,
        }));
      },

      incrementFlashcardsMastered: () => {
        set((state) => ({
          flashcardsMastered: state.flashcardsMastered + 1,
        }));
      },

      recordQuizScore: (score, passed) => {
        set((state) => {
          const totalQuizzes = state.quizzesCompleted + 1;
          const newAverage =
            (state.averageQuizScore * state.quizzesCompleted + score) / totalQuizzes;

          return {
            quizzesCompleted: totalQuizzes,
            quizzesPassed: passed ? state.quizzesPassed + 1 : state.quizzesPassed,
            averageQuizScore: Math.round(newAverage * 10) / 10,
          };
        });
      },

      unlockAchievement: (achievementId) => {
        set((state) => {
          if (state.achievements.includes(achievementId)) return state;
          return {
            achievements: [...state.achievements, achievementId],
          };
        });
      },

      updateStreak: () => {
        set((state) => {
          const today = getTodayString();

          // If already updated today, don't change streak
          if (isToday(state.lastActiveDate)) {
            return state;
          }

          // If yesterday was last active, increment streak
          if (areConsecutiveDays(state.lastActiveDate, today)) {
            return {
              streakDays: state.streakDays + 1,
              lastActiveDate: today,
            };
          }

          // Otherwise, reset streak to 1
          return {
            streakDays: 1,
            lastActiveDate: today,
          };
        });
      },

      addTimeSpent: (minutes) => {
        set((state) => ({
          totalTimeSpentMinutes: state.totalTimeSpentMinutes + minutes,
        }));
      },

      reset: () => set(INITIAL_PROGRESS),
    }),
    {
      name: 'ithena-study-progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        totalTimeSpentMinutes: state.totalTimeSpentMinutes,
        streakDays: state.streakDays,
        lastActiveDate: state.lastActiveDate,
        articlesRead: state.articlesRead,
        articlesInProgress: state.articlesInProgress,
        flashcardsReviewed: state.flashcardsReviewed,
        flashcardsMastered: state.flashcardsMastered,
        quizzesCompleted: state.quizzesCompleted,
        quizzesPassed: state.quizzesPassed,
        averageQuizScore: state.averageQuizScore,
        sessions: state.sessions,
        achievements: state.achievements,
      }),
    }
  )
);

// Selectors for common queries
export const selectTotalArticles = (state: StudyProgressState) =>
  state.articlesRead.length;

export const selectQuizPassRate = (state: StudyProgressState) =>
  state.quizzesCompleted > 0
    ? Math.round((state.quizzesPassed / state.quizzesCompleted) * 100)
    : 0;

export const selectFlashcardMasteryRate = (state: StudyProgressState) =>
  state.flashcardsReviewed > 0
    ? Math.round((state.flashcardsMastered / state.flashcardsReviewed) * 100)
    : 0;

export const selectRecentSessions = (state: StudyProgressState, count = 5) =>
  state.sessions.slice(-count).reverse();

export const selectTodaySessions = (state: StudyProgressState) => {
  const today = getTodayString();
  return state.sessions.filter((s) => s.startTime.startsWith(today));
};

export const selectTodayTimeSpent = (state: StudyProgressState) => {
  const todaySessions = selectTodaySessions(state);
  const totalSeconds = todaySessions.reduce(
    (acc, s) => acc + s.timeSpentSeconds,
    0
  );
  return Math.floor(totalSeconds / 60);
};
