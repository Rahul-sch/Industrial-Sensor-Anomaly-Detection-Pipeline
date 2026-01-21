'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Info, AlertTriangle, Lightbulb, HelpCircle } from 'lucide-react';

type AnnotationType = 'how' | 'why' | 'critical' | 'note' | 'warning';

interface CodeAnnotationProps {
  type: AnnotationType;
  title?: string;
  children: React.ReactNode;
  lineNumber?: number;
  expandable?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

const ANNOTATION_CONFIG: Record<AnnotationType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  how: {
    label: 'HOW',
    icon: <HelpCircle className="w-4 h-4" />,
    color: 'var(--accent-blue)',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    description: 'Implementation details',
  },
  why: {
    label: 'WHY',
    icon: <Lightbulb className="w-4 h-4" />,
    color: 'var(--accent-green)',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    description: 'Reasoning behind the code',
  },
  critical: {
    label: 'CRITICAL',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'var(--accent-red)',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Must understand for interviews',
  },
  note: {
    label: 'NOTE',
    icon: <Info className="w-4 h-4" />,
    color: 'var(--accent-yellow)',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    description: 'Additional context',
  },
  warning: {
    label: 'WARNING',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'var(--accent-orange)',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    description: 'Common pitfalls',
  },
};

export function CodeAnnotation({
  type,
  title,
  children,
  lineNumber,
  expandable = true,
  defaultExpanded = true,
  className = '',
}: CodeAnnotationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const config = ANNOTATION_CONFIG[type];

  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{
        backgroundColor: config.bgColor,
        borderLeft: `3px solid ${config.borderColor}`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => expandable && setIsExpanded(!isExpanded)}
        disabled={!expandable}
        className={`
          w-full flex items-center gap-2 px-3 py-2 text-left
          ${expandable ? 'cursor-pointer hover:bg-black/10' : 'cursor-default'}
          transition-colors
        `}
      >
        {/* Expand/collapse icon */}
        {expandable && (
          <span style={{ color: config.color }}>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}

        {/* Type icon */}
        <span style={{ color: config.color }}>{config.icon}</span>

        {/* Label */}
        <span
          className="text-xs font-bold tracking-wider"
          style={{ color: config.color }}
        >
          {config.label}
        </span>

        {/* Title */}
        {title && (
          <span className="text-sm text-[var(--foreground)] font-medium ml-1">
            {title}
          </span>
        )}

        {/* Line number */}
        {lineNumber && (
          <span className="ml-auto text-xs text-[var(--foreground-muted)] font-mono">
            Line {lineNumber}
          </span>
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-3 text-sm text-[var(--foreground)] leading-relaxed animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

// Inline annotation for within text
export function InlineAnnotation({
  type,
  children,
}: {
  type: AnnotationType;
  children: React.ReactNode;
}) {
  const config = ANNOTATION_CONFIG[type];

  return (
    <span
      className="px-1 py-0.5 rounded text-sm"
      style={{
        backgroundColor: config.bgColor,
        borderBottom: `2px solid ${config.borderColor}`,
        color: config.color,
      }}
      title={`${config.label}: ${config.description}`}
    >
      {children}
    </span>
  );
}

// Annotation badge for labels
export function AnnotationBadge({
  type,
  showLabel = true,
}: {
  type: AnnotationType;
  showLabel?: boolean;
}) {
  const config = ANNOTATION_CONFIG[type];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Code block with annotation
export function AnnotatedCodeBlock({
  code,
  language = 'python',
  annotations,
  className = '',
}: {
  code: string;
  language?: string;
  annotations: Array<{
    line: number;
    type: AnnotationType;
    content: string;
  }>;
  className?: string;
}) {
  const lines = code.split('\n');

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <div className="code-viewer">
        {lines.map((line, index) => {
          const lineNum = index + 1;
          const annotation = annotations.find((a) => a.line === lineNum);

          return (
            <div key={index}>
              {/* Code line */}
              <div className={`code-line ${annotation ? 'highlighted' : ''}`}>
                <span className="code-gutter">{lineNum}</span>
                <span className="code-content">{line || ' '}</span>
              </div>

              {/* Annotation after line */}
              {annotation && (
                <div className="px-2 py-1">
                  <CodeAnnotation
                    type={annotation.type}
                    lineNumber={lineNum}
                    expandable={false}
                  >
                    {annotation.content}
                  </CodeAnnotation>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Annotation legend
export function AnnotationLegend({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 bg-[var(--background-secondary)] rounded-lg ${className}`}>
      <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
        Annotation Legend
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(Object.keys(ANNOTATION_CONFIG) as AnnotationType[]).map((type) => {
          const config = ANNOTATION_CONFIG[type];
          return (
            <div key={type} className="flex items-center gap-2">
              <AnnotationBadge type={type} showLabel={false} />
              <div>
                <p className="text-xs font-medium text-[var(--foreground)]">
                  {config.label}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {config.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CodeAnnotation;
