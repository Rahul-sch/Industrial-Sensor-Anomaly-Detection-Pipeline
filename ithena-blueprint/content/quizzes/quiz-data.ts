import type { Quiz, QuizQuestion, WikiCategory, Difficulty } from '@/lib/types';

// Quiz question data - extracted from FAQ and Wiki content
export const quizQuestions: QuizQuestion[] = [
  // Kafka Questions
  {
    id: 'q-kafka-exactly-once-1',
    type: 'multiple-choice',
    question: 'What three components work together to achieve exactly-once semantics in Kafka?',
    options: [
      'Consumer groups, partitions, and offsets',
      'Idempotent producers, transactional APIs, and consumer group coordination',
      'ZooKeeper, brokers, and topics',
      'Producers, consumers, and streams',
    ],
    correctAnswer: 1,
    explanation: 'Exactly-once semantics requires idempotent producers (preventing duplicates), transactional APIs (atomic writes), and consumer group coordination (ensuring exactly-once consumption).',
    category: 'kafka',
    difficulty: 'critical',
    relatedContent: ['wiki:exactly-once', 'faq:exactly-once'],
    tags: ['kafka', 'exactly-once', 'transactions'],
  },
  {
    id: 'q-kafka-idempotent',
    type: 'true-false',
    question: 'Idempotent producers in Kafka guarantee that sending the same message multiple times will result in multiple duplicates in the topic.',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'False. Idempotent producers ensure that even if a message is sent multiple times (due to retries), it will only be written once to the topic.',
    category: 'kafka',
    difficulty: 'intermediate',
    relatedContent: ['wiki:idempotent-producers'],
    tags: ['kafka', 'idempotency'],
  },
  {
    id: 'q-kafka-acks',
    type: 'multiple-choice',
    question: 'What does setting `acks=all` mean for Kafka producers?',
    options: [
      'The producer does not wait for any acknowledgment',
      'The producer waits only for the leader to acknowledge',
      'The producer waits for the leader and all in-sync replicas to acknowledge',
      'The producer waits for all consumers to acknowledge',
    ],
    correctAnswer: 2,
    explanation: 'acks=all ensures the message is acknowledged only after the leader and all in-sync replicas have received it, providing the strongest durability guarantee.',
    category: 'kafka',
    difficulty: 'intermediate',
    relatedContent: ['wiki:kafka-acks'],
    tags: ['kafka', 'durability', 'producers'],
  },
  {
    id: 'q-kafka-partition-key',
    type: 'multiple-choice',
    question: 'How does Kafka determine which partition a message goes to when a key is provided?',
    options: [
      'Random selection',
      'Round-robin distribution',
      'Hash of the key modulo number of partitions',
      'Least loaded partition',
    ],
    correctAnswer: 2,
    explanation: 'When a key is provided, Kafka uses a hash of the key (typically murmur2) modulo the number of partitions to determine the target partition, ensuring messages with the same key go to the same partition.',
    category: 'kafka',
    difficulty: 'beginner',
    relatedContent: ['wiki:kafka-partitioning'],
    tags: ['kafka', 'partitions'],
  },
  {
    id: 'q-kafka-consumer-group',
    type: 'fill-blank',
    question: 'In Kafka, a _______ ensures that each partition is consumed by exactly one consumer within the group.',
    options: ['consumer group', 'partition', 'offset', 'topic'],
    correctAnswer: 0,
    explanation: 'Consumer groups coordinate consumption so each partition is assigned to exactly one consumer in the group, enabling parallel processing while maintaining order within partitions.',
    category: 'kafka',
    difficulty: 'beginner',
    relatedContent: ['wiki:consumer-groups'],
    tags: ['kafka', 'consumers'],
  },

  // ML/Anomaly Detection Questions
  {
    id: 'q-ml-iforest-1',
    type: 'multiple-choice',
    question: 'How does Isolation Forest detect anomalies?',
    options: [
      'By measuring distance from cluster centroids',
      'By counting neighbors within a radius',
      'By measuring how quickly a point can be isolated through random splits',
      'By comparing to a statistical distribution',
    ],
    correctAnswer: 2,
    explanation: 'Isolation Forest works on the principle that anomalies are easier to isolate. It builds random trees and measures the average path length to isolate each point - anomalies require fewer splits.',
    category: 'ml',
    difficulty: 'intermediate',
    relatedContent: ['wiki:isolation-forest'],
    tags: ['ml', 'anomaly-detection', 'isolation-forest'],
  },
  {
    id: 'q-ml-contamination',
    type: 'multiple-choice',
    question: 'What does the contamination parameter in Isolation Forest represent?',
    options: [
      'The maximum tree depth',
      'The expected proportion of anomalies in the dataset',
      'The number of features to use',
      'The learning rate',
    ],
    correctAnswer: 1,
    explanation: 'The contamination parameter tells the algorithm what proportion of the data is expected to be anomalous, helping set the threshold for classification.',
    category: 'ml',
    difficulty: 'intermediate',
    relatedContent: ['wiki:isolation-forest-params'],
    tags: ['ml', 'isolation-forest', 'hyperparameters'],
  },
  {
    id: 'q-ml-feature-scaling',
    type: 'true-false',
    question: 'Isolation Forest requires feature scaling/normalization to work effectively.',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'False. Isolation Forest is tree-based and uses random splits, making it largely insensitive to feature scaling. This is one of its advantages over distance-based methods.',
    category: 'ml',
    difficulty: 'advanced',
    relatedContent: ['wiki:feature-engineering'],
    tags: ['ml', 'preprocessing'],
  },
  {
    id: 'q-ml-sliding-window',
    type: 'multiple-choice',
    question: 'What is the primary purpose of using a sliding window for anomaly detection in time series?',
    options: [
      'To reduce memory usage',
      'To capture temporal patterns and recent context',
      'To increase training speed',
      'To normalize the data',
    ],
    correctAnswer: 1,
    explanation: 'Sliding windows capture temporal patterns by including recent history with each data point, allowing the model to detect anomalies based on how current values relate to recent behavior.',
    category: 'ml',
    difficulty: 'intermediate',
    relatedContent: ['wiki:streaming-ml'],
    tags: ['ml', 'time-series', 'streaming'],
  },
  {
    id: 'q-ml-retraining',
    type: 'multiple-choice',
    question: 'Why might you periodically retrain an anomaly detection model in a production system?',
    options: [
      'To reduce model size',
      'To adapt to concept drift and changing normal behavior',
      'To improve inference speed',
      'To reduce memory usage',
    ],
    correctAnswer: 1,
    explanation: 'Concept drift occurs when the underlying data distribution changes over time. Periodic retraining allows the model to adapt to new "normal" patterns.',
    category: 'ml',
    difficulty: 'advanced',
    relatedContent: ['wiki:model-lifecycle'],
    tags: ['ml', 'mlops', 'concept-drift'],
  },

  // Database Questions
  {
    id: 'q-db-timescale-1',
    type: 'multiple-choice',
    question: 'What is a hypertable in TimescaleDB?',
    options: [
      'A regular PostgreSQL table with indexes',
      'An abstraction that automatically partitions data by time',
      'A table stored entirely in memory',
      'A distributed table across multiple nodes',
    ],
    correctAnswer: 1,
    explanation: 'A hypertable is TimescaleDB\'s abstraction for time-series data that automatically partitions data into chunks based on time intervals, optimizing queries and data lifecycle management.',
    category: 'database',
    difficulty: 'beginner',
    relatedContent: ['wiki:timescaledb'],
    tags: ['database', 'timescaledb', 'time-series'],
  },
  {
    id: 'q-db-retention',
    type: 'multiple-choice',
    question: 'What is a data retention policy in the context of time-series databases?',
    options: [
      'A backup strategy',
      'A rule for automatically deleting or compressing old data',
      'A caching mechanism',
      'A replication configuration',
    ],
    correctAnswer: 1,
    explanation: 'Data retention policies automatically manage old data by deleting, compressing, or moving it to cold storage based on age, balancing storage costs with data availability needs.',
    category: 'database',
    difficulty: 'intermediate',
    relatedContent: ['wiki:data-retention'],
    tags: ['database', 'retention', 'timescaledb'],
  },
  {
    id: 'q-db-continuous-aggregate',
    type: 'true-false',
    question: 'Continuous aggregates in TimescaleDB are updated in real-time with every new row insert.',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'False. Continuous aggregates are materialized views that are refreshed periodically (either manually or on a schedule), not with every insert. This provides a balance between freshness and performance.',
    category: 'database',
    difficulty: 'advanced',
    relatedContent: ['wiki:continuous-aggregates'],
    tags: ['database', 'timescaledb', 'aggregates'],
  },
  {
    id: 'q-db-index-brin',
    type: 'multiple-choice',
    question: 'Why are BRIN indexes particularly effective for time-series data?',
    options: [
      'They store exact values for fast lookups',
      'They work well with unordered data',
      'They store min/max summaries for ranges, which works well with naturally ordered time data',
      'They support full-text search',
    ],
    correctAnswer: 2,
    explanation: 'BRIN (Block Range INdex) indexes store summary information (min/max) for ranges of blocks. Since time-series data is naturally ordered by time, BRIN can efficiently narrow down which blocks to scan.',
    category: 'database',
    difficulty: 'advanced',
    relatedContent: ['wiki:indexing-strategies'],
    tags: ['database', 'indexing', 'postgresql'],
  },

  // Security Questions
  {
    id: 'q-sec-kafka-auth',
    type: 'multiple-choice',
    question: 'Which protocol provides both authentication and encryption for Kafka?',
    options: [
      'PLAINTEXT',
      'SASL_PLAINTEXT',
      'SASL_SSL',
      'SSL only',
    ],
    correctAnswer: 2,
    explanation: 'SASL_SSL combines SASL for authentication (username/password, Kerberos, etc.) with SSL/TLS for encryption, providing both security features.',
    category: 'security',
    difficulty: 'intermediate',
    relatedContent: ['wiki:kafka-security'],
    tags: ['security', 'kafka', 'authentication'],
  },
  {
    id: 'q-sec-acl',
    type: 'fill-blank',
    question: 'Kafka uses _______ to control which users can read from or write to specific topics.',
    options: ['ACLs', 'firewalls', 'passwords', 'tokens'],
    correctAnswer: 0,
    explanation: 'Access Control Lists (ACLs) in Kafka define permissions for principals (users) on resources (topics, consumer groups) for specific operations (read, write, describe).',
    category: 'security',
    difficulty: 'beginner',
    relatedContent: ['wiki:kafka-acls'],
    tags: ['security', 'kafka', 'authorization'],
  },
  {
    id: 'q-sec-secrets',
    type: 'multiple-choice',
    question: 'What is the recommended way to manage database credentials in a production application?',
    options: [
      'Hard-code them in the source code',
      'Store them in a .env file committed to git',
      'Use a secrets manager like HashiCorp Vault or AWS Secrets Manager',
      'Pass them as command-line arguments',
    ],
    correctAnswer: 2,
    explanation: 'Secrets managers provide secure storage, access control, audit logging, and rotation capabilities for sensitive credentials, following security best practices.',
    category: 'security',
    difficulty: 'intermediate',
    relatedContent: ['wiki:secrets-management'],
    tags: ['security', 'credentials', 'best-practices'],
  },
  {
    id: 'q-sec-encryption-at-rest',
    type: 'true-false',
    question: 'Encryption at rest protects data from being read by unauthorized users while it travels over the network.',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'False. Encryption at rest protects stored data (on disk). Encryption in transit (TLS/SSL) protects data traveling over the network.',
    category: 'security',
    difficulty: 'beginner',
    relatedContent: ['wiki:encryption'],
    tags: ['security', 'encryption'],
  },

  // Frontend/Dashboard Questions
  {
    id: 'q-fe-three-js',
    type: 'multiple-choice',
    question: 'What is the primary purpose of Three.js in a monitoring dashboard?',
    options: [
      'Database queries',
      'API authentication',
      '3D visualization and rendering',
      'State management',
    ],
    correctAnswer: 2,
    explanation: 'Three.js is a JavaScript 3D library used for creating and rendering 3D graphics in the browser, enabling immersive visualizations of system states.',
    category: 'frontend',
    difficulty: 'beginner',
    relatedContent: ['wiki:threejs-basics'],
    tags: ['frontend', 'threejs', 'visualization'],
  },
  {
    id: 'q-fe-websocket',
    type: 'multiple-choice',
    question: 'Why use WebSockets instead of HTTP polling for real-time dashboards?',
    options: [
      'WebSockets are simpler to implement',
      'WebSockets maintain persistent connections, reducing latency and overhead',
      'HTTP polling is not supported in modern browsers',
      'WebSockets are more secure',
    ],
    correctAnswer: 1,
    explanation: 'WebSockets maintain a persistent, bidirectional connection, allowing the server to push updates instantly without the overhead of repeated HTTP request/response cycles.',
    category: 'frontend',
    difficulty: 'intermediate',
    relatedContent: ['wiki:websockets'],
    tags: ['frontend', 'websockets', 'real-time'],
  },
  {
    id: 'q-fe-react-rerender',
    type: 'multiple-choice',
    question: 'What React hook is best for preventing unnecessary re-renders when dealing with frequently updating data?',
    options: [
      'useEffect',
      'useState',
      'useMemo / useCallback',
      'useContext',
    ],
    correctAnswer: 2,
    explanation: 'useMemo memoizes computed values and useCallback memoizes functions, preventing unnecessary recalculations and re-renders when dependencies haven\'t changed.',
    category: 'frontend',
    difficulty: 'intermediate',
    relatedContent: ['wiki:react-optimization'],
    tags: ['frontend', 'react', 'performance'],
  },

  // System Architecture Questions
  {
    id: 'q-arch-decoupling',
    type: 'multiple-choice',
    question: 'What is the main benefit of using Kafka as a message broker between services?',
    options: [
      'Faster database queries',
      'Decoupling producers and consumers, enabling independent scaling and fault tolerance',
      'Simpler deployment',
      'Lower memory usage',
    ],
    correctAnswer: 1,
    explanation: 'Kafka decouples producers from consumers, allowing them to scale independently, handle failures gracefully, and process data at their own pace through buffering.',
    category: 'kafka',
    difficulty: 'beginner',
    relatedContent: ['wiki:system-architecture'],
    tags: ['architecture', 'kafka', 'decoupling'],
  },
  {
    id: 'q-arch-backpressure',
    type: 'multiple-choice',
    question: 'What is backpressure in a streaming data pipeline?',
    options: [
      'A technique to compress data',
      'A mechanism to slow down producers when consumers can\'t keep up',
      'A method to encrypt data',
      'A way to partition data',
    ],
    correctAnswer: 1,
    explanation: 'Backpressure is a flow control mechanism that signals upstream components to slow down when downstream components are overwhelmed, preventing system overload.',
    category: 'kafka',
    difficulty: 'advanced',
    relatedContent: ['wiki:backpressure'],
    tags: ['architecture', 'streaming', 'flow-control'],
  },
  {
    id: 'q-arch-eventual-consistency',
    type: 'true-false',
    question: 'In an eventually consistent system, all nodes will always have identical data at any given moment.',
    options: ['True', 'False'],
    correctAnswer: 1,
    explanation: 'False. Eventually consistent systems guarantee that, given no new updates, all nodes will eventually converge to the same state. At any given moment, nodes may have different views.',
    category: 'database',
    difficulty: 'advanced',
    relatedContent: ['wiki:consistency-models'],
    tags: ['architecture', 'consistency', 'distributed-systems'],
  },

  // Monitoring & Observability Questions
  {
    id: 'q-obs-metrics',
    type: 'multiple-choice',
    question: 'What are the three pillars of observability?',
    options: [
      'CPU, memory, and disk',
      'Logs, metrics, and traces',
      'Alerts, dashboards, and reports',
      'Latency, throughput, and errors',
    ],
    correctAnswer: 1,
    explanation: 'The three pillars of observability are logs (discrete events), metrics (aggregated measurements), and traces (request flows across services).',
    category: 'general',
    difficulty: 'beginner',
    relatedContent: ['wiki:observability'],
    tags: ['observability', 'monitoring'],
  },
  {
    id: 'q-obs-percentile',
    type: 'multiple-choice',
    question: 'Why is p99 latency often more important than average latency for monitoring?',
    options: [
      'p99 is easier to calculate',
      'p99 shows the experience of the slowest 1% of requests, revealing tail latency issues',
      'Average latency is not a valid metric',
      'p99 uses less memory to track',
    ],
    correctAnswer: 1,
    explanation: 'P99 (99th percentile) reveals how the slowest 1% of requests perform. High tail latency affects user experience even when averages look good, making p99 critical for SLAs.',
    category: 'general',
    difficulty: 'intermediate',
    relatedContent: ['wiki:latency-metrics'],
    tags: ['observability', 'metrics', 'latency'],
  },
  {
    id: 'q-obs-alerting',
    type: 'multiple-choice',
    question: 'What is alert fatigue and how can it be prevented?',
    options: [
      'A database performance issue; solved by adding indexes',
      'Too many alerts causing operators to ignore them; solved by tuning thresholds and reducing noise',
      'A network latency problem; solved by using faster connections',
      'A memory leak; solved by restarting services',
    ],
    correctAnswer: 1,
    explanation: 'Alert fatigue occurs when operators receive too many alerts (especially false positives), leading them to ignore or miss critical issues. Prevention involves tuning thresholds, grouping related alerts, and focusing on actionable signals.',
    category: 'general',
    difficulty: 'intermediate',
    relatedContent: ['wiki:alerting-best-practices'],
    tags: ['observability', 'alerting', 'operations'],
  },
];

