'use client';

import { CheckCircle, XCircle, Circle, Clock } from 'lucide-react';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: (number | null)[];
  correctAnswers: number[];
  showResults?: boolean;
  timeRemaining?: number;
  className?: string;
}

export function QuizProgress({
  currentQuestion,
  totalQuestions,
  answers,
  correctAnswers,
  showResults = false,
  timeRemaining,
  className = '',
}: QuizProgressProps) {
  // Calculate stats
  const answeredCount = answers.filter((a) => a !== null).length;
  const correctCount = answers.filter((a, i) => a === correctAnswers[i]).length;
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-cyan)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="absolute -top-1 left-0 w-full h-4 flex">
          {Array.from({ length: totalQuestions }).map((_, index) => {
            const answer = answers[index];
            const isCorrect = answer === correctAnswers[index];
            const isCurrent = index === currentQuestion - 1;
            const position = ((index + 0.5) / totalQuestions) * 100;

            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                {showResults && answer !== null ? (
                  isCorrect ? (
                    <CheckCircle className="w-3 h-3 text-[var(--accent-green)]" />
                  ) : (
                    <XCircle className="w-3 h-3 text-[var(--accent-red)]" />
                  )
                ) : (
                  <Circle
                    className={`w-2 h-2 ${
                      isCurrent
                        ? 'text-[var(--accent-cyan)] fill-current'
                        : answer !== null
                          ? 'text-[var(--foreground-muted)] fill-current'
                          : 'text-[var(--background-tertiary)]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--foreground-muted)]">
          Question <span className="text-[var(--foreground)] font-semibold">{currentQuestion}</span>{' '}
          of {totalQuestions}
        </span>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {timeRemaining !== undefined && (
            <div className="flex items-center gap-1.5 text-[var(--accent-orange)]">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}

          {/* Answered count */}
          <span className="text-[var(--foreground-muted)]">
            <span className="text-[var(--accent-cyan)] font-semibold">{answeredCount}</span> answered
          </span>

          {/* Score (if showing results) */}
          {showResults && (
            <span className="text-[var(--foreground-muted)]">
              <span className="text-[var(--accent-green)] font-semibold">{correctCount}</span> correct
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact progress indicator
export function CompactQuizProgress({
  current,
  total,
  correct,
  showScore = false,
}: {
  current: number;
  total: number;
  correct?: number;
  showScore?: boolean;
}) {
  const progress = (current / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <ProgressRing
        progress={progress}
        size={40}
        strokeWidth={4}
        showPercentage={false}
        color="var(--accent-cyan)"
      >
        <span className="text-xs font-semibold text-[var(--foreground)]">
          {current}/{total}
        </span>
      </ProgressRing>

      {showScore && correct !== undefined && (
        <div className="text-sm">
          <span className="text-[var(--accent-green)] font-semibold">{correct}</span>
          <span className="text-[var(--foreground-muted)]"> correct</span>
        </div>
      )}
    </div>
  );
}

// Question dots indicator
export function QuestionDots({
  total,
  current,
  answers,
  correctAnswers,
  showResults = false,
  onNavigate,
}: {
  total: number;
  current: number;
  answers: (number | null)[];
  correctAnswers: number[];
  showResults?: boolean;
  onNavigate?: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: total }).map((_, index) => {
        const answer = answers[index];
        const isCorrect = answer === correctAnswers[index];
        const isCurrent = index === current - 1;
        const isAnswered = answer !== null;

        let bgColor = 'bg-[var(--background-tertiary)]';
        let borderColor = 'border-transparent';

        if (showResults && isAnswered) {
          bgColor = isCorrect ? 'bg-[var(--accent-green)]' : 'bg-[var(--accent-red)]';
        } else if (isAnswered) {
          bgColor = 'bg-[var(--accent-cyan)]';
        }

        if (isCurrent) {
          borderColor = 'border-[var(--foreground)]';
        }

        return (
          <button
            key={index}
            onClick={() => onNavigate?.(index)}
            disabled={!onNavigate}
            className={`w-3 h-3 rounded-full border-2 transition-all ${bgColor} ${borderColor} ${
              onNavigate ? 'hover:scale-125 cursor-pointer' : ''
            }`}
            title={`Question ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

// Timer display
export function QuizTimer({
  seconds,
  warning = 60,
  danger = 30,
  className = '',
}: {
  seconds: number;
  warning?: number;
  danger?: number;
  className?: string;
}) {
  const colorClass =
    seconds <= danger
      ? 'text-[var(--accent-red)]'
      : seconds <= warning
        ? 'text-[var(--accent-orange)]'
        : 'text-[var(--foreground)]';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className={`w-5 h-5 ${colorClass}`} />
      <span className={`font-mono text-xl font-bold ${colorClass}`}>
        {formatTime(seconds)}
      </span>
    </div>
  );
}

// Helper function to format time
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Progress summary for end of quiz
export function ProgressSummary({
  answered,
  total,
  correct,
  timeSpent,
}: {
  answered: number;
  total: number;
  correct: number;
  timeSpent: number;
}) {
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const score = Math.round((correct / total) * 100);

  return (
    <div className="grid grid-cols-4 gap-4">
      <SummaryCard
        label="Score"
        value={`${score}%`}
        color={score >= 70 ? 'var(--accent-green)' : 'var(--accent-red)'}
      />
      <SummaryCard
        label="Correct"
        value={`${correct}/${total}`}
        color="var(--accent-cyan)"
      />
      <SummaryCard
        label="Accuracy"
        value={`${accuracy}%`}
        color="var(--accent-purple)"
      />
      <SummaryCard
        label="Time"
        value={formatTime(timeSpent)}
        color="var(--accent-orange)"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="p-4 bg-[var(--background-secondary)] rounded-xl text-center">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-[var(--foreground-muted)] mt-1">{label}</p>
    </div>
  );
}

export default QuizProgress;
