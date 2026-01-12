---
name: Dynamic Sensor Parameters
overview: Enable runtime addition of custom sensor parameters while maintaining full backward compatibility with existing 50 sensors. Uses hybrid schema (columns + JSONB) and warm-start ML approach.
todos:
  - id: phase1-db
    content: "Phase 1: Create database migration for custom_sensors table and JSONB column"
    status: pending
  - id: phase2-producer
    content: "Phase 2: Add database config loading and custom sensor generation to producer"
    status: pending
    dependencies:
      - phase1-db
  - id: phase3-consumer
    content: "Phase 3: Modify consumer to insert custom sensors into JSONB column"
    status: pending
    dependencies:
      - phase1-db
      - phase2-producer
  - id: phase4-dashboard-display
    content: "Phase 4: Add custom sensor display to dashboard stats and recent readings"
    status: pending
    dependencies:
      - phase3-consumer
  - id: phase5-admin-ui
    content: "Phase 5: Create admin UI and API endpoints for managing custom sensors"
    status: completed
    dependencies:
      - phase4-dashboard-display
  - id: phase6-ml-integration
    content: "Phase 6: Add warm-start support to ML models for custom sensors"
    status: pending
    dependencies:
      - phase5-admin-ui
---

# Dynamic S

ensor Parameters Implementation Plan

## Architecture Decision

### Schema Strategy: Hybrid Approach

**Decision:** Keep existing 50 sensors as database columns, store custom sensors in JSONB column.**Rationale:**

- **Zero breaking changes** to existing queries, indexes, and ML models
- **JSONB is indexed and queryable** in PostgreSQL (GIN index)
- **No ALTER TABLE required** for new sensors (no schema locks)
- **Backward compatible** - existing code continues working unchanged
- **Forward compatible** - new sensors can be added dynamically

**Architecture Diagram:**

```javascript
┌─────────────────────────────────────────────────────────┐
│                    Kafka Message                        │
│  {temperature: 75, ..., custom_sensors: {new: 2.3}}   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              sensor_readings Table                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Columns: 50 built-in sensors (temperature, ...) │  │
│  │ JSONB: custom_sensors {"bearing_vibration": 2.3}│  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                      │
         ▼                      ▼
┌─────────────────┐   ┌──────────────────┐
│  ML Models      │   │  Dashboard        │
│  (50 features)  │   │  (50 + JSONB)     │
└─────────────────┘   └──────────────────┘
```



## Database Plan

### New Tables

1. **`custom_sensors`** - Metadata registry
   ```sql
               CREATE TABLE custom_sensors (
                   id SERIAL PRIMARY KEY,
                   sensor_name VARCHAR(64) UNIQUE NOT NULL,
                   category VARCHAR(32) DEFAULT 'custom',
                   unit VARCHAR(16),
                   min_range FLOAT NOT NULL,
                   max_range FLOAT NOT NULL,
                   low_threshold FLOAT,
                   high_threshold FLOAT,
                   is_active BOOLEAN DEFAULT TRUE,
                   created_at TIMESTAMPTZ DEFAULT NOW(),
                   created_by VARCHAR(64)
               );
   ```




2. **`machine_sensor_config`** - Machine-specific sensor settings
   ```sql
               CREATE TABLE machine_sensor_config (
                   id SERIAL PRIMARY KEY,
                   machine_id VARCHAR(1) NOT NULL,
                   sensor_name VARCHAR(64) NOT NULL,
                   enabled BOOLEAN DEFAULT TRUE,
                   baseline FLOAT,
                   UNIQUE(machine_id, sensor_name)
               );
   ```




### Schema Modifications

1. **Add JSONB column to `sensor_readings`**
   ```sql
               ALTER TABLE sensor_readings 
               ADD COLUMN IF NOT EXISTS custom_sensors JSONB DEFAULT '{}'::jsonb;
               
               CREATE INDEX IF NOT EXISTS idx_custom_sensors 
               ON sensor_readings USING GIN (custom_sensors);
   ```




2. **Migration file:** `migrations/add_custom_sensors.sql`

- All changes use `IF NOT EXISTS` for safety
- Can be rolled back by dropping column/table

### Historical Data Preservation

- Existing readings: `custom_sensors` column defaults to `{}`
- No data loss or migration required
- Custom sensors only appear in new readings

## Producer Changes

### Configuration Loading

1. **Startup:**

- Load built-in sensors from `config.SENSOR_RANGES` (unchanged)
- Query database: `SELECT * FROM custom_sensors WHERE is_active = TRUE`
- Merge into runtime dict: `active_sensors = {built_in: {...}, custom: {...}}`

