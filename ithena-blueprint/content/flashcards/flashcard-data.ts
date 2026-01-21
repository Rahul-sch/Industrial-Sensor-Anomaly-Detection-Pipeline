import type { FlashCard, Difficulty, WikiCategory } from '@/lib/types';

/**
 * Ithena Flashcard Database
 * 50+ flashcards covering Kafka, ML, Database, Security, and Frontend topics
 */

export const flashcardData: FlashCard[] = [
  // =====================================
  // KAFKA & STREAMING (15 cards)
  // =====================================
  {
    id: 'fc-exactly-once',
    front: 'What is Exactly-Once Semantics in Kafka?',
    back: 'A delivery guarantee where each message is processed exactly one time. Achieved by: (1) enable_auto_commit=False, (2) autocommit=False on DB, (3) Commit DB FIRST, then Kafka offset.',
    category: 'kafka',
    tags: ['kafka', 'reliability', 'critical'],
    difficulty: 'critical',
    relatedWiki: ['exactly-once-semantics'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-process-message' }],
  },
  {
    id: 'fc-kafka-offset',
    front: 'What is a Kafka Offset?',
    back: 'A sequential ID (integer) that uniquely identifies each message within a partition. Used to track consumer progress. Offsets are stored either in Kafka (__consumer_offsets topic) or externally.',
    category: 'kafka',
    tags: ['kafka', 'fundamentals'],
    difficulty: 'intermediate',
    relatedWiki: ['offset-management'],
  },
  {
    id: 'fc-consumer-group',
    front: 'What is a Kafka Consumer Group?',
    back: 'A set of consumers that share the work of consuming from a topic. Each partition is consumed by exactly one consumer in the group. Enables horizontal scaling - add consumers to share load.',
    category: 'kafka',
    tags: ['kafka', 'scaling'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-auto-commit-danger',
    front: 'Why is Kafka auto-commit dangerous for exactly-once?',
    back: 'Auto-commit happens every 5s in background. If DB write fails AFTER auto-commit, the message is lost forever - Kafka thinks it\'s "done" but data was never persisted.',
    category: 'kafka',
    tags: ['kafka', 'reliability', 'critical'],
    difficulty: 'critical',
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-kafka-connect' }],
  },
  {
    id: 'fc-kafka-vs-rabbitmq',
    front: 'Why choose Kafka over RabbitMQ?',
    back: '(1) Exactly-once semantics with idempotent producers, (2) Message ordering within partitions, (3) Message retention for replay, (4) Higher throughput for streaming. RabbitMQ deletes messages after consumption.',
    category: 'kafka',
    tags: ['kafka', 'architecture'],
    difficulty: 'critical',
  },
  {
    id: 'fc-kafka-partition',
    front: 'What is a Kafka Partition?',
    back: 'A topic is split into partitions for parallelism. Messages within a partition are ordered. Partitions are distributed across brokers. More partitions = more parallelism but more overhead.',
    category: 'kafka',
    tags: ['kafka', 'fundamentals'],
    difficulty: 'beginner',
  },
  {
    id: 'fc-backoff',
    front: 'What is Exponential Backoff?',
    back: 'Retry strategy where wait time doubles after each failure: 1s → 2s → 4s → 8s → 16s → 32s → 60s (capped). Prevents overwhelming a failing service while still recovering quickly.',
    category: 'kafka',
    tags: ['reliability', 'patterns'],
    difficulty: 'intermediate',
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-kafka-connect' }],
  },
  {
    id: 'fc-kafka-retention',
    front: 'How long does Kafka retain messages?',
    back: 'Configurable per topic. Default is 7 days (168 hours). Unlike traditional message queues, Kafka keeps messages even after consumption, enabling replay and fault recovery.',
    category: 'kafka',
    tags: ['kafka', 'configuration'],
    difficulty: 'beginner',
  },
  {
    id: 'fc-poll-timeout',
    front: 'What happens in Kafka poll()?',
    back: 'Consumer.poll(timeout_ms) fetches messages from assigned partitions. Returns batch of records (up to max_poll_records). If no messages, waits up to timeout before returning empty.',
    category: 'kafka',
    tags: ['kafka', 'api'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-kafka-idempotent',
    front: 'What makes a Kafka producer idempotent?',
    back: 'Setting enable.idempotence=True. Producer assigns sequence numbers to messages. Broker detects and deduplicates retried messages with same sequence number.',
    category: 'kafka',
    tags: ['kafka', 'reliability'],
    difficulty: 'advanced',
  },
  {
    id: 'fc-max-in-flight',
    front: 'Why set max_in_flight_requests_per_connection=1?',
    back: 'Guarantees strict ordering even with retries. Without it, if message 2 succeeds before retry of message 1, order is violated. Trade-off: lower throughput for guaranteed order.',
    category: 'kafka',
    tags: ['kafka', 'ordering', 'critical'],
    difficulty: 'advanced',
  },
  {
    id: 'fc-sasl-ssl',
    front: 'What is SASL_SSL in Kafka?',
    back: 'Security protocol combining SASL (authentication) with SSL/TLS (encryption). Used for cloud Kafka services like Upstash. Requires username, password, and CA certificate.',
    category: 'kafka',
    tags: ['kafka', 'security'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-consumer-rebalance',
    front: 'What triggers a Kafka consumer group rebalance?',
    back: 'Adding/removing consumers, consumer failure (missed heartbeat), topic partition changes, consumer group membership changes. During rebalance, consumption pauses briefly.',
    category: 'kafka',
    tags: ['kafka', 'operations'],
    difficulty: 'advanced',
  },
  {
    id: 'fc-heartbeat',
    front: 'What is Kafka heartbeat_interval_ms?',
    back: 'How often consumer sends heartbeat to broker (default 10s). If broker receives no heartbeat within session_timeout_ms (default 30s), consumer is considered dead and triggers rebalance.',
    category: 'kafka',
    tags: ['kafka', 'configuration'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-broker-down',
    front: 'What happens when Kafka broker goes down?',
    back: 'Consumer retries with exponential backoff (1s→60s, 10 attempts). Producer buffers messages locally. After max retries, process crashes. Orchestrator (Docker/systemd) restarts it. No data loss due to disk persistence.',
    category: 'kafka',
    tags: ['kafka', 'fault-tolerance', 'critical'],
    difficulty: 'critical',
  },

  // =====================================
  // ML & ANOMALY DETECTION (12 cards)
  // =====================================
  {
    id: 'fc-isolation-forest',
    front: 'How does Isolation Forest detect anomalies?',
    back: 'Builds random trees by splitting features. Anomalies require fewer splits to isolate (shorter path length). Score = average path length across trees. Lower score = more anomalous.',
    category: 'ml',
    tags: ['machine-learning', 'anomaly-detection'],
    difficulty: 'advanced',
    relatedWiki: ['isolation-forest'],
  },
  {
    id: 'fc-lstm-autoencoder',
    front: 'How does LSTM Autoencoder detect anomalies?',
    back: 'Trained to reconstruct normal sequences. High reconstruction error = anomaly. Architecture: Encoder (LSTM) → bottleneck → Decoder (LSTM). Captures temporal patterns IF alone misses.',
    category: 'ml',
    tags: ['machine-learning', 'deep-learning'],
    difficulty: 'advanced',
    relatedWiki: ['lstm-autoencoder'],
  },
  {
    id: 'fc-hybrid-ml',
    front: 'Why use hybrid ML (IF + LSTM) instead of one model?',
    back: 'IF alone: 40% false positives (too sensitive). LSTM alone: misses 30% sudden failures. Hybrid (both agree): 8% false positives. Catches both sudden spikes (IF) and gradual degradation (LSTM).',
    category: 'ml',
    tags: ['machine-learning', 'architecture', 'critical'],
    difficulty: 'critical',
    relatedWiki: ['hybrid-strategies'],
  },
  {
    id: 'fc-contamination',
    front: 'What is the contamination parameter in Isolation Forest?',
    back: 'Expected proportion of anomalies in the dataset (0.0 to 0.5). Default 0.1 = 10% anomalies expected. Affects decision threshold for anomaly classification.',
    category: 'ml',
    tags: ['machine-learning', 'tuning'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-sequence-length',
    front: 'What is LSTM sequence length?',
    back: 'Number of timesteps fed to LSTM at once (look-back window). Longer = captures more context but needs more memory and compute. Typical: 50-100 for sensor data.',
    category: 'ml',
    tags: ['machine-learning', 'configuration'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-min-training',
    front: 'What happens if ML models aren\'t trained yet?',
    back: 'MIN_TRAINING_SAMPLES=100. Before threshold, ML returns None. Consumer continues with rule-based detection only. Models auto-train when samples accumulate. Graceful degradation.',
    category: 'ml',
    tags: ['machine-learning', 'fault-tolerance', 'critical'],
    difficulty: 'critical',
  },
  {
    id: 'fc-rule-based',
    front: 'What is rule-based anomaly detection?',
    back: 'Simple threshold checks: if value < min or value > max, flag anomaly. Fast, deterministic, catches impossible values. First line of defense before ML.',
    category: 'ml',
    tags: ['machine-learning', 'fundamentals'],
    difficulty: 'beginner',
  },
  {
    id: 'fc-ease-factor',
    front: 'What is ease factor in SM-2 spaced repetition?',
    back: 'Multiplier for calculating next interval (default 2.5). Easy cards: EF increases, intervals grow faster. Hard cards: EF decreases, more frequent reviews. Min EF = 1.3.',
    category: 'ml',
    tags: ['algorithm', 'learning'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-normalization',
    front: 'Why normalize sensor data before ML?',
    back: 'Different sensors have different scales (RPM: 0-5000, temp: 60-100). Without normalization, high-magnitude features dominate. StandardScaler: mean=0, std=1.',
    category: 'ml',
    tags: ['machine-learning', 'preprocessing'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-anomaly-score',
    front: 'What is an anomaly score?',
    back: 'Continuous value (0-1) indicating how anomalous a reading is. Threshold (e.g., 0.5) determines binary classification. Higher threshold = fewer false positives but may miss anomalies.',
    category: 'ml',
    tags: ['machine-learning', 'metrics'],
    difficulty: 'beginner',
  },
  {
    id: 'fc-detection-latency',
    front: 'What is the ML detection latency in the pipeline?',
    back: 'Isolation Forest: ~5ms per reading. LSTM Autoencoder: ~200ms per reading. Hybrid total: ~205ms. Acceptable at 10Hz update rate (100ms between readings).',
    category: 'ml',
    tags: ['machine-learning', 'performance'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-false-positive',
    front: 'How to reduce ML false positives?',
    back: '(1) Increase threshold (risk missing real anomalies), (2) Use hybrid detection (both models must agree), (3) Add temporal smoothing, (4) Tune contamination parameter.',
    category: 'ml',
    tags: ['machine-learning', 'tuning'],
    difficulty: 'advanced',
  },

  // =====================================
  // DATABASE (10 cards)
  // =====================================
  {
    id: 'fc-postgresql-acid',
    front: 'Why PostgreSQL over InfluxDB for this system?',
    back: 'ACID transactions required for exactly-once: INSERT → COMMIT → Kafka offset must be atomic. InfluxDB is eventually consistent. Also: JSONB for custom sensors, familiar SQL.',
    category: 'database',
    tags: ['database', 'architecture', 'critical'],
    difficulty: 'critical',
    relatedWiki: ['database-schema'],
  },
  {
    id: 'fc-autocommit-false',
    front: 'Why set autocommit=False on PostgreSQL connection?',
    back: 'Manual transaction control. Each INSERT doesn\'t auto-commit. You call conn.commit() explicitly AFTER success, conn.rollback() on failure. Essential for exactly-once with Kafka.',
    category: 'database',
    tags: ['database', 'transactions', 'critical'],
    difficulty: 'critical',
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-db-connect' }],
  },
  {
    id: 'fc-jsonb',
    front: 'What is PostgreSQL JSONB?',
    back: 'Binary JSON storage with indexing support. Used for custom_sensors column - dynamic fields without schema changes. Supports operators like @>, ->, #>> for querying.',
    category: 'database',
    tags: ['database', 'postgresql'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-wide-table',
    front: 'Why use a wide table (50+ columns) for sensor readings?',
    back: 'No joins needed - all sensors in one row. Query performance critical for real-time dashboard. Trade-off: less normalized, harder to add sensors (schema change).',
    category: 'database',
    tags: ['database', 'schema', 'critical'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-returning-id',
    front: 'What does RETURNING id do in PostgreSQL INSERT?',
    back: 'Returns the auto-generated primary key after INSERT. Used to correlate ML detection results with sensor reading. Without it, need separate SELECT (slower).',
    category: 'database',
    tags: ['database', 'postgresql'],
    difficulty: 'beginner',
  },
  {
    id: 'fc-connection-pool',
    front: 'What is database connection pooling?',
    back: 'Reuse connections instead of creating new ones per query. psycopg2 ThreadedConnectionPool maintains a pool. Reduces connection overhead from ~50ms to ~1ms per query.',
    category: 'database',
    tags: ['database', 'performance'],
    difficulty: 'intermediate',
    relatedWiki: ['connection-pooling'],
  },
  {
    id: 'fc-neon',
    front: 'What is Neon Database?',
    back: 'Serverless PostgreSQL with instant branching. Auto-scales compute, scale-to-zero when idle. Pay per second of compute. Separate storage and compute architecture.',
    category: 'database',
    tags: ['database', 'cloud'],
    difficulty: 'beginner',
    relatedWiki: ['neon-deployment'],
  },
  {
    id: 'fc-sql-injection',
    front: 'How to prevent SQL injection?',
    back: 'Use parameterized queries: cursor.execute("SELECT * FROM t WHERE id = %s", (id,)). NEVER use f-strings or string concatenation with user input.',
    category: 'database',
    tags: ['database', 'security'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-audit-logs',
    front: 'Why separate audit_logs_v2 table?',
    back: 'Immutable compliance record. Append-only (no UPDATE/DELETE). Tracks: who, what, when, before/after values. Required for security audits and debugging.',
    category: 'database',
    tags: ['database', 'security'],
    difficulty: 'intermediate',
    relatedWiki: ['audit-logging'],
  },
  {
    id: 'fc-db-rollback',
    front: 'When should you call conn.rollback()?',
    back: 'After any exception in a transaction. Discards all changes since last commit. Ensures partial writes don\'t corrupt data. Always in try/except blocks for DB operations.',
    category: 'database',
    tags: ['database', 'transactions'],
    difficulty: 'intermediate',
  },

  // =====================================
  // SECURITY (8 cards)
  // =====================================
  {
    id: 'fc-rate-limiting',
    front: 'What is rate limiting and how is it implemented?',
    back: 'Limits requests per time window. Flask-Limiter: 1000/min API, 5/min login. Prevents DoS attacks and credential stuffing. Returns 429 Too Many Requests.',
    category: 'security',
    tags: ['security', 'api'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-csp',
    front: 'What is Content Security Policy (CSP)?',
    back: 'HTTP header that restricts resource loading. Prevents XSS by limiting script sources. Flask-Talisman adds default-src \'self\', script-src \'self\', etc.',
    category: 'security',
    tags: ['security', 'web'],
    difficulty: 'advanced',
    relatedWiki: ['csp-headers'],
  },
  {
    id: 'fc-rbac',
    front: 'What is Role-Based Access Control (RBAC)?',
    back: 'Permission model based on roles (admin, operator). @requires_role decorator checks user role. Admin: full access. Operator: read + limited write.',
    category: 'security',
    tags: ['security', 'authentication'],
    difficulty: 'intermediate',
    relatedWiki: ['rbac'],
  },
  {
    id: 'fc-xss-prevention',
    front: 'How to prevent XSS attacks?',
    back: 'Use .textContent instead of .innerHTML. Sanitize user input. Set Content-Security-Policy headers. Escape HTML entities in templates. Never trust client data.',
    category: 'security',
    tags: ['security', 'web'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-7-security-layers',
    front: 'What are the 7 security layers in the system?',
    back: '(1) Rate limiting (2) CSP headers (3) Parameterized queries (4) .textContent for XSS (5) RBAC @requires_role (6) Immutable audit logs (7) SASL/SSL for cloud services.',
    category: 'security',
    tags: ['security', 'architecture', 'critical'],
    difficulty: 'critical',
  },
  {
    id: 'fc-session-security',
    front: 'How are Flask sessions secured?',
    back: 'Cryptographically signed with SECRET_KEY. HttpOnly flag prevents JS access. Secure flag requires HTTPS. SameSite prevents CSRF. Session data stored server-side.',
    category: 'security',
    tags: ['security', 'web'],
    difficulty: 'advanced',
  },
  {
    id: 'fc-env-vars',
    front: 'Why use environment variables for secrets?',
    back: 'Secrets (DB password, API keys) never in code. .env files not committed to git. Different values per environment. Easy rotation without code change.',
    category: 'security',
    tags: ['security', 'best-practices'],
    difficulty: 'beginner',
  },
  {
    id: 'fc-cors',
    front: 'What is CORS and when is it needed?',
    back: 'Cross-Origin Resource Sharing. Browser blocks requests to different domains by default. Flask-CORS allows specific origins. Needed when frontend and backend on different domains.',
    category: 'security',
    tags: ['security', 'web'],
    difficulty: 'intermediate',
  },

  // =====================================
  // FRONTEND & 3D (8 cards)
  // =====================================
  {
    id: 'fc-transient-state',
    front: 'What is the transient state pattern in React?',
    back: 'Direct mutation outside React state to avoid re-renders. Used for 60fps animations. Update object directly, read in useFrame. No useState for high-frequency updates.',
    category: 'frontend',
    tags: ['react', 'performance', 'critical'],
    difficulty: 'advanced',
  },
  {
    id: 'fc-react-three-fiber',
    front: 'What is React Three Fiber?',
    back: 'React renderer for Three.js. Declarative 3D: <mesh>, <boxGeometry>, <meshStandardMaterial>. Hooks: useFrame (animation loop), useThree (scene access).',
    category: 'frontend',
    tags: ['react', '3d'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-websocket-10hz',
    front: 'Why 10Hz WebSocket updates for the dashboard?',
    back: 'Balance between real-time feel and performance. 10 updates/sec is smooth visually. Higher frequency wastes bandwidth. Uses SocketIO for auto-reconnection.',
    category: 'frontend',
    tags: ['websocket', 'performance'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-useframe',
    front: 'What is useFrame in React Three Fiber?',
    back: 'Hook that runs every frame (~60fps). Used for animations: rotation, position updates. Receives (state, delta) where delta is time since last frame.',
    category: 'frontend',
    tags: ['react', '3d'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-zustand',
    front: 'What is Zustand?',
    back: 'Lightweight state management for React. No providers needed. create(set => ({...})) pattern. Supports middleware like persist for localStorage. Simpler than Redux.',
    category: 'frontend',
    tags: ['react', 'state-management'],
    difficulty: 'beginner',
  },
  {
    id: 'fc-sensor-visual-mapping',
    front: 'How are sensors mapped to 3D visuals?',
    back: 'RPM → fan rotation speed. Temperature → emissive color (black→red→orange). Vibration → position shake. Anomaly score → warning light + sparkles.',
    category: 'frontend',
    tags: ['3d', 'visualization', 'critical'],
    difficulty: 'intermediate',
  },
  {
    id: 'fc-graceful-shutdown',
    front: 'What is graceful shutdown?',
    back: 'Set flag (should_shutdown=True) instead of sys.exit(). Current message finishes processing. Resources cleaned up properly. Signal handlers for SIGINT, SIGTERM.',
    category: 'general',
    tags: ['reliability', 'patterns', 'critical'],
    difficulty: 'critical',
    relatedWiki: ['graceful-shutdown'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-signal-handler' }],
  },
  {
    id: 'fc-emissive-material',
    front: 'What is emissive material in Three.js?',
    back: 'Material that appears to glow. emissive color + emissiveIntensity. toneMapped=false allows bloom to "blow out". Used for temperature visualization.',
    category: 'frontend',
    tags: ['3d', 'visualization'],
    difficulty: 'intermediate',
  },
];

// Helper to get cards by category
export function getCardsByCategory(category: WikiCategory | 'general'): FlashCard[] {
  return flashcardData.filter(card => card.category === category);
}

// Helper to get cards by difficulty
export function getCardsByDifficulty(difficulty: Difficulty): FlashCard[] {
  return flashcardData.filter(card => card.difficulty === difficulty);
}

// Helper to get cards by tag
export function getCardsByTag(tag: string): FlashCard[] {
  return flashcardData.filter(card => card.tags.includes(tag));
}

// Get all unique tags
export const allFlashcardTags = Array.from(
  new Set(flashcardData.flatMap(card => card.tags))
).sort();

// Get all categories with card counts
export function getFlashcardCategories(): { category: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const card of flashcardData) {
    counts[card.category] = (counts[card.category] || 0) + 1;
  }
  return Object.entries(counts).map(([category, count]) => ({ category, count }));
}

// Get critical cards (for CTO interview prep)
export function getCriticalCards(): FlashCard[] {
  return flashcardData.filter(card => card.difficulty === 'critical');
}

// Shuffle cards (Fisher-Yates)
export function shuffleCards<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
