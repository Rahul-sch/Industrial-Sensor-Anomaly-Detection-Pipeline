'use client';

import { useState, useMemo, useCallback } from 'react';
import { Shuffle, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { FlashCard as FlashCardType, WikiCategory, Difficulty } from '@/lib/types';
import { FlashCard } from './FlashCard';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';

interface FlashCardDeckProps {
  cards: FlashCardType[];
  title?: string;
  onCardReview?: (cardId: string, quality: number) => void;
  showFilters?: boolean;
  className?: string;
}

type CategoryFilter = WikiCategory | 'general' | 'all';
type DifficultyFilter = Difficulty | 'all';

const CATEGORIES: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'kafka', label: 'Kafka' },
  { value: 'ml', label: 'Machine Learning' },
  { value: 'database', label: 'Database' },
  { value: 'security', label: 'Security' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'general', label: 'General' },
];

const DIFFICULTIES: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'critical', label: 'Critical' },
];

export function FlashCardDeck({
  cards,
  title = 'Flashcard Deck',
  onCardReview,
  showFilters = true,
  className = '',
}: FlashCardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [shuffledCards, setShuffledCards] = useState<FlashCardType[]>(cards);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter cards based on selected filters
  const filteredCards = useMemo(() => {
    return shuffledCards.filter((card) => {
      const categoryMatch = categoryFilter === 'all' || card.category === categoryFilter;
      const difficultyMatch = difficultyFilter === 'all' || card.difficulty === difficultyFilter;
      return categoryMatch && difficultyMatch;
    });
  }, [shuffledCards, categoryFilter, difficultyFilter]);

  // Current card
  const currentCard = filteredCards[currentIndex];

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, filteredCards.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Shuffle deck
  const shuffleDeck = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  // Reset deck
  const resetDeck = useCallback(() => {
    setShuffledCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCategoryFilter('all');
    setDifficultyFilter('all');
  }, [cards]);

  // Handle filter changes
  const handleCategoryChange = useCallback((category: CategoryFilter) => {
    setCategoryFilter(category);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  const handleDifficultyChange = useCallback((difficulty: DifficultyFilter) => {
    setDifficultyFilter(difficulty);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

  // Calculate progress
  const progress = filteredCards.length > 0
    ? ((currentIndex + 1) / filteredCards.length) * 100
    : 0;

  if (filteredCards.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <p className="text-[var(--foreground-muted)] text-lg mb-4">
          No cards match the selected filters
        </p>
        <button
          onClick={resetDeck}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-cyan)] text-[var(--background)] rounded-lg hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">{title}</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            Card {currentIndex + 1} of {filteredCards.length}
            {(categoryFilter !== 'all' || difficultyFilter !== 'all') && (
              <span className="ml-2">
                (filtered from {cards.length} total)
              </span>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-lg transition-colors ${
                showFilterPanel
                  ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                  : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
              title="Filter cards"
            >
              <Filter className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={shuffleDeck}
            className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            title="Shuffle deck"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            onClick={resetDeck}
            className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            title="Reset deck"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="mb-6 p-4 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-lg animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleCategoryChange(value)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      categoryFilter === value
                        ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                Difficulty
              </label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleDifficultyChange(value)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      difficultyFilter === value
                        ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-[var(--background-tertiary)] rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-[var(--accent-cyan)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card Display */}
      <div className="flex items-center gap-4">
        {/* Previous Button */}
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={`p-3 rounded-full transition-colors ${
            currentIndex === 0
              ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] opacity-50 cursor-not-allowed'
              : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-blue)]'
          }`}
          title="Previous card"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Card */}
        <div className="flex-1 flex justify-center">
          {currentCard && (
            <FlashCard
              card={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              showDifficulty={true}
              showCategory={true}
            />
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={goToNext}
          disabled={currentIndex === filteredCards.length - 1}
          className={`p-3 rounded-full transition-colors ${
            currentIndex === filteredCards.length - 1
              ? 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] opacity-50 cursor-not-allowed'
              : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--accent-blue)]'
          }`}
          title="Next card"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Card Stack Indicator */}
      <div className="flex justify-center mt-6 gap-1">
        {filteredCards.slice(0, 10).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsFlipped(false);
            }}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex
                ? 'bg-[var(--accent-cyan)]'
                : 'bg-[var(--background-tertiary)] hover:bg-[var(--foreground-muted)]'
            }`}
            title={`Go to card ${index + 1}`}
          />
        ))}
        {filteredCards.length > 10 && (
          <span className="text-xs text-[var(--foreground-muted)] ml-2">
            +{filteredCards.length - 10} more
          </span>
        )}
      </div>

      {/* Current Card Info */}
      {currentCard && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <DifficultyBadge difficulty={currentCard.difficulty} size="sm" />
          <span className="text-sm text-[var(--foreground-muted)]">
            {currentCard.category}
          </span>
          {currentCard.tags.length > 0 && (
            <div className="flex gap-1">
              {currentCard.tags.slice(0, 3).map((tag) => (
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
      )}
    </div>
  );
}

// Compact deck selector for choosing which deck to study
export function DeckSelector({
  decks,
  onSelect,
}: {
  decks: { id: string; title: string; cardCount: number; category: string }[];
  onSelect: (deckId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <button
          key={deck.id}
          onClick={() => onSelect(deck.id)}
          className="p-4 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl text-left hover:border-[var(--accent-cyan)] transition-colors group"
        >
          <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-cyan)] transition-colors">
            {deck.title}
          </h3>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            {deck.cardCount} cards · {deck.category}
          </p>
        </button>
      ))}
    </div>
  );
}

export default FlashCardDeck;
