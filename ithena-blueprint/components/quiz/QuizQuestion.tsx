'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, HelpCircle, Lightbulb } from 'lucide-react';
import type { QuizQuestion as QuizQuestionType } from '@/lib/types';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import { QuizOption } from './QuizOption';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  onAnswer: (answerIndex: number) => void;
  showResult?: boolean;
  showExplanation?: boolean;
  className?: string;
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  showResult = false,
  showExplanation = false,
  className = '',
}: QuizQuestionProps) {
  const [showHint, setShowHint] = useState(false);

  const isCorrect = selectedAnswer === question.correctAnswer;
  const hasAnswered = selectedAnswer !== null;

  const handleOptionClick = useCallback(
    (index: number) => {
      if (showResult) return; // Can't change answer after revealing
      onAnswer(index);
    },
    [showResult, onAnswer]
  );

  // Get question type label
  const typeLabel = {
    multiple_choice: 'Multiple Choice',
    true_false: 'True or False',
    fill_blank: 'Fill in the Blank',
  }[question.type];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--foreground-muted)]">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--background-tertiary)] text-[var(--foreground-muted)]">
            {typeLabel}
          </span>
        </div>
        <DifficultyBadge difficulty={question.difficulty} size="sm" />
      </div>

      {/* Question Text */}
      <div className="p-6 bg-[var(--background-secondary)] rounded-xl">
        <h3 className="text-xl font-medium text-[var(--foreground)] leading-relaxed">
          {question.type === 'fill_blank'
            ? formatFillBlankQuestion(question.question)
            : question.question}
        </h3>

        {/* Tags */}
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <QuizOption
            key={index}
            option={option}
            index={index}
            isSelected={selectedAnswer === index}
            isCorrect={index === question.correctAnswer}
            showResult={showResult}
            onClick={() => handleOptionClick(index)}
          />
        ))}
      </div>

      {/* Result Feedback */}
      {showResult && hasAnswered && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 animate-fade-in ${
            isCorrect
              ? 'bg-[var(--accent-green)]/15 border border-[var(--accent-green)]/30'
              : 'bg-[var(--accent-red)]/15 border border-[var(--accent-red)]/30'
          }`}
        >
          {isCorrect ? (
            <CheckCircle className="w-6 h-6 text-[var(--accent-green)] flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-6 h-6 text-[var(--accent-red)] flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`font-semibold ${
                isCorrect ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
              }`}
            >
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            {!isCorrect && (
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                The correct answer is:{' '}
                <span className="text-[var(--accent-green)] font-medium">
                  {question.options[question.correctAnswer]}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      {showExplanation && question.explanation && (
        <div className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--accent-cyan)]/30 animate-fade-in">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[var(--accent-cyan)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--accent-cyan)] text-sm mb-1">
                Explanation
              </p>
              <p className="text-[var(--foreground)] leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hint Button (only before answering) */}
      {!showResult && !hasAnswered && question.explanation && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          {showHint ? 'Hide hint' : 'Need a hint?'}
        </button>
      )}

      {showHint && !hasAnswered && (
        <div className="p-3 bg-[var(--background-tertiary)] rounded-lg text-sm text-[var(--foreground-muted)] animate-fade-in">
          <p>Think about: {getHintFromExplanation(question.explanation)}</p>
        </div>
      )}
    </div>
  );
}

// Format fill-in-the-blank questions with highlighted blank
function formatFillBlankQuestion(question: string): React.ReactNode {
  const parts = question.split('______');
  if (parts.length < 2) return question;

  return (
    <>
      {parts[0]}
      <span className="inline-block px-4 py-1 mx-1 bg-[var(--accent-cyan)]/20 border-b-2 border-[var(--accent-cyan)] rounded">
        ?
      </span>
      {parts[1]}
    </>
  );
}

// Generate a hint from the explanation (first sentence, vague)
function getHintFromExplanation(explanation: string): string {
  const firstSentence = explanation.split('.')[0];
  // Make it vaguer by removing specific answers
  return firstSentence
    .replace(/\b(is|are|means|requires)\b/gi, 'involves')
    .replace(/\b(always|never|exactly)\b/gi, 'typically')
    .slice(0, 80) + '...';
}

// Compact question preview for lists
export function QuestionPreview({
  question,
  onClick,
}: {
  question: QuizQuestionType;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-lg hover:border-[var(--accent-cyan)] transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <DifficultyBadge difficulty={question.difficulty} size="sm" />
        <span className="text-xs text-[var(--foreground-muted)] capitalize">
          {question.type.replace('_', ' ')}
        </span>
      </div>
      <p className="text-sm text-[var(--foreground)] line-clamp-2">{question.question}</p>
    </button>
  );
}

export default QuizQuestion;
