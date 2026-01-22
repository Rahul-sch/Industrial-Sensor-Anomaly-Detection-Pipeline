'use client';

import { useState, useCallback, useEffect } from 'react';
import { Highlighter, Trash2, Download, X } from 'lucide-react';
import type { StudyHighlight } from '@/lib/types';

type HighlightColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

interface StudyHighlighterProps {
  contentId: string;
  onHighlight?: (highlight: StudyHighlight) => void;
  onRemove?: (highlightId: string) => void;
  highlights?: StudyHighlight[];
  className?: string;
}

const HIGHLIGHT_COLORS: Record<HighlightColor, {
  label: string;
  meaning: string;
  bg: string;
  border: string;
}> = {
  blue: {
    label: 'HOW',
    meaning: 'Implementation details',
    bg: 'rgba(59, 130, 246, 0.3)',
    border: 'var(--accent-blue)',
  },
  green: {
    label: 'WHY',
    meaning: 'Reasoning & purpose',
    bg: 'rgba(16, 185, 129, 0.3)',
    border: 'var(--accent-green)',
  },
  red: {
    label: 'CRITICAL',
    meaning: 'Must remember',
    bg: 'rgba(239, 68, 68, 0.3)',
    border: 'var(--accent-red)',
  },
  yellow: {
    label: 'NOTE',
    meaning: 'Important note',
    bg: 'rgba(251, 191, 36, 0.3)',
    border: 'var(--accent-yellow)',
  },
  purple: {
    label: 'CONCEPT',
    meaning: 'Key concept',
    bg: 'rgba(139, 92, 246, 0.3)',
    border: 'var(--accent-purple)',
  },
};

export function StudyHighlighter({
  contentId,
  onHighlight,
  onRemove,
  highlights = [],
  className = '',
}: StudyHighlighterProps) {
  const [selectedText, setSelectedText] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });

  // Handle text selection
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowColorPicker(false);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      setShowColorPicker(false);
      return;
    }

    setSelectedText(text);

    // Position the color picker near the selection
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    setPickerPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setShowColorPicker(true);
  }, []);

  // Map color to annotation type
  const colorToType: Record<HighlightColor, 'how' | 'why' | 'critical' | 'note'> = {
    blue: 'how',
    green: 'why',
    red: 'critical',
    yellow: 'note',
    purple: 'note',
  };

  // Handle highlight creation
  const handleHighlight = useCallback(
    (color: HighlightColor) => {
      if (!selectedText) return;

      const highlight: StudyHighlight = {
        id: `hl-${Date.now()}`,
        contentId,
        text: selectedText,
        type: colorToType[color],
        color,
        position: { startOffset: 0, endOffset: selectedText.length },
        createdAt: new Date().toISOString(),
      };

      onHighlight?.(highlight);
      setShowColorPicker(false);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    },
    [contentId, selectedText, onHighlight]
  );

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [handleSelection]);

  return (
    <div className={className}>
      {/* Color Picker Popup */}
      {showColorPicker && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            left: pickerPosition.x,
            top: pickerPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="flex items-center gap-1 p-2 bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-lg shadow-lg">
            {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
              <button
                key={color}
                onClick={() => handleHighlight(color)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
                title={`${HIGHLIGHT_COLORS[color].label}: ${HIGHLIGHT_COLORS[color].meaning}`}
              />
            ))}
            <button
              onClick={() => setShowColorPicker(false)}
              className="ml-1 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Display existing highlights
export function HighlightsList({
  highlights,
  onRemove,
  onExport,
  className = '',
}: {
  highlights: StudyHighlight[];
  onRemove?: (id: string) => void;
  onExport?: () => void;
  className?: string;
}) {
  if (highlights.length === 0) {
    return (
      <div className={`p-4 text-center text-[var(--foreground-muted)] ${className}`}>
        <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No highlights yet</p>
        <p className="text-xs mt-1">Select text to highlight important passages</p>
      </div>
    );
  }

  // Group highlights by color
  const grouped = highlights.reduce(
    (acc, h) => {
      const color = h.color ?? 'yellow';
      if (!acc[color]) acc[color] = [];
      acc[color].push(h);
      return acc;
    },
    {} as Record<HighlightColor, StudyHighlight[]>
  );

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-[var(--foreground)]">
          Highlights ({highlights.length})
        </h4>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        )}
      </div>

      {/* Grouped highlights */}
      <div className="space-y-4">
        {(Object.keys(grouped) as HighlightColor[]).map((color) => (
          <div key={color}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
              />
              <span className="text-xs font-medium text-[var(--foreground-muted)]">
                {HIGHLIGHT_COLORS[color].label}
              </span>
              <span className="text-xs text-[var(--foreground-muted)]">
                ({grouped[color].length})
              </span>
            </div>

            <div className="space-y-2 pl-5">
              {grouped[color].map((highlight) => (
                <HighlightCard
                  key={highlight.id}
                  highlight={highlight}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual highlight card
function HighlightCard({
  highlight,
  onRemove,
}: {
  highlight: StudyHighlight;
  onRemove?: (id: string) => void;
}) {
  const config = HIGHLIGHT_COLORS[highlight.color as HighlightColor];

  return (
    <div
      className="p-3 rounded-lg group"
      style={{
        backgroundColor: config.bg,
        borderLeft: `3px solid ${config.border}`,
      }}
    >
      <p className="text-sm text-[var(--foreground)] leading-relaxed">
        &ldquo;{highlight.text}&rdquo;
      </p>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-[var(--foreground-muted)]">
          {new Date(highlight.createdAt).toLocaleDateString()}
        </span>

        {onRemove && (
          <button
            onClick={() => onRemove(highlight.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-[var(--foreground-muted)] hover:text-[var(--accent-red)] transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {highlight.note && (
        <p className="text-xs text-[var(--foreground-muted)] mt-2 pt-2 border-t border-[var(--background-tertiary)]">
          {highlight.note}
        </p>
      )}
    </div>
  );
}

// Highlight color legend
export function HighlightLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => {
        const config = HIGHLIGHT_COLORS[color];
        return (
          <div key={color} className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: config.bg }}
            />
            <span className="text-xs text-[var(--foreground-muted)]">
              {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Hook for managing highlights
export function useHighlights(contentId: string) {
  const [highlights, setHighlights] = useState<StudyHighlight[]>([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`ithena-highlights-${contentId}`);
    if (stored) {
      setHighlights(JSON.parse(stored));
    }
  }, [contentId]);

  // Save to localStorage
  const saveHighlights = useCallback((newHighlights: StudyHighlight[]) => {
    localStorage.setItem(`ithena-highlights-${contentId}`, JSON.stringify(newHighlights));
    setHighlights(newHighlights);
  }, [contentId]);

  const addHighlight = useCallback((highlight: StudyHighlight) => {
    saveHighlights([...highlights, highlight]);
  }, [highlights, saveHighlights]);

  const removeHighlight = useCallback((id: string) => {
    saveHighlights(highlights.filter((h) => h.id !== id));
  }, [highlights, saveHighlights]);

  const exportHighlights = useCallback(() => {
    const markdown = highlights
      .map((h) => `- **[${HIGHLIGHT_COLORS[(h.color ?? 'yellow') as HighlightColor].label}]** "${h.text}"`)
      .join('\n');

    const blob = new Blob([`# Highlights for ${contentId}\n\n${markdown}`], {
      type: 'text/markdown',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlights-${contentId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [highlights, contentId]);

  return {
    highlights,
    addHighlight,
    removeHighlight,
    exportHighlights,
  };
}

export default StudyHighlighter;
