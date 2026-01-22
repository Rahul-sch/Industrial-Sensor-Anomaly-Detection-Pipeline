'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Clock,
  Flame,
  BookOpen,
  Brain,
  Trophy,
  Calendar,
  Target,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import { useFlashcardProgress } from '@/hooks/useFlashcardProgress';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StreakCounter } from '@/components/ui/StreakCounter';
import Link from 'next/link';
import clsx from 'clsx';

// Quick stat card component
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
        'p-4 bg-[var(--background-secondary)] rounded-xl border border-transparent transition-all',
        link && 'hover:border-[var(--background-tertiary)] cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-[var(--foreground-muted)] mt-1">{subValue}</p>
          )}
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {link && (
        <div className="flex items-center gap-1 mt-3 text-xs text-[var(--foreground-muted)]">
          View details <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }
  return content;
}

// Daily goal item
function GoalItem({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const progress = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  return (
    <div className="flex items-center gap-3">
      <ProgressRing
        value={progress}
        size={40}
        strokeWidth={4}
        color={isComplete ? 'var(--accent-green)' : color}
        showPercentage={false}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]">{label}</span>
          <span
            className={clsx(
              'text-sm font-medium',
              isComplete ? 'text-[var(--accent-green)]' : 'text-[var(--foreground-muted)]'
            )}
          >
            {current}/{target}
          </span>
        </div>
        <div className="h-1.5 bg-[var(--background-tertiary)] rounded-full mt-1 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: isComplete ? 'var(--accent-green)' : color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Continue studying section
function ContinueStudying() {
  // Recent activity data (would come from localStorage in real app)
  const recentItems = [
    { type: 'wiki', slug: 'kafka-deep-dive', title: 'Kafka Deep Dive', progress: 75 },
    { type: 'flashcards', slug: 'kafka', title: 'Kafka Flashcards', progress: 40 },
    { type: 'quiz', slug: 'kafka-basics', title: 'Kafka Basics Quiz', progress: 0 },
  ];

  return (
    <div className="bg-[var(--background-secondary)] rounded-xl p-6">
      <h3 className="font-semibold text-[var(--foreground)] mb-4">Continue Studying</h3>
      <div className="space-y-3">
        {recentItems.map((item, i) => (
          <Link
            key={i}
            href={`/${item.type}/${item.slug}`}
            className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
          >
            <div
              className={clsx(
                'p-2 rounded-lg',
                item.type === 'wiki' && 'bg-[var(--accent-blue)]/10',
                item.type === 'flashcards' && 'bg-[var(--accent-purple)]/10',
                item.type === 'quiz' && 'bg-[var(--accent-orange)]/10'
              )}
            >
              {item.type === 'wiki' && (
                <BookOpen className="w-4 h-4 text-[var(--accent-blue)]" />
              )}
              {item.type === 'flashcards' && (
                <Brain className="w-4 h-4 text-[var(--accent-purple)]" />
              )}
              {item.type === 'quiz' && (
                <Target className="w-4 h-4 text-[var(--accent-orange)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {item.title}
              </p>
              <p className="text-xs text-[var(--foreground-muted)]">
                {item.progress > 0 ? `${item.progress}% complete` : 'Not started'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--foreground-muted)]" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// Weekly activity heatmap
function WeeklyActivity() {
  // Generate sample data for last 7 days
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();

  // Sample activity data (minutes studied)
  const activityData = [15, 45, 30, 0, 60, 25, 40];

  return (
    <div className="bg-[var(--background-secondary)] rounded-xl p-6">
      <h3 className="font-semibold text-[var(--foreground)] mb-4">This Week</h3>
      <div className="flex items-end justify-between gap-2 h-24">
        {days.map((day, i) => {
          const isToday = i === today;
          const height = Math.max((activityData[i] / 60) * 100, 5);

          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex-1 w-full flex items-end justify-center">
                <div
                  className={clsx(
                    'w-full max-w-[24px] rounded-t transition-all',
                    isToday
                      ? 'bg-[var(--accent-purple)]'
                      : activityData[i] > 0
                      ? 'bg-[var(--accent-cyan)]'
                      : 'bg-[var(--background-tertiary)]'
                  )}
                  style={{ height: `${height}%` }}
                  title={`${activityData[i]} minutes`}
                />
              </div>
              <span
                className={clsx(
                  'text-xs',
                  isToday ? 'text-[var(--accent-purple)] font-medium' : 'text-[var(--foreground-muted)]'
                )}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--background-tertiary)]">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">215</p>
          <p className="text-xs text-[var(--foreground-muted)]">Total minutes</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">6/7</p>
          <p className="text-xs text-[var(--foreground-muted)]">Days active</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--accent-green)]">+12%</p>
          <p className="text-xs text-[var(--foreground-muted)]">vs last week</p>
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const progress = useStudyProgress();
  const flashcardProgress = useFlashcardProgress();
  const quizProgress = useQuizProgress();

  // Calculate stats
  const totalStudyTime = progress.totalTimeSpent;
  const studyTimeHours = Math.floor(totalStudyTime / 60);
  const studyTimeMinutes = totalStudyTime % 60;

  const masteredCards = Object.values(flashcardProgress.cardProgress).filter(
    (p) => p.interval >= 21
  ).length;
  const totalCards = Object.keys(flashcardProgress.cardProgress).length || 50;
  const cardMasteryPercent = Math.round((masteredCards / totalCards) * 100);

  const quizAccuracy = quizProgress.stats.totalQuestions > 0
    ? Math.round((quizProgress.stats.totalCorrect / quizProgress.stats.totalQuestions) * 100)
    : 0;

  // Daily goals
  const dailyGoals = {
    studyTime: { current: 30, target: 60 }, // minutes
    flashcards: { current: 15, target: 20 },
    quizzes: { current: 1, target: 2 },
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Progress Dashboard
          </h1>
          <p className="text-[var(--foreground-muted)] mt-1">
            Track your learning journey
          </p>
        </div>
        <StreakCounter days={progress.streakDays} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Clock}
          label="Total Study Time"
          value={`${studyTimeHours}h ${studyTimeMinutes}m`}
          color="var(--accent-cyan)"
        />
        <StatCard
          icon={Brain}
          label="Cards Mastered"
          value={`${cardMasteryPercent}%`}
          subValue={`${masteredCards} of ${totalCards} cards`}
          color="var(--accent-purple)"
          link="/flashcards"
        />
        <StatCard
          icon={Target}
          label="Quiz Accuracy"
          value={`${quizAccuracy}%`}
          subValue={`${quizProgress.stats.quizzesCompleted} quizzes completed`}
          color="var(--accent-orange)"
          link="/quiz"
        />
        <StatCard
          icon={BookOpen}
          label="Articles Read"
          value={progress.articlesRead}
          color="var(--accent-blue)"
          link="/wiki"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Goals */}
          <div className="bg-[var(--background-secondary)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--foreground)]">Daily Goals</h3>
              <span className="text-xs text-[var(--foreground-muted)]">
                Resets at midnight
              </span>
            </div>
            <div className="space-y-4">
              <GoalItem
                label="Study Time"
                current={dailyGoals.studyTime.current}
                target={dailyGoals.studyTime.target}
                color="var(--accent-cyan)"
              />
              <GoalItem
                label="Review Flashcards"
                current={dailyGoals.flashcards.current}
                target={dailyGoals.flashcards.target}
                color="var(--accent-purple)"
              />
              <GoalItem
                label="Complete Quizzes"
                current={dailyGoals.quizzes.current}
                target={dailyGoals.quizzes.target}
                color="var(--accent-orange)"
              />
            </div>
          </div>

          {/* Weekly Activity */}
          <WeeklyActivity />

          {/* Learning Path Preview */}
          <div className="bg-[var(--background-secondary)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--foreground)]">Learning Path</h3>
              <Link
                href="/progress/path"
                className="text-xs text-[var(--accent-purple)] hover:underline"
              >
                View full path →
              </Link>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {[
                { name: 'Fundamentals', complete: true },
                { name: 'Kafka', complete: true },
                { name: 'Database', complete: false, current: true },
                { name: 'ML Detection', complete: false },
                { name: 'Deployment', complete: false },
              ].map((step, i) => (
                <div key={step.name} className="flex items-center gap-4">
                  <div
                    className={clsx(
                      'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium',
                      step.complete
                        ? 'bg-[var(--accent-green)] text-[var(--background)]'
                        : step.current
                        ? 'bg-[var(--accent-purple)] text-[var(--background)]'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)]'
                    )}
                  >
                    {step.complete ? '✓' : i + 1}
                  </div>
                  {i < 4 && (
                    <div
                      className={clsx(
                        'w-8 h-0.5',
                        step.complete
                          ? 'bg-[var(--accent-green)]'
                          : 'bg-[var(--background-tertiary)]'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3">
              {[
                { name: 'Fundamentals', complete: true },
                { name: 'Kafka', complete: true },
                { name: 'Database', complete: false, current: true },
                { name: 'ML Detection', complete: false },
                { name: 'Deployment', complete: false },
              ].map((step) => (
                <span
                  key={step.name}
                  className={clsx(
                    'text-xs',
                    step.current
                      ? 'text-[var(--accent-purple)] font-medium'
                      : 'text-[var(--foreground-muted)]'
                  )}
                >
                  {step.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Continue Studying */}
          <ContinueStudying />

          {/* Recent Achievements */}
          <div className="bg-[var(--background-secondary)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">
              Recent Achievements
            </h3>
            <div className="space-y-3">
              {[
                { icon: Flame, name: '7-Day Streak', date: 'Today', color: 'var(--accent-red)' },
                { icon: Trophy, name: 'Kafka Master', date: 'Yesterday', color: 'var(--accent-yellow)' },
                { icon: Zap, name: 'Speed Learner', date: '3 days ago', color: 'var(--accent-purple)' },
              ].map((achievement, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-lg"
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${achievement.color}20` }}
                  >
                    <achievement.icon className="w-4 h-4" style={{ color: achievement.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {achievement.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/progress/achievements"
              className="block mt-4 text-center text-sm text-[var(--accent-purple)] hover:underline"
            >
              View all achievements →
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-[var(--background-secondary)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--foreground)] mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/flashcards?mode=review"
                className="flex flex-col items-center gap-2 p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-center"
              >
                <Brain className="w-6 h-6 text-[var(--accent-purple)]" />
                <span className="text-sm text-[var(--foreground)]">Review Cards</span>
              </Link>
              <Link
                href="/quiz?recommended=true"
                className="flex flex-col items-center gap-2 p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-center"
              >
                <Target className="w-6 h-6 text-[var(--accent-orange)]" />
                <span className="text-sm text-[var(--foreground)]">Take Quiz</span>
              </Link>
              <Link
                href="/wiki"
                className="flex flex-col items-center gap-2 p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-center"
              >
                <BookOpen className="w-6 h-6 text-[var(--accent-blue)]" />
                <span className="text-sm text-[var(--foreground)]">Read Article</span>
              </Link>
              <Link
                href="/xray"
                className="flex flex-col items-center gap-2 p-4 bg-[var(--background)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors text-center"
              >
                <Zap className="w-6 h-6 text-[var(--accent-cyan)]" />
                <span className="text-sm text-[var(--foreground)]">X-Ray Code</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