// Pre-built quizzes
export const quizzes: Quiz[] = [
  {
    id: 'quiz-kafka-fundamentals',
    title: 'Kafka Fundamentals',
    description: 'Test your understanding of Apache Kafka core concepts, producers, consumers, and message delivery semantics.',
    questions: quizQuestions.filter((q) => q.category === 'kafka').map((q) => q.id),
    category: 'kafka',
    difficulty: 'intermediate',
    estimatedMinutes: 10,
    passingScore: 70,
  },
  {
    id: 'quiz-ml-anomaly',
    title: 'Anomaly Detection',
    description: 'Master the concepts of anomaly detection, Isolation Forest, and streaming ML for sensor data.',
    questions: quizQuestions.filter((q) => q.category === 'ml').map((q) => q.id),
    category: 'ml',
    difficulty: 'intermediate',
    estimatedMinutes: 8,
    passingScore: 70,
  },
  {
    id: 'quiz-database-timeseries',
    title: 'Time-Series Databases',
    description: 'Learn about TimescaleDB, hypertables, continuous aggregates, and time-series optimizations.',
    questions: quizQuestions.filter((q) => q.category === 'database').map((q) => q.id),
    category: 'database',
    difficulty: 'intermediate',
    estimatedMinutes: 8,
    passingScore: 70,
  },
  {
    id: 'quiz-security',
    title: 'Security Best Practices',
    description: 'Understand authentication, authorization, encryption, and secrets management in distributed systems.',
    questions: quizQuestions.filter((q) => q.category === 'security').map((q) => q.id),
    category: 'security',
    difficulty: 'intermediate',
    estimatedMinutes: 6,
    passingScore: 70,
  },
  {
    id: 'quiz-frontend-realtime',
    title: 'Real-Time Frontend',
    description: 'Test your knowledge of Three.js, WebSockets, React optimization, and real-time dashboard techniques.',
    questions: quizQuestions.filter((q) => q.category === 'frontend').map((q) => q.id),
    category: 'frontend',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    passingScore: 70,
  },
  {
    id: 'quiz-full-stack',
    title: 'Full Stack Challenge',
    description: 'Comprehensive quiz covering all aspects of the Rig Alpha system - Kafka, ML, databases, security, and frontend.',
    questions: quizQuestions.map((q) => q.id),
    category: 'general',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    passingScore: 75,
  },
  {
    id: 'quiz-critical-concepts',
    title: 'Critical Concepts',
    description: 'Master the most important concepts that distinguish senior engineers - the ones that matter in interviews.',
    questions: quizQuestions.filter((q) => q.difficulty === 'critical' || q.difficulty === 'advanced').map((q) => q.id),
    category: 'general',
    difficulty: 'critical',
    estimatedMinutes: 15,
    passingScore: 80,
  },
];

