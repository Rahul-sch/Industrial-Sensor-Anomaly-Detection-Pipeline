"""
Combined ML Anomaly Detection Pipeline

This module implements a hybrid anomaly detection system combining:
1. Rule-based detection for known failure patterns
2. Isolation Forest for multivariate outlier detection
3. LSTM Autoencoder for temporal pattern anomalies

The pipeline processes sensor readings in real-time and generates
alerts with confidence scores and recommended actions.
"""

import logging
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from collections import deque
import json

# Conditional imports for ML libraries
try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning("scikit-learn not available, Isolation Forest disabled")

try:
    import tensorflow as tf
    from tensorflow.keras.models import Model, load_model
    from tensorflow.keras.layers import Input, LSTM, Dense, RepeatVector, TimeDistributed
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    logging.warning("TensorFlow not available, LSTM Autoencoder disabled")


class AnomalyType(Enum):
    """Classification of anomaly types detected by the pipeline."""
    RULE_VIOLATION = "rule_violation"
    STATISTICAL_OUTLIER = "statistical_outlier"
    TEMPORAL_PATTERN = "temporal_pattern"
    COMBINED = "combined"


class Severity(Enum):
    """Severity levels for detected anomalies."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class AnomalyResult:
    """Result of anomaly detection for a single reading."""
    is_anomaly: bool
    anomaly_type: Optional[AnomalyType] = None
    severity: Severity = Severity.LOW
    confidence: float = 0.0
    affected_sensors: List[str] = field(default_factory=list)
    description: str = ""
    recommended_action: str = ""
    raw_scores: Dict[str, float] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class SensorReading:
    """Normalized sensor reading with metadata."""
    timestamp: datetime
    rig_id: str
    values: Dict[str, float]
    custom_sensors: Optional[Dict[str, Any]] = None


class RuleBasedDetector:
    """
    Rule-based anomaly detection using predefined thresholds.

    This detector catches obvious violations that don't require
    statistical modeling - like temperature exceeding safe limits
    or pressure dropping to dangerous levels.
    """

    # Default thresholds for standard sensors
    DEFAULT_THRESHOLDS = {
        'temperature': {'min': -40, 'max': 150, 'unit': 'C'},
        'pressure': {'min': 0, 'max': 500, 'unit': 'PSI'},
        'vibration': {'min': 0, 'max': 100, 'unit': 'mm/s'},
        'humidity': {'min': 0, 'max': 100, 'unit': '%'},
        'flow_rate': {'min': 0, 'max': 1000, 'unit': 'L/min'},
        'voltage': {'min': 0, 'max': 480, 'unit': 'V'},
        'current': {'min': 0, 'max': 100, 'unit': 'A'},
        'rpm': {'min': 0, 'max': 10000, 'unit': 'RPM'},
    }

    # Critical thresholds that require immediate action
    CRITICAL_THRESHOLDS = {
        'temperature': {'min': -20, 'max': 120},
        'pressure': {'min': 10, 'max': 450},
        'vibration': {'min': 0, 'max': 80},
    }

    def __init__(self, custom_thresholds: Optional[Dict] = None):
        """Initialize with optional custom threshold overrides."""
        self.thresholds = {**self.DEFAULT_THRESHOLDS}
        if custom_thresholds:
            self.thresholds.update(custom_thresholds)
        self.logger = logging.getLogger(__name__)

    def check(self, reading: SensorReading) -> List[AnomalyResult]:
        """
        Check a sensor reading against all defined rules.

        Returns a list of anomaly results for each violated rule.
        """
        anomalies = []

        for sensor_name, value in reading.values.items():
            # Find matching threshold rule
            threshold_key = self._find_threshold_key(sensor_name)
            if not threshold_key:
                continue

            threshold = self.thresholds[threshold_key]
            critical = self.CRITICAL_THRESHOLDS.get(threshold_key, {})

            # Check for violations
            if value < threshold['min'] or value > threshold['max']:
                is_critical = (
                    value < critical.get('min', float('-inf')) or
                    value > critical.get('max', float('inf'))
                )

                anomalies.append(AnomalyResult(
                    is_anomaly=True,
                    anomaly_type=AnomalyType.RULE_VIOLATION,
                    severity=Severity.CRITICAL if is_critical else Severity.HIGH,
                    confidence=1.0,  # Rule violations are certain
                    affected_sensors=[sensor_name],
                    description=self._format_violation(sensor_name, value, threshold),
                    recommended_action=self._get_recommended_action(sensor_name, value, threshold),
                    raw_scores={'rule_violation': 1.0},
                    timestamp=reading.timestamp
                ))

        return anomalies

    def _find_threshold_key(self, sensor_name: str) -> Optional[str]:
        """Find the threshold key that matches a sensor name."""
        sensor_lower = sensor_name.lower()
        for key in self.thresholds:
            if key in sensor_lower:
                return key
        return None

    def _format_violation(self, sensor: str, value: float, threshold: Dict) -> str:
        """Format a human-readable violation description."""
        if value < threshold['min']:
            return f"{sensor} value {value:.2f} below minimum {threshold['min']} {threshold.get('unit', '')}"
        return f"{sensor} value {value:.2f} exceeds maximum {threshold['max']} {threshold.get('unit', '')}"

    def _get_recommended_action(self, sensor: str, value: float, threshold: Dict) -> str:
        """Get recommended action for a violation."""
        if 'temperature' in sensor.lower():
            return "Check cooling system and thermal sensors"
        if 'pressure' in sensor.lower():
            return "Inspect pressure relief valves and seals"
        if 'vibration' in sensor.lower():
            return "Schedule maintenance inspection for bearings and mounts"
        return "Investigate sensor reading and equipment status"


class IsolationForestDetector:
    """
    Isolation Forest for multivariate outlier detection.

    This detector identifies anomalies that may not violate individual
    thresholds but represent unusual combinations of sensor values.
    For example: normal temperature + normal pressure + abnormal flow
    could indicate a developing problem.
    """

    def __init__(
        self,
        contamination: float = 0.01,
        n_estimators: int = 100,
        random_state: int = 42
    ):
        """
        Initialize the Isolation Forest detector.

        Args:
            contamination: Expected proportion of outliers (0.01 = 1%)
            n_estimators: Number of trees in the forest
            random_state: Random seed for reproducibility
        """
        if not SKLEARN_AVAILABLE:
            raise RuntimeError("scikit-learn required for IsolationForestDetector")

        self.contamination = contamination
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=random_state,
            n_jobs=-1  # Use all CPU cores
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names: List[str] = []
        self.logger = logging.getLogger(__name__)

    def fit(self, readings: List[SensorReading]) -> None:
        """
        Train the model on historical sensor data.

        Args:
            readings: List of normal sensor readings for training
        """
        if len(readings) < 100:
            self.logger.warning("Insufficient data for training, need at least 100 samples")
            return

        # Extract feature matrix
        X, self.feature_names = self._readings_to_matrix(readings)

        # Fit scaler and model
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.is_fitted = True

        self.logger.info(f"Isolation Forest trained on {len(readings)} samples, {len(self.feature_names)} features")

    def detect(self, reading: SensorReading) -> Optional[AnomalyResult]:
        """
        Detect if a reading is an outlier.

        Args:
            reading: Sensor reading to check

        Returns:
            AnomalyResult if anomaly detected, None otherwise
        """
        if not self.is_fitted:
            return None

        # Convert to feature vector
        X, _ = self._readings_to_matrix([reading])
        if X.shape[1] != len(self.feature_names):
            self.logger.warning("Feature mismatch, skipping detection")
            return None

        X_scaled = self.scaler.transform(X)

        # Get prediction and anomaly score
        prediction = self.model.predict(X_scaled)[0]
        score = -self.model.score_samples(X_scaled)[0]  # Higher = more anomalous

        if prediction == -1:  # Outlier
            # Determine severity based on anomaly score
            if score > 0.7:
                severity = Severity.HIGH
            elif score > 0.5:
                severity = Severity.MEDIUM
            else:
                severity = Severity.LOW

            return AnomalyResult(
                is_anomaly=True,
                anomaly_type=AnomalyType.STATISTICAL_OUTLIER,
                severity=severity,
                confidence=min(score, 1.0),
                affected_sensors=self._identify_anomalous_features(X_scaled[0]),
                description=f"Statistical outlier detected (score: {score:.3f})",
                recommended_action="Review sensor combination for unusual patterns",
                raw_scores={'isolation_forest': score},
                timestamp=reading.timestamp
            )

        return None

    def _readings_to_matrix(self, readings: List[SensorReading]) -> Tuple[np.ndarray, List[str]]:
        """Convert readings to numpy matrix for ML processing."""
        if not readings:
            return np.array([]), []

        # Get all unique sensor names
        all_sensors = set()
        for r in readings:
            all_sensors.update(r.values.keys())
        feature_names = sorted(all_sensors)

        # Build matrix
        X = np.zeros((len(readings), len(feature_names)))
        for i, reading in enumerate(readings):
            for j, sensor in enumerate(feature_names):
                X[i, j] = reading.values.get(sensor, 0.0)

        return X, feature_names

    def _identify_anomalous_features(self, x_scaled: np.ndarray) -> List[str]:
        """Identify which features contributed most to the anomaly."""
        # Features far from mean (>2 std) are likely contributors
        anomalous = []
        for i, (val, name) in enumerate(zip(x_scaled, self.feature_names)):
            if abs(val) > 2.0:  # More than 2 standard deviations
                anomalous.append(name)
        return anomalous[:5]  # Return top 5


class LSTMAutoencoderDetector:
    """
    LSTM Autoencoder for temporal pattern anomaly detection.

    This detector learns normal temporal patterns in sensor data
    and flags sequences that deviate from learned patterns.
    It catches anomalies that develop over time, like gradual
    drift or unusual oscillations.
    """

    def __init__(
        self,
        sequence_length: int = 50,
        latent_dim: int = 32,
        threshold_percentile: float = 99.0
    ):
        """
        Initialize the LSTM Autoencoder detector.

        Args:
            sequence_length: Number of timesteps in each sequence
            latent_dim: Dimension of the latent space
            threshold_percentile: Percentile for anomaly threshold
        """
        if not TF_AVAILABLE:
            raise RuntimeError("TensorFlow required for LSTMAutoencoderDetector")

        self.sequence_length = sequence_length
        self.latent_dim = latent_dim
        self.threshold_percentile = threshold_percentile
        self.model: Optional[Model] = None
        self.threshold: float = 0.0
        self.scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        self.feature_names: List[str] = []
        self.history: deque = deque(maxlen=sequence_length)
        self.logger = logging.getLogger(__name__)

    def build_model(self, n_features: int) -> Model:
        """Build the LSTM Autoencoder architecture."""
        # Encoder
        inputs = Input(shape=(self.sequence_length, n_features))
        encoded = LSTM(64, activation='relu', return_sequences=True)(inputs)
        encoded = LSTM(self.latent_dim, activation='relu', return_sequences=False)(encoded)

        # Decoder
        decoded = RepeatVector(self.sequence_length)(encoded)
        decoded = LSTM(self.latent_dim, activation='relu', return_sequences=True)(decoded)
        decoded = LSTM(64, activation='relu', return_sequences=True)(decoded)
        outputs = TimeDistributed(Dense(n_features))(decoded)

        model = Model(inputs, outputs)
        model.compile(optimizer='adam', loss='mse')

        return model

    def fit(self, readings: List[SensorReading], epochs: int = 50) -> None:
        """
        Train the autoencoder on historical data.

        Args:
            readings: Historical sensor readings (should be normal data)
            epochs: Number of training epochs
        """
        if len(readings) < self.sequence_length * 2:
            self.logger.warning("Insufficient data for LSTM training")
            return

        # Prepare sequences
        X, self.feature_names = self._prepare_sequences(readings)
        if X is None or len(X) == 0:
            return

        # Build and train model
        self.model = self.build_model(X.shape[2])

        self.logger.info(f"Training LSTM Autoencoder: {X.shape}")
        self.model.fit(
            X, X,
            epochs=epochs,
            batch_size=32,
            validation_split=0.1,
            verbose=0
        )

        # Calculate reconstruction error threshold
        reconstructed = self.model.predict(X, verbose=0)
        errors = np.mean(np.abs(X - reconstructed), axis=(1, 2))
        self.threshold = np.percentile(errors, self.threshold_percentile)

        self.logger.info(f"LSTM trained, threshold: {self.threshold:.4f}")

    def detect(self, reading: SensorReading) -> Optional[AnomalyResult]:
        """
        Detect temporal pattern anomalies.

        Args:
            reading: Current sensor reading

        Returns:
            AnomalyResult if anomaly detected, None otherwise
        """
        if self.model is None:
            return None

        # Add to history
        self.history.append(reading)

        if len(self.history) < self.sequence_length:
            return None  # Not enough history yet

        # Prepare sequence
        X, _ = self._prepare_sequences(list(self.history))
        if X is None or len(X) == 0:
            return None

        # Get reconstruction error
        reconstructed = self.model.predict(X, verbose=0)
        error = np.mean(np.abs(X - reconstructed))

        if error > self.threshold:
            severity = self._error_to_severity(error)

            return AnomalyResult(
                is_anomaly=True,
                anomaly_type=AnomalyType.TEMPORAL_PATTERN,
                severity=severity,
                confidence=min((error / self.threshold) - 1.0, 1.0),
                affected_sensors=self._identify_anomalous_sequences(X[0], reconstructed[0]),
                description=f"Temporal pattern anomaly (error: {error:.4f}, threshold: {self.threshold:.4f})",
                recommended_action="Review recent sensor trends for unusual patterns",
                raw_scores={'lstm_error': error, 'threshold': self.threshold},
                timestamp=reading.timestamp
            )

        return None

    def _prepare_sequences(self, readings: List[SensorReading]) -> Tuple[Optional[np.ndarray], List[str]]:
        """Prepare data for LSTM processing."""
        if len(readings) < self.sequence_length:
            return None, []

        # Get feature names from first reading
        feature_names = sorted(readings[0].values.keys())

        # Build sequences
        data = []
        for reading in readings:
            row = [reading.values.get(f, 0.0) for f in feature_names]
            data.append(row)

        data = np.array(data)

        # Scale if scaler available
        if self.scaler is not None:
            if not hasattr(self.scaler, 'mean_'):
                self.scaler.fit(data)
            data = self.scaler.transform(data)

        # Create sequences
        sequences = []
        for i in range(len(data) - self.sequence_length + 1):
            sequences.append(data[i:i + self.sequence_length])

        return np.array(sequences), feature_names

    def _error_to_severity(self, error: float) -> Severity:
        """Convert reconstruction error to severity level."""
        ratio = error / self.threshold
        if ratio > 3.0:
            return Severity.CRITICAL
        if ratio > 2.0:
            return Severity.HIGH
        if ratio > 1.5:
            return Severity.MEDIUM
        return Severity.LOW

    def _identify_anomalous_sequences(self, original: np.ndarray, reconstructed: np.ndarray) -> List[str]:
        """Identify which sensors had highest reconstruction error."""
        errors = np.mean(np.abs(original - reconstructed), axis=0)
        top_indices = np.argsort(errors)[-3:]  # Top 3
        return [self.feature_names[i] for i in top_indices if i < len(self.feature_names)]


class CombinedPipeline:
    """
    Master pipeline combining all detection methods.

    This orchestrates rule-based, statistical, and temporal
    detection to provide comprehensive anomaly detection.
    Results are fused with configurable weights.
    """

    def __init__(
        self,
        enable_rules: bool = True,
        enable_isolation_forest: bool = True,
        enable_lstm: bool = True,
        fusion_weights: Optional[Dict[str, float]] = None
    ):
        """
        Initialize the combined detection pipeline.

        Args:
            enable_rules: Enable rule-based detection
            enable_isolation_forest: Enable Isolation Forest
            enable_lstm: Enable LSTM Autoencoder
            fusion_weights: Weights for combining detector outputs
        """
        self.logger = logging.getLogger(__name__)

        # Initialize detectors
        self.rule_detector = RuleBasedDetector() if enable_rules else None

        self.if_detector = None
        if enable_isolation_forest and SKLEARN_AVAILABLE:
            self.if_detector = IsolationForestDetector()

        self.lstm_detector = None
        if enable_lstm and TF_AVAILABLE:
            self.lstm_detector = LSTMAutoencoderDetector()

        # Fusion weights
        self.weights = fusion_weights or {
            'rule': 1.0,
            'isolation_forest': 0.7,
            'lstm': 0.8
        }

        self.logger.info(f"Pipeline initialized: rules={enable_rules}, IF={self.if_detector is not None}, LSTM={self.lstm_detector is not None}")

    def train(self, historical_readings: List[SensorReading]) -> None:
        """
        Train ML-based detectors on historical data.

        Args:
            historical_readings: List of normal sensor readings
        """
        if self.if_detector:
            self.if_detector.fit(historical_readings)

        if self.lstm_detector:
            self.lstm_detector.fit(historical_readings)

    def detect(self, reading: SensorReading) -> AnomalyResult:
        """
        Run all detectors and fuse results.

        Args:
            reading: Current sensor reading

        Returns:
            Combined anomaly detection result
        """
        all_anomalies: List[AnomalyResult] = []

        # Rule-based detection
        if self.rule_detector:
            rule_results = self.rule_detector.check(reading)
            all_anomalies.extend(rule_results)

        # Isolation Forest detection
        if self.if_detector:
            if_result = self.if_detector.detect(reading)
            if if_result:
                all_anomalies.append(if_result)

        # LSTM detection
        if self.lstm_detector:
            lstm_result = self.lstm_detector.detect(reading)
            if lstm_result:
                all_anomalies.append(lstm_result)

        # Fuse results
        return self._fuse_results(all_anomalies, reading.timestamp)

    def _fuse_results(self, anomalies: List[AnomalyResult], timestamp: datetime) -> AnomalyResult:
        """Combine multiple detector outputs into single result."""
        if not anomalies:
            return AnomalyResult(
                is_anomaly=False,
                timestamp=timestamp
            )

        # Aggregate information
        all_sensors = set()
        descriptions = []
        raw_scores = {}
        max_severity = Severity.LOW
        weighted_confidence = 0.0
        total_weight = 0.0

        for anomaly in anomalies:
            all_sensors.update(anomaly.affected_sensors)
            descriptions.append(anomaly.description)
            raw_scores.update(anomaly.raw_scores)

            if anomaly.severity.value > max_severity.value:
                max_severity = anomaly.severity

            # Get weight for this detector type
            weight = self._get_weight(anomaly.anomaly_type)
            weighted_confidence += anomaly.confidence * weight
            total_weight += weight

        # Determine combined anomaly type
        types = [a.anomaly_type for a in anomalies if a.anomaly_type]
        if len(set(types)) > 1:
            anomaly_type = AnomalyType.COMBINED
        else:
            anomaly_type = types[0] if types else AnomalyType.RULE_VIOLATION

        return AnomalyResult(
            is_anomaly=True,
            anomaly_type=anomaly_type,
            severity=max_severity,
            confidence=weighted_confidence / total_weight if total_weight > 0 else 0.0,
            affected_sensors=list(all_sensors),
            description=" | ".join(descriptions),
            recommended_action=self._get_combined_action(anomalies),
            raw_scores=raw_scores,
            timestamp=timestamp
        )

    def _get_weight(self, anomaly_type: Optional[AnomalyType]) -> float:
        """Get fusion weight for an anomaly type."""
        if anomaly_type == AnomalyType.RULE_VIOLATION:
            return self.weights['rule']
        if anomaly_type == AnomalyType.STATISTICAL_OUTLIER:
            return self.weights['isolation_forest']
        if anomaly_type == AnomalyType.TEMPORAL_PATTERN:
            return self.weights['lstm']
        return 0.5

    def _get_combined_action(self, anomalies: List[AnomalyResult]) -> str:
        """Get recommended action based on all anomalies."""
        actions = [a.recommended_action for a in anomalies if a.recommended_action]
        if not actions:
            return "Investigate anomaly and verify sensor readings"
        return actions[0]  # Return most severe (first) action


def process_batch(
    pipeline: CombinedPipeline,
    readings: List[Dict],
    rig_id: str
) -> List[Dict]:
    """
    Process a batch of readings through the pipeline.

    Args:
        pipeline: Configured detection pipeline
        readings: Raw sensor reading dictionaries
        rig_id: Identifier for the rig

    Returns:
        List of anomaly results as dictionaries
    """
    results = []

    for raw_reading in readings:
        # Convert to SensorReading
        reading = SensorReading(
            timestamp=datetime.fromisoformat(raw_reading.get('timestamp', datetime.utcnow().isoformat())),
            rig_id=rig_id,
            values=raw_reading.get('values', {}),
            custom_sensors=raw_reading.get('custom_sensors')
        )

        # Detect anomalies
        result = pipeline.detect(reading)

        if result.is_anomaly:
            results.append({
                'timestamp': result.timestamp.isoformat(),
                'rig_id': rig_id,
                'is_anomaly': result.is_anomaly,
                'anomaly_type': result.anomaly_type.value if result.anomaly_type else None,
                'severity': result.severity.value,
                'confidence': result.confidence,
                'affected_sensors': result.affected_sensors,
                'description': result.description,
                'recommended_action': result.recommended_action,
                'raw_scores': result.raw_scores
            })

    return results


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    # Create pipeline
    pipeline = CombinedPipeline(
        enable_rules=True,
        enable_isolation_forest=SKLEARN_AVAILABLE,
        enable_lstm=TF_AVAILABLE
    )

    # Example reading
    test_reading = SensorReading(
        timestamp=datetime.utcnow(),
        rig_id="RIG-001",
        values={
            'temperature_1': 85.5,
            'pressure_main': 245.0,
            'vibration_motor': 15.2,
            'flow_rate': 450.0
        }
    )

    result = pipeline.detect(test_reading)
    print(f"Anomaly: {result.is_anomaly}, Type: {result.anomaly_type}, Severity: {result.severity}")
