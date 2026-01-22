'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Code2,
  Map,
  HelpCircle,
  Home,
  Zap,
  Brain,
  Target,
  TrendingUp,
  Flame,
  GraduationCap,
  Box,
  ExternalLink,
} from 'lucide-react';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import { useFlashcardProgress } from '@/hooks/useFlashcardProgress';
import clsx from 'clsx';

// Main navigation items
const mainNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/wiki', label: 'Wiki', icon: BookOpen },
  { href: '/xray', label: 'Code X-Ray', icon: Code2 },
  { href: '/map', label: 'System Map', icon: Map },
  { href: '/faq', label: 'Warlord FAQ', icon: HelpCircle },
];

// Study mode navigation items
const studyNavItems = [
  { href: '/flashcards', label: 'Flashcards', icon: Brain },
  { href: '/quiz', label: 'Quizzes', icon: Target },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const progress = useStudyProgress();
  const flashcardProgress = useFlashcardProgress();

  // Calculate badges
  const dueCards = flashcardProgress.getDueCards().length;
  const streakDays = progress.streakDays;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gradient">Ithena</h1>
          <p className="text-xs text-[var(--foreground-muted)]">The Blueprint</p>
        </div>
      </div>

      {/* Streak Banner (if active) */}
      {streakDays > 0 && (
        <div className="mx-2 mb-4 p-2 bg-gradient-to-r from-[var(--accent-red)]/10 to-[var(--accent-orange)]/10 rounded-lg border border-[var(--accent-red)]/20">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[var(--accent-red)]" />
            <span className="text-sm font-medium text-[var(--foreground)]">
              {streakDays} day streak
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="space-y-1 mb-6">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('sidebar-nav-item', isActive && 'active')}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Study Mode Section */}
      <div className="px-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">
          <GraduationCap className="w-3 h-3" />
          <span>Study Mode</span>
        </div>
      </div>

      <nav className="space-y-1">
        {studyNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          // Add badges for specific items
          let badge = null;
          if (item.href === '/flashcards' && dueCards > 0) {
            badge = (
              <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-[var(--accent-purple)] text-[var(--background)] rounded-full">
                {dueCards}
              </span>
            );
          }
          if (item.href === '/progress' && streakDays > 0) {
            badge = (
              <span className="ml-auto flex items-center gap-0.5 text-[10px] text-[var(--accent-red)]">
                <Flame className="w-3 h-3" />
                {streakDays}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx('sidebar-nav-item', isActive && 'active')}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
              {badge}
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="mt-6 mx-2 p-3 bg-[var(--background-secondary)] rounded-lg">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-[var(--accent-purple)]">
              {flashcardProgress.stats.totalReviewed}
            </p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Reviews</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--accent-cyan)]">
              {Math.round(progress.totalTimeSpent / 60)}h
            </p>
            <p className="text-[10px] text-[var(--foreground-muted)]">Studied</p>
          </div>
        </div>
      </div>

      {/* 3D Digital Twin Link */}
      <div className="mt-6 mx-2">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--accent-cyan)]/10 to-[var(--accent-purple)]/10 border border-[var(--accent-cyan)]/30 hover:border-[var(--accent-cyan)]/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all group"
        >
          <Box className="w-5 h-5 text-[var(--accent-cyan)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">3D Digital Twin</span>
          <ExternalLink className="w-3 h-3 ml-auto text-[var(--foreground-muted)] group-hover:text-[var(--accent-cyan)] transition-colors" />
        </a>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-xs text-[var(--foreground-muted)] space-y-1">
          <p>Rig Alpha Learning OS</p>
          <p className="opacity-60">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
