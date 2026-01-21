'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface QuizOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  onClick: () => void;
  disabled?: boolean;
}

// Option letters for display
const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizOption({
  option,
  index,
  isSelected,
  isCorrect,
  showResult,
  onClick,
  disabled = false,
}: QuizOptionProps) {
  // Determine the visual state
  const getStateClass = (): string => {
    if (!showResult) {
      // Before revealing answer
      if (isSelected) {
        return 'quiz-option selected';
      }
      return 'quiz-option';
    }

    // After revealing answer
    if (isCorrect) {
      return 'quiz-option correct';
    }
    if (isSelected && !isCorrect) {
      return 'quiz-option incorrect';
    }
    return 'quiz-option disabled';
  };

  // Get the icon to show
  const getIcon = () => {
    if (!showResult) return null;

    if (isCorrect) {
      return <CheckCircle className="w-5 h-5 text-[var(--accent-green)]" />;
    }
    if (isSelected && !isCorrect) {
      return <XCircle className="w-5 h-5 text-[var(--accent-red)]" />;
    }
    return null;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || showResult}
      className={`${getStateClass()} w-full flex items-center gap-4 text-left group`}
    >
      {/* Option letter badge */}
      <span
        className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          font-semibold text-sm transition-colors
          ${
            isSelected && !showResult
              ? 'bg-[var(--accent-blue)] text-white'
              : showResult && isCorrect
                ? 'bg-[var(--accent-green)] text-white'
                : showResult && isSelected && !isCorrect
                  ? 'bg-[var(--accent-red)] text-white'
                  : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] group-hover:bg-[var(--accent-blue)] group-hover:text-white'
          }
        `}
      >
        {OPTION_LETTERS[index]}
      </span>

      {/* Option text */}
      <span className="flex-1 text-[var(--foreground)]">{option}</span>

      {/* Result icon */}
      {getIcon()}
    </button>
  );
}

// True/False specific option
export function TrueFalseOption({
  value,
  isSelected,
  isCorrect,
  showResult,
  onClick,
}: {
  value: boolean;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  onClick: () => void;
}) {
  return (
    <QuizOption
      option={value ? 'True' : 'False'}
      index={value ? 0 : 1}
      isSelected={isSelected}
      isCorrect={isCorrect}
      showResult={showResult}
      onClick={onClick}
    />
  );
}

// Code option (with syntax highlighting appearance)
export function CodeOption({
  code,
  index,
  isSelected,
  isCorrect,
  showResult,
  onClick,
}: {
  code: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  onClick: () => void;
}) {
  const getStateClass = (): string => {
    if (!showResult) {
      if (isSelected) {
        return 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10';
      }
      return 'border-[var(--background-tertiary)] hover:border-[var(--accent-blue)]';
    }

    if (isCorrect) {
      return 'border-[var(--accent-green)] bg-[var(--accent-green)]/10';
    }
    if (isSelected && !isCorrect) {
      return 'border-[var(--accent-red)] bg-[var(--accent-red)]/10';
    }
    return 'border-[var(--background-tertiary)] opacity-50';
  };

  return (
    <button
      onClick={onClick}
      disabled={showResult}
      className={`w-full text-left p-4 border-2 rounded-xl transition-all ${getStateClass()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--foreground-muted)]">
          Option {OPTION_LETTERS[index]}
        </span>
        {showResult && isCorrect && (
          <CheckCircle className="w-4 h-4 text-[var(--accent-green)]" />
        )}
        {showResult && isSelected && !isCorrect && (
          <XCircle className="w-4 h-4 text-[var(--accent-red)]" />
        )}
      </div>
      <pre className="font-mono text-sm text-[var(--foreground)] bg-[var(--code-bg)] p-3 rounded-lg overflow-x-auto">
        <code>{code}</code>
      </pre>
    </button>
  );
}

// Inline option badges for compact display
export function InlineOptions({
  options,
  selectedIndex,
  correctIndex,
  showResult,
  onSelect,
}: {
  options: string[];
  selectedIndex: number | null;
  correctIndex: number;
  showResult: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const isCorrect = index === correctIndex;

        let bgColor = 'bg-[var(--background-tertiary)]';
        let textColor = 'text-[var(--foreground)]';

        if (showResult) {
          if (isCorrect) {
            bgColor = 'bg-[var(--accent-green)]/20';
            textColor = 'text-[var(--accent-green)]';
          } else if (isSelected && !isCorrect) {
            bgColor = 'bg-[var(--accent-red)]/20';
            textColor = 'text-[var(--accent-red)]';
          } else {
            textColor = 'text-[var(--foreground-muted)]';
          }
        } else if (isSelected) {
          bgColor = 'bg-[var(--accent-blue)]/20';
          textColor = 'text-[var(--accent-blue)]';
        }

        return (
          <button
            key={index}
            onClick={() => onSelect(index)}
            disabled={showResult}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${bgColor} ${textColor} ${
              !showResult && !isSelected ? 'hover:bg-[var(--accent-blue)]/10' : ''
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export default QuizOption;
