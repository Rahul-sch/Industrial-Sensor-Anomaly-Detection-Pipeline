'use client';

import { useState } from 'react';
import { Zap, Database, Brain, Radio, ChevronDown, ChevronUp, Code2 } from 'lucide-react';

const codeSnippets = {
  kafka_producer: `# producer.py - Sending sensor data to Kafka
def send_to_kafka(sensor_data):
    producer.send(
        'sensor-readings',
        value=sensor_data,
        key=sensor_data['sensor_id'].encode()
    )
    producer.flush()  # Ensure delivery`,

  kafka_consumer: `# consumer.py - Reading from Kafka with exactly-once
consumer = KafkaConsumer(
    'sensor-readings',
    enable_auto_commit=False,  # Manual commit for exactly-once
    isolation_level='read_committed'
)

for message in consumer:
    data = message.value
    process_sensor_data(data)
    consumer.commit()  # Commit after successful processing`,

  db_insert: `# consumer.py - Inserting to PostgreSQL
def store_reading(reading):
    cursor.execute("""
        INSERT INTO sensor_readings
        (sensor_id, timestamp, temperature, pressure, vibration)
        VALUES (%s, %s, %s, %s, %s)
    """, (reading['sensor_id'], reading['timestamp'],
          reading['temperature'], reading['pressure'],
          reading['vibration']))
    conn.commit()`,

  lstm_detection: `# lstm_detector.py - LSTM Anomaly Detection
def detect_anomaly(sequence):
    # Normalize sequence
    normalized = scaler.transform(sequence)

    # Predict next value
    predicted = model.predict(normalized)

    # Calculate reconstruction error
    error = np.mean((normalized[-1] - predicted) ** 2)

    # Threshold-based detection
    return error > THRESHOLD`,

  isolation_forest: `# ml_detector.py - Isolation Forest Detection
def detect_with_forest(features):
    # Extract features: [temp, pressure, vibration, temp_delta]
    X = np.array([[
        features['temperature'],
        features['pressure'],
        features['vibration'],
        features['temperature'] - features['prev_temp']
    ]])

    # -1 = anomaly, 1 = normal
    prediction = forest.predict(X)
    return prediction[0] == -1`,

  hybrid_decision: `# analysis_engine.py - Hybrid ML Decision
def analyze_reading(reading):
    lstm_anomaly = lstm_detector.detect(reading['sequence'])
    forest_anomaly = isolation_forest.detect(reading['features'])

    # Both must agree for high confidence
    if lstm_anomaly and forest_anomaly:
        severity = calculate_severity(reading)
        emit_alert(reading, severity, confidence='high')
    elif lstm_anomaly or forest_anomaly:
        emit_alert(reading, 'medium', confidence='low')`,

  websocket_emit: `# dashboard.py - Emitting WebSocket events
@socketio.on('connect')
def handle_connect():
    emit('connection_status', {'status': 'connected'})

def broadcast_telemetry(sensor_data):
    socketio.emit('sensor_telemetry', {
        'sensor_id': sensor_data['sensor_id'],
        'temperature': sensor_data['temperature'],
        'timestamp': sensor_data['timestamp']
    })`,

  websocket_receive: `// useSocket.js - Receiving WebSocket events
socket.on('sensor_telemetry', (data) => {
  // Update transient state (bypasses React for 10Hz)
  const state = useSensorStore.getState();
  state.transientState[data.sensor_id] = {
    temperature: data.temperature,
    pressure: data.pressure,
    vibration: data.vibration,
    timestamp: data.timestamp
  };

  // Trigger 3D visualization update
  state.triggerRender();
});`,

  react_3d: `// App.jsx - 3D Visualization Update
function SensorMesh({ sensorId }) {
  const transientState = useSensorStore(s => s.transientState);

  useFrame(() => {
    const data = transientState[sensorId];
    if (!data) return;

    // Update mesh color based on temperature
    meshRef.current.material.color.setHSL(
      (data.temperature - 20) / 100,  // Hue
      1.0,  // Saturation
      0.5   // Lightness
    );
  });
}`,
};

