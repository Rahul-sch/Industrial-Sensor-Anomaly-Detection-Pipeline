'use client';

import { useMemo } from 'react';
import {
  Calendar,
  Clock,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Target,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import { useFlashcardProgress } from '@/hooks/useFlashcardProgress';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import { ProgressRing } from '@/components/ui/ProgressRing';
import Link from 'next/link';
import clsx from 'clsx';

// Weekly stats type
interface WeeklyStats {
  totalMinutes: number;
  sessions: number;
  flashcardsReviewed: number;
  quizzesCompleted: number;
  articlesRead: number;
  streakMaintained: boolean;
  quizAccuracy: number;
  newCardsLearned: number;
  daysActive: number;
}

// Generate sample weekly data (would come from localStorage in real app)
function generateWeeklyStats(weekOffset: number = 0): WeeklyStats {
  // For demo, generate realistic-looking random data
  const baseActivity = Math.random() * 0.5 + 0.5; // 0.5-1.0
  const variance = weekOffset === 0 ? 1 : 0.8 + Math.random() * 0.4;

  return {
    totalMinutes: Math.round(120 + Math.random() * 180 * baseActivity * variance),
    sessions: Math.round(5 + Math.random() * 10 * baseActivity * variance),
    flashcardsReviewed: Math.round(30 + Math.random() * 50 * baseActivity * variance),
    quizzesCompleted: Math.round(1 + Math.random() * 4 * baseActivity * variance),
    articlesRead: Math.round(1 + Math.random() * 3 * baseActivity * variance),
    streakMaintained: Math.random() > 0.3,
    quizAccuracy: Math.round(60 + Math.random() * 35),
    newCardsLearned: Math.round(5 + Math.random() * 15 * baseActivity * variance),
    daysActive: Math.round(3 + Math.random() * 4),
  };
}

// Recommendation type
interface Recommendation {
  id: string;
  type: 'action' | 'suggestion' | 'achievement';
  icon: typeof Lightbulb;
  color: string;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

interface WeeklyReportProps {
  className?: string;
}

export function WeeklyReport({ className = '' }: WeeklyReportProps) {
  const progress = useStudyProgress();
  const flashcardProgress = useFlashcardProgress();
  const quizProgress = useQuizProgress();

  // Get current and previous week stats
  const currentWeek = useMemo(() => generateWeeklyStats(0), []);
  const previousWeek = useMemo(() => generateWeeklyStats(1), []);

  // Calculate changes
  const changes = useMemo(() => {
    const calc = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalMinutes: calc(currentWeek.totalMinutes, previousWeek.totalMinutes),
      sessions: calc(currentWeek.sessions, previousWeek.sessions),
      flashcardsReviewed: calc(currentWeek.flashcardsReviewed, previousWeek.flashcardsReviewed),
      quizzesCompleted: calc(currentWeek.quizzesCompleted, previousWeek.quizzesCompleted),
      quizAccuracy: currentWeek.quizAccuracy - previousWeek.quizAccuracy,
    };
  }, [currentWeek, previousWeek]);

  // Generate recommendations based on stats
  const recommendations = useMemo((): Recommendation[] => {
    const recs: Recommendation[] = [];

    // Due cards recommendation
    const dueCards = flashcardProgress.getDueCards().length;
    if (dueCards > 0) {
      recs.push({
        id: 'due-cards',
        type: 'action',
        icon: Brain,
        color: 'var(--accent-purple)',
        title: `Review ${dueCards} due flashcards`,
        description: 'Spaced repetition works best with daily reviews',
        link: '/flashcards?mode=review',
        linkText: 'Start Review',
      });
    }

    // Low quiz accuracy
    if (currentWeek.quizAccuracy < 70) {
      recs.push({
        id: 'low-accuracy',
        type: 'suggestion',
        icon: Target,
        color: 'var(--accent-orange)',
        title: 'Focus on weak topics',
        description: 'Your quiz accuracy is below 70%. Try reviewing the articles first.',
        link: '/wiki',
        linkText: 'Browse Articles',
      });
    }

    // Streak maintenance
    if (!currentWeek.streakMaintained) {
      recs.push({
        id: 'streak',
        type: 'action',
        icon: Flame,
        color: 'var(--accent-red)',
        title: 'Rebuild your streak',
        description: 'Even 5 minutes of study counts towards your streak!',
      });
    }

    // Study time improvement
    if (changes.totalMinutes < 0) {
      recs.push({
        id: 'study-time',
        type: 'suggestion',
        icon: Clock,
        color: 'var(--accent-cyan)',
        title: 'Increase study time',
        description: `You studied ${Math.abs(changes.totalMinutes)}% less than last week`,
      });
    }

    // Achievement progress
    if (progress.streakDays >= 5 && progress.streakDays < 7) {
      recs.push({
        id: 'achievement-close',
        type: 'achievement',
        icon: Award,
        color: 'var(--accent-yellow)',
        title: 'Week Warrior almost unlocked!',
        description: `${7 - progress.streakDays} more days to unlock the 7-day streak badge`,
      });
    }

    // Read more articles
    if (currentWeek.articlesRead < 2) {
      recs.push({
        id: 'read-more',
        type: 'suggestion',
        icon: BookOpen,
        color: 'var(--accent-blue)',
        title: 'Explore more content',
        description: 'Reading articles improves quiz performance',
        link: '/wiki',
        linkText: 'Browse Wiki',
      });
    }

    return recs.slice(0, 4); // Max 4 recommendations
  }, [currentWeek, changes, flashcardProgress, progress]);

  // Week date range
  const getWeekRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const format = (date: Date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${format(startOfWeek)} - ${format(endOfWeek)}`;
  };

  // Change indicator component
  const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
          <Minus className="w-3 h-3" />
          Same
        </span>
      );
    }
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-[var(--accent-green)]">
          <TrendingUp className="w-3 h-3" />+{value}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-[var(--accent-red)]">
        <TrendingDown className="w-3 h-3" />
        {value}%
      </span>
    );
  };

  return (
    <div className={`bg-[var(--background-secondary)] rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--foreground-muted)]" />
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Weekly Report</h3>
            <p className="text-xs text-[var(--foreground-muted)]">{getWeekRange()}</p>
          </div>
        </div>
        {/* Overall progress */}
        <div className="flex items-center gap-3">
          <ProgressRing
            value={(currentWeek.daysActive / 7) * 100}
            size={48}
            strokeWidth={4}
            color="var(--accent-green)"
            showPercentage={false}
          />
          <div className="text-right">
            <p className="text-lg font-bold text-[var(--foreground)]">
              {currentWeek.daysActive}/7
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">days active</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Study Time */}
        <div className="p-3 bg-[var(--background)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-xs text-[var(--foreground-muted)]">Study Time</span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {Math.round(currentWeek.totalMinutes / 60)}h {currentWeek.totalMinutes % 60}m
          </p>
          <ChangeIndicator value={changes.totalMinutes} />
        </div>

        {/* Flashcards */}
        <div className="p-3 bg-[var(--background)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-[var(--accent-purple)]" />
            <span className="text-xs text-[var(--foreground-muted)]">Cards Reviewed</span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {currentWeek.flashcardsReviewed}
          </p>
          <ChangeIndicator value={changes.flashcardsReviewed} />
        </div>

        {/* Quizzes */}
        <div className="p-3 bg-[var(--background)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[var(--accent-orange)]" />
            <span className="text-xs text-[var(--foreground-muted)]">Quizzes</span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {currentWeek.quizzesCompleted}
          </p>
          <ChangeIndicator value={changes.quizzesCompleted} />
        </div>

        {/* Accuracy */}
        <div className="p-3 bg-[var(--background)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent-green)]" />
            <span className="text-xs text-[var(--foreground-muted)]">Quiz Accuracy</span>
          </div>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {currentWeek.quizAccuracy}%
          </p>
          <ChangeIndicator value={changes.quizAccuracy} />
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="border-t border-[var(--background-tertiary)] pt-4">
          <h4 className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[var(--accent-yellow)]" />
            Recommendations for Next Week
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec) => {
              const Icon = rec.icon;
              return (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${rec.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: rec.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {rec.title}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">
                      {rec.description}
                    </p>
                  </div>
                  {rec.link && (
                    <Link
                      href={rec.link}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                      style={{
                        backgroundColor: `${rec.color}15`,
                        color: rec.color,
                      }}
                    >
                      {rec.linkText}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Goals for Next Week */}
      <div className="mt-4 pt-4 border-t border-[var(--background-tertiary)]">
        <h4 className="text-sm font-medium text-[var(--foreground)] mb-3">
          Goals for Next Week
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--background)] rounded-lg text-center">
            <p className="text-lg font-bold text-[var(--accent-cyan)]">5h</p>
            <p className="text-xs text-[var(--foreground-muted)]">Study Time</p>
          </div>
          <div className="p-3 bg-[var(--background)] rounded-lg text-center">
            <p className="text-lg font-bold text-[var(--accent-purple)]">50</p>
            <p className="text-xs text-[var(--foreground-muted)]">Card Reviews</p>
          </div>
          <div className="p-3 bg-[var(--background)] rounded-lg text-center">
            <p className="text-lg font-bold text-[var(--accent-orange)]">3</p>
            <p className="text-xs text-[var(--foreground-muted)]">Quizzes</p>
          </div>
        </div>
      </div>

      {/* View full report link */}
      <Link
        href="/progress/weekly"
        className="flex items-center justify-center gap-2 mt-4 py-2 text-sm text-[var(--accent-purple)] hover:underline"
      >
        View full weekly breakdown
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// Compact weekly summary for home page
export function WeeklyReportMini({ className = '' }: { className?: string }) {
  const currentWeek = useMemo(() => generateWeeklyStats(0), []);
  const previousWeek = useMemo(() => generateWeeklyStats(1), []);

  const timeChange =
    previousWeek.totalMinutes > 0
      ? Math.round(
          ((currentWeek.totalMinutes - previousWeek.totalMinutes) / previousWeek.totalMinutes) *
            100
        )
      : 0;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[var(--accent-cyan)]" />
        <span className="text-sm text-[var(--foreground)]">
          {Math.round(currentWeek.totalMinutes / 60)}h this week
        </span>
        {timeChange !== 0 && (
          <span
            className={clsx(
              'text-xs',
              timeChange > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
            )}
          >
            {timeChange > 0 ? '+' : ''}
            {timeChange}%
          </span>
        )}
      </div>
      <Link
        href="/progress"
        className="text-xs text-[var(--accent-purple)] hover:underline"
      >
        Details →
      </Link>
    </div>
  );
}

export default WeeklyReport;
