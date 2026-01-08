# PROJECT MANIFEST: RIG ALPHA

## Industrial IoT Dashboard - Technical DNA

**Version:** 1.0.0
**Last Updated:** 2026-01-07
**Architecture Lead:** Rahul + Gemini + Claude

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [AI Integration Layer](#2-ai-integration-layer)
3. [Ingestion Engine](#3-ingestion-engine)
4. [UI/UX Framework](#4-uiux-framework)
5. [Database Architecture](#5-database-architecture)
6. [ML Anomaly Detection](#6-ml-anomaly-detection)
7. [Tomorrow Tasks](#7-tomorrow-tasks)
8. [Enterprise Gap Analysis](#8-enterprise-gap-analysis)
9. [Cloud Migration Plan](#9-cloud-migration-plan)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RIG ALPHA ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│   │   PRODUCER   │───▶│    KAFKA     │───▶│   CONSUMER   │                │
│   │  (Simulator) │    │ sensor-data  │    │  (ML + DB)   │                │
│   └──────────────┘    └──────────────┘    └──────────────┘                │
│          │                                       │                         │
│          ▼                                       ▼                         │
│   ┌──────────────┐                       ┌──────────────┐                 │
│   │  /api/v1/    │                       │  PostgreSQL  │                 │
│   │   ingest     │                       │  + JSONB     │                 │
│   └──────────────┘                       └──────────────┘                 │
│                                                 │                          │
│   ┌──────────────┐    ┌──────────────┐         │                          │
│   │   GROQ AI    │◀───│   Dashboard  │◀────────┘                          │
│   │  LLaMA 3.3   │    │   (Flask)    │                                    │
│   └──────────────┘    └──────────────┘                                    │
│                              │                                             │
│                              ▼                                             │
│                       ┌──────────────┐                                    │
│                       │  Cyberpunk   │                                    │
│                       │     UI       │                                    │
│                       └──────────────┘                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer           | Technology       | Version    |
| --------------- | ---------------- | ---------- |
| Backend         | Python + Flask   | 3.13 / 3.0 |
| Message Broker  | Apache Kafka     | 7.5+       |
| Database        | PostgreSQL       | 15+        |
| ML (Anomaly)    | scikit-learn     | 1.3+       |
| ML (Prediction) | TensorFlow LSTM  | 2.16+      |
| AI (NLP)        | Groq + LLaMA     | 3.3-70B    |
| Frontend        | Vanilla JS + SVG | ES6+       |

---

## 2. AI Integration Layer

### 2.1 Groq Configuration

**File:** `stub/config.py` (lines 422-446)

```python
# Model Configuration
AI_PROVIDER = "groq"
AI_MODEL_PARSING = "llama3-8b-8192"      # Fast, spec extraction
AI_MODEL_REPORTS = "llama-3.3-70b-versatile"  # Deep analysis
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
```

### 2.2 Sensor Spec Parser

**Endpoint:** `POST /api/admin/parse-sensor-file`
**File:** `stub/dashboard.py` (lines 3013-3140)

**Supported Formats:**

- PDF (PyPDF2 - first 2 pages)
- CSV (direct text parsing)
- TXT (raw specification sheets)
- JSON (passthrough or AI enhancement)

**AI Prompt Engineering:**

```python
system_prompt = """You are an engineering assistant.
Extract sensor specifications from this text.
Return ONLY raw JSON (no markdown) with these exact keys:
- 'sensor_name' (snake_case string)
- 'min_range' (float)
- 'max_range' (float)
- 'unit' (string)
- 'low_threshold' (float or null)
- 'high_threshold' (float or null)
- 'category' (environmental|mechanical|thermal|electrical|fluid)"""
```

**Output Schema:**

```json
{
  "sensor_name": "hydraulic_pressure",
  "min_range": 0,
  "max_range": 5000,
  "unit": "PSI",
  "low_threshold": 500,
  "high_threshold": 4500,
  "category": "fluid"
}
```

### 2.3 AI Report Generation

**Endpoint:** `POST /api/generate-report/<anomaly_id>`
**File:** `stub/report_generator.py` (lines 203-401)

Generates root-cause analysis reports with:

- Anomaly context (which sensors, severity)
- Historical pattern analysis
- Recommended corrective actions
- Confidence scores

---

## 3. Ingestion Engine

### 3.1 Kafka Topic Architecture

**File:** `stub/config.py` (lines 55-108)

```
┌───────────────────────────────────────────────────────────┐
│                    KAFKA TOPOLOGY                         │
├───────────────────────────────────────────────────────────┤
│                                                           │
│   Topic: sensor-data                                      │
│   ├── Partition 0 ─── Machine A readings                  │
│   ├── Partition 1 ─── Machine B readings                  │
│   └── Partition 2 ─── Machine C readings                  │
│                                                           │
│   Consumer Group: sensor-consumer-group                   │
│   ├── enable_auto_commit: false (exactly-once)           │
│   ├── auto_offset_reset: earliest                        │
│   └── max_poll_records: 100                              │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 3.2 External Ingestion API

**Endpoint:** `POST /api/v1/ingest`
**File:** `stub/dashboard.py`

**Authentication:**

```http
POST /api/v1/ingest HTTP/1.1
Content-Type: application/json
X-API-KEY: rig-alpha-secret
```

**Request Payload:**

```json
{
  "machine_id": "A",
  "temperature": 72.5,
  "pressure": 10.2,
  "custom_sensors": {
    "hydraulic_pressure": 2500,
    "bearing_temp_aux": 145
  }
}
```

**Response:**

```json
{
  "success": true,
  "topic": "sensor-data",
  "partition": 0,
  "offset": 15234
}
```

### 3.3 Message Schema (50 Core Sensors)

```json
{
  "timestamp": "2026-01-07T12:34:56",
  "machine_id": "A",

  "// ENVIRONMENTAL (10)": "",
  "temperature": 72.5,
  "pressure": 10.2,
  "humidity": 45.0,
  "ambient_temp": 68.0,
  "dew_point": 52.0,
  "air_quality_index": 85,
  "co2_level": 420,
  "particle_count": 150,
  "noise_level": 72,
  "light_intensity": 500,

  "// MECHANICAL (10)": "",
  "vibration": 2.1,
  "rpm": 3200,
  "torque": 45.5,
  "shaft_alignment": 0.02,
  "bearing_temp": 145,
  "motor_current": 25.5,
  "belt_tension": 85,
  "gear_wear": 12,
  "coupling_temp": 130,
  "lubrication_pressure": 35,

  "// THERMAL (10)": "",
  "coolant_temp": 190,
  "exhaust_temp": 425,
  "oil_temp": 185,
  "radiator_temp": 175,
  "thermal_efficiency": 0.85,
  "heat_dissipation": 2500,
  "inlet_temp": 65,
  "outlet_temp": 185,
  "core_temp": 195,
  "surface_temp": 145,

  "// ELECTRICAL (10)": "",
  "voltage": 120,
  "current": 25.5,
  "power_factor": 0.92,
  "frequency": 60.0,
  "resistance": 0.5,
  "capacitance": 100,
  "inductance": 50,
  "phase_angle": 15,
  "harmonic_distortion": 3.2,
  "ground_fault": 0.01,

  "// FLUID DYNAMICS (10)": "",
  "flow_rate": 250,
  "fluid_pressure": 85,
  "viscosity": 32,
  "density": 0.85,
  "reynolds_number": 4500,
  "pipe_pressure_drop": 5.2,
  "pump_efficiency": 0.88,
  "cavitation_index": 0.15,
  "turbulence": 2.8,
  "valve_position": 75,

  "// DYNAMIC SENSORS": "",
  "custom_sensors": {}
}
```

---

## 4. UI/UX Framework

### 4.1 Boot Sequence Animation

**File:** `stub/templates/dashboard.html` (lines 7899-7906)

```javascript
// Timeline-based industrial boot sequence
window.addEventListener("load", () => {
  const text = document.getElementById("boot-text");

  // T+0ms:    "INITIALIZING..."
  // T+800ms:  "CONNECTING SATELLITE..."
  setTimeout(() => (text.innerText = "CONNECTING SATELLITE..."), 800);

  // T+1600ms: "SYSTEM NOMINAL."
  setTimeout(() => (text.innerText = "SYSTEM NOMINAL."), 1600);

  // T+2200ms: Begin fade transition
  setTimeout(() => (overlay.style.opacity = "0"), 2200);

  // T+2500ms: Remove overlay, reveal dashboard
  setTimeout(() => overlay.remove(), 2500);
});
```

### 4.2 Real-Time Sensor Card Architecture

**File:** `stub/templates/dashboard.html` (lines 3985-4144)

```
┌─────────────────────────────────────────┐
│  TEMPERATURE                    ▲ 72.5°F │
│  ────────────────────────────────────── │
│  [═══════════════▓░░░░░░░░░░░░░░░░░░░] │  ← Sparkline (30 readings)
│                                         │
│  AVG: 71.2°F    │  RANGE: 65-85°F      │
│  ○○○○●●●○○○                            │  ← LSTM Prediction Dots
└─────────────────────────────────────────┘
```

**Priority Sensors (8 Cards):**

1. Temperature (Environmental)
2. Pressure (Environmental)
3. Voltage (Electrical)
4. Current (Electrical)
5. RPM (Mechanical)
6. Vibration (Mechanical)
7. Coolant Temp (Thermal)
8. Flow Rate (Fluid)

**Color Coding Logic:**

```javascript
function getThresholdColorClass(value, thresholds) {
  if (value < thresholds.low || value > thresholds.high) return "crit"; // Red - Critical
  if (value < thresholds.low * 1.1 || value > thresholds.high * 0.9)
    return "wrn"; // Yellow - Warning
  return "nom"; // Green - Nominal
}
```

### 4.3 Update Loop

```javascript
const UI_REFRESH_MS = 2000;

setInterval(() => {
  fetch("/api/stats")
    .then((r) => r.json())
    .then((data) => {
      renderHealthMatrix(data); // Left: 6 category cards
      renderTelemetryTiles(data); // Right: 8 sensor cards
      updatePipelineHealth(); // Header: TOTAL + MPS
    });
}, UI_REFRESH_MS);
```

---

## 5. Database Architecture

### 5.1 Core Schema

**File:** `stub/setup_db.sql`

```sql
-- Primary sensor storage with JSONB for dynamic sensors
CREATE TABLE sensor_readings (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    machine_id VARCHAR(1) CHECK (machine_id IN ('A', 'B', 'C')),

    -- 50 built-in sensor columns
    temperature FLOAT, pressure FLOAT, humidity FLOAT,
    vibration FLOAT, rpm FLOAT, voltage INT, current INT,
    -- ... (46 more)

    -- Dynamic sensor extension point
    custom_sensors JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index for fast JSONB queries
CREATE INDEX idx_custom_sensors ON sensor_readings
  USING GIN (custom_sensors);
```

### 5.2 ML Detection Results

```sql
CREATE TABLE anomaly_detections (
    id SERIAL PRIMARY KEY,
    reading_id INT REFERENCES sensor_readings(id),
    detection_method VARCHAR(32),  -- 'isolation_forest' | 'lstm'
    anomaly_score FLOAT NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    detected_sensors TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Audit Trail

**File:** `stub/migrations/add_audit_logs.sql`

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    operator_name VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id),
    machine_id VARCHAR(10),
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. ML Anomaly Detection

### 6.1 Hybrid Detection Strategy

**File:** `stub/config.py`

```python
HYBRID_DETECTION_STRATEGY = 'hybrid_smart'

# Options:
# - 'isolation_forest': Fast, unsupervised
# - 'lstm': Sequence-aware, predictive
# - 'hybrid_or': Flag if EITHER detects
# - 'hybrid_and': Flag if BOTH detect
# - 'hybrid_smart': Weighted ensemble
```

### 6.2 Isolation Forest (Real-Time)

```python
ISOLATION_FOREST_CONFIG = {
    'contamination': 0.05,      # 5% expected anomaly rate
    'n_estimators': 100,        # 100 decision trees
    'min_samples': 100,         # Minimum training data
    'random_state': 42
}
```

### 6.3 LSTM Autoencoder (Predictive)

```python
LSTM_CONFIG = {
    'sequence_length': 20,      # 20-reading lookback
    'encoding_dim': 32,         # Compressed representation
    'threshold_percentile': 95, # Top 5% = anomaly
    'min_readings': 100,        # Before training starts
    'prediction_horizon': 10    # Predict 10 steps ahead
}
```

---

## 7. Tomorrow Tasks

### 7.1 Persistent Audit Log Architecture

**Current State:** Basic `audit_logs` table exists
**Gap:** No UI, no retention policy, no compliance exports

**Proposed Architecture:**

```sql
-- Enhanced audit schema
CREATE TABLE audit_logs_v2 (
    id BIGSERIAL PRIMARY KEY,

    -- WHO
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(64) NOT NULL,
    role VARCHAR(16),
    ip_address INET,
    user_agent TEXT,

    -- WHAT
    action_type VARCHAR(32) NOT NULL,  -- CRUD enum
    resource_type VARCHAR(64),         -- 'sensor', 'threshold', 'user'
    resource_id VARCHAR(128),

    -- BEFORE/AFTER
    previous_state JSONB,
    new_state JSONB,

    -- WHEN
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- COMPLIANCE
    retention_until TIMESTAMPTZ,       -- GDPR/SOX compliance
    hash_chain VARCHAR(64)             -- Tamper detection
);

-- Partitioning for scale
CREATE TABLE audit_logs_2026_q1 PARTITION OF audit_logs_v2
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
```

**UI Requirements:**

- Filterable audit log viewer (by user, action, resource)
- Export to CSV/PDF for compliance
- Anomaly highlighting (unusual access patterns)

### 7.2 Predictive ML Module (PTTF/RUL)

**Current State:** LSTM predicts anomaly probability
**Gap:** No Remaining Useful Life (RUL) countdown

**Proposed Architecture:**

```python
# Predicted Time To Failure (PTTF) Module
class PTTFPredictor:
    """
    Uses degradation patterns to estimate time until failure.
    Based on NASA Turbofan Engine Degradation dataset methodology.
    """

    def __init__(self):
        self.model = Sequential([
            LSTM(64, return_sequences=True),
            LSTM(32),
            Dense(1, activation='relu')  # Hours until failure
        ])

    def predict_rul(self, sensor_sequence: np.ndarray) -> dict:
        """
        Returns:
        {
            'rul_hours': 127.5,
            'confidence': 0.85,
            'degradation_trend': 'accelerating',
            'critical_sensors': ['bearing_temp', 'vibration']
        }
        """
```

**Training Data Requirements:**

- Historical run-to-failure data
- Labeled maintenance events
- Minimum 1000 failure cycles for accuracy

---

## 8. Enterprise Gap Analysis

### 8.1 Security Gaps

| Gap               | Current State      | Enterprise Requirement | Priority     |
| ----------------- | ------------------ | ---------------------- | ------------ |
| Authentication    | `X-API-KEY` header | JWT + OAuth 2.0        | **CRITICAL** |
| Authorization     | Role column only   | RBAC with permissions  | HIGH         |
| API Rate Limiting | None               | 1000 req/min/user      | HIGH         |
| Secret Management | `.env` file        | HashiCorp Vault        | MEDIUM       |
| Audit Encryption  | Plaintext          | AES-256 at rest        | HIGH         |
| TLS               | HTTP (dev)         | TLS 1.3 mandatory      | **CRITICAL** |

### 8.2 Database Gaps

| Gap             | Current State   | Enterprise Requirement | Priority     |
| --------------- | --------------- | ---------------------- | ------------ |
| Connection Pool | psycopg2 direct | pgBouncer / PgPool     | HIGH         |
| Read Replicas   | Single node     | Primary + 2 replicas   | HIGH         |
| Backup          | Manual          | Automated + PITR       | **CRITICAL** |
| Partitioning    | None            | Time-based partitions  | MEDIUM       |
| Encryption      | Plaintext       | TDE (Transparent Data) | HIGH         |

### 8.3 Observability Gaps

| Gap      | Current State      | Enterprise Requirement | Priority |
| -------- | ------------------ | ---------------------- | -------- |
| Logging  | print() statements | Structured JSON logs   | HIGH     |
| Metrics  | None               | Prometheus + Grafana   | HIGH     |
| Tracing  | None               | OpenTelemetry          | MEDIUM   |
| Alerting | Console logs       | PagerDuty/OpsGenie     | HIGH     |

---

## 9. Cloud Migration Plan

### Phase 1: Foundation (Week 1-2)

```yaml
# Infrastructure as Code
services:
  postgres:
    provider: neon.tech # Serverless Postgres
    tier: Scale # Auto-scaling

  kafka:
    provider: upstash.com # Serverless Kafka
    plan: Pay-as-you-go

  compute:
    provider: render.com # Or Railway
    type: Web Service
    instances: 2 # HA deployment
```

**Tasks:**

- [ ] Migrate PostgreSQL to Neon (schema + data)
- [ ] Migrate Kafka to Upstash (SASL auth)
- [ ] Deploy Flask app to Render
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline (GitHub Actions)

### Phase 2: Security Hardening (Week 3-4)

```python
# JWT Implementation
from flask_jwt_extended import JWTManager, jwt_required

app.config['JWT_SECRET_KEY'] = os.environ['JWT_SECRET']
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)

@app.route('/api/v1/ingest', methods=['POST'])
@jwt_required()
def api_v1_ingest():
    current_user = get_jwt_identity()
    # ... existing logic
```

**Tasks:**

- [ ] Implement JWT authentication
- [ ] Add OAuth 2.0 provider integration (Auth0/Clerk)
- [ ] Implement RBAC permission system
- [ ] Add API rate limiting (Flask-Limiter)
- [ ] Enable TLS everywhere

### Phase 3: Observability (Week 5-6)

```python
# Structured Logging
import structlog

logger = structlog.get_logger()

@app.route('/api/v1/ingest', methods=['POST'])
def api_v1_ingest():
    logger.info(
        "ingest_request",
        machine_id=data['machine_id'],
        sensor_count=len(data),
        user_id=current_user.id
    )
```

**Tasks:**

- [ ] Replace print() with structlog
- [ ] Add Prometheus metrics endpoint
- [ ] Configure Grafana dashboards
- [ ] Set up PagerDuty alerting
- [ ] Implement distributed tracing

### Phase 4: Scale & Resilience (Week 7-8)

```yaml
# Kubernetes Deployment (Optional)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rig-alpha-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
  template:
    spec:
      containers:
        - name: api
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

**Tasks:**

- [ ] Configure horizontal auto-scaling
- [ ] Implement health check endpoints
- [ ] Add circuit breakers (Kafka failures)
- [ ] Set up database connection pooling
- [ ] Configure CDN for static assets

---

## API Reference Quick Card

| Endpoint                       | Method   | Auth    | Purpose                    |
| ------------------------------ | -------- | ------- | -------------------------- |
| `/api/v1/ingest`               | POST     | API Key | External sensor ingestion  |
| `/api/stats`                   | GET      | Session | Real-time statistics       |
| `/api/admin/parse-sensor-file` | POST     | Admin   | AI spec parsing            |
| `/api/admin/custom-sensors`    | GET/POST | Admin   | Sensor registry            |
| `/api/lstm-predictions`        | GET      | Session | Future anomaly predictions |
| `/api/generate-report/<id>`    | POST     | Session | AI analysis report         |
| `/api/thresholds`              | GET/POST | Admin   | Threshold management       |

---

## Environment Variables Reference

```bash
# === REQUIRED ===
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://user:pass@host:5432/db
KAFKA_BROKER_URL=localhost:9092
SECRET_KEY=<random-32-chars>

# === KAFKA CLOUD (Upstash) ===
KAFKA_SASL_USERNAME=
KAFKA_SASL_PASSWORD=

# === ML TUNING ===
ML_DETECTION_ENABLED=true
HYBRID_DETECTION_STRATEGY=hybrid_smart
LSTM_SEQUENCE_LENGTH=20
LSTM_THRESHOLD_PERCENTILE=95

# === OPERATIONAL ===
FLASK_ENV=production
DEBUG=false
API_SECRET_KEY=<random-32-chars>
```

---

**Document Generated:** 2026-01-07
**Next Review:** Upon completion of Phase 1 Migration
