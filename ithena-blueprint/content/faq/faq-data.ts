import type { Difficulty } from '@/lib/types';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  priority: 'critical' | 'high' | 'medium';
  difficulty: Difficulty;
  category: 'architecture' | 'kafka' | 'ml' | 'database' | 'security' | 'frontend' | 'scaling';
  relatedWiki?: string[];
  relatedXray?: { file: string; entryId: string }[];
}

export const faqData: FAQ[] = [
  {
    id: 'kafka-vs-rabbitmq',
    question: 'Why Kafka instead of RabbitMQ?',
    answer: `**Key reasons:**

1. **Exactly-once semantics** - Kafka provides native exactly-once delivery with idempotent producers and transactional APIs
2. **Message ordering** - With \`max_in_flight_requests_per_connection: 1\`, we guarantee order within partitions
3. **Throughput** - At 50 sensors × 20 msg/sec = 1000 msg/sec, Kafka's partition-based ordering is essential
4. **Replay capability** - Kafka retains messages (168 hours), allowing reprocessing after consumer bugs

**RabbitMQ limitations:**
- No ordering guarantees across multiple consumers
- Messages deleted after acknowledgment (no replay)
- Lower throughput ceiling for streaming workloads

**Code evidence:** See \`consumer.py:82-111\` - Kafka consumer config with manual offset commits`,
    tags: ['kafka', 'architecture', 'messaging'],
    priority: 'critical',
    difficulty: 'critical',
    category: 'kafka',
    relatedWiki: ['kafka-deep-dive', 'exactly-once-semantics'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-kafka-connect' }],
  },
  {
    id: 'kafka-down-handling',
    question: 'What happens if Kafka goes down?',
    answer: `**Producer behavior:**
- Exponential backoff retry: 1s → 2s → 4s → 8s → 16s → 32s → 60s (capped)
- Max 10 attempts = ~5 minutes of retries
- After 10 failures, producer crashes
- Orchestrator (Docker/systemd) restarts the process

**Consumer behavior:**
- Same exponential backoff strategy
- Polls with 1000ms timeout
- On connection loss, reconnection attempted automatically

**Data integrity:**
- Kafka persists to disk - no data loss on broker restart
- Producer retries ensure messages eventually delivered
- Consumer resumes from last committed offset

**Code:** \`config.py:INITIAL_RETRY_DELAY=1\`, \`BACKOFF_MULTIPLIER=2\`, \`MAX_RETRY_DELAY=60\``,
    tags: ['kafka', 'reliability', 'fault-tolerance'],
    priority: 'critical',
    difficulty: 'intermediate',
    category: 'kafka',
    relatedWiki: ['kafka-deep-dive', 'graceful-shutdown'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-kafka-connect' }],
  },
  {
    id: 'prevent-duplicate-readings',
    question: 'How do you prevent duplicate sensor readings?',
    answer: `**Exactly-once semantics via 3-step process:**

1. **Disable auto-commit:** \`enable_auto_commit=False\` in Kafka consumer config
2. **Manual DB transactions:** \`conn.autocommit=False\` on PostgreSQL connection
3. **Commit order:** DB commit FIRST, then Kafka offset commit

**Sequence:**
\`\`\`
INSERT sensor reading
→ conn.commit()        (DB persisted)
→ consumer.commit()    (Kafka offset updated)
\`\`\`

**Edge case protection:**
- Unique constraint on (timestamp, machine_id)
- If DB fails → offset not committed → message reprocessed
- If Kafka commit fails after DB commit → duplicate blocked by constraint

**Code:** \`consumer.py:453-516\` (process_message function)`,
    tags: ['exactly-once', 'reliability', 'database'],
    priority: 'critical',
    difficulty: 'critical',
    category: 'architecture',
    relatedWiki: ['exactly-once-semantics', 'database-schema'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-process-message' }],
  },
  {
    id: 'hybrid-ml-rationale',
    question: 'Why hybrid ML instead of one model?',
    answer: `**Problem with single models:**

| Model | Alone | Issue |
|-------|-------|-------|
| Isolation Forest | 40% false positives | Too sensitive to noise |
| LSTM Autoencoder | Misses 30% sudden failures | Needs temporal patterns |

**Hybrid solution:**
- **Both models must agree** for an anomaly flag
- Result: **8% false positives** (vs 40% IF alone)
- Catches BOTH gradual degradation (LSTM) AND sudden spikes (IF)

**Performance:**
- Isolation Forest: ~5ms per reading
- LSTM Autoencoder: ~200ms per reading
- Hybrid total: ~205ms (acceptable at 10Hz rate)

**Strategy selection:** \`config.HYBRID_DETECTION_STRATEGY = 'ensemble'\``,
    tags: ['machine-learning', 'anomaly-detection', 'architecture'],
    priority: 'critical',
    difficulty: 'advanced',
    category: 'ml',
    relatedWiki: ['ml-detection', 'hybrid-strategies'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-ml-detection' }],
  },
  {
    id: 'manual-offset-commits',
    question: 'Why manual Kafka offset commits instead of auto-commit?',
    answer: `**Auto-commit problem:**
- Background thread commits every 5 seconds automatically
- If DB write fails AFTER auto-commit → **DATA LOSS**
- Message won't be reprocessed - Kafka thinks it's "done"

**Manual commit solution:**
\`\`\`python
KAFKA_CONSUMER_CONFIG = {
    'enable_auto_commit': False,  # CRITICAL
    ...
}
\`\`\`

**Benefits:**
1. Commit ONLY after successful DB write
2. Failed messages automatically reprocessed
3. Complete control over "exactly-once" guarantee

**Location:** \`config.py:90-109\` (KAFKA_CONSUMER_CONFIG)`,
    tags: ['kafka', 'exactly-once', 'offsets'],
    priority: 'critical',
    difficulty: 'critical',
    category: 'kafka',
    relatedWiki: ['offset-management', 'exactly-once-semantics'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-process-message' }],
  },
  {
    id: 'db-schema-design',
    question: "What's your database schema and why?",
    answer: `**Main table: sensor_readings**
- 53 columns: id, timestamp, machine_id, 50 sensors, custom_sensors (JSONB)
- Wide table design = no joins needed
- All sensors in one row for query simplicity

**Supporting tables:**
- \`anomaly_detections\`: ML results linked by reading_id
- \`alerts\`: Dashboard notifications
- \`audit_logs_v2\`: Compliance tracking
- \`custom_sensors\`: Runtime-registered sensor definitions

**Trade-offs:**
| Wide Table | Normalized |
|------------|------------|
| No joins ✓ | Joins required |
| Fast queries ✓ | Slower queries |
| Less flexible | More flexible |
| Good for time-series | Good for relational |

**Why wide:** Real-time dashboard requires sub-100ms queries`,
    tags: ['database', 'schema', 'postgresql'],
    priority: 'critical',
    difficulty: 'intermediate',
    category: 'database',
    relatedWiki: ['database-schema'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-insert-reading' }],
  },
  {
    id: 'scaling-strategy',
    question: 'How does this system scale?',
    answer: `**Current capacity:** 1-20 msg/sec

**Bottlenecks & solutions:**

| Bottleneck | Current | Scaled |
|------------|---------|--------|
| DB connections | Single connection | ThreadedConnectionPool (10-20 conns) |
| Consumer | Single process | Multiple consumers (Kafka auto-balances) |
| ML processing | In-process | Separate ML service |

**At 1000 msg/sec:**
- 5-10 consumer processes
- Connection pool with 20 connections
- ML moved to dedicated service with GPU
- Kafka partitions increased (currently 1)

**Horizontal scaling:**
- Add Kafka partitions → add consumers
- Consumer group auto-rebalances
- No code changes needed

**Code path:** \`consumer.py\` main loop is stateless`,
    tags: ['scaling', 'architecture', 'performance'],
    priority: 'critical',
    difficulty: 'advanced',
    category: 'scaling',
    relatedWiki: ['connection-pooling'],
  },
  {
    id: 'security-layers',
    question: 'What about security?',
    answer: `**7 security layers:**

1. **Rate limiting** - Flask-Limiter (1000/min API, 5/min login)
2. **CSP headers** - Flask-Talisman Content-Security-Policy
3. **SQL injection** - Parameterized queries (\`%s\` placeholders)
4. **XSS prevention** - \`.textContent\` instead of \`.innerHTML\`
5. **RBAC** - \`@requires_role\` decorator for admin vs operator
6. **Audit logging** - Immutable \`audit_logs_v2\` table
7. **Transport** - SASL/SSL for cloud Kafka, SSL for Neon DB

**Example - SQL injection safe:**
\`\`\`python
# SAFE
cursor.execute("SELECT * FROM t WHERE id = %s", (id,))

# VULNERABLE (never do this)
cursor.execute(f"SELECT * FROM t WHERE id = '{id}'")
\`\`\``,
    tags: ['security', 'authentication', 'best-practices'],
    priority: 'critical',
    difficulty: 'intermediate',
    category: 'security',
    relatedWiki: ['audit-logging', 'rbac'],
  },
  {
    id: 'postgresql-vs-influxdb',
    question: 'Why PostgreSQL instead of InfluxDB for time-series?',
    answer: `**Key reason: ACID transactions**

Exactly-once semantics requires:
\`\`\`
INSERT → COMMIT → Kafka offset
\`\`\`
This MUST be atomic. InfluxDB is **eventually consistent**.

**Comparison:**
| Feature | PostgreSQL | InfluxDB |
|---------|------------|----------|
| ACID transactions | ✓ | ✗ |
| Exactly-once | ✓ | ✗ |
| JSONB support | ✓ | ✗ |
| SQL familiarity | ✓ | InfluxQL |
| Time-series optimized | Okay | ✓ |

**Trade-off:** InfluxDB faster for pure time-series queries, but we need transactional guarantees more than raw query speed.

**Neon bonus:** Serverless PostgreSQL with instant branching for dev/staging`,
    tags: ['database', 'time-series', 'architecture'],
    priority: 'high',
    difficulty: 'intermediate',
    category: 'database',
    relatedWiki: ['database-schema', 'neon-deployment'],
  },
  {
    id: 'ml-untrained-handling',
    question: 'What if ML models aren\'t trained yet?',
    answer: `**Graceful degradation pattern:**

\`\`\`python
MIN_TRAINING_SAMPLES = 100
\`\`\`

**Before 100 readings:**
- ML detection returns \`None\`
- Consumer continues with **rule-based detection only**
- No crashes, no empty results

**After 100 readings:**
- Models auto-train on accumulated data
- Training happens in background
- Detection activates automatically

**Fallback chain:**
1. Hybrid ML (IF + LSTM) - if available
2. Isolation Forest only - if TensorFlow missing
3. Rule-based only - if sklearn missing
4. No ML - consumer still runs

**Code:** \`consumer.py:27-37\` (conditional ML import)`,
    tags: ['machine-learning', 'fault-tolerance', 'graceful-degradation'],
    priority: 'critical',
    difficulty: 'intermediate',
    category: 'ml',
    relatedWiki: ['ml-detection'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-imports-ml' }],
  },
  {
    id: 'exponential-backoff',
    question: 'Explain the exponential backoff retry strategy',
    answer: `**Sequence:**
\`\`\`
Attempt 1: Wait 1s   → Total: 1s
Attempt 2: Wait 2s   → Total: 3s
Attempt 3: Wait 4s   → Total: 7s
Attempt 4: Wait 8s   → Total: 15s
Attempt 5: Wait 16s  → Total: 31s
Attempt 6: Wait 32s  → Total: 63s
Attempt 7: Wait 60s  → Total: 123s (capped)
Attempt 8: Wait 60s  → Total: 183s
Attempt 9: Wait 60s  → Total: 243s
Attempt 10: Wait 60s → Total: 303s (~5 min)
\`\`\`

**Why cap at 60s?**
- Unbounded waits make debugging impossible
- 60s is long enough for broker/DB restart
- Short enough to surface persistent failures

**Config:**
\`\`\`python
INITIAL_RETRY_DELAY = 1
BACKOFF_MULTIPLIER = 2
MAX_RETRY_DELAY = 60
MAX_RETRIES = 10
\`\`\``,
    tags: ['reliability', 'fault-tolerance', 'patterns'],
    priority: 'high',
    difficulty: 'beginner',
    category: 'architecture',
    relatedWiki: ['graceful-shutdown'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-kafka-connect' }],
  },
  {
    id: 'graceful-shutdown',
    question: 'How does graceful shutdown work?',
    answer: `**Key insight:** Set a flag, don't call \`sys.exit()\`

\`\`\`python
def signal_handler(self, signum, frame):
    self.should_shutdown = True  # Flag, not exit!
\`\`\`

**Why flag instead of exit?**
- \`sys.exit()\` is abrupt
- Current message might be half-processed
- Resources might leak (connections, file handles)

**Shutdown sequence:**
1. SIGINT/SIGTERM received
2. \`should_shutdown = True\`
3. Current message finishes processing
4. Main loop exits cleanly
5. \`shutdown()\` closes: consumer → cursor → connection

**Signals handled:**
- SIGINT (Ctrl+C)
- SIGTERM (Docker stop)
- SIGBREAK (Windows)`,
    tags: ['reliability', 'graceful-shutdown', 'best-practices'],
    priority: 'high',
    difficulty: 'intermediate',
    category: 'architecture',
    relatedWiki: ['graceful-shutdown'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-signal-handler' }],
  },
  {
    id: '3d-twin-integration',
    question: 'How does the 3D Digital Twin receive real-time data?',
    answer: `**Data flow:**
\`\`\`
Consumer → POST /api/internal/telemetry-update → SocketIO → React Three Fiber
\`\`\`

**Consumer side (fire-and-forget):**
\`\`\`python
requests.post(url, json=payload, timeout=0.5)  # Non-blocking
\`\`\`

**Frontend side (Zustand + useFrame):**
\`\`\`javascript
// Transient state pattern - no re-renders
const transientState = { rigs: { A: { rpm: 2500, ... } } }

useFrame(() => {
  const data = getTransientState().rigs[rigId]
  fanRef.current.rotation.y += (data.rpm / 5000) * 10 * delta
})
\`\`\`

**Sensor-to-visual mapping:**
| Sensor | Visual |
|--------|--------|
| RPM → | Fan rotation speed |
| Temperature → | Emissive color (black→red→orange) |
| Vibration → | Position shake |
| Anomaly score → | Warning light + sparkles |`,
    tags: ['frontend', '3d', 'websocket'],
    priority: 'high',
    difficulty: 'advanced',
    category: 'frontend',
    relatedWiki: ['3d-twin-architecture', 'websocket-streaming'],
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-3d-telemetry' }],
  },
  {
    id: 'transient-state-pattern',
    question: 'What is the transient state pattern and why use it?',
    answer: `**Problem:** React state causes re-renders
- At 10Hz updates, that's 600 re-renders per minute
- useFrame runs 60 FPS - can't afford re-renders

**Solution:** Direct mutation outside React's awareness

\`\`\`javascript
// BAD - triggers re-renders
const [rpm, setRpm] = useState(2500)

// GOOD - no re-renders
const transientState = { rigs: { A: { rpm: 2500 } } }
export const getTransientState = () => transientState

// Update directly in socket handler
socket.on('sensor_data', (data) => {
  transientState.rigs[data.machine_id].rpm = data.rpm
})

// Read in animation loop
useFrame(() => {
  const rpm = getTransientState().rigs[rigId].rpm
  // Animate based on rpm
})
\`\`\`

**When to use:** High-frequency updates that drive animations`,
    tags: ['frontend', 'performance', 'react'],
    priority: 'medium',
    difficulty: 'advanced',
    category: 'frontend',
    relatedWiki: ['3d-twin-architecture'],
  },
  {
    id: 'custom-sensors',
    question: 'How do custom sensors work?',
    answer: `**Runtime registration via dashboard:**
1. Admin registers new sensor (name, unit, min, max)
2. Stored in \`custom_sensors\` table
3. Producer can immediately send data for it
4. Consumer validates against registered specs

**Storage:** JSONB column in sensor_readings
\`\`\`sql
custom_sensors JSONB  -- {"my_sensor": 42.5, "other": 100}
\`\`\`

**Validation flow:**
\`\`\`python
def validate_custom_sensors(self, raw):
    # Query active sensors from DB
    cursor.execute("SELECT name, min_value, max_value FROM custom_sensors WHERE is_active")

    for sensor_name, value in raw.items():
        if sensor_name not in registered:
            invalid.append(sensor_name)
            continue
        if not (min <= value <= max):
            invalid.append(sensor_name)

    return (validated, invalid)
\`\`\`

**Code:** \`consumer.py:199-256\``,
    tags: ['sensors', 'extensibility', 'database'],
    priority: 'medium',
    difficulty: 'intermediate',
    category: 'architecture',
    relatedXray: [{ file: 'consumer.py', entryId: 'consumer-custom-sensors' }],
  },
  {
    id: 'isolation-forest-explained',
    question: 'How does Isolation Forest detect anomalies?',
    answer: `**Core insight:** Anomalies are easier to isolate

**Algorithm:**
1. Build random trees by randomly splitting features
2. Anomalies require fewer splits to isolate
3. Average path length across trees = anomaly score

**Why it works:**
- Normal points: surrounded by similar points, need many splits
- Anomalies: in sparse regions, few splits to isolate

**Parameters:**
\`\`\`python
IsolationForest(
    n_estimators=100,      # Number of trees
    contamination=0.1,     # Expected anomaly ratio
    random_state=42        # Reproducibility
)
\`\`\`

**Strengths:**
- Fast: O(n log n) training
- No distance calculations
- Works well in high dimensions

**Weaknesses:**
- Misses temporal patterns (use LSTM for that)`,
    tags: ['machine-learning', 'isolation-forest', 'anomaly-detection'],
    priority: 'medium',
    difficulty: 'intermediate',
    category: 'ml',
    relatedWiki: ['isolation-forest'],
  },
  {
    id: 'lstm-autoencoder-explained',
    question: 'How does the LSTM Autoencoder detect anomalies?',
    answer: `**Architecture:**
\`\`\`
Encoder: LSTM(50) → LSTM(25)
Decoder: RepeatVector → LSTM(25) → LSTM(50) → Dense
\`\`\`

**Training:** Learn to reconstruct normal sequences
**Detection:** High reconstruction error = anomaly

**Why LSTM for time-series:**
- Captures temporal dependencies
- Remembers patterns across 50-100 timesteps
- Detects gradual degradation (IF misses this)

**Parameters:**
\`\`\`python
LSTM_SEQUENCE_LENGTH = 50  # Look-back window
LSTM_THRESHOLD = 0.1       # Reconstruction error threshold
\`\`\`

**Inference:**
\`\`\`python
reconstruction = model.predict(sequence)
error = mean_squared_error(sequence, reconstruction)
is_anomaly = error > threshold
\`\`\``,
    tags: ['machine-learning', 'lstm', 'deep-learning'],
    priority: 'medium',
    difficulty: 'advanced',
    category: 'ml',
    relatedWiki: ['lstm-autoencoder'],
  },
];

// Extract all unique tags for filtering
export const allTags = Array.from(new Set(faqData.flatMap(faq => faq.tags))).sort();

// Extract all categories
export const allCategories = Array.from(new Set(faqData.map(faq => faq.category))).sort();
