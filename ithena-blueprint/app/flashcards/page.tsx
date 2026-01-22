'use client';

import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, BookOpen, Brain, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import { FlashCardDeck } from '@/components/flashcards/FlashCardDeck';
import { FlashCardReviewButtons } from '@/components/flashcards/FlashCardReviewButtons';
import { FlashCard } from '@/components/flashcards/FlashCard';
import { ProgressRing, MasteryRing } from '@/components/ui/ProgressRing';
import { StreakCounter } from '@/components/ui/StreakCounter';
import {
  flashcardData,
  getCardsByCategory,
  getCardsByDifficulty,
  shuffleCards,
} from '@/content/flashcards/flashcard-data';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import type { FlashCard as FlashCardType, WikiCategory } from '@/lib/types';
import type { SM2Quality } from '@/lib/spaced-repetition';

type StudyMode = 'browse' | 'review' | 'learn';

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  all: { label: 'All Cards', icon: '📚', color: 'var(--accent-cyan)' },
  kafka: { label: 'Kafka', icon: '📨', color: 'var(--accent-orange)' },
  ml: { label: 'Machine Learning', icon: '🤖', color: 'var(--accent-purple)' },
  database: { label: 'Database', icon: '🗄️', color: 'var(--accent-blue)' },
  security: { label: 'Security', icon: '🔐', color: 'var(--accent-red)' },
  frontend: { label: 'Frontend', icon: '🎨', color: 'var(--accent-green)' },
};

