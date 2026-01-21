'use client';

import { useState, useMemo } from 'react';
import { HelpCircle, Filter, Zap, Shield, Database, Cpu, Globe, TrendingUp, Box } from 'lucide-react';
import { FAQSearch } from '@/components/faq/FAQSearch';
import { FAQCard } from '@/components/faq/FAQCard';
import { FAQTagChip } from '@/components/faq/FAQTagChip';
import { faqData, allTags, allCategories, type FAQ } from '@/content/faq/faq-data';

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  architecture: { icon: Box, color: 'var(--accent-purple)' },
  kafka: { icon: Zap, color: 'var(--accent-orange)' },
  ml: { icon: Cpu, color: 'var(--accent-pink)' },
  database: { icon: Database, color: 'var(--accent-cyan)' },
  security: { icon: Shield, color: 'var(--accent-red)' },
  frontend: { icon: Globe, color: 'var(--accent-green)' },
  scaling: { icon: TrendingUp, color: 'var(--accent-yellow)' },
};

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter FAQs based on search, tags, category, and priority
  const filteredFAQs = useMemo(() => {
    return faqData.filter((faq) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuestion = faq.question.toLowerCase().includes(query);
        const matchesAnswer = faq.answer.toLowerCase().includes(query);
        const matchesTags = faq.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesQuestion && !matchesAnswer && !matchesTags) {
          return false;
        }
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => faq.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      // Category filter
      if (selectedCategory && faq.category !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority && faq.priority !== selectedPriority) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedTags, selectedCategory, selectedPriority]);

  // Group FAQs by priority for display
  const groupedFAQs = useMemo(() => {
    const critical = filteredFAQs.filter(f => f.priority === 'critical');
    const high = filteredFAQs.filter(f => f.priority === 'high');
    const medium = filteredFAQs.filter(f => f.priority === 'medium');
    return { critical, high, medium };
  }, [filteredFAQs]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedCategory(null);
    setSelectedPriority(null);
  };

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedCategory || selectedPriority;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-green)]/20 flex items-center justify-center">
              <HelpCircle className="w-7 h-7 text-[var(--accent-green)]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Warlord FAQ</h1>
              <p className="text-[var(--foreground-muted)]">
                High-stakes Q&A for CTO interviews and troubleshooting
              </p>
            </div>
          </div>

          <div className="bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl p-5">
            <p className="text-[var(--foreground-muted)] leading-relaxed">
              <span className="text-[var(--accent-red)] font-semibold">Critical</span> questions are must-know for any technical interview.
              Each answer includes code references, architectural reasoning, and links to deeper documentation.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <FAQSearch
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={filteredFAQs.length}
            totalCount={faqData.length}
          />
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Category Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground-muted)]">Categories</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => {
                const config = categoryConfig[category];
                const Icon = config?.icon || Box;
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(isActive ? null : category)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${isActive
                        ? 'text-white shadow-lg'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }
                    `}
                    style={isActive ? { backgroundColor: config?.color } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <span className="text-sm font-medium text-[var(--foreground-muted)] block mb-3">Priority</span>
            <div className="flex gap-2">
              {['critical', 'high', 'medium'].map((priority) => {
                const isActive = selectedPriority === priority;
                const colors = {
                  critical: 'var(--accent-red)',
                  high: 'var(--accent-orange)',
                  medium: 'var(--accent-blue)',
                };
                return (
                  <button
                    key={priority}
                    onClick={() => setSelectedPriority(isActive ? null : priority)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                      ${isActive
                        ? 'text-white shadow-lg'
                        : 'bg-[var(--background-tertiary)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                      }
                    `}
                    style={isActive ? { backgroundColor: colors[priority as keyof typeof colors] } : undefined}
                  >
                    {priority}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag Filter */}
          <div>
            <span className="text-sm font-medium text-[var(--foreground-muted)] block mb-3">Tags</span>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 15).map((tag) => (
                <FAQTagChip
                  key={tag}
                  tag={tag}
                  active={selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
              {allTags.length > 15 && (
                <span className="text-xs text-[var(--foreground-muted)] self-center">
                  +{allTags.length - 15} more
                </span>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[var(--accent-green)] hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* FAQ List */}
        {filteredFAQs.length === 0 ? (
          <div className="bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl p-12 text-center">
            <HelpCircle className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No matching questions</h3>
            <p className="text-[var(--foreground-muted)]">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Critical Questions */}
            {groupedFAQs.critical.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--accent-red)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />
                  Critical Questions ({groupedFAQs.critical.length})
                </h2>
                <div className="space-y-4">
                  {groupedFAQs.critical.map((faq) => (
                    <FAQCard
                      key={faq.id}
                      faq={faq}
                      isExpanded={expandedId === faq.id}
                      onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* High Priority Questions */}
            {groupedFAQs.high.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--accent-orange)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-orange)]" />
                  High Priority ({groupedFAQs.high.length})
                </h2>
                <div className="space-y-4">
                  {groupedFAQs.high.map((faq) => (
                    <FAQCard
                      key={faq.id}
                      faq={faq}
                      isExpanded={expandedId === faq.id}
                      onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Medium Priority Questions */}
            {groupedFAQs.medium.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--accent-blue)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
                  Medium Priority ({groupedFAQs.medium.length})
                </h2>
                <div className="space-y-4">
                  {groupedFAQs.medium.map((faq) => (
                    <FAQCard
                      key={faq.id}
                      faq={faq}
                      isExpanded={expandedId === faq.id}
                      onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Stats footer */}
        <div className="mt-12 pt-8 border-t border-[var(--background-tertiary)]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-[var(--background-secondary)] rounded-lg p-4">
              <div className="text-3xl font-bold text-[var(--accent-green)]">{faqData.length}</div>
              <div className="text-sm text-[var(--foreground-muted)]">Total Questions</div>
            </div>
            <div className="bg-[var(--background-secondary)] rounded-lg p-4">
              <div className="text-3xl font-bold text-[var(--accent-red)]">
                {faqData.filter(f => f.priority === 'critical').length}
              </div>
              <div className="text-sm text-[var(--foreground-muted)]">Critical</div>
            </div>
            <div className="bg-[var(--background-secondary)] rounded-lg p-4">
              <div className="text-3xl font-bold text-[var(--accent-purple)]">{allCategories.length}</div>
              <div className="text-sm text-[var(--foreground-muted)]">Categories</div>
            </div>
            <div className="bg-[var(--background-secondary)] rounded-lg p-4">
              <div className="text-3xl font-bold text-[var(--accent-cyan)]">{allTags.length}</div>
              <div className="text-sm text-[var(--foreground-muted)]">Tags</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
