'use client';

import { useState } from 'react';
import { ChevronDown, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { FAQ } from '@/content/faq/faq-data';

interface FAQCardProps {
  faq: FAQ;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const priorityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'var(--accent-red)',
    bg: 'rgba(239, 68, 68, 0.15)',
    label: 'Critical',
  },
  high: {
    icon: AlertCircle,
    color: 'var(--accent-orange)',
    bg: 'rgba(249, 115, 22, 0.15)',
    label: 'High',
  },
  medium: {
    icon: Info,
    color: 'var(--accent-blue)',
    bg: 'rgba(59, 130, 246, 0.15)',
    label: 'Medium',
  },
};

const categoryColors: Record<string, string> = {
  architecture: 'var(--accent-purple)',
  kafka: 'var(--accent-orange)',
  ml: 'var(--accent-pink)',
  database: 'var(--accent-cyan)',
  security: 'var(--accent-red)',
  frontend: 'var(--accent-green)',
  scaling: 'var(--accent-yellow)',
};

export function FAQCard({ faq, isExpanded = false, onToggle }: FAQCardProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = onToggle ? isExpanded : localExpanded;
  const toggleExpand = onToggle || (() => setLocalExpanded(!localExpanded));

  const priority = priorityConfig[faq.priority];
  const PriorityIcon = priority.icon;
  const categoryColor = categoryColors[faq.category] || 'var(--foreground-muted)';

  return (
    <div
      className={`
        bg-[var(--background-secondary)] border rounded-xl overflow-hidden transition-all duration-300
        ${expanded
          ? 'border-[var(--accent-green)] shadow-lg'
          : 'border-[var(--background-tertiary)] hover:border-[var(--accent-green)]/50'
        }
      `}
    >
      {/* Header - always visible */}
      <button
        onClick={toggleExpand}
        className="w-full p-5 text-left flex items-start gap-4 group"
      >
        {/* Priority badge */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: priority.bg }}
        >
          <PriorityIcon className="w-4 h-4" style={{ color: priority.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Question */}
          <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent-green)] transition-colors pr-8">
            {faq.question}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Category */}
            <span
              className="text-xs font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: `color-mix(in srgb, ${categoryColor} 20%, transparent)`,
                color: categoryColor,
              }}
            >
              {faq.category}
            </span>

            {/* Priority label */}
            <span
              className="text-xs font-medium"
              style={{ color: priority.color }}
            >
              {priority.label}
            </span>

            {/* Tags preview */}
            <div className="flex gap-1.5 flex-wrap">
              {faq.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
                >
                  {tag}
                </span>
              ))}
              {faq.tags.length > 3 && (
                <span className="text-xs text-[var(--foreground-muted)]">
                  +{faq.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expand icon */}
        <ChevronDown
          className={`w-5 h-5 text-[var(--foreground-muted)] transition-transform duration-300 flex-shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable content */}
      <div
        className={`
          overflow-hidden transition-all duration-300
          ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-5 pb-5 pt-2 border-t border-[var(--background-tertiary)]">
          {/* Answer content */}
          <div
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-[var(--foreground)] prose-headings:font-semibold
              prose-p:text-[var(--foreground-muted)] prose-p:leading-relaxed
              prose-strong:text-[var(--foreground)]
              prose-code:text-[var(--accent-cyan)] prose-code:bg-[var(--code-bg)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-[var(--code-bg)] prose-pre:border prose-pre:border-[var(--code-border)] prose-pre:rounded-lg
              prose-a:text-[var(--accent-green)] prose-a:no-underline hover:prose-a:underline
              prose-li:text-[var(--foreground-muted)]
              prose-table:text-sm
              prose-th:text-[var(--foreground)] prose-th:font-semibold prose-th:bg-[var(--background-tertiary)] prose-th:px-3 prose-th:py-2
              prose-td:text-[var(--foreground-muted)] prose-td:px-3 prose-td:py-2 prose-td:border-t prose-td:border-[var(--background-tertiary)]
            "
            dangerouslySetInnerHTML={{
              __html: formatMarkdown(faq.answer),
            }}
          />

          {/* Related links */}
          {((faq.relatedWiki && faq.relatedWiki.length > 0) || (faq.relatedXray && faq.relatedXray.length > 0)) && (
            <div className="mt-6 pt-4 border-t border-[var(--background-tertiary)]">
              <h4 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Related Resources
              </h4>
              <div className="flex flex-wrap gap-2">
                {faq.relatedWiki?.map((slug) => (
                  <Link
                    key={slug}
                    href={`/wiki/${slug}`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/20 transition-colors"
                  >
                    Wiki: {slug}
                  </Link>
                ))}
                {faq.relatedXray?.map((xray) => (
                  <Link
                    key={`${xray.file}-${xray.entryId}`}
                    href={`/xray/${encodeURIComponent(xray.file)}#${xray.entryId}`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/20 transition-colors"
                  >
                    X-Ray: {xray.entryId}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple markdown formatter for FAQ answers
function formatMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => c.match(/^-+$/))) {
        return ''; // Skip separator row
      }
      const isHeader = !match.includes('---');
      const tag = isHeader ? 'th' : 'td';
      return `<tr>${cells.map(c => `<${tag}>${c}</${tag}>`).join('')}</tr>`;
    })
    .replace(/((<tr>.*<\/tr>\s*)+)/g, '<table><tbody>$1</tbody></table>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (lines that don't start with special chars)
    .replace(/^(?!<|#|\||-|\d+\.)(.+)$/gm, '<p>$1</p>')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/g, '')
    // Clean up nested issues
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/<\/table>\s*<table>/g, '');
}