2. **Config Reloading:**

- Poll database every 60 seconds for changes
- Use `updated_at` timestamp or version number to detect changes
- Update in-memory cache when changes detected
- Log config reload events

### Generation Logic

1. **Built-in sensors:** Generate as before (correlated values, existing logic unchanged)
2. **Custom sensors:** 

- Generate random values within `min_range` to `max_range`
- No correlation initially (can add correlation rules later)
- Respect machine-specific enable/disable settings

3. **Message Format:**
   ```json
               {
                 "timestamp": "2024-01-01T12:00:00",
                 "temperature": 75.0,
                 ... (all 50 built-in sensors),
                 "custom_sensors": {
                   "bearing_vibration_rms": 2.3,
                   "custom_sensor_2": 100.0
                 }
               }
   ```




### Error Handling

- If database unavailable: Fallback to built-in sensors only
- If custom sensor config invalid: Log warning, skip that sensor
- Never crash producer due to custom sensor issues

## Consumer & ML Compatibility

### Consumer Changes

1. **Dynamic INSERT:**

- Keep existing 50-column INSERT for built-in sensors (unchanged)
- Add `custom_sensors` parameter: `..., %s)` where `%s` is JSONB value
- Extract `custom_sensors` from message JSON
- Validate custom sensors exist in `custom_sensors` table

2. **Validation:**

