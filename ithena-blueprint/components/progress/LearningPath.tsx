'use client';

import { useState, useMemo } from 'react';
import {
  Check,
  Lock,
  PlayCircle,
  ChevronRight,
  BookOpen,
  Brain,
  Target,
  Zap,
  Server,
  Database,
  Cpu,
  Cloud,
  Code,
} from 'lucide-react';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import Link from 'next/link';
import clsx from 'clsx';

// Learning path node type
interface PathNode {
  id: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  category: 'fundamentals' | 'kafka' | 'database' | 'ml' | 'deployment';
  prerequisites: string[];
  resources: {
    type: 'wiki' | 'flashcards' | 'quiz' | 'xray';
    slug: string;
    title: string;
  }[];
  estimatedTime: number; // minutes
}

// Learning path data
const learningPathNodes: PathNode[] = [
  {
    id: 'fundamentals',
    title: 'System Fundamentals',
    description: 'Core concepts: data flow, architecture overview, and terminology',
    icon: BookOpen,
    category: 'fundamentals',
    prerequisites: [],
    resources: [
      { type: 'wiki', slug: 'system-overview', title: 'System Overview' },
      { type: 'flashcards', slug: 'fundamentals', title: 'Core Concepts Cards' },
      { type: 'quiz', slug: 'fundamentals', title: 'Fundamentals Quiz' },
    ],
    estimatedTime: 45,
  },
  {
    id: 'kafka-basics',
    title: 'Kafka Basics',
    description: 'Topics, partitions, offsets, and consumer groups',
    icon: Server,
    category: 'kafka',
    prerequisites: ['fundamentals'],
    resources: [
      { type: 'wiki', slug: 'kafka-deep-dive', title: 'Kafka Deep Dive' },
      { type: 'flashcards', slug: 'kafka', title: 'Kafka Flashcards' },
      { type: 'quiz', slug: 'kafka-basics', title: 'Kafka Basics Quiz' },
    ],
    estimatedTime: 60,
  },
  {
    id: 'kafka-advanced',
    title: 'Kafka Advanced',
    description: 'Exactly-once semantics, rebalancing, and performance tuning',
    icon: Zap,
    category: 'kafka',
    prerequisites: ['kafka-basics'],
    resources: [
      { type: 'wiki', slug: 'kafka-deep-dive', title: 'Advanced Kafka Patterns' },
      { type: 'xray', slug: 'consumer', title: 'Consumer X-Ray' },
      { type: 'quiz', slug: 'kafka-advanced', title: 'Advanced Quiz' },
    ],
    estimatedTime: 75,
  },
  {
    id: 'database',
    title: 'Database Schema',
    description: 'PostgreSQL schema design, JSONB, and query optimization',
    icon: Database,
    category: 'database',
    prerequisites: ['fundamentals'],
    resources: [
      { type: 'wiki', slug: 'database-schema', title: 'Database Schema' },
      { type: 'flashcards', slug: 'database', title: 'Database Cards' },
      { type: 'quiz', slug: 'database', title: 'Database Quiz' },
    ],
    estimatedTime: 50,
  },
  {
    id: 'ml-basics',
    title: 'ML Detection Basics',
    description: 'Rule-based detection and anomaly detection fundamentals',
    icon: Brain,
    category: 'ml',
    prerequisites: ['database', 'kafka-basics'],
    resources: [
      { type: 'wiki', slug: 'ml-detection', title: 'ML Detection Pipeline' },
      { type: 'flashcards', slug: 'ml', title: 'ML Flashcards' },
      { type: 'quiz', slug: 'ml-basics', title: 'ML Basics Quiz' },
    ],
    estimatedTime: 90,
  },
  {
    id: 'ml-advanced',
    title: 'Advanced ML',
    description: 'Isolation Forest, LSTM Autoencoder, and hybrid strategies',
    icon: Cpu,
    category: 'ml',
    prerequisites: ['ml-basics'],
    resources: [
      { type: 'wiki', slug: 'isolation-forest', title: 'Isolation Forest' },
      { type: 'wiki', slug: 'lstm-autoencoder', title: 'LSTM Autoencoder' },
      { type: 'xray', slug: 'combined_pipeline', title: 'ML Pipeline X-Ray' },
    ],
    estimatedTime: 120,
  },
  {
    id: 'deployment',
    title: 'Deployment',
    description: 'Docker, cloud services, and production configuration',
    icon: Cloud,
    category: 'deployment',
    prerequisites: ['kafka-advanced', 'ml-basics'],
    resources: [
      { type: 'wiki', slug: 'deployment-guide', title: 'Deployment Guide' },
      { type: 'quiz', slug: 'deployment', title: 'Deployment Quiz' },
    ],
    estimatedTime: 60,
  },
];

// Category colors
const categoryColors: Record<string, string> = {
  fundamentals: 'var(--accent-cyan)',
  kafka: 'var(--accent-green)',
  database: 'var(--accent-blue)',
  ml: 'var(--accent-purple)',
  deployment: 'var(--accent-orange)',
};

