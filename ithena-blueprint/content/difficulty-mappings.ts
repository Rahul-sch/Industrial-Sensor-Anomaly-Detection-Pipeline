import type { Difficulty } from '@/lib/types';

/**
 * Difficulty mappings for existing content
 * Maps content IDs to their difficulty levels
 */

// Wiki article difficulty mappings
export const wikiDifficulty: Record<string, Difficulty> = {
  // Fundamentals - mostly beginner/intermediate
  'data-flow-overview': 'beginner',
  'exactly-once-semantics': 'intermediate',
  'graceful-shutdown': 'intermediate',

  // Kafka - intermediate to advanced
  'kafka-deep-dive': 'advanced',
  'kafka-consumer-patterns': 'intermediate',
  'offset-management': 'critical',

  // ML - mostly advanced
  'ml-detection': 'advanced',
  'isolation-forest': 'intermediate',
  'lstm-autoencoder': 'advanced',
  'hybrid-strategies': 'critical',

  // Database - intermediate
  'database-schema': 'intermediate',
  'neon-deployment': 'beginner',
  'connection-pooling': 'advanced',

  // Security - intermediate to critical
  'audit-logging': 'intermediate',
  'rbac': 'intermediate',
  'csp-headers': 'advanced',

  // Frontend - beginner to intermediate
  '3d-twin-architecture': 'intermediate',
  'websocket-streaming': 'beginner',
};

// FAQ difficulty mappings (by FAQ ID)
export const faqDifficulty: Record<string, Difficulty> = {
  'kafka-vs-rabbitmq': 'critical',
  'kafka-down-handling': 'critical',
  'prevent-duplicate-readings': 'critical',
  'hybrid-ml-rationale': 'critical',
  'manual-offset-commits': 'critical',
  'db-schema-design': 'critical',
  'scaling-strategy': 'critical',
  'security-layers': 'critical',
  'postgresql-vs-influxdb': 'advanced',
  'ml-untrained-handling': 'critical',
  'exponential-backoff': 'intermediate',
  'graceful-shutdown': 'intermediate',
  '3d-twin-integration': 'intermediate',
  'transient-state-pattern': 'advanced',
  'custom-sensors': 'intermediate',
  'isolation-forest-explained': 'advanced',
  'lstm-autoencoder-explained': 'advanced',
};

// X-Ray entry difficulty mappings (by entry ID)
export const xrayDifficulty: Record<string, Difficulty> = {
  'consumer-imports-core': 'beginner',
  'consumer-imports-http': 'beginner',
  'consumer-imports-ml': 'intermediate',
  'consumer-class-init': 'intermediate',
  'consumer-logging-setup': 'beginner',
  'consumer-signal-handler': 'critical',
  'consumer-kafka-connect': 'critical',
  'consumer-db-connect': 'critical',
  'consumer-validate-message': 'beginner',
  'consumer-rule-anomaly': 'intermediate',
  'consumer-record-alert': 'intermediate',
  'consumer-custom-sensors': 'advanced',
  'consumer-insert-reading': 'critical',
  'consumer-ml-detection': 'advanced',
  'consumer-3d-telemetry': 'intermediate',
  'consumer-process-message': 'critical',
  'consumer-main-loop': 'advanced',
  'consumer-shutdown': 'intermediate',
  'consumer-entry-point': 'beginner',
};

// Glossary term difficulty mappings
export const glossaryDifficulty: Record<string, Difficulty> = {
  'exactly-once-semantics': 'critical',
  'kafka-offset': 'intermediate',
  'consumer-group': 'intermediate',
  'isolation-forest': 'advanced',
  'lstm': 'advanced',
  'autoencoder': 'advanced',
  'backoff': 'intermediate',
  'idempotent': 'intermediate',
  'postgresql': 'beginner',
  'zustand': 'beginner',
  'websocket': 'beginner',
  'flask': 'beginner',
  'react-three-fiber': 'intermediate',
  'jsonb': 'intermediate',
  'sasl': 'advanced',
  'rbac': 'intermediate',
};

/**
 * Get difficulty for any content type
 */
export function getContentDifficulty(
  type: 'wiki' | 'faq' | 'xray' | 'glossary',
  id: string
): Difficulty {
  switch (type) {
    case 'wiki':
      return wikiDifficulty[id] ?? 'intermediate';
    case 'faq':
      return faqDifficulty[id] ?? 'intermediate';
    case 'xray':
      return xrayDifficulty[id] ?? 'intermediate';
    case 'glossary':
      return glossaryDifficulty[id] ?? 'beginner';
    default:
      return 'intermediate';
  }
}

/**
 * Get all content IDs at a specific difficulty level
 */
export function getContentByDifficulty(difficulty: Difficulty): {
  wiki: string[];
  faq: string[];
  xray: string[];
  glossary: string[];
} {
  return {
    wiki: Object.entries(wikiDifficulty)
      .filter(([, d]) => d === difficulty)
      .map(([id]) => id),
    faq: Object.entries(faqDifficulty)
      .filter(([, d]) => d === difficulty)
      .map(([id]) => id),
    xray: Object.entries(xrayDifficulty)
      .filter(([, d]) => d === difficulty)
      .map(([id]) => id),
    glossary: Object.entries(glossaryDifficulty)
      .filter(([, d]) => d === difficulty)
      .map(([id]) => id),
  };
}

/**
 * Count content items by difficulty
 */
export function countByDifficulty(): Record<Difficulty, number> {
  const all = [
    ...Object.values(wikiDifficulty),
    ...Object.values(faqDifficulty),
    ...Object.values(xrayDifficulty),
    ...Object.values(glossaryDifficulty),
  ];

  return {
    beginner: all.filter((d) => d === 'beginner').length,
    intermediate: all.filter((d) => d === 'intermediate').length,
    advanced: all.filter((d) => d === 'advanced').length,
    critical: all.filter((d) => d === 'critical').length,
  };
}