- Check custom sensor names exist in database
- Validate values within min/max range
- Log warnings for unknown sensors (don't fail)
- If `custom_sensors` key missing, insert `{}`

### ML Model Handling (Warm-Start)

**Isolation Forest:**

- Current: Uses hardcoded `SENSOR_COLUMNS = [50 sensors]`
- When custom sensor added: Continue using 50 features only
- Custom sensors **ignored** in feature extraction until retrain
- Log warning: "Custom sensors available but not included in ML model. Retrain to include."

**LSTM Autoencoder:**

- Current: Input shape `(sequence_length, 50)`
- When custom sensor added: Continue with shape `(20, 50)`
- Custom sensors **ignored** in sequences until retrain
- When retraining:
- New shape: `(20, 50 + N_custom)`
- Pad historical sequences with zeros/means for new sensors
- Recalculate threshold based on new feature count

**Feature Extraction:**

```python
# Pseudo-code
def extract_features(reading):
    # Always extract 50 built-in sensors
    features = [reading[sensor] for sensor in BUILT_IN_SENSORS]
    
    # Custom sensors: Only if model retrained
    if model_retrained and ENABLE_CUSTOM_SENSORS_IN_ML:
        custom = reading.get('custom_sensors', {})
        for sensor in CUSTOM_SENSORS:
            features.append(custom.get(sensor, 0.0))  # Default to 0
    
    return features
```



### What NOT to Do

- ❌ Don't auto-retrain when sensor added (too disruptive)
- ❌ Don't change model input shape without explicit retrain
- ❌ Don't crash if custom sensor missing from reading
- ❌ Don't include custom sensors in ML without retrain flag

## Dashboard/UI Plan

### Admin Interface

1. **New Section: "Manage Custom Sensors"**

- Location: Admin-only section (add role check)
- List existing custom sensors with edit/delete actions
- "Add New Sensor" button

2. **Add Sensor Form:**

- Sensor name: Alphanumeric + underscore, validated for uniqueness
- Category: Dropdown (existing 5 + "Custom Parameters")
- Unit: Text input
- Min/Max range: Numeric inputs
- Low/High threshold: Numeric inputs (optional)
- Machine assignment: All machines or specific (A, B, C)

3. **API Endpoints:**

- `POST /api/admin/custom-sensors` - Create sensor
- `GET /api/admin/custom-sensors` - List all
- `GET /api/admin/custom-sensors/:id` - Get details
- `PUT /api/admin/custom-sensors/:id` - Update
- `DELETE /api/admin/custom-sensors/:id` - Soft delete (set `is_active=false`)

### Dashboard Display

1. **Stats Page:**

- Show custom sensors in "Custom Parameters" category
- Calculate averages: `SELECT AVG((custom_sensors->>'sensor_name')::float) FROM sensor_readings`
- Display with unit, metadata

2. **Recent Readings:**

- Include `custom_sensors` JSONB in display
- Format as key-value pairs
- Show in same table or separate section

3. **Alerts:**

- Check custom sensor thresholds
- Compare values from JSONB against thresholds
- Generate alerts same as built-in sensors

4. **Anomalies:**

- Show custom sensors in `contributing_sensors` if relevant
- Display custom sensor values in anomaly details

5. **Threshold Editing:**

- Extend `/api/thresholds` endpoint
- Support both built-in and custom sensors
- Store custom thresholds in database (not just memory)

## Rollout Strategy

### Phase 1: Database Foundation (Safest)

**Files:** `migrations/add_custom_sensors.sql`

- Create `custom_sensors` table
- Add `custom_sensors` JSONB column to `sensor_readings`
- Add indexes
- Test with manual SQL inserts
- **Rollback:** Drop column/table

### Phase 2: Producer Support (Read-only)

**Files:** `producer.py`, `config.py`

- Add database config loading
- Generate custom sensors in messages
- Keep existing 50 sensors unchanged
- **Test:** Producer sends messages, existing consumer still works

### Phase 3: Consumer Support (Write)

**Files:** `consumer.py`

- Modify INSERT to handle JSONB
- Validate custom sensors
- **Test:** Consumer writes custom sensors, existing queries work

### Phase 4: Dashboard Display (Read-only UI)

**Files:** `dashboard.py`, `templates/dashboard.html`

- Show custom sensors in stats
- Display in recent readings
- Calculate averages from JSONB
- **Test:** UI shows data, no write operations

### Phase 5: Admin UI (Write Operations)

**Files:** `dashboard.py`, `templates/dashboard.html`

- Add sensor management interface
- API endpoints for CRUD
- Role-based access control
- **Test:** Admin can add sensors, appears in producer/consumer

### Phase 6: ML Integration (Most Risky)

**Files:** `ml_detector.py`, `lstm_detector.py`, `combined_pipeline.py`

- Warm-start support in ML models
- Feature extraction ignores custom sensors initially
- Retraining includes custom sensors
- **Test:** ML continues working, retrain includes new sensors

## Feature Flags

1. **`ENABLE_CUSTOM_SENSORS`** (config.py, default: False)

- Master switch for entire feature
- When False: System behaves exactly as before
- When True: Custom sensors enabled

2. **`CUSTOM_SENSORS_IN_ML`** (config.py, default: False)

- Controls ML inclusion of custom sensors
- When False: ML ignores custom sensors (warm-start)
- When True: ML includes custom sensors (requires retrain)

## Testing Strategy

1. **Unit Tests:**

- Config loading from database
- Message generation with custom sensors
- JSONB insertion
- Feature extraction (with/without custom sensors)

2. **Integration Tests:**

- Producer → Kafka → Consumer → Database flow
- Custom sensors appear in database
- Dashboard displays custom sensors

3. **Backward Compatibility Tests:**

- Old messages (no `custom_sensors` key) still work
- Existing queries return same results
- ML models work with old data

4. **Forward Compatibility Tests:**

- New messages work with old consumer (ignores unknown key)
- New sensors appear in dashboard
- ML models don't crash

5. **Performance Tests:**

- JSONB queries don't slow down dashboard
- GIN index improves query performance
- Producer config reload doesn't block

6. **Rollback Tests:**

- Disable feature flag, system returns to original state
- No data corruption
- No broken queries

## Risks & Mitigations

| Risk | Mitigation ||------|------------|| Schema changes break queries | All changes additive, use `IF NOT EXISTS` || Producer crashes on invalid config | Validate on load, fallback to built-in only || Consumer fails on invalid JSONB | Validate structure, try/except, log and continue || ML dimension mismatch | Warm-start: ignore custom sensors until retrain || Dashboard queries slow | Add GIN index, use efficient JSONB operators || Race condition: sensor added mid-run | Poll config periodically, use version/timestamp || Custom sensor deleted with data | Soft delete (`is_active=false`), keep historical data || Kafka format breaks consumers | Custom sensors additive, old consumers ignore |

## Explicit "Do NOT Do" List

1. ❌ Do NOT modify existing 50 sensor columns in `sensor_readings` table
2. ❌ Do NOT change existing INSERT queries to be fully dynamic (keep 50 columns explicit)
3. ❌ Do NOT auto-retrain ML models when sensor added
4. ❌ Do NOT include custom sensors in ML features without explicit retrain
5. ❌ Do NOT change Kafka message structure for built-in sensors
6. ❌ Do NOT remove or rename `config.SENSOR_RANGES`
7. ❌ Do NOT make custom sensors required in validation
8. ❌ Do NOT break existing dashboard queries
9. ❌ Do NOT allow custom sensor names that conflict with built-in sensors
10. ❌ Do NOT hard-delete custom sensors with historical data (soft delete only)
11. ❌ Do NOT modify producer generation logic for built-in sensors