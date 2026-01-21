import type { Difficulty } from '@/lib/types';

/**
 * Difficulty configuration with colors, labels, and descriptions
 */
export interface DifficultyConfig {
  level: Difficulty;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  icon: string;
  estimatedMinutes: number; // Average time to complete content at this level
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  beginner: {
    level: 'beginner',
    label: 'Beginner',
    description: 'Foundational concepts, no prerequisites',
    color: 'var(--accent-cyan)',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    glowColor: '0 0 15px rgba(6, 182, 212, 0.3)',
    icon: '🌱',
    estimatedMinutes: 5,
  },
  intermediate: {
    level: 'intermediate',
    label: 'Intermediate',
    description: 'Requires basic understanding, builds on fundamentals',
    color: 'var(--accent-orange)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    glowColor: '0 0 15px rgba(249, 115, 22, 0.3)',
    icon: '🔥',
    estimatedMinutes: 10,
  },
  advanced: {
    level: 'advanced',
    label: 'Advanced',
    description: 'Deep knowledge required, complex topics',
    color: 'var(--accent-red)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    glowColor: '0 0 15px rgba(239, 68, 68, 0.3)',
    icon: '⚡',
    estimatedMinutes: 15,
  },
  critical: {
    level: 'critical',
    label: 'Critical',
    description: 'Must-know for interviews, core concepts',
    color: 'var(--accent-purple)',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    glowColor: '0 0 20px rgba(139, 92, 246, 0.4)',
    icon: '💎',
    estimatedMinutes: 12,
  },
};

/**
 * Get difficulty config by level
 */
export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIG[difficulty];
}

/**
 * Get all difficulty levels in order (easiest to hardest)
 */
export function getDifficultyLevels(): Difficulty[] {
  return ['beginner', 'intermediate', 'advanced', 'critical'];
}

/**
 * Compare difficulties (returns negative if a < b, positive if a > b)
 */
export function compareDifficulty(a: Difficulty, b: Difficulty): number {
  const order: Record<Difficulty, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    critical: 4,
  };
  return order[a] - order[b];
}

/**
 * Get next difficulty level
 */
export function getNextDifficulty(current: Difficulty): Difficulty | null {
  const levels = getDifficultyLevels();
  const currentIndex = levels.indexOf(current);
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return null;
  }
  return levels[currentIndex + 1];
}

/**
 * Get previous difficulty level
 */
export function getPreviousDifficulty(current: Difficulty): Difficulty | null {
  const levels = getDifficultyLevels();
  const currentIndex = levels.indexOf(current);
  if (currentIndex <= 0) {
    return null;
  }
  return levels[currentIndex - 1];
}

/**
 * Calculate recommended daily study order based on difficulty
 * Returns difficulties in recommended study order
 */
export function getRecommendedStudyOrder(): Difficulty[] {
  // Start with critical (most important), then build up
  return ['critical', 'beginner', 'intermediate', 'advanced'];
}

/**
 * Estimate total study time for a list of content
 */
export function estimateStudyTime(
  items: { difficulty: Difficulty }[]
): { minutes: number; hours: number; formatted: string } {
  const totalMinutes = items.reduce(
    (acc, item) => acc + DIFFICULTY_CONFIG[item.difficulty].estimatedMinutes,
    0
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted: string;
  if (hours === 0) {
    formatted = `${minutes} min`;
  } else if (minutes === 0) {
    formatted = `${hours} hr`;
  } else {
    formatted = `${hours} hr ${minutes} min`;
  }

  return { minutes: totalMinutes, hours, formatted };
}

/**
 * Filter content by difficulty
 */
export function filterByDifficulty<T extends { difficulty: Difficulty }>(
  items: T[],
  difficulties: Difficulty[]
): T[] {
  if (difficulties.length === 0) return items;
  return items.filter((item) => difficulties.includes(item.difficulty));
}

/**
 * Group content by difficulty
 */
export function groupByDifficulty<T extends { difficulty: Difficulty }>(
  items: T[]
): Record<Difficulty, T[]> {
  const groups: Record<Difficulty, T[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
    critical: [],
  };

  for (const item of items) {
    groups[item.difficulty].push(item);
  }

  return groups;
}

/**
 * Get CSS class name for difficulty
 */
export function getDifficultyClassName(difficulty: Difficulty): string {
  return `difficulty-${difficulty}`;
}
