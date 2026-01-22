'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Play, Clock, Target, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StreakCounter } from '@/components/ui/StreakCounter';
import { QuizQuestion } from '@/components/quiz/QuizQuestion';
import { QuizProgress, QuizTimer, QuestionDots } from '@/components/quiz/QuizProgress';
import { QuizResults } from '@/components/quiz/QuizResults';
import {
  quizzes,
  getQuizById,
  getQuestionsForQuiz,
  shuffleQuestions,
  shuffleOptions,
} from '@/content/quizzes/quiz-data';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import type { Quiz, QuizQuestion as QuizQuestionType } from '@/lib/types';

type QuizState = 'selection' | 'active' | 'results';

export default function QuizPage() {
  const [state, setState] = useState<QuizState>('selection');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const studyProgress = useStudyProgress();
  const { startSession, endSession, recordQuizScore, streakDays } = studyProgress;

  // Timer effect
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  // Start a quiz
  const startQuiz = useCallback((quiz: Quiz) => {
    const quizQuestions = getQuestionsForQuiz(quiz.id);
    const shuffled = shuffleQuestions(quizQuestions).map(shuffleOptions);

    setSelectedQuiz(quiz);
    setQuestions(shuffled);
    setAnswers(new Array(shuffled.length).fill(null));
    setCurrentQuestion(0);
    setShowResult(false);
    setTimeSpent(0);
    setTimerActive(true);
    setState('active');
    startSession('quiz', quiz.id);
  }, [startSession]);

  // Handle answer selection
  const handleAnswer = useCallback((answerIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answerIndex;
      return newAnswers;
    });
  }, [currentQuestion]);

  // Navigate to next question
  const nextQuestion = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setShowResult(false);
    }
  }, [currentQuestion, questions.length]);

  // Navigate to previous question
  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setShowResult(false);
    }
  }, [currentQuestion]);

  // Submit answer and show result
  const submitAnswer = useCallback(() => {
    setShowResult(true);
  }, []);

  // Finish quiz
  const finishQuiz = useCallback(() => {
    setTimerActive(false);
    const correctCount = questions.filter((q, i) => answers[i] === q.correctAnswer).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= (selectedQuiz?.passingScore ?? 70);
    recordQuizScore(score, passed);
    endSession();
    setState('results');
  }, [questions, answers, selectedQuiz, recordQuizScore, endSession]);

  // Retry quiz
  const retryQuiz = useCallback(() => {
    if (selectedQuiz) {
      startQuiz(selectedQuiz);
    }
  }, [selectedQuiz, startQuiz]);

  // Back to selection
  const backToSelection = useCallback(() => {
    setSelectedQuiz(null);
    setQuestions([]);
    setAnswers([]);
    setState('selection');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (state !== 'active') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'n':
          if (showResult) nextQuestion();
          break;
        case 'ArrowLeft':
        case 'p':
          prevQuestion();
          break;
        case 'Enter':
        case ' ':
          if (!showResult && answers[currentQuestion] !== null) {
            e.preventDefault();
            submitAnswer();
          } else if (showResult && currentQuestion < questions.length - 1) {
            nextQuestion();
          } else if (showResult && currentQuestion === questions.length - 1) {
            finishQuiz();
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          if (!showResult) {
            const index = parseInt(e.key) - 1;
            if (index < (questions[currentQuestion]?.options?.length ?? 0)) {
              handleAnswer(index);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state,
    showResult,
    answers,
    currentQuestion,
    questions,
    nextQuestion,
    prevQuestion,
    submitAnswer,
    finishQuiz,
    handleAnswer,
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background-secondary)] border-b border-[var(--background-tertiary)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  {state === 'selection' ? 'Quiz Center' : selectedQuiz?.title}
                </h1>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {state === 'selection'
                    ? `${quizzes.length} quizzes available`
                    : state === 'active'
                      ? `Question ${currentQuestion + 1} of ${questions.length}`
                      : 'Results'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {state === 'active' && (
                <QuizTimer seconds={timeSpent} />
              )}
              <StreakCounter streak={streakDays} size="sm" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Quiz Selection */}
        {state === 'selection' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onStart={() => startQuiz(quiz)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Quiz */}
        {state === 'active' && questions[currentQuestion] && (
          <div className="space-y-6">
            {/* Progress */}
            <QuizProgress
              currentQuestion={currentQuestion + 1}
              totalQuestions={questions.length}
              answers={answers}
              correctAnswers={questions.map((q) => q.correctAnswer as number)}
              showResults={showResult}
            />

            {/* Question */}
            <QuizQuestion
              question={questions[currentQuestion]}
              questionNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestion]}
              onAnswer={handleAnswer}
              showResult={showResult}
              showExplanation={showResult}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="px-4 py-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-50 transition-colors"
              >
                Previous
              </button>

              <QuestionDots
                total={questions.length}
                current={currentQuestion + 1}
                answers={answers}
                correctAnswers={questions.map((q) => q.correctAnswer as number)}
                showResults={showResult}
                onNavigate={(index) => {
                  setCurrentQuestion(index);
                  setShowResult(false);
                }}
              />

              <div className="flex gap-2">
                {!showResult && answers[currentQuestion] !== null && (
                  <button
                    onClick={submitAnswer}
                    className="px-5 py-2 bg-[var(--accent-cyan)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Check Answer
                  </button>
                )}

                {showResult && currentQuestion < questions.length - 1 && (
                  <button
                    onClick={nextQuestion}
                    className="px-5 py-2 bg-[var(--accent-cyan)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Next Question
                  </button>
                )}

                {showResult && currentQuestion === questions.length - 1 && (
                  <button
                    onClick={finishQuiz}
                    className="px-5 py-2 bg-[var(--accent-green)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Finish Quiz
                  </button>
                )}
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="text-center text-xs text-[var(--foreground-muted)]">
              <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">1-4</kbd> select
              {' · '}
              <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">Enter</kbd> submit
              {' · '}
              <kbd className="px-1.5 py-0.5 bg-[var(--background-tertiary)] rounded">←→</kbd> navigate
            </div>
          </div>
        )}

        {/* Results */}
        {state === 'results' && selectedQuiz && (
          <QuizResults
            quiz={selectedQuiz}
            questions={questions}
            answers={answers}
            timeSpent={timeSpent}
            onRetry={retryQuiz}
            onBackToQuizzes={backToSelection}
          />
        )}
      </main>
    </div>
  );
}

// Quiz Card Component
function QuizCard({ quiz, onStart }: { quiz: Quiz; onStart: () => void }) {
  const questionCount = quiz.questions.length;

  return (
    <div className="p-6 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl hover:border-[var(--accent-cyan)] transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <DifficultyBadge difficulty={quiz.difficulty} />
        <span className="text-xs text-[var(--foreground-muted)] capitalize">
          {quiz.category}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
        {quiz.title}
      </h3>

      <p className="text-sm text-[var(--foreground-muted)] mb-4 line-clamp-2">
        {quiz.description}
      </p>

      <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-4">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" />
          {questionCount} questions
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          ~{quiz.estimatedMinutes} min
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          {quiz.passingScore}% to pass
        </span>
      </div>

      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent-cyan)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity font-medium"
      >
        <Play className="w-4 h-4" />
        Start Quiz
      </button>
    </div>
  );
}
