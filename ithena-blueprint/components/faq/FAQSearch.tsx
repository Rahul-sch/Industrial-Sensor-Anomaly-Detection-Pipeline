'use client';

import { Search, X } from 'lucide-react';

interface FAQSearchProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

export function FAQSearch({ value, onChange, resultCount, totalCount }: FAQSearchProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search questions... (e.g., 'kafka', 'exactly-once', 'security')"
          className="w-full pl-12 pr-12 py-4 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--accent-green)] focus:ring-1 focus:ring-[var(--accent-green)] transition-all"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--background-tertiary)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--foreground-muted)]" />
          </button>
        )}
      </div>

      <div className="mt-2 text-sm text-[var(--foreground-muted)]">
        Showing <span className="text-[var(--accent-green)] font-semibold">{resultCount}</span> of {totalCount} questions
        {value && (
          <span className="ml-2">
            matching &quot;<span className="text-[var(--foreground)]">{value}</span>&quot;
          </span>
        )}
      </div>
    </div>
  );
}
