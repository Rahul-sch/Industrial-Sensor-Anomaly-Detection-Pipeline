'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Trophy, Clock, Target, Star, BookOpen } from 'lucide-react';
import { DifficultyBadge } from '@/components/ui/DifficultyBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { quizzes } from '@/content/quizzes/quiz-data';
import { useQuizProgress, useRecommendedQuiz } from '@/hooks/useQuizProgress';
import type { Quiz, WikiCategory, Difficulty } from '@/lib/types';

interface QuizSelectorProps {
  onSelect: (quizId: string) => void;
  showFilters?: boolean;
  showRecommended?: boolean;
  className?: string;
}

type CategoryFilter = WikiCategory | 'general' | 'all';
type DifficultyFilter = Difficulty | 'all';

export function QuizSelector({
  onSelect,
  showFilters = true,
  showRecommended = true,
  className = '',
}: QuizSelectorProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const quizStats = useQuizProgress((s) => s.quizStats);
  const recommendedQuizId = useRecommendedQuiz();

  // Filter quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesTitle = quiz.title.toLowerCase().includes(searchLower);
        const matchesDesc = quiz.description.toLowerCase().includes(searchLower);
        const matchesCategory = quiz.category.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && quiz.category !== categoryFilter) return false;

      // Difficulty filter
      if (difficultyFilter !== 'all' && quiz.difficulty !== difficultyFilter) return false;

      return true;
    });
  }, [search, categoryFilter, difficultyFilter]);

  // Sort quizzes (recommended first, then by completion status)
  const sortedQuizzes = useMemo(() => {
    return [...filteredQuizzes].sort((a, b) => {
      // Recommended first
      if (a.id === recommendedQuizId) return -1;
      if (b.id === recommendedQuizId) return 1;

      // Incomplete first
      const aStats = quizStats[a.id];
      const bStats = quizStats[b.id];
      const aCompleted = aStats?.passed || false;
      const bCompleted = bStats?.passed || false;
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

      // Then by difficulty
      const diffOrder = { beginner: 0, intermediate: 1, advanced: 2, critical: 3 };
      return diffOrder[a.difficulty] - diffOrder[b.difficulty];
    });
  }, [filteredQuizzes, recommendedQuizId, quizStats]);

  const categories = ['all', 'kafka', 'ml', 'database', 'security', 'frontend', 'general'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced', 'critical'];

  return (
    <div className={className}>
      {/* Search and Filter Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
          />
        </div>

        {showFilters && (
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2.5 rounded-lg transition-colors ${
              showFilterPanel
                ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        )}
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
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat as CategoryFilter)}
                    className={`px-3 py-1.5 text-sm rounded-full capitalize transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {cat}
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
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff as DifficultyFilter)}
                    className={`px-3 py-1.5 text-sm rounded-full capitalize transition-colors ${
                      difficultyFilter === diff
                        ? 'bg-[var(--accent-cyan)] text-[var(--background)]'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-[var(--foreground-muted)] mb-4">
        Showing {sortedQuizzes.length} of {quizzes.length} quizzes
      </p>

      {/* Quiz Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedQuizzes.map((quiz) => {
          const stats = quizStats[quiz.id];
          const isRecommended = showRecommended && quiz.id === recommendedQuizId;

          return (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              stats={stats}
              isRecommended={isRecommended}
              onSelect={() => onSelect(quiz.id)}
            />
          );
        })}
      </div>

      {sortedQuizzes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--foreground-muted)]">
            No quizzes match your filters
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('all');
              setDifficultyFilter('all');
            }}
            className="mt-4 px-4 py-2 text-[var(--accent-cyan)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

// Quiz Card Component
function QuizCard({
  quiz,
  stats,
  isRecommended,
  onSelect,
}: {
  quiz: Quiz;
  stats?: { bestScore: number; attempts: number; passed: boolean };
  isRecommended?: boolean;
  onSelect: () => void;
}) {
  const hasAttempts = stats && stats.attempts > 0;

  return (
    <button
      onClick={onSelect}
      className={`p-5 bg-[var(--background-secondary)] border rounded-xl text-left transition-all group hover:border-[var(--accent-cyan)] ${
        isRecommended
          ? 'border-[var(--accent-yellow)] ring-1 ring-[var(--accent-yellow)]/30'
          : 'border-[var(--background-tertiary)]'
      }`}
    >
      {/* Recommended Badge */}
      {isRecommended && (
        <div className="flex items-center gap-1.5 text-[var(--accent-yellow)] text-xs font-medium mb-3">
          <Star className="w-3.5 h-3.5 fill-current" />
          Recommended for you
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <DifficultyBadge difficulty={quiz.difficulty} size="sm" />
        {stats?.passed && (
          <div className="flex items-center gap-1 text-[var(--accent-green)]">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-medium">Passed</span>
          </div>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
        {quiz.title}
      </h3>
      <p className="text-sm text-[var(--foreground-muted)] line-clamp-2 mb-4">
        {quiz.description}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {quiz.questions.length}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {quiz.estimatedMinutes}m
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5" />
            {quiz.passingScore}%
          </span>
        </div>

        {/* Progress indicator */}
        {hasAttempts && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--foreground-muted)]">
              Best: <span className={stats.passed ? 'text-[var(--accent-green)]' : 'text-[var(--foreground)]'}>
                {stats.bestScore}%
              </span>
            </span>
            <ProgressRing
              progress={stats.bestScore}
              size={24}
              strokeWidth={3}
              showPercentage={false}
              color={stats.passed ? 'var(--accent-green)' : 'var(--accent-orange)'}
            />
          </div>
        )}
      </div>
    </button>
  );
}

// Compact quiz list for sidebars
export function CompactQuizList({
  limit = 5,
  onSelect,
}: {
  limit?: number;
  onSelect: (quizId: string) => void;
}) {
  const quizStats = useQuizProgress((s) => s.quizStats);
  const recommendedQuizId = useRecommendedQuiz();

  // Get top quizzes
  const topQuizzes = useMemo(() => {
    return quizzes
      .sort((a, b) => {
        if (a.id === recommendedQuizId) return -1;
        if (b.id === recommendedQuizId) return 1;
        const aStats = quizStats[a.id];
        const bStats = quizStats[b.id];
        if (!aStats && bStats) return -1;
        if (aStats && !bStats) return 1;
        return 0;
      })
      .slice(0, limit);
  }, [quizStats, recommendedQuizId, limit]);

  return (
    <div className="space-y-2">
      {topQuizzes.map((quiz) => {
        const stats = quizStats[quiz.id];
        const isRecommended = quiz.id === recommendedQuizId;

        return (
          <button
            key={quiz.id}
            onClick={() => onSelect(quiz.id)}
            className="w-full p-3 bg-[var(--background-secondary)] rounded-lg text-left hover:bg-[var(--background-tertiary)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {quiz.title}
              </span>
              {isRecommended && (
                <Star className="w-3.5 h-3.5 text-[var(--accent-yellow)] fill-current" />
              )}
              {stats?.passed && (
                <Trophy className="w-3.5 h-3.5 text-[var(--accent-green)]" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--foreground-muted)]">
              <DifficultyBadge difficulty={quiz.difficulty} size="sm" showLabel={false} />
              <span>{quiz.questions.length} questions</span>
              {stats && <span>· Best: {stats.bestScore}%</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default QuizSelector;
