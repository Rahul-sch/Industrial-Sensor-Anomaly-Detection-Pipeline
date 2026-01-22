'use client';

import { useMemo } from 'react';
import {
  Clock,
  Flame,
  BookOpen,
  Brain,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import { useFlashcardProgress } from '@/hooks/useFlashcardProgress';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StreakCounter } from '@/components/ui/StreakCounter';
import Link from 'next/link';
import clsx from 'clsx';

interface ProgressOverviewProps {
  variant?: 'full' | 'compact' | 'mini';
  showStreak?: boolean;
  showLinks?: boolean;
  className?: string;
}

export function ProgressOverview({
  variant = 'full',
  showStreak = true,
  showLinks = true,
  className = '',
}: ProgressOverviewProps) {
  const progress = useStudyProgress();
  const flashcardProgress = useFlashcardProgress();
  const quizProgress = useQuizProgress();

  // Calculate stats
  const stats = useMemo(() => {
    const totalStudyTime = progress.totalTimeSpent;
    const studyTimeHours = Math.floor(totalStudyTime / 60);
    const studyTimeMinutes = totalStudyTime % 60;

    const cardProgressValues = Object.values(flashcardProgress.cardProgress);
    const masteredCards = cardProgressValues.filter((p) => p.interval >= 21).length;
    const learningCards = cardProgressValues.filter((p) => p.interval > 0 && p.interval < 21).length;
    const newCards = cardProgressValues.filter((p) => p.reviewCount === 0).length;
    const totalCards = cardProgressValues.length || 50;
    const cardMasteryPercent = Math.round((masteredCards / totalCards) * 100);

    const dueCards = flashcardProgress.getDueCards().length;

    const quizAccuracy =
      quizProgress.stats.totalQuestions > 0
        ? Math.round((quizProgress.stats.totalCorrect / quizProgress.stats.totalQuestions) * 100)
        : 0;

    return {
      studyTimeHours,
      studyTimeMinutes,
      totalStudyTime,
      masteredCards,
      learningCards,
      newCards,
      totalCards,
      cardMasteryPercent,
      dueCards,
      quizAccuracy,
      articlesRead: progress.articlesRead,
      quizzesCompleted: quizProgress.stats.quizzesCompleted,
      streakDays: progress.streakDays,
    };
  }, [progress, flashcardProgress, quizProgress]);

  // Mini variant - single line with key stats
  if (variant === 'mini') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {showStreak && (
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[var(--accent-red)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              {stats.streakDays}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Brain className="w-4 h-4 text-[var(--accent-purple)]" />
          <span className="text-sm text-[var(--foreground-muted)]">
            {stats.dueCards} due
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-[var(--accent-orange)]" />
          <span className="text-sm text-[var(--foreground-muted)]">
            {stats.quizAccuracy}%
          </span>
        </div>
      </div>
    );
  }

  // Compact variant - horizontal card row
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {showStreak && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--background-secondary)] rounded-lg">
            <Flame className="w-5 h-5 text-[var(--accent-red)]" />
            <div>
              <p className="text-lg font-bold text-[var(--foreground)]">{stats.streakDays}</p>
              <p className="text-xs text-[var(--foreground-muted)]">day streak</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--background-secondary)] rounded-lg">
          <Clock className="w-5 h-5 text-[var(--accent-cyan)]" />
          <div>
            <p className="text-lg font-bold text-[var(--foreground)]">
              {stats.studyTimeHours}h {stats.studyTimeMinutes}m
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">study time</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--background-secondary)] rounded-lg">
          <Brain className="w-5 h-5 text-[var(--accent-purple)]" />
          <div>
            <p className="text-lg font-bold text-[var(--foreground)]">
              {stats.cardMasteryPercent}%
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">cards mastered</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--background-secondary)] rounded-lg">
          <Target className="w-5 h-5 text-[var(--accent-orange)]" />
          <div>
            <p className="text-lg font-bold text-[var(--foreground)]">
              {stats.quizAccuracy}%
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">quiz accuracy</p>
          </div>
        </div>
      </div>
    );
  }

  // Full variant - detailed overview with all stats
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Streak Banner */}
      {showStreak && stats.streakDays > 0 && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--accent-red)]/10 to-[var(--accent-orange)]/10 rounded-xl border border-[var(--accent-red)]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-red)]/20 rounded-lg">
              <Flame className="w-6 h-6 text-[var(--accent-red)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                🔥 {stats.streakDays} Day Streak!
              </p>
              <p className="text-sm text-[var(--foreground-muted)]">
                Keep studying to maintain your streak
              </p>
            </div>
          </div>
          <StreakCounter days={stats.streakDays} size="sm" />
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Study Time */}
        <StatCard
          icon={Clock}
          label="Total Study Time"
          value={`${stats.studyTimeHours}h ${stats.studyTimeMinutes}m`}
          color="var(--accent-cyan)"
          link={showLinks ? '/progress' : undefined}
        />

        {/* Cards Mastered */}
        <StatCard
          icon={Brain}
          label="Cards Mastered"
          value={`${stats.cardMasteryPercent}%`}
          subValue={`${stats.masteredCards}/${stats.totalCards} cards`}
          color="var(--accent-purple)"
          link={showLinks ? '/flashcards' : undefined}
        />

        {/* Quiz Accuracy */}
        <StatCard
          icon={Target}
          label="Quiz Accuracy"
          value={`${stats.quizAccuracy}%`}
          subValue={`${stats.quizzesCompleted} quizzes`}
          color="var(--accent-orange)"
          link={showLinks ? '/quiz' : undefined}
        />

        {/* Articles Read */}
        <StatCard
          icon={BookOpen}
          label="Articles Read"
          value={stats.articlesRead}
          color="var(--accent-blue)"
          link={showLinks ? '/wiki' : undefined}
        />
      </div>

      {/* Flashcard Breakdown */}
      <div className="bg-[var(--background-secondary)] rounded-xl p-4">
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
          Flashcard Progress
        </h4>
        <div className="flex items-center gap-4">
          <ProgressRing
            value={stats.cardMasteryPercent}
            size={80}
            strokeWidth={8}
            color="var(--accent-purple)"
          />
          <div className="flex-1 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--accent-green)]">
                {stats.masteredCards}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">Mastered</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--accent-yellow)]">
                {stats.learningCards}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">Learning</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--accent-cyan)]">
                {stats.newCards}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">New</p>
            </div>
          </div>
        </div>
        {stats.dueCards > 0 && (
          <Link
            href="/flashcards?mode=review"
            className="block mt-3 pt-3 border-t border-[var(--background-tertiary)] text-center text-sm text-[var(--accent-purple)] hover:underline"
          >
            {stats.dueCards} cards due for review →
          </Link>
        )}
      </div>
    </div>
  );
}

// Internal stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  link,
}: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  link?: string;
}) {
  const content = (
    <div
      className={clsx(
        'p-4 bg-[var(--background-secondary)] rounded-xl transition-all',
        link && 'hover:bg-[var(--background-tertiary)] cursor-pointer'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--foreground-muted)] truncate">{label}</p>
          <p className="text-xl font-bold mt-0.5" style={{ color }}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  return content;
}

export default ProgressOverview;
