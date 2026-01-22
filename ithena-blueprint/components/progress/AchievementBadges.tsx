'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Zap,
  Brain,
  Target,
  BookOpen,
  Clock,
  Star,
  Award,
  Crown,
  Lock,
  Sparkles,
  Check,
} from 'lucide-react';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import { useFlashcardProgress } from '@/hooks/useFlashcardProgress';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import clsx from 'clsx';

// Achievement types
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  color: string;
  category: 'streak' | 'study' | 'flashcard' | 'quiz' | 'special';
  requirement: {
    type: string;
    value: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Achievement definitions
const achievements: Achievement[] = [
  // Streak achievements
  {
    id: 'streak-3',
    title: 'Getting Started',
    description: 'Study for 3 consecutive days',
    icon: Flame,
    color: 'var(--accent-red)',
    category: 'streak',
    requirement: { type: 'streak', value: 3 },
    rarity: 'common',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Study for 7 consecutive days',
    icon: Flame,
    color: 'var(--accent-red)',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    rarity: 'rare',
  },
  {
    id: 'streak-30',
    title: 'Unstoppable',
    description: 'Study for 30 consecutive days',
    icon: Flame,
    color: 'var(--accent-red)',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    rarity: 'epic',
  },
  {
    id: 'streak-100',
    title: 'Centurion',
    description: 'Study for 100 consecutive days',
    icon: Crown,
    color: 'var(--accent-yellow)',
    category: 'streak',
    requirement: { type: 'streak', value: 100 },
    rarity: 'legendary',
  },

  // Study time achievements
  {
    id: 'time-60',
    title: 'First Hour',
    description: 'Study for 1 hour total',
    icon: Clock,
    color: 'var(--accent-cyan)',
    category: 'study',
    requirement: { type: 'studyTime', value: 60 },
    rarity: 'common',
  },
  {
    id: 'time-300',
    title: 'Dedicated Learner',
    description: 'Study for 5 hours total',
    icon: Clock,
    color: 'var(--accent-cyan)',
    category: 'study',
    requirement: { type: 'studyTime', value: 300 },
    rarity: 'rare',
  },
  {
    id: 'time-1200',
    title: 'Scholar',
    description: 'Study for 20 hours total',
    icon: Star,
    color: 'var(--accent-cyan)',
    category: 'study',
    requirement: { type: 'studyTime', value: 1200 },
    rarity: 'epic',
  },

  // Article achievements
  {
    id: 'articles-1',
    title: 'First Read',
    description: 'Read your first article',
    icon: BookOpen,
    color: 'var(--accent-blue)',
    category: 'study',
    requirement: { type: 'articles', value: 1 },
    rarity: 'common',
  },
  {
    id: 'articles-5',
    title: 'Bookworm',
    description: 'Read 5 articles',
    icon: BookOpen,
    color: 'var(--accent-blue)',
    category: 'study',
    requirement: { type: 'articles', value: 5 },
    rarity: 'rare',
  },

  // Flashcard achievements
  {
    id: 'cards-10',
    title: 'Memory Start',
    description: 'Master 10 flashcards',
    icon: Brain,
    color: 'var(--accent-purple)',
    category: 'flashcard',
    requirement: { type: 'masteredCards', value: 10 },
    rarity: 'common',
  },
  {
    id: 'cards-25',
    title: 'Card Collector',
    description: 'Master 25 flashcards',
    icon: Brain,
    color: 'var(--accent-purple)',
    category: 'flashcard',
    requirement: { type: 'masteredCards', value: 25 },
    rarity: 'rare',
  },
  {
    id: 'cards-50',
    title: 'Memory Master',
    description: 'Master 50 flashcards',
    icon: Award,
    color: 'var(--accent-purple)',
    category: 'flashcard',
    requirement: { type: 'masteredCards', value: 50 },
    rarity: 'epic',
  },
  {
    id: 'review-100',
    title: 'Reviewer',
    description: 'Review 100 flashcards',
    icon: Sparkles,
    color: 'var(--accent-purple)',
    category: 'flashcard',
    requirement: { type: 'totalReviews', value: 100 },
    rarity: 'rare',
  },

  // Quiz achievements
  {
    id: 'quiz-1',
    title: 'First Quiz',
    description: 'Complete your first quiz',
    icon: Target,
    color: 'var(--accent-orange)',
    category: 'quiz',
    requirement: { type: 'quizzes', value: 1 },
    rarity: 'common',
  },
  {
    id: 'quiz-10',
    title: 'Quiz Taker',
    description: 'Complete 10 quizzes',
    icon: Target,
    color: 'var(--accent-orange)',
    category: 'quiz',
    requirement: { type: 'quizzes', value: 10 },
    rarity: 'rare',
  },
  {
    id: 'perfect-quiz',
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    icon: Trophy,
    color: 'var(--accent-yellow)',
    category: 'quiz',
    requirement: { type: 'perfectQuiz', value: 1 },
    rarity: 'epic',
  },
  {
    id: 'accuracy-90',
    title: 'Sharp Mind',
    description: 'Maintain 90%+ quiz accuracy',
    icon: Zap,
    color: 'var(--accent-orange)',
    category: 'quiz',
    requirement: { type: 'quizAccuracy', value: 90 },
    rarity: 'epic',
  },

  // Special achievements
  {
    id: 'kafka-master',
    title: 'Kafka Master',
    description: 'Complete all Kafka content',
    icon: Trophy,
    color: 'var(--accent-green)',
    category: 'special',
    requirement: { type: 'kafkaComplete', value: 1 },
    rarity: 'epic',
  },
  {
    id: 'ml-master',
    title: 'ML Detective',
    description: 'Complete all ML content',
    icon: Trophy,
    color: 'var(--accent-purple)',
    category: 'special',
    requirement: { type: 'mlComplete', value: 1 },
    rarity: 'epic',
  },
  {
    id: 'completionist',
    title: 'Ithena Graduate',
    description: 'Complete all learning content',
    icon: Crown,
    color: 'var(--accent-yellow)',
    category: 'special',
    requirement: { type: 'allComplete', value: 1 },
    rarity: 'legendary',
  },
];

// Rarity colors and styles
const rarityConfig = {
  common: {
    border: 'border-[var(--foreground-muted)]',
    bg: 'bg-[var(--background-tertiary)]',
    label: 'Common',
  },
  rare: {
    border: 'border-[var(--accent-blue)]',
    bg: 'bg-[var(--accent-blue)]/10',
    label: 'Rare',
  },
  epic: {
    border: 'border-[var(--accent-purple)]',
    bg: 'bg-[var(--accent-purple)]/10',
    label: 'Epic',
  },
  legendary: {
    border: 'border-[var(--accent-yellow)]',
    bg: 'bg-[var(--accent-yellow)]/10',
    label: 'Legendary',
  },
};

interface AchievementBadgesProps {
  variant?: 'grid' | 'list' | 'compact';
  showLocked?: boolean;
  filter?: 'all' | 'unlocked' | 'streak' | 'study' | 'flashcard' | 'quiz' | 'special';
  className?: string;
}

export function AchievementBadges({
  variant = 'grid',
  showLocked = true,
  filter = 'all',
  className = '',
}: AchievementBadgesProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Set<string>>(new Set());

  const progress = useStudyProgress();
  const flashcardProgress = useFlashcardProgress();
  const quizProgress = useQuizProgress();

  // Calculate which achievements are unlocked
  const unlockedAchievements = useMemo(() => {
    const unlocked = new Set<string>();

    const masteredCards = Object.values(flashcardProgress.cardProgress).filter(
      (p) => p.interval >= 21
    ).length;
    const totalReviews = Object.values(flashcardProgress.cardProgress).reduce(
      (sum, p) => sum + p.reviewCount,
      0
    );
    const quizAccuracy =
      quizProgress.stats.totalQuestions > 0
        ? Math.round((quizProgress.stats.totalCorrect / quizProgress.stats.totalQuestions) * 100)
        : 0;
    const perfectQuizzes = Object.values(quizProgress.quizProgress).filter(
      (p) => p.bestScore === 100
    ).length;

    achievements.forEach((achievement) => {
      let isUnlocked = false;

      switch (achievement.requirement.type) {
        case 'streak':
          isUnlocked = progress.streakDays >= achievement.requirement.value;
          break;
        case 'studyTime':
          isUnlocked = progress.totalTimeSpent >= achievement.requirement.value;
          break;
        case 'articles':
          isUnlocked = progress.articlesRead >= achievement.requirement.value;
          break;
        case 'masteredCards':
          isUnlocked = masteredCards >= achievement.requirement.value;
          break;
        case 'totalReviews':
          isUnlocked = totalReviews >= achievement.requirement.value;
          break;
        case 'quizzes':
          isUnlocked = quizProgress.stats.quizzesCompleted >= achievement.requirement.value;
          break;
        case 'perfectQuiz':
          isUnlocked = perfectQuizzes >= achievement.requirement.value;
          break;
        case 'quizAccuracy':
          isUnlocked =
            quizAccuracy >= achievement.requirement.value &&
            quizProgress.stats.quizzesCompleted >= 5;
          break;
        // Special achievements would need more complex logic
        default:
          isUnlocked = false;
      }

      if (isUnlocked) {
        unlocked.add(achievement.id);
      }
    });

    return unlocked;
  }, [progress, flashcardProgress, quizProgress]);

  // Check for newly unlocked achievements
  useEffect(() => {
    const stored = localStorage.getItem('ithena-seen-achievements');
    const seenAchievements = new Set<string>(stored ? JSON.parse(stored) : []);

    const newUnlocked = new Set<string>();
    unlockedAchievements.forEach((id) => {
      if (!seenAchievements.has(id)) {
        newUnlocked.add(id);
      }
    });

    if (newUnlocked.size > 0) {
      setNewlyUnlocked(newUnlocked);
      // Mark as seen
      localStorage.setItem(
        'ithena-seen-achievements',
        JSON.stringify([...unlockedAchievements])
      );
    }
  }, [unlockedAchievements]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((a) => {
      const isUnlocked = unlockedAchievements.has(a.id);

      if (filter === 'unlocked' && !isUnlocked) return false;
      if (filter !== 'all' && filter !== 'unlocked' && a.category !== filter) return false;
      if (!showLocked && !isUnlocked) return false;

      return true;
    });
  }, [filter, showLocked, unlockedAchievements]);

  // Stats
  const stats = {
    unlocked: unlockedAchievements.size,
    total: achievements.length,
    percentage: Math.round((unlockedAchievements.size / achievements.length) * 100),
  };

  // Compact variant - just badges
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {filteredAchievements.slice(0, 6).map((achievement) => {
          const isUnlocked = unlockedAchievements.has(achievement.id);
          const Icon = achievement.icon;

          return (
            <div
              key={achievement.id}
              className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                isUnlocked
                  ? rarityConfig[achievement.rarity].border
                  : 'border-[var(--background-tertiary)] opacity-40'
              )}
              style={{
                backgroundColor: isUnlocked ? `${achievement.color}20` : undefined,
              }}
              title={`${achievement.title}${isUnlocked ? '' : ' (Locked)'}`}
            >
              {isUnlocked ? (
                <Icon className="w-5 h-5" style={{ color: achievement.color }} />
              ) : (
                <Lock className="w-4 h-4 text-[var(--foreground-muted)]" />
              )}
            </div>
          );
        })}
        {filteredAchievements.length > 6 && (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--background-tertiary)] text-xs font-medium text-[var(--foreground-muted)]">
            +{filteredAchievements.length - 6}
          </div>
        )}
      </div>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {filteredAchievements.map((achievement) => {
          const isUnlocked = unlockedAchievements.has(achievement.id);
          const isNew = newlyUnlocked.has(achievement.id);
          const Icon = achievement.icon;

          return (
            <div
              key={achievement.id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                isUnlocked
                  ? `${rarityConfig[achievement.rarity].bg} ${rarityConfig[achievement.rarity].border}`
                  : 'bg-[var(--background-secondary)] border-transparent opacity-60'
              )}
            >
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  !isUnlocked && 'bg-[var(--background-tertiary)]'
                )}
                style={{
                  backgroundColor: isUnlocked ? `${achievement.color}20` : undefined,
                }}
              >
                {isUnlocked ? (
                  <Icon className="w-5 h-5" style={{ color: achievement.color }} />
                ) : (
                  <Lock className="w-4 h-4 text-[var(--foreground-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">
                    {achievement.title}
                  </span>
                  {isNew && (
                    <span className="px-1.5 py-0.5 bg-[var(--accent-green)] text-[var(--background)] text-[10px] font-medium rounded">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] truncate">
                  {achievement.description}
                </p>
              </div>
              {isUnlocked && (
                <Check className="w-5 h-5 text-[var(--accent-green)]" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-[var(--accent-yellow)]" />
          <h3 className="font-semibold text-[var(--foreground)]">Achievements</h3>
        </div>
        <div className="text-sm text-[var(--foreground-muted)]">
          {stats.unlocked}/{stats.total} ({stats.percentage}%)
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {filteredAchievements.map((achievement) => {
          const isUnlocked = unlockedAchievements.has(achievement.id);
          const isNew = newlyUnlocked.has(achievement.id);
          const isSelected = selectedAchievement === achievement.id;
          const Icon = achievement.icon;

          return (
            <button
              key={achievement.id}
              onClick={() => setSelectedAchievement(isSelected ? null : achievement.id)}
              className={clsx(
                'relative flex flex-col items-center p-3 rounded-xl border-2 transition-all',
                isUnlocked
                  ? `${rarityConfig[achievement.rarity].bg} ${rarityConfig[achievement.rarity].border}`
                  : 'bg-[var(--background-secondary)] border-[var(--background-tertiary)] opacity-50',
                isSelected && 'ring-2 ring-[var(--accent-purple)] ring-offset-2 ring-offset-[var(--background)]'
              )}
            >
              {/* New badge */}
              {isNew && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-green)] rounded-full flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--background)]" />
                </div>
              )}

              {/* Icon */}
              <div
                className={clsx(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                  !isUnlocked && 'bg-[var(--background-tertiary)]'
                )}
                style={{
                  backgroundColor: isUnlocked ? `${achievement.color}20` : undefined,
                }}
              >
                {isUnlocked ? (
                  <Icon className="w-6 h-6" style={{ color: achievement.color }} />
                ) : (
                  <Lock className="w-5 h-5 text-[var(--foreground-muted)]" />
                )}
              </div>

              {/* Title */}
              <span className="text-xs font-medium text-[var(--foreground)] text-center line-clamp-2">
                {achievement.title}
              </span>

              {/* Rarity indicator */}
              <span
                className={clsx(
                  'text-[10px] mt-1',
                  isUnlocked ? 'text-[var(--foreground-muted)]' : 'text-[var(--foreground-muted)]/50'
                )}
              >
                {rarityConfig[achievement.rarity].label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Achievement Detail */}
      {selectedAchievement && (
        <div className="mt-4 p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--background-tertiary)]">
          {(() => {
            const achievement = achievements.find((a) => a.id === selectedAchievement)!;
            const isUnlocked = unlockedAchievements.has(achievement.id);
            const Icon = achievement.icon;

            return (
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${achievement.color}20` }}
                >
                  <Icon className="w-8 h-8" style={{ color: achievement.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-[var(--foreground)]">
                      {achievement.title}
                    </h4>
                    <span
                      className={clsx(
                        'px-2 py-0.5 text-xs rounded-full',
                        rarityConfig[achievement.rarity].bg,
                        'text-[var(--foreground-muted)]'
                      )}
                    >
                      {rarityConfig[achievement.rarity].label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    {achievement.description}
                  </p>
                  {isUnlocked ? (
                    <div className="flex items-center gap-2 mt-3 text-sm text-[var(--accent-green)]">
                      <Check className="w-4 h-4" />
                      <span>Unlocked!</span>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-[var(--foreground-muted)]">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Keep studying to unlock
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default AchievementBadges;