export default function FlashcardsPage() {
  const [mode, setMode] = useState<StudyMode>('browse');
  const [selectedCategory, setSelectedCategory] = useState<WikiCategory | 'all'>('all');
  const [currentCards, setCurrentCards] = useState<FlashCardType[]>(flashcardData);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    startTime: Date.now(),
  });

  const studyProgress = useStudyProgress();
  const { startSession, endSession, recordFlashcardReview, streakDays, flashcardsReviewed } = studyProgress;

  // Filter cards by category
  useEffect(() => {
    const cards = selectedCategory === 'all'
      ? flashcardData
      : getCardsByCategory(selectedCategory);
    setCurrentCards(shuffleCards(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategory]);

  // Start session when entering review mode
  useEffect(() => {
    if (mode === 'review') {
      startSession('flashcards', selectedCategory);
      setSessionStats({
        reviewed: 0,
        correct: 0,
        startTime: Date.now(),
      });
    }
  }, [mode, selectedCategory, startSession]);

  const currentCard = currentCards[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleReview = useCallback((quality: SM2Quality) => {
    if (!currentCard) return;

    recordFlashcardReview(currentCard.id, quality);

    setSessionStats((prev) => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
    }));

    // Move to next card
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      // End of deck
      endSession();
      setMode('browse');
    }
  }, [currentCard, currentIndex, currentCards.length, recordFlashcardReview, endSession]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode !== 'review') return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          handleFlip();
          break;
        case '1':
          if (isFlipped) handleReview(0);
          break;
        case '2':
          if (isFlipped) handleReview(1);
          break;
        case '3':
          if (isFlipped) handleReview(3);
          break;
        case '4':
          if (isFlipped) handleReview(5);
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            setIsFlipped(false);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < currentCards.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setIsFlipped(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isFlipped, currentIndex, currentCards.length, handleFlip, handleReview]);

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
                  Flashcard Study
                </h1>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {currentCards.length} cards available
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <StreakCounter streak={streakDays} />
              <MasteryRing
                progress={
                  flashcardsReviewed > 0
                    ? Math.min(100, (flashcardsReviewed / flashcardData.length) * 100)
                    : 0
                }
                size={48}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {mode === 'browse' ? (
          <>
            {/* Category Selection */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Choose a Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(CATEGORY_LABELS).map(([key, { label, icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key as WikiCategory | 'all')}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedCategory === key
                        ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/10'
                        : 'border-[var(--background-tertiary)] bg-[var(--background-secondary)] hover:border-[var(--foreground-muted)]'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{icon}</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {label}
                    </span>
                    <span className="text-xs text-[var(--foreground-muted)] block mt-1">
                      {key === 'all'
                        ? `${flashcardData.length} cards`
                        : `${getCardsByCategory(key as WikiCategory).length} cards`}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Study Mode Selection */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Study Mode
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setMode('review')}
                  className="p-6 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl hover:border-[var(--accent-cyan)] transition-all group text-left"
                >
                  <Brain className="w-8 h-8 text-[var(--accent-cyan)] mb-3" />
                  <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-cyan)]">
                    Review Mode
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Study with spaced repetition. Rate your recall to optimize learning.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setCurrentCards(shuffleCards(currentCards));
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className="p-6 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl hover:border-[var(--accent-purple)] transition-all group text-left"
                >
                  <BookOpen className="w-8 h-8 text-[var(--accent-purple)] mb-3" />
                  <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-purple)]">
                    Shuffle & Browse
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Shuffle the deck and browse cards at your own pace.
                  </p>
                </button>

                <div className="p-6 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl opacity-60">
                  <Trophy className="w-8 h-8 text-[var(--accent-yellow)] mb-3" />
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    Challenge Mode
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Timed quizzes coming soon...
                  </p>
                </div>
              </div>
            </section>

            {/* Card Preview */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Preview Deck
              </h2>
              <FlashCardDeck
                cards={currentCards}
                title={CATEGORY_LABELS[selectedCategory]?.label || 'All Cards'}
                showFilters={true}
              />
            </section>
          </>
        ) : (
          /* Review Mode */
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  endSession();
                  setMode('browse');
                }}
                className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Exit Review
              </button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--foreground-muted)]">
                  {currentIndex + 1} / {currentCards.length}
                </span>
                <ProgressRing
                  progress={((currentIndex + 1) / currentCards.length) * 100}
                  size={40}
                  strokeWidth={4}
                  showPercentage={false}
                />
              </div>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-[var(--background-secondary)] rounded-xl text-center">
                <p className="text-2xl font-bold text-[var(--accent-cyan)]">
                  {sessionStats.reviewed}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">Reviewed</p>
              </div>
              <div className="p-4 bg-[var(--background-secondary)] rounded-xl text-center">
                <p className="text-2xl font-bold text-[var(--accent-green)]">
                  {sessionStats.reviewed > 0
                    ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">Accuracy</p>
              </div>
              <div className="p-4 bg-[var(--background-secondary)] rounded-xl text-center">
                <p className="text-2xl font-bold text-[var(--accent-orange)]">
                  {Math.floor((Date.now() - sessionStats.startTime) / 60000)}m
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">Time</p>
              </div>
            </div>

            {/* Current Card */}
            {currentCard ? (
              <div className="flex flex-col items-center">
                <FlashCard
                  card={currentCard}
                  isFlipped={isFlipped}
                  onFlip={handleFlip}
                  className="mb-8"
                />

                {/* Review Buttons (only show when flipped) */}
                {isFlipped && (
                  <FlashCardReviewButtons
                    onReview={handleReview}
                    showIntervals={true}
                    className="animate-fade-in"
                  />
                )}

                {/* Flip hint */}
                {!isFlipped && (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Press <kbd className="px-2 py-0.5 bg-[var(--background-tertiary)] rounded">Space</kbd> to flip
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-[var(--accent-yellow)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  Session Complete!
                </h3>
                <p className="text-[var(--foreground-muted)] mb-6">
                  You reviewed {sessionStats.reviewed} cards with{' '}
                  {sessionStats.reviewed > 0
                    ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
                    : 0}% accuracy
                </p>
                <button
                  onClick={() => {
                    setMode('browse');
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                  className="px-6 py-3 bg-[var(--accent-cyan)] text-[var(--background)] rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Back to Deck
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
