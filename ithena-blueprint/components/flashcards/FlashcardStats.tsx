'use client';

import { useMemo } from 'react';
import { BookOpen, Brain, Trophy, Clock, Flame, Target } from 'lucide-react';
import { ProgressRing, MasteryRing } from '@/components/ui/ProgressRing';
import { useFlashcardProgress, useFlashcardStats } from '@/hooks/useFlashcardProgress';
import { flashcardData } from '@/content/flashcards/flashcard-data';

interface FlashcardStatsProps {
  className?: string;
}

export function FlashcardStats({ className = '' }: FlashcardStatsProps) {
  const stats = useFlashcardStats();
  const cardProgress = useFlashcardProgress((state) => state.cardProgress);

  // Calculate mastery percentage
  const masteryPercent = stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0;

  // Calculate overall accuracy
  const overallAccuracy = useMemo(() => {
    let totalReviews = 0;
    let totalCorrect = 0;

    Object.values(cardProgress).forEach((progress) => {
      totalReviews += progress.reviewCount;
      totalCorrect += progress.correctCount;
    });

    return totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
  }, [cardProgress]);

  // Calculate study streak (simplified - actual implementation in useStudyProgress)
  const totalReviewedToday = useMemo(() => {
    const today = new Date().toDateString();
    let count = 0;

    Object.values(cardProgress).forEach((progress) => {
      if (progress.lastReview) {
        const reviewDate = new Date(progress.lastReview).toDateString();
        if (reviewDate === today) count++;
      }
    });

    return count;
  }, [cardProgress]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mastery Overview */}
      <div className="flex items-center justify-center">
        <MasteryRing progress={masteryPercent} size={120} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Due Today */}
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Due Today"
          value={stats.dueToday}
          color="var(--accent-orange)"
          bgColor="rgba(249, 115, 22, 0.15)"
        />

        {/* Mastered */}
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Mastered"
          value={stats.mastered}
          color="var(--accent-green)"
          bgColor="rgba(16, 185, 129, 0.15)"
        />

        {/* Learning */}
        <StatCard
          icon={<Brain className="w-5 h-5" />}
          label="Learning"
          value={stats.learning}
          color="var(--accent-cyan)"
          bgColor="rgba(6, 182, 212, 0.15)"
        />

        {/* New */}
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="New"
          value={stats.new}
          color="var(--accent-purple)"
          bgColor="rgba(139, 92, 246, 0.15)"
        />
      </div>

      {/* Accuracy & Activity */}
      <div className="space-y-3">
        {/* Accuracy */}
        <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-[var(--accent-blue)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Overall Accuracy</span>
          </div>
          <span className="font-semibold text-[var(--foreground)]">{overallAccuracy}%</span>
        </div>

        {/* Reviewed Today */}
        <div className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-[var(--accent-orange)]" />
            <span className="text-sm text-[var(--foreground-muted)]">Reviewed Today</span>
          </div>
          <span className="font-semibold text-[var(--foreground)]">{totalReviewedToday}</span>
        </div>
      </div>

      {/* Progress Breakdown */}
      <div className="p-4 bg-[var(--background-secondary)] rounded-lg">
        <h4 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">
          Progress Breakdown
        </h4>
        <div className="space-y-2">
          <ProgressBar
            label="Mastered"
            value={stats.mastered}
            max={stats.total}
            color="var(--accent-green)"
          />
          <ProgressBar
            label="Learning"
            value={stats.learning}
            max={stats.total}
            color="var(--accent-cyan)"
          />
          <ProgressBar
            label="New"
            value={stats.new}
            max={stats.total}
            color="var(--accent-purple)"
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div
      className="p-4 rounded-xl flex flex-col items-center gap-2 transition-transform hover:scale-105"
      style={{ backgroundColor: bgColor }}
    >
      <div style={{ color }}>{icon}</div>
      <span className="text-2xl font-bold text-[var(--foreground)]">{value}</span>
      <span className="text-xs text-[var(--foreground-muted)]">{label}</span>
    </div>
  );
}

// Progress Bar Component
function ProgressBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percent = max > 0 ? (value / max) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[var(--foreground-muted)]">{label}</span>
        <span className="text-[var(--foreground)]">
          {value} / {max}
        </span>
      </div>
      <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Compact stats for inline display
export function CompactFlashcardStats() {
  const stats = useFlashcardStats();

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-[var(--foreground-muted)]">
        <span className="text-[var(--accent-orange)] font-semibold">{stats.dueToday}</span> due
      </span>
      <span className="text-[var(--foreground-muted)]">
        <span className="text-[var(--accent-green)] font-semibold">{stats.mastered}</span> mastered
      </span>
      <span className="text-[var(--foreground-muted)]">
        <span className="text-[var(--accent-cyan)] font-semibold">{stats.learning}</span> learning
      </span>
    </div>
  );
}

// Review Heatmap Calendar (simplified)
export function ReviewHeatmap({ days = 30 }: { days?: number }) {
  const cardProgress = useFlashcardProgress((state) => state.cardProgress);

  // Generate activity data for past N days
  const activityData = useMemo(() => {
    const data: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();

      let count = 0;
      Object.values(cardProgress).forEach((progress) => {
        if (progress.lastReview) {
          const reviewDate = new Date(progress.lastReview).toDateString();
          if (reviewDate === dateString) count++;
        }
      });

      data.push({ date: dateString, count });
    }

    return data;
  }, [cardProgress, days]);

  const maxCount = Math.max(...activityData.map((d) => d.count), 1);

  const getLevel = (count: number): number => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  return (
    <div className="p-4 bg-[var(--background-secondary)] rounded-lg">
      <h4 className="text-sm font-medium text-[var(--foreground-muted)] mb-3">
        Review Activity ({days} days)
      </h4>
      <div className="flex flex-wrap gap-1">
        {activityData.map((day, index) => (
          <div
            key={index}
            className={`heatmap-cell heatmap-level-${getLevel(day.count)}`}
            title={`${day.date}: ${day.count} reviews`}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-[var(--foreground-muted)]">
        <span>Less</span>
        <div className="heatmap-cell heatmap-level-0" />
        <div className="heatmap-cell heatmap-level-1" />
        <div className="heatmap-cell heatmap-level-2" />
        <div className="heatmap-cell heatmap-level-3" />
        <div className="heatmap-cell heatmap-level-4" />
        <span>More</span>
      </div>
    </div>
  );
}

export default FlashcardStats;