// Helper functions
export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find((q) => q.id === id);
}

export function getQuestionById(id: string): QuizQuestion | undefined {
  return quizQuestions.find((q) => q.id === id);
}

export function getQuestionsForQuiz(quizId: string): QuizQuestion[] {
  const quiz = getQuizById(quizId);
  if (!quiz) return [];
  return quiz.questions.map(getQuestionById).filter((q): q is QuizQuestion => q !== undefined);
}

export function getQuizzesByCategory(category: WikiCategory | 'general'): Quiz[] {
  return quizzes.filter((q) => q.category === category);
}

export function getQuizzesByDifficulty(difficulty: Difficulty): Quiz[] {
  return quizzes.filter((q) => q.difficulty === difficulty);
}

export function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return [...questions].sort(() => Math.random() - 0.5);
}

export function shuffleOptions(question: QuizQuestion): QuizQuestion {
  if (question.type === 'true-false') return question;
  if (!question.options) return question;

  const optionsWithIndex = question.options.map((opt, idx) => ({ opt, idx }));
  const shuffled = [...optionsWithIndex].sort(() => Math.random() - 0.5);
  const newCorrectIndex = shuffled.findIndex((item) => item.idx === question.correctAnswer);

  return {
    ...question,
    options: shuffled.map((item) => item.opt),
    correctAnswer: newCorrectIndex,
  };
}

export default quizQuestions;
