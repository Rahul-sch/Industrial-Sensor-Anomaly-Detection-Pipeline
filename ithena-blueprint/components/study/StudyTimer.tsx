'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  BookOpen,
  Timer,
  Settings,
  X,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import clsx from 'clsx';

// Timer modes
type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
}

const defaultSettings: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
};

const modeConfig: Record<TimerMode, { icon: typeof BookOpen; color: string; label: string }> = {
  focus: {
    icon: BookOpen,
    color: 'var(--accent-red)',
    label: 'Focus',
  },
  shortBreak: {
    icon: Coffee,
    color: 'var(--accent-green)',
    label: 'Short Break',
  },
  longBreak: {
    icon: Coffee,
    color: 'var(--accent-blue)',
    label: 'Long Break',
  },
};

interface StudyTimerProps {
  onSessionComplete?: (duration: number) => void;
  className?: string;
  compact?: boolean;
}

export function StudyTimer({
  onSessionComplete,
  className = '',
  compact = false,
}: StudyTimerProps) {
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeRemaining, setTimeRemaining] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  const { addStudyTime } = useStudyProgress();

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('ithena-timer-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      setSettings(parsed);
      if (mode === 'focus') {
        setTimeRemaining(parsed.focusDuration * 60);
      }
    }

    const storedSessions = localStorage.getItem('ithena-timer-sessions-today');
    if (storedSessions) {
      const data = JSON.parse(storedSessions);
      // Only restore if from today
      if (data.date === new Date().toDateString()) {
        setCompletedSessions(data.sessions);
        setTotalFocusTime(data.totalTime || 0);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: TimerSettings) => {
    localStorage.setItem('ithena-timer-settings', JSON.stringify(newSettings));
    setSettings(newSettings);
  }, []);

  // Save session data
  const saveSessionData = useCallback((sessions: number, totalTime: number) => {
    localStorage.setItem(
      'ithena-timer-sessions-today',
      JSON.stringify({
        date: new Date().toDateString(),
        sessions,
        totalTime,
      })
    );
  }, []);

  // Get duration for current mode
  const getDuration = useCallback(
    (m: TimerMode) => {
      switch (m) {
        case 'focus':
          return settings.focusDuration * 60;
        case 'shortBreak':
          return settings.shortBreakDuration * 60;
        case 'longBreak':
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  // Play notification sound
  const playSound = useCallback(() => {
    if (settings.soundEnabled) {
      // Use Web Audio API to create a simple beep
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();

        // Fade out
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch {
        // Fallback: do nothing if audio fails
      }
    }
  }, [settings.soundEnabled]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    playSound();

    if (mode === 'focus') {
      // Track focus time
      const sessionDuration = settings.focusDuration;
      const newTotalTime = totalFocusTime + sessionDuration;
      const newSessions = completedSessions + 1;

      setTotalFocusTime(newTotalTime);
      setCompletedSessions(newSessions);
      saveSessionData(newSessions, newTotalTime);

      // Add to study progress
      addStudyTime(sessionDuration);
      onSessionComplete?.(sessionDuration);

      // Determine next break type
      const shouldTakeLongBreak = newSessions % settings.sessionsBeforeLongBreak === 0;
      const nextMode = shouldTakeLongBreak ? 'longBreak' : 'shortBreak';

      setMode(nextMode);
      setTimeRemaining(getDuration(nextMode));

      if (settings.autoStartBreaks) {
        setIsRunning(true);
        sessionStartRef.current = Date.now();
      } else {
        setIsRunning(false);
      }
    } else {
      // Break complete, switch to focus
      setMode('focus');
      setTimeRemaining(getDuration('focus'));

      if (settings.autoStartFocus) {
        setIsRunning(true);
        sessionStartRef.current = Date.now();
      } else {
        setIsRunning(false);
      }
    }
  }, [
    mode,
    settings,
    completedSessions,
    totalFocusTime,
    playSound,
    getDuration,
    saveSessionData,
    addStudyTime,
    onSessionComplete,
  ]);

  // Timer tick
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, handleTimerComplete]);

  // Start/pause timer
  const toggleTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      if (!sessionStartRef.current) {
        sessionStartRef.current = Date.now();
      }
    }
  }, [isRunning]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(getDuration(mode));
    sessionStartRef.current = null;
  }, [mode, getDuration]);

  // Switch mode
  const switchMode = useCallback(
    (newMode: TimerMode) => {
      setIsRunning(false);
      setMode(newMode);
      setTimeRemaining(getDuration(newMode));
      sessionStartRef.current = null;
    },
    [getDuration]
  );

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = ((getDuration(mode) - timeRemaining) / getDuration(mode)) * 100;

  const ModeIcon = modeConfig[mode].icon;

  // Compact view
  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-[var(--background-secondary)] rounded-lg ${className}`}
      >
        <ModeIcon
          className="w-4 h-4"
          style={{ color: modeConfig[mode].color }}
        />
        <span
          className="font-mono text-lg font-semibold"
          style={{ color: modeConfig[mode].color }}
        >
          {formatTime(timeRemaining)}
        </span>
        <button
          onClick={toggleTimer}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            isRunning
              ? 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)]'
              : 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
          )}
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-[var(--background-secondary)] rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-[var(--foreground-muted)]" />
          <h3 className="font-semibold text-[var(--foreground)]">Study Timer</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          {showSettings ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-[var(--background)] rounded-lg border border-[var(--background-tertiary)] space-y-4">
          <h4 className="text-sm font-medium text-[var(--foreground)]">Timer Settings</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--foreground-muted)]">Focus (min)</label>
              <input
                type="number"
                value={settings.focusDuration}
                onChange={(e) =>
                  saveSettings({ ...settings, focusDuration: parseInt(e.target.value) || 25 })
                }
                min={1}
                max={120}
                className="w-full mt-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded text-[var(--foreground)] text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--foreground-muted)]">Short Break (min)</label>
              <input
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) =>
                  saveSettings({
                    ...settings,
                    shortBreakDuration: parseInt(e.target.value) || 5,
                  })
                }
                min={1}
                max={30}
                className="w-full mt-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded text-[var(--foreground)] text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--foreground-muted)]">Long Break (min)</label>
              <input
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) =>
                  saveSettings({
                    ...settings,
                    longBreakDuration: parseInt(e.target.value) || 15,
                  })
                }
                min={1}
                max={60}
                className="w-full mt-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded text-[var(--foreground)] text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--foreground-muted)]">Sessions for Long Break</label>
              <input
                type="number"
                value={settings.sessionsBeforeLongBreak}
                onChange={(e) =>
                  saveSettings({
                    ...settings,
                    sessionsBeforeLongBreak: parseInt(e.target.value) || 4,
                  })
                }
                min={1}
                max={10}
                className="w-full mt-1 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded text-[var(--foreground)] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) =>
                  saveSettings({ ...settings, autoStartBreaks: e.target.checked })
                }
                className="rounded border-[var(--background-tertiary)]"
              />
              Auto-start breaks
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartFocus}
                onChange={(e) =>
                  saveSettings({ ...settings, autoStartFocus: e.target.checked })
                }
                className="rounded border-[var(--background-tertiary)]"
              />
              Auto-start focus after break
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) =>
                  saveSettings({ ...settings, soundEnabled: e.target.checked })
                }
                className="rounded border-[var(--background-tertiary)]"
              />
              <span className="flex items-center gap-1">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                Sound notifications
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(modeConfig) as TimerMode[]).map((m) => {
          const config = modeConfig[m];
          const Icon = config.icon;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                mode === m
                  ? 'text-[var(--background)]'
                  : 'bg-[var(--background)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              )}
              style={{
                backgroundColor: mode === m ? config.color : undefined,
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timer Display */}
      <div className="relative flex flex-col items-center justify-center py-8">
        {/* Progress Ring */}
        <svg className="absolute w-48 h-48" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--background-tertiary)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={modeConfig[mode].color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
        </svg>

        {/* Time */}
        <div className="z-10 text-center">
          <ModeIcon
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: modeConfig[mode].color }}
          />
          <div
            className="font-mono text-5xl font-bold"
            style={{ color: modeConfig[mode].color }}
          >
            {formatTime(timeRemaining)}
          </div>
          <div className="text-sm text-[var(--foreground-muted)] mt-1">
            {modeConfig[mode].label}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={resetTimer}
          className="p-3 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        <button
          onClick={toggleTimer}
          className={clsx(
            'flex items-center justify-center w-16 h-16 rounded-full transition-all',
            isRunning
              ? 'bg-[var(--accent-yellow)] hover:opacity-90'
              : 'hover:opacity-90'
          )}
          style={{
            backgroundColor: isRunning ? 'var(--accent-yellow)' : modeConfig[mode].color,
          }}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 text-[var(--background)]" />
          ) : (
            <Play className="w-8 h-8 text-[var(--background)] ml-1" />
          )}
        </button>
        <div className="w-12" /> {/* Spacer for balance */}
      </div>

      {/* Session Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--background-tertiary)]">
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            {Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'w-3 h-3 rounded-full transition-colors',
                  i < completedSessions % settings.sessionsBeforeLongBreak
                    ? 'bg-[var(--accent-green)]'
                    : 'bg-[var(--background-tertiary)]'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Until long break
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 text-[var(--accent-green)]">
            <Check className="w-4 h-4" />
            <span className="font-semibold">{completedSessions}</span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">Sessions today</p>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 text-[var(--accent-purple)]">
            <Timer className="w-4 h-4" />
            <span className="font-semibold">{totalFocusTime}m</span>
          </div>
          <p className="text-xs text-[var(--foreground-muted)]">Focus time</p>
        </div>
      </div>
    </div>
  );
}

// Compact timer badge for sidebar/header
export function StudyTimerBadge({ className = '' }: { className?: string }) {
  return <StudyTimer compact className={className} />;
}

export default StudyTimer;
