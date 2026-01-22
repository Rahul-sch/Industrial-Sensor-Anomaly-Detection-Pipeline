'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

// Activity data type
interface DayActivity {
  date: string; // YYYY-MM-DD
  minutes: number;
  sessions: number;
  flashcardsReviewed: number;
  quizzesCompleted: number;
}

// Generate sample activity data (would come from localStorage in real app)
function generateSampleData(months: number = 6): Map<string, DayActivity> {
  const data = new Map<string, DayActivity>();
  const today = new Date();

  for (let i = 0; i < months * 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Generate random activity (more likely to have activity on recent days)
    const recencyFactor = Math.max(0, 1 - i / (months * 30));
    const hasActivity = Math.random() < 0.3 + recencyFactor * 0.4;

    if (hasActivity) {
      const intensity = Math.random() * recencyFactor;
      data.set(dateStr, {
        date: dateStr,
        minutes: Math.round(10 + intensity * 90),
        sessions: Math.round(1 + intensity * 4),
        flashcardsReviewed: Math.round(intensity * 30),
        quizzesCompleted: Math.random() < intensity ? 1 : 0,
      });
    }
  }

  return data;
}

// Get activity level (0-4) based on minutes
function getActivityLevel(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

// Activity level colors
const levelColors = [
  'var(--background-tertiary)', // 0: no activity
  'var(--accent-green)', // 1: low
  'var(--accent-green)', // 2: medium
  'var(--accent-green)', // 3: high
  'var(--accent-green)', // 4: very high
];

const levelOpacity = [1, 0.25, 0.5, 0.75, 1];

interface ActivityHeatmapProps {
  months?: number;
  showLegend?: boolean;
  showStats?: boolean;
  className?: string;
}

export function ActivityHeatmap({
  months = 6,
  showLegend = true,
  showStats = true,
  className = '',
}: ActivityHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(0); // 0 = current month

  // Load activity data
  const activityData = useMemo(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') {
      return generateSampleData(months);
    }
    // Try to load from localStorage first
    const stored = localStorage.getItem('ithena-activity-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map<string, DayActivity>(Object.entries(parsed));
    }
    // Generate sample data for demo
    return generateSampleData(months);
  }, [months]);

  // Generate calendar grid for the visible period
  const calendarData = useMemo(() => {
    const today = new Date();
    const weeks: { date: Date; dateStr: string; activity: DayActivity | null }[][] = [];

    // Calculate start date (beginning of visible month's week grid)
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - visibleMonth);
    startDate.setDate(1);
    // Go back to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Generate weeks (approximately months * 4 weeks + buffer)
    const totalWeeks = 4 * (months - visibleMonth) + 2;

    let currentDate = new Date(startDate);
    for (let w = 0; w < totalWeeks; w++) {
      const week: { date: Date; dateStr: string; activity: DayActivity | null }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isFuture = currentDate > today;

        week.push({
          date: new Date(currentDate),
          dateStr,
          activity: isFuture ? null : activityData.get(dateStr) || null,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, [activityData, months, visibleMonth]);

  // Calculate stats
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let totalSessions = 0;
    let activeDays = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort dates and calculate
    const sortedDates = [...activityData.keys()].sort().reverse();
    const today = new Date().toISOString().split('T')[0];

    sortedDates.forEach((dateStr, i) => {
      const activity = activityData.get(dateStr)!;
      totalMinutes += activity.minutes;
      totalSessions += activity.sessions;
      activeDays++;

      // Streak calculation
      if (i === 0 && dateStr === today) {
        tempStreak = 1;
      } else if (i > 0) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(dateStr);
        const diff = Math.floor(
          (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    });

    currentStreak = tempStreak;
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      totalMinutes,
      totalSessions,
      activeDays,
      currentStreak,
      longestStreak,
      totalDays: months * 30,
    };
  }, [activityData, months]);

  // Get selected day details
  const selectedActivity = selectedDate ? activityData.get(selectedDate) : null;

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number }[] = [];
    const today = new Date();

    for (let m = 0; m <= months; m++) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - m);
      const weekIndex = Math.floor((today.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
      labels.push({
        month: date.toLocaleString('default', { month: 'short' }),
        position: calendarData.length - weekIndex - 1,
      });
    }

    return labels.filter((l) => l.position >= 0 && l.position < calendarData.length);
  }, [calendarData, months]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-[var(--background-secondary)] rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[var(--foreground-muted)]" />
          <h3 className="font-semibold text-[var(--foreground)]">Activity</h3>
        </div>
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisibleMonth(Math.min(visibleMonth + 1, months - 1))}
            disabled={visibleMonth >= months - 1}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setVisibleMonth(Math.max(visibleMonth - 1, 0))}
            disabled={visibleMonth <= 0}
            className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2">
            {dayLabels.map((day, i) => (
              <div
                key={day}
                className={clsx(
                  'h-3 text-[10px] text-[var(--foreground-muted)]',
                  i % 2 === 1 && 'invisible'
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Week columns */}
          <div className="flex gap-[3px]">
            {calendarData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day) => {
                  const level = day.activity ? getActivityLevel(day.activity.minutes) : 0;
                  const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = selectedDate === day.dateStr;
                  const isFuture = day.date > new Date();

                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => !isFuture && setSelectedDate(isSelected ? null : day.dateStr)}
                      disabled={isFuture}
                      className={clsx(
                        'w-3 h-3 rounded-sm transition-all',
                        isSelected && 'ring-1 ring-[var(--foreground)] ring-offset-1 ring-offset-[var(--background-secondary)]',
                        isToday && 'ring-1 ring-[var(--accent-purple)]',
                        isFuture && 'opacity-20 cursor-not-allowed'
                      )}
                      style={{
                        backgroundColor: levelColors[level],
                        opacity: levelOpacity[level],
                      }}
                      title={`${day.dateStr}: ${day.activity?.minutes || 0} min`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-[var(--foreground-muted)]">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: levelColors[level],
                opacity: levelOpacity[level],
              }}
            />
          ))}
          <span>More</span>
        </div>
      )}

      {/* Selected Day Detail */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-[var(--background)] rounded-lg border border-[var(--background-tertiary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--foreground)]">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Close
            </button>
          </div>
          {selectedActivity ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--foreground-muted)]">Study time:</span>
                <span className="ml-1 font-medium text-[var(--foreground)]">
                  {selectedActivity.minutes} min
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-muted)]">Sessions:</span>
                <span className="ml-1 font-medium text-[var(--foreground)]">
                  {selectedActivity.sessions}
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-muted)]">Flashcards:</span>
                <span className="ml-1 font-medium text-[var(--foreground)]">
                  {selectedActivity.flashcardsReviewed}
                </span>
              </div>
              <div>
                <span className="text-[var(--foreground-muted)]">Quizzes:</span>
                <span className="ml-1 font-medium text-[var(--foreground)]">
                  {selectedActivity.quizzesCompleted}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--foreground-muted)]">No activity recorded</p>
          )}
        </div>
      )}

      {/* Stats Summary */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--background-tertiary)]">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--foreground)]">
              {Math.round(stats.totalMinutes / 60)}h
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">Total time</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--foreground)]">
              {stats.activeDays}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">Active days</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--accent-red)]">
              {stats.currentStreak}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">Current streak</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--accent-yellow)]">
              {stats.longestStreak}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">Best streak</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact inline heatmap (last 7 days)
export function ActivityHeatmapMini({ className = '' }: { className?: string }) {
  const activityData = useMemo(() => {
    if (typeof window === 'undefined') {
      return generateSampleData(1);
    }
    const stored = localStorage.getItem('ithena-activity-data');
    if (stored) {
      return new Map<string, DayActivity>(Object.entries(JSON.parse(stored)));
    }
    return generateSampleData(1);
  }, []);

  // Last 7 days
  const days = useMemo(() => {
    const result: { date: string; minutes: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activity = activityData.get(dateStr);
      result.push({
        date: dateStr,
        minutes: activity?.minutes || 0,
      });
    }

    return result;
  }, [activityData]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {days.map((day) => {
        const level = getActivityLevel(day.minutes);
        return (
          <div
            key={day.date}
            className="w-4 h-4 rounded"
            style={{
              backgroundColor: levelColors[level],
              opacity: levelOpacity[level],
            }}
            title={`${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}: ${day.minutes} min`}
          />
        );
      })}
    </div>
  );
}

export default ActivityHeatmap;