const flows = [
  {
    id: 'data-pipeline',
    title: 'Data Pipeline Flow',
    icon: Database,
    color: 'cyan',
    description: 'How sensor data flows from Kafka through consumer to PostgreSQL',
    steps: [
      {
        title: 'Producer: Send to Kafka',
        file: 'producer.py',
        code: codeSnippets.kafka_producer,
        explanation: 'Sensors send readings to Kafka topic "sensor-readings". Uses key-based partitioning by sensor_id for ordering.',
      },
      {
        title: 'Consumer: Read from Kafka',
        file: 'consumer.py',
        code: codeSnippets.kafka_consumer,
        explanation: 'Consumer reads with exactly-once semantics (manual commit + read_committed isolation). Only commits after successful DB write.',
      },
      {
        title: 'Database: Store Reading',
        file: 'consumer.py',
        code: codeSnippets.db_insert,
        explanation: 'Inserts reading into PostgreSQL. Uses prepared statements to prevent SQL injection. Commit happens before Kafka commit for idempotency.',
      },
    ],
  },
  {
    id: 'ml-detection',
    title: 'ML Anomaly Detection',
    icon: Brain,
    color: 'purple',
    description: 'How the hybrid LSTM + Isolation Forest system detects anomalies',
    steps: [
      {
        title: 'LSTM: Sequential Pattern Detection',
        file: 'lstm_detector.py',
        code: codeSnippets.lstm_detection,
        explanation: 'LSTM looks at time-series sequence (last 50 readings). Detects anomalies via reconstruction error. Good for gradual drift.',
      },
      {
        title: 'Isolation Forest: Feature-based Detection',
        file: 'ml_detector.py',
        code: codeSnippets.isolation_forest,
        explanation: 'Isolation Forest uses current reading features. Detects sudden spikes. Fast and good for outliers.',
      },
      {
        title: 'Hybrid Decision Engine',
        file: 'analysis_engine.py',
        code: codeSnippets.hybrid_decision,
        explanation: 'Combines both models. High confidence only when both agree. Reduces false positives while catching both gradual and sudden anomalies.',
      },
    ],
  },
  {
    id: 'websocket-realtime',
    title: 'WebSocket Real-time Updates',
    icon: Radio,
    color: 'orange',
    description: 'How live sensor data gets pushed from backend to 3D frontend',
    steps: [
      {
        title: 'Backend: Emit WebSocket Event',
        file: 'dashboard.py',
        code: codeSnippets.websocket_emit,
        explanation: 'Flask-SocketIO broadcasts sensor_telemetry events to all connected clients at 10Hz per sensor.',
      },
      {
        title: 'Frontend: Receive and Update State',
        file: 'useSocket.js',
        code: codeSnippets.websocket_receive,
        explanation: 'Socket handler updates transientState directly (bypasses React re-render). Critical for 10Hz updates without lag.',
      },
      {
        title: '3D Rendering: Visual Update',
        file: 'App.jsx',
        code: codeSnippets.react_3d,
        explanation: 'useFrame hook (60 FPS) reads from transientState and updates Three.js meshes. Decouples data updates (10Hz) from render loop (60Hz).',
      },
    ],
  },
];

export default function ConnectionsPage() {
  const [expandedFlow, setExpandedFlow] = useState<string | null>('data-pipeline');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  const toggleFlow = (flowId: string) => {
    setExpandedFlow(expandedFlow === flowId ? null : flowId);
  };

  const toggleStep = (flowId: string, stepIndex: number) => {
    const key = `${flowId}-${stepIndex}`;
    setExpandedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gradient">Code Connections</h1>
          </div>
          <p className="text-xl text-[var(--foreground-muted)]">
            Visual guide to the 3 critical code flows in Ithena. Click to expand each flow and see the exact code that makes it work.
          </p>
        </div>

        {/* Flows */}
        <div className="space-y-4">
          {flows.map((flow) => {
            const Icon = flow.icon;
            const isExpanded = expandedFlow === flow.id;

            return (
              <div
                key={flow.id}
                className="bg-[var(--background-secondary)] border border-[var(--background-tertiary)] rounded-xl overflow-hidden"
              >
                {/* Flow Header */}
                <button
                  onClick={() => toggleFlow(flow.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        background: `rgba(var(--accent-${flow.color}-rgb, 6, 182, 212), 0.15)`,
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: `var(--accent-${flow.color})` }}
                      />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                        {flow.title}
                      </h2>
                      <p className="text-sm text-[var(--foreground-muted)] mt-1">
                        {flow.description}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-[var(--foreground-muted)]" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-[var(--foreground-muted)]" />
                  )}
                </button>

                {/* Flow Steps */}
                {isExpanded && (
                  <div className="p-6 pt-0 space-y-4">
                    {flow.steps.map((step, stepIndex) => {
                      const stepKey = `${flow.id}-${stepIndex}`;
                      const isStepExpanded = expandedSteps[stepKey];

                      return (
                        <div
                          key={stepIndex}
                          className="bg-[var(--background)] border border-[var(--background-tertiary)] rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleStep(flow.id, stepIndex)}
                            className="w-full p-4 flex items-center justify-between hover:bg-[var(--background-secondary)] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[var(--accent-blue)]/20 flex items-center justify-center">
                                <span className="text-sm font-bold text-[var(--accent-blue)]">
                                  {stepIndex + 1}
                                </span>
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-[var(--foreground)]">
                                  {step.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Code2 className="w-3 h-3 text-[var(--foreground-muted)]" />
                                  <span className="text-xs text-[var(--foreground-muted)]">
                                    {step.file}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {isStepExpanded ? (
                              <ChevronUp className="w-5 h-5 text-[var(--foreground-muted)]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[var(--foreground-muted)]" />
                            )}
                          </button>

                          {isStepExpanded && (
                            <div className="p-4 pt-0">
                              <p className="text-sm text-[var(--foreground-muted)] mb-4">
                                {step.explanation}
                              </p>
                              <pre className="bg-[var(--code-bg)] border border-[var(--code-border)] rounded-lg p-4 overflow-x-auto">
                                <code className="text-sm font-mono text-[var(--foreground)]">
                                  {step.code}
                                </code>
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Study Tips */}
        <div className="mt-10 p-6 bg-gradient-to-r from-[var(--accent-cyan)]/10 to-[var(--accent-purple)]/10 border border-[var(--accent-cyan)]/30 rounded-xl">
          <h3 className="font-semibold text-[var(--foreground)] mb-3">💡 Study Strategy</h3>
          <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
            <li>• <strong>Data Pipeline</strong>: Focus on exactly-once semantics (manual commit pattern)</li>
            <li>• <strong>ML Detection</strong>: Understand why both models are needed (gradual vs sudden anomalies)</li>
            <li>• <strong>WebSocket</strong>: Key insight is transientState bypass for high-frequency updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
