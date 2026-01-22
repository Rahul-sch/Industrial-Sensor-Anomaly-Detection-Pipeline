'use client';

import { useMemo } from 'react';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Brain,
} from 'lucide-react';
import { QuizScoreRing } from '@/components/ui/ProgressRing';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import type { Quiz, QuizQuestion } from '@/lib/types';

interface QuizResultsProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  answers: (number | null)[];
  timeSpent: number;
  onRetry?: () => void;
  onReviewWrong?: () => void;
  onNextQuiz?: () => void;
  onBackToQuizzes?: () => void;
  className?: string;
}

export function QuizResults({
  quiz,
  questions,
  answers,
  timeSpent,
  onRetry,
  onReviewWrong,
  onNextQuiz,
  onBackToQuizzes,
  className = '',
}: QuizResultsProps) {
  // Calculate results
  const results = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    const wrongQuestions: { question: QuizQuestion; userAnswer: number; correctAnswer: number }[] = [];
    const correctQuestions: QuizQuestion[] = [];

    questions.forEach((q, i) => {
      const answer = answers[i];
      if (answer === q.correctAnswer) {
        correct++;
        correctQuestions.push(q);
      } else {
        incorrect++;
        if (answer !== null) {
          wrongQuestions.push({
            question: q,
            userAnswer: answer,
            correctAnswer: q.correctAnswer as number,
          });
        }
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= quiz.passingScore;

    return {
      correct,
      incorrect,
      score,
      passed,
      wrongQuestions,
      correctQuestions,
    };
  }, [questions, answers, quiz.passingScore]);

  // Calculate time efficiency
  const avgTimePerQuestion = Math.round(timeSpent / questions.length);
  const expectedTime = (quiz.estimatedMinutes ?? 5) * 60;
  const timeEfficiency = timeSpent < expectedTime ? 'Fast' : timeSpent < expectedTime * 1.5 ? 'On pace' : 'Slow';

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--background-secondary)] mb-4">
          {results.passed ? (
            <Trophy className="w-10 h-10 text-[var(--accent-yellow)]" />
          ) : (
            <Target className="w-10 h-10 text-[var(--accent-red)]" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          {results.passed ? 'Congratulations!' : 'Keep Practicing!'}
        </h2>
        <p className="text-[var(--foreground-muted)] mt-1">
          {results.passed
            ? `You passed the ${quiz.title} quiz!`
            : `You need ${quiz.passingScore}% to pass. You got ${results.score}%.`}
        </p>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center">
        <QuizScoreRing score={results.score} size={120} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Correct"
          value={results.correct.toString()}
          subtext={`of ${questions.length}`}
          color="var(--accent-green)"
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Incorrect"
          value={results.incorrect.toString()}
          subtext="questions"
          color="var(--accent-red)"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Time"
          value={formatTime(timeSpent)}
          subtext={timeEfficiency}
          color="var(--accent-orange)"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Avg/Question"
          value={`${avgTimePerQuestion}s`}
          subtext="per question"
          color="var(--accent-cyan)"
        />
      </div>

      {/* Wrong Answers Review */}
      {results.wrongQuestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <XCircle className="w-5 h-5 text-[var(--accent-red)]" />
            Review Incorrect Answers
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {results.wrongQuestions.map(({ question, userAnswer, correctAnswer }) => (
              <WrongAnswerCard
                key={question.id}
                question={question}
                userAnswer={userAnswer}
                correctAnswer={correctAnswer}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="p-4 bg-[var(--background-secondary)] rounded-xl">
        <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Recommendations
        </h3>
        <div className="space-y-2 text-sm text-[var(--foreground)]">
          {results.wrongQuestions.length > 0 && (
            <p>
              • Review the{' '}
              <span className="text-[var(--accent-cyan)]">
                {[...new Set(results.wrongQuestions.map((w) => w.question.category))].join(', ')}
              </span>{' '}
              topics for better understanding
            </p>
          )}
          {results.score < 70 && (
            <p>
              • Try the{' '}
              <span className="text-[var(--accent-purple)]">flashcards</span> for these topics before
              retrying
            </p>
          )}
          {results.score >= 90 && (
            <p>
              • Excellent! Consider trying the{' '}
              <span className="text-[var(--accent-yellow)]">advanced</span> quiz next
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--background-tertiary)] text-[var(--foreground)] rounded-lg hover:bg-[var(--accent-blue)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry Quiz
          </button>
        )}

        {results.wrongQuestions.length > 0 && onReviewWrong && (
          <button
            onClick={onReviewWrong}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-red)]/20 text-[var(--accent-red)] rounded-lg hover:bg-[var(--accent-red)]/30 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Study Wrong Answers
          </button>
        )}

        {results.passed && onNextQuiz && (
          <button
            onClick={onNextQuiz}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-cyan)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
          >
            Next Quiz
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {onBackToQuizzes && (
          <button
            onClick={onBackToQuizzes}
            className="flex items-center gap-2 px-5 py-2.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Back to Quizzes
          </button>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="p-4 bg-[var(--background-secondary)] rounded-xl text-center">
      <div className="flex justify-center mb-2" style={{ color }}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--foreground-muted)]">
        {label} · {subtext}
      </p>
    </div>
  );
}

// Wrong Answer Card
function WrongAnswerCard({
  question,
  userAnswer,
  correctAnswer,
}: {
  question: QuizQuestion;
  userAnswer: number;
  correctAnswer: number;
}) {
  return (
    <div className="p-4 bg-[var(--background-secondary)] border border-[var(--accent-red)]/30 rounded-lg">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-[var(--foreground)] font-medium">{question.question}</p>
        <DifficultyBadge difficulty={question.difficulty} size="sm" showLabel={false} />
      </div>

      <div className="space-y-1 text-sm">
        <p className="text-[var(--accent-red)]">
          <span className="opacity-70">Your answer:</span> {question.options?.[userAnswer]}
        </p>
        <p className="text-[var(--accent-green)]">
          <span className="opacity-70">Correct answer:</span> {question.options?.[correctAnswer]}
        </p>
      </div>

      {question.explanation && (
        <p className="text-xs text-[var(--foreground-muted)] mt-2 pt-2 border-t border-[var(--background-tertiary)]">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

// Format time helper
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// Compact results for dashboard
export function CompactQuizResults({
  score,
  passed,
  correct,
  total,
}: {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <QuizScoreRing score={score} size={60} />
      <div>
        <p
          className={`font-semibold ${
            passed ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
          }`}
        >
          {passed ? 'Passed' : 'Failed'}
        </p>
        <p className="text-sm text-[var(--foreground-muted)]">
          {correct}/{total} correct
        </p>
      </div>
    </div>
  );
}

export default QuizResults;