interface LearningPathProps {
  variant?: 'full' | 'compact' | 'horizontal';
  showProgress?: boolean;
  className?: string;
}

export function LearningPath({
  variant = 'full',
  showProgress = true,
  className = '',
}: LearningPathProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const progress = useStudyProgress();

  // Calculate node states
  const nodeStates = useMemo(() => {
    const states: Record<string, 'completed' | 'current' | 'locked' | 'available'> = {};

    // For demo, use localStorage to track completed nodes
    const completedNodes = new Set<string>(
      JSON.parse(localStorage.getItem('ithena-completed-nodes') || '[]')
    );

    learningPathNodes.forEach((node) => {
      const prereqsMet = node.prerequisites.every((prereq) => completedNodes.has(prereq));

      if (completedNodes.has(node.id)) {
        states[node.id] = 'completed';
      } else if (prereqsMet) {
        // First available node is current
        const isFirst = !Object.values(states).includes('current');
        states[node.id] = isFirst ? 'current' : 'available';
      } else {
        states[node.id] = 'locked';
      }
    });

    return states;
  }, []);

  // Mark node as complete
  const markComplete = (nodeId: string) => {
    const completedNodes = new Set<string>(
      JSON.parse(localStorage.getItem('ithena-completed-nodes') || '[]')
    );
    completedNodes.add(nodeId);
    localStorage.setItem('ithena-completed-nodes', JSON.stringify([...completedNodes]));
    window.location.reload(); // Simple refresh to update state
  };

  // Calculate overall progress
  const completedCount = Object.values(nodeStates).filter((s) => s === 'completed').length;
  const progressPercent = Math.round((completedCount / learningPathNodes.length) * 100);

  // Horizontal variant - compact path display
  if (variant === 'horizontal') {
    return (
      <div className={className}>
        {/* Progress bar */}
        {showProgress && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-green)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-[var(--foreground-muted)]">
              {completedCount}/{learningPathNodes.length}
            </span>
          </div>
        )}

        {/* Horizontal nodes */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {learningPathNodes.map((node, i) => {
            const state = nodeStates[node.id];
            const Icon = node.icon;
            const color = categoryColors[node.category];

            return (
              <div key={node.id} className="flex items-center gap-2">
                <button
                  onClick={() =>
                    state !== 'locked' && setSelectedNode(selectedNode === node.id ? null : node.id)
                  }
                  disabled={state === 'locked'}
                  className={clsx(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    state === 'completed' && 'bg-[var(--accent-green)]',
                    state === 'current' && 'ring-2 ring-offset-2 ring-offset-[var(--background)]',
                    state === 'available' && 'bg-[var(--background-secondary)]',
                    state === 'locked' && 'bg-[var(--background-tertiary)] opacity-50 cursor-not-allowed'
                  )}
                  style={{
                    backgroundColor:
                      state === 'current' ? color : state === 'completed' ? undefined : undefined,
                    // @ts-expect-error Tailwind CSS ring color
                    '--tw-ring-color': state === 'current' ? color : undefined,
                  }}
                  title={node.title}
                >
                  {state === 'completed' ? (
                    <Check className="w-5 h-5 text-[var(--background)]" />
                  ) : state === 'locked' ? (
                    <Lock className="w-4 h-4 text-[var(--foreground-muted)]" />
                  ) : (
                    <Icon
                      className="w-5 h-5"
                      style={{
                        color: state === 'current' ? 'var(--background)' : color,
                      }}
                    />
                  )}
                </button>
                {i < learningPathNodes.length - 1 && (
                  <div
                    className={clsx(
                      'w-6 h-0.5',
                      state === 'completed' ? 'bg-[var(--accent-green)]' : 'bg-[var(--background-tertiary)]'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Selected node details */}
        {selectedNode && (
          <NodeDetail
            node={learningPathNodes.find((n) => n.id === selectedNode)!}
            state={nodeStates[selectedNode]}
            onComplete={() => markComplete(selectedNode)}
          />
        )}
      </div>
    );
  }

  // Compact variant - list style
  if (variant === 'compact') {
    return (
      <div className={`space-y-2 ${className}`}>
        {learningPathNodes.map((node) => {
          const state = nodeStates[node.id];
          const Icon = node.icon;
          const color = categoryColors[node.category];

          return (
            <div
              key={node.id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg transition-all',
                state === 'locked'
                  ? 'opacity-50 bg-[var(--background-secondary)]'
                  : 'bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] cursor-pointer'
              )}
              onClick={() =>
                state !== 'locked' && setSelectedNode(selectedNode === node.id ? null : node.id)
              }
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  state === 'completed' && 'bg-[var(--accent-green)]'
                )}
                style={{
                  backgroundColor: state !== 'completed' ? `${color}20` : undefined,
                }}
              >
                {state === 'completed' ? (
                  <Check className="w-4 h-4 text-[var(--background)]" />
                ) : state === 'locked' ? (
                  <Lock className="w-3 h-3 text-[var(--foreground-muted)]" />
                ) : (
                  <Icon className="w-4 h-4" style={{ color }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    'text-sm font-medium truncate',
                    state === 'current' ? '' : 'text-[var(--foreground)]'
                  )}
                  style={{ color: state === 'current' ? color : undefined }}
                >
                  {node.title}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] truncate">
                  {node.estimatedTime} min
                </p>
              </div>
              {state === 'current' && (
                <PlayCircle className="w-5 h-5" style={{ color }} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant - detailed view with connections
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Header */}
      {showProgress && (
        <div className="flex items-center justify-between p-4 bg-[var(--background-secondary)] rounded-xl">
          <div>
            <h3 className="font-semibold text-[var(--foreground)]">Learning Path</h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              {completedCount} of {learningPathNodes.length} topics completed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-green)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-[var(--foreground)]">
              {progressPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Path Nodes */}
      <div className="space-y-4">
        {learningPathNodes.map((node, i) => {
          const state = nodeStates[node.id];
          const Icon = node.icon;
          const color = categoryColors[node.category];
          const isSelected = selectedNode === node.id;

          return (
            <div key={node.id} className="relative">
              {/* Connection line to previous */}
              {i > 0 && (
                <div
                  className={clsx(
                    'absolute left-5 -top-4 w-0.5 h-4',
                    nodeStates[learningPathNodes[i - 1].id] === 'completed'
                      ? 'bg-[var(--accent-green)]'
                      : 'bg-[var(--background-tertiary)]'
                  )}
                />
              )}

              {/* Node Card */}
              <div
                className={clsx(
                  'relative flex gap-4 p-4 rounded-xl border transition-all cursor-pointer',
                  state === 'locked'
                    ? 'bg-[var(--background-secondary)] border-[var(--background-tertiary)] opacity-60'
                    : 'bg-[var(--background-secondary)] border-transparent hover:border-[var(--background-tertiary)]',
                  isSelected && 'border-[var(--accent-purple)]'
                )}
                onClick={() =>
                  state !== 'locked' && setSelectedNode(isSelected ? null : node.id)
                }
              >
                {/* Icon */}
                <div
                  className={clsx(
                    'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                    state === 'completed' && 'bg-[var(--accent-green)]'
                  )}
                  style={{
                    backgroundColor: state !== 'completed' ? `${color}20` : undefined,
                  }}
                >
                  {state === 'completed' ? (
                    <Check className="w-5 h-5 text-[var(--background)]" />
                  ) : state === 'locked' ? (
                    <Lock className="w-4 h-4 text-[var(--foreground-muted)]" />
                  ) : (
                    <Icon className="w-5 h-5" style={{ color }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4
                      className="font-semibold"
                      style={{ color: state === 'current' ? color : 'var(--foreground)' }}
                    >
                      {node.title}
                    </h4>
                    {state === 'current' && (
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    {node.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--foreground-muted)]">
                    <span>~{node.estimatedTime} min</span>
                    <span>•</span>
                    <span>{node.resources.length} resources</span>
                  </div>
                </div>

                {/* Expand indicator */}
                <ChevronRight
                  className={clsx(
                    'w-5 h-5 text-[var(--foreground-muted)] transition-transform',
                    isSelected && 'rotate-90'
                  )}
                />
              </div>

              {/* Expanded detail */}
              {isSelected && state !== 'locked' && (
                <div className="mt-2 ml-14">
                  <NodeDetail
                    node={node}
                    state={state}
                    onComplete={() => markComplete(node.id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Node detail component
function NodeDetail({
  node,
  state,
  onComplete,
}: {
  node: PathNode;
  state: 'completed' | 'current' | 'available' | 'locked';
  onComplete: () => void;
}) {
  const color = categoryColors[node.category];

  const resourceIcons: Record<string, typeof BookOpen> = {
    wiki: BookOpen,
    flashcards: Brain,
    quiz: Target,
    xray: Code,
  };

  return (
    <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--background-tertiary)] space-y-4 animate-fade-in">
      {/* Resources */}
      <div>
        <h5 className="text-sm font-medium text-[var(--foreground)] mb-2">Resources</h5>
        <div className="space-y-2">
          {node.resources.map((resource, i) => {
            const Icon = resourceIcons[resource.type];
            return (
              <Link
                key={i}
                href={`/${resource.type}/${resource.slug}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
              >
                <Icon className="w-4 h-4 text-[var(--foreground-muted)]" />
                <span className="text-sm text-[var(--foreground)]">{resource.title}</span>
                <ChevronRight className="w-4 h-4 text-[var(--foreground-muted)] ml-auto" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Prerequisites */}
      {node.prerequisites.length > 0 && (
        <div className="text-xs text-[var(--foreground-muted)]">
          Prerequisites:{' '}
          {node.prerequisites
            .map((id) => learningPathNodes.find((n) => n.id === id)?.title)
            .join(', ')}
        </div>
      )}

      {/* Actions */}
      {state !== 'completed' && (
        <button
          onClick={onComplete}
          className="w-full py-2 rounded-lg text-sm font-medium text-[var(--background)] transition-colors"
          style={{ backgroundColor: color }}
        >
          Mark as Complete
        </button>
      )}
    </div>
  );
}

export default LearningPath;
