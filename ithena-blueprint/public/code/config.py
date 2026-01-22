"""
config.py - Rig Alpha Configuration Management

Centralized configuration for the entire Rig Alpha industrial IoT monitoring system.
Handles environment variables, validation, and provides type-safe access to all settings.

Configuration Categories:
- Kafka: Broker connections, topics, consumer groups
- Database: TimescaleDB connection and pool settings
- ML Pipeline: Model paths, thresholds, feature engineering
- WebSocket: Real-time streaming configuration
- Security: Authentication, encryption, rate limiting
- Logging: Structured logging configuration

Usage:
    from config import config

    # Access nested config
    broker = config.kafka.bootstrap_servers
    threshold = config.ml.anomaly_threshold
"""

import os
import json
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
from enum import Enum
from pathlib import Path


# =============================================================================
# ENVIRONMENT DETECTION
# =============================================================================

class Environment(Enum):
    """Deployment environment enumeration."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


def get_environment() -> Environment:
    """
    Detect current environment from ENV variable.
    Defaults to DEVELOPMENT if not set.
    """
    env_str = os.getenv("RIG_ALPHA_ENV", "development").lower()
    try:
        return Environment(env_str)
    except ValueError:
        print(f"Warning: Unknown environment '{env_str}', defaulting to development")
        return Environment.DEVELOPMENT


CURRENT_ENV = get_environment()


# =============================================================================
# KAFKA CONFIGURATION
# =============================================================================

@dataclass
class KafkaConfig:
    """
    Kafka connection and consumer configuration.

    The Rig Alpha system uses Kafka as the central message bus between
    the sensor simulator (producer) and the processing pipeline (consumer).

    Key Topics:
    - rig-sensor-data: Raw sensor readings from all 50 parameters
    - rig-anomalies: Detected anomalies for alerting systems
    - rig-predictions: ML model predictions for dashboard
    """

    # Connection settings
    bootstrap_servers: str = field(
        default_factory=lambda: os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    )

    # Topic configuration
    sensor_topic: str = field(
        default_factory=lambda: os.getenv("KAFKA_SENSOR_TOPIC", "rig-sensor-data")
    )
    anomaly_topic: str = field(
        default_factory=lambda: os.getenv("KAFKA_ANOMALY_TOPIC", "rig-anomalies")
    )
    prediction_topic: str = field(
        default_factory=lambda: os.getenv("KAFKA_PREDICTION_TOPIC", "rig-predictions")
    )

    # Consumer group settings
    consumer_group: str = field(
        default_factory=lambda: os.getenv("KAFKA_CONSUMER_GROUP", "rig-alpha-consumer")
    )

    # Performance tuning
    batch_size: int = field(
        default_factory=lambda: int(os.getenv("KAFKA_BATCH_SIZE", "100"))
    )
    poll_timeout_ms: int = field(
        default_factory=lambda: int(os.getenv("KAFKA_POLL_TIMEOUT_MS", "1000"))
    )
    max_poll_records: int = field(
        default_factory=lambda: int(os.getenv("KAFKA_MAX_POLL_RECORDS", "500"))
    )

    # Reliability settings
    auto_offset_reset: str = field(
        default_factory=lambda: os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest")
    )
    enable_auto_commit: bool = field(
        default_factory=lambda: os.getenv("KAFKA_AUTO_COMMIT", "true").lower() == "true"
    )
    auto_commit_interval_ms: int = field(
        default_factory=lambda: int(os.getenv("KAFKA_COMMIT_INTERVAL_MS", "5000"))
    )

    # Security (optional)
    security_protocol: Optional[str] = field(
        default_factory=lambda: os.getenv("KAFKA_SECURITY_PROTOCOL")
    )
    sasl_mechanism: Optional[str] = field(
        default_factory=lambda: os.getenv("KAFKA_SASL_MECHANISM")
    )
    sasl_username: Optional[str] = field(
        default_factory=lambda: os.getenv("KAFKA_SASL_USERNAME")
    )
    sasl_password: Optional[str] = field(
        default_factory=lambda: os.getenv("KAFKA_SASL_PASSWORD")
    )

    def to_consumer_config(self) -> Dict[str, Any]:
        """
        Convert to kafka-python consumer configuration dict.
        Only includes security settings if configured.
        """
        config = {
            "bootstrap_servers": self.bootstrap_servers.split(","),
            "group_id": self.consumer_group,
            "auto_offset_reset": self.auto_offset_reset,
            "enable_auto_commit": self.enable_auto_commit,
            "max_poll_records": self.max_poll_records,
        }

        # Add security settings if configured
        if self.security_protocol:
            config["security_protocol"] = self.security_protocol
        if self.sasl_mechanism:
            config["sasl_mechanism"] = self.sasl_mechanism
        if self.sasl_username:
            config["sasl_plain_username"] = self.sasl_username
        if self.sasl_password:
            config["sasl_plain_password"] = self.sasl_password

        return config


# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

@dataclass
class DatabaseConfig:
    """
    TimescaleDB connection and pool configuration.

    TimescaleDB extends PostgreSQL with time-series optimizations:
    - Automatic partitioning (chunks) by time
    - Compression for older data
    - Continuous aggregates for fast queries

    The sensor_readings hypertable stores all 50 parameters with
    automatic chunk management based on time intervals.
    """

    # Connection string components
    host: str = field(
        default_factory=lambda: os.getenv("DB_HOST", "localhost")
    )
    port: int = field(
        default_factory=lambda: int(os.getenv("DB_PORT", "5432"))
    )
    database: str = field(
        default_factory=lambda: os.getenv("DB_NAME", "rig_alpha")
    )
    user: str = field(
        default_factory=lambda: os.getenv("DB_USER", "rig_user")
    )
    password: str = field(
        default_factory=lambda: os.getenv("DB_PASSWORD", "rig_password")
    )

    # Connection pool settings
    min_pool_size: int = field(
        default_factory=lambda: int(os.getenv("DB_MIN_POOL", "5"))
    )
    max_pool_size: int = field(
        default_factory=lambda: int(os.getenv("DB_MAX_POOL", "20"))
    )

    # Query settings
    query_timeout_seconds: int = field(
        default_factory=lambda: int(os.getenv("DB_QUERY_TIMEOUT", "30"))
    )

    # TimescaleDB specific
    chunk_interval: str = field(
        default_factory=lambda: os.getenv("DB_CHUNK_INTERVAL", "1 day")
    )
    retention_days: int = field(
        default_factory=lambda: int(os.getenv("DB_RETENTION_DAYS", "90"))
    )
    compression_after_days: int = field(
        default_factory=lambda: int(os.getenv("DB_COMPRESS_AFTER", "7"))
    )

    # Table names
    readings_table: str = "sensor_readings"
    anomalies_table: str = "detected_anomalies"
    predictions_table: str = "ml_predictions"

    @property
    def connection_string(self) -> str:
        """Generate PostgreSQL connection string."""
        return (
            f"postgresql://{self.user}:{self.password}@"
            f"{self.host}:{self.port}/{self.database}"
        )

    @property
    def async_connection_string(self) -> str:
        """Generate asyncpg connection string."""
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}@"
            f"{self.host}:{self.port}/{self.database}"
        )


# =============================================================================
# ML PIPELINE CONFIGURATION
# =============================================================================

@dataclass
class MLConfig:
    """
    Machine Learning pipeline configuration.

    The Rig Alpha ML pipeline uses a hybrid approach:
    1. Rule-based: Fast, interpretable alerts for known conditions
    2. Isolation Forest: Statistical anomaly detection
    3. LSTM Autoencoder: Temporal pattern recognition

    Ensemble fusion combines detector outputs using weighted voting
    with configurable thresholds for different severity levels.
    """

    # Model storage paths
    models_dir: Path = field(
        default_factory=lambda: Path(os.getenv("ML_MODELS_DIR", "./models"))
    )

    # Feature engineering
    feature_window_size: int = field(
        default_factory=lambda: int(os.getenv("ML_WINDOW_SIZE", "100"))
    )
    feature_columns: List[str] = field(default_factory=lambda: [
        "temperature", "pressure", "vibration", "flow_rate",
        "power_consumption", "rpm", "torque", "humidity",
        "ambient_temp", "coolant_level"
    ])

    # Anomaly thresholds (0.0 to 1.0)
    anomaly_threshold: float = field(
        default_factory=lambda: float(os.getenv("ML_ANOMALY_THRESHOLD", "0.7"))
    )
    critical_threshold: float = field(
        default_factory=lambda: float(os.getenv("ML_CRITICAL_THRESHOLD", "0.9"))
    )
    warning_threshold: float = field(
        default_factory=lambda: float(os.getenv("ML_WARNING_THRESHOLD", "0.5"))
    )

    # Isolation Forest settings
    isolation_forest_estimators: int = field(
        default_factory=lambda: int(os.getenv("ML_IF_ESTIMATORS", "100"))
    )
    isolation_forest_contamination: float = field(
        default_factory=lambda: float(os.getenv("ML_IF_CONTAMINATION", "0.1"))
    )

    # LSTM Autoencoder settings
    lstm_sequence_length: int = field(
        default_factory=lambda: int(os.getenv("ML_LSTM_SEQ_LEN", "50"))
    )
    lstm_hidden_units: int = field(
        default_factory=lambda: int(os.getenv("ML_LSTM_HIDDEN", "64"))
    )
    lstm_learning_rate: float = field(
        default_factory=lambda: float(os.getenv("ML_LSTM_LR", "0.001"))
    )
    lstm_epochs: int = field(
        default_factory=lambda: int(os.getenv("ML_LSTM_EPOCHS", "50"))
    )
    lstm_batch_size: int = field(
        default_factory=lambda: int(os.getenv("ML_LSTM_BATCH", "32"))
    )

    # Ensemble weights (must sum to 1.0)
    rule_based_weight: float = field(
        default_factory=lambda: float(os.getenv("ML_WEIGHT_RULES", "0.3"))
    )
    isolation_forest_weight: float = field(
        default_factory=lambda: float(os.getenv("ML_WEIGHT_IF", "0.3"))
    )
    lstm_weight: float = field(
        default_factory=lambda: float(os.getenv("ML_WEIGHT_LSTM", "0.4"))
    )

    # Rule-based thresholds (sensor-specific limits)
    sensor_limits: Dict[str, Dict[str, float]] = field(default_factory=lambda: {
        "temperature": {"min": -10, "max": 150, "critical_max": 180},
        "pressure": {"min": 0, "max": 500, "critical_max": 600},
        "vibration": {"min": 0, "max": 10, "critical_max": 15},
        "flow_rate": {"min": 0, "max": 1000, "critical_max": 1200},
        "power_consumption": {"min": 0, "max": 5000, "critical_max": 6000},
        "rpm": {"min": 0, "max": 3600, "critical_max": 4000},
        "torque": {"min": 0, "max": 1000, "critical_max": 1200},
        "humidity": {"min": 0, "max": 100, "critical_max": 100},
    })

    def validate_weights(self) -> bool:
        """Ensure ensemble weights sum to 1.0."""
        total = self.rule_based_weight + self.isolation_forest_weight + self.lstm_weight
        return abs(total - 1.0) < 0.001

    def get_model_path(self, model_name: str) -> Path:
        """Get full path for a model file."""
        return self.models_dir / f"{model_name}.pkl"


# =============================================================================
# WEBSOCKET CONFIGURATION
# =============================================================================

@dataclass
class WebSocketConfig:
    """
    WebSocket server configuration for real-time dashboard updates.

    The WebSocket server pushes:
    - Live sensor readings (throttled to reduce bandwidth)
    - Anomaly alerts (immediate)
    - System health status (periodic)

    Client connections are managed with heartbeat/ping-pong
    to detect and clean up stale connections.
    """

    host: str = field(
        default_factory=lambda: os.getenv("WS_HOST", "0.0.0.0")
    )
    port: int = field(
        default_factory=lambda: int(os.getenv("WS_PORT", "8765"))
    )

    # Connection management
    max_connections: int = field(
        default_factory=lambda: int(os.getenv("WS_MAX_CONNECTIONS", "100"))
    )
    heartbeat_interval_seconds: int = field(
        default_factory=lambda: int(os.getenv("WS_HEARTBEAT_INTERVAL", "30"))
    )
    connection_timeout_seconds: int = field(
        default_factory=lambda: int(os.getenv("WS_CONN_TIMEOUT", "60"))
    )

    # Throttling
    sensor_broadcast_interval_ms: int = field(
        default_factory=lambda: int(os.getenv("WS_SENSOR_INTERVAL_MS", "100"))
    )
    anomaly_broadcast_immediate: bool = True

    # Message settings
    max_message_size_bytes: int = field(
        default_factory=lambda: int(os.getenv("WS_MAX_MSG_SIZE", "1048576"))  # 1MB
    )
    compression_enabled: bool = field(
        default_factory=lambda: os.getenv("WS_COMPRESSION", "true").lower() == "true"
    )


# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

@dataclass
class SecurityConfig:
    """
    Security settings for authentication, encryption, and rate limiting.

    Production deployments should:
    - Use strong JWT secrets (minimum 256 bits)
    - Enable TLS for all connections
    - Configure appropriate rate limits
    - Enable audit logging
    """

    # JWT settings
    jwt_secret: str = field(
        default_factory=lambda: os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    )
    jwt_algorithm: str = field(
        default_factory=lambda: os.getenv("JWT_ALGORITHM", "HS256")
    )
    jwt_expiry_hours: int = field(
        default_factory=lambda: int(os.getenv("JWT_EXPIRY_HOURS", "24"))
    )

    # API rate limiting
    rate_limit_requests_per_minute: int = field(
        default_factory=lambda: int(os.getenv("RATE_LIMIT_RPM", "100"))
    )
    rate_limit_burst: int = field(
        default_factory=lambda: int(os.getenv("RATE_LIMIT_BURST", "20"))
    )

    # TLS settings
    tls_enabled: bool = field(
        default_factory=lambda: os.getenv("TLS_ENABLED", "false").lower() == "true"
    )
    tls_cert_path: Optional[str] = field(
        default_factory=lambda: os.getenv("TLS_CERT_PATH")
    )
    tls_key_path: Optional[str] = field(
        default_factory=lambda: os.getenv("TLS_KEY_PATH")
    )

    # Audit logging
    audit_logging_enabled: bool = field(
        default_factory=lambda: os.getenv("AUDIT_LOGGING", "true").lower() == "true"
    )

    def validate_production_settings(self) -> List[str]:
        """
        Validate configuration for production deployment.
        Returns list of warnings/errors.
        """
        issues = []

        if self.jwt_secret == "dev-secret-change-in-production":
            issues.append("CRITICAL: Default JWT secret in use")

        if len(self.jwt_secret) < 32:
            issues.append("WARNING: JWT secret should be at least 32 characters")

        if not self.tls_enabled and CURRENT_ENV == Environment.PRODUCTION:
            issues.append("WARNING: TLS disabled in production")

        if self.tls_enabled and (not self.tls_cert_path or not self.tls_key_path):
            issues.append("ERROR: TLS enabled but cert/key paths not configured")

        return issues


# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

@dataclass
class LoggingConfig:
    """
    Structured logging configuration.

    Uses Python's logging module with JSON formatter for production
    and human-readable format for development.

    Log levels by component can be configured independently
    for granular debugging without noise.
    """

    # Global settings
    level: str = field(
        default_factory=lambda: os.getenv("LOG_LEVEL", "INFO")
    )
    format_json: bool = field(
        default_factory=lambda: os.getenv("LOG_FORMAT", "text") == "json"
    )

    # Output settings
    log_to_file: bool = field(
        default_factory=lambda: os.getenv("LOG_TO_FILE", "false").lower() == "true"
    )
    log_file_path: str = field(
        default_factory=lambda: os.getenv("LOG_FILE_PATH", "./logs/rig_alpha.log")
    )
    log_rotation_mb: int = field(
        default_factory=lambda: int(os.getenv("LOG_ROTATION_MB", "100"))
    )
    log_retention_count: int = field(
        default_factory=lambda: int(os.getenv("LOG_RETENTION_COUNT", "10"))
    )

    # Per-component log levels (override global)
    component_levels: Dict[str, str] = field(default_factory=lambda: {
        "kafka": os.getenv("LOG_LEVEL_KAFKA", "INFO"),
        "database": os.getenv("LOG_LEVEL_DB", "INFO"),
        "ml_pipeline": os.getenv("LOG_LEVEL_ML", "INFO"),
        "websocket": os.getenv("LOG_LEVEL_WS", "INFO"),
        "api": os.getenv("LOG_LEVEL_API", "INFO"),
    })

    def get_logging_dict_config(self) -> Dict[str, Any]:
        """Generate Python logging dictConfig compatible configuration."""
        handlers = {
            "console": {
                "class": "logging.StreamHandler",
                "level": self.level,
                "formatter": "json" if self.format_json else "standard",
                "stream": "ext://sys.stdout",
            }
        }

        if self.log_to_file:
            handlers["file"] = {
                "class": "logging.handlers.RotatingFileHandler",
                "level": self.level,
                "formatter": "json" if self.format_json else "standard",
                "filename": self.log_file_path,
                "maxBytes": self.log_rotation_mb * 1024 * 1024,
                "backupCount": self.log_retention_count,
            }

        return {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "standard": {
                    "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
                },
                "json": {
                    "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
                    "format": "%(asctime)s %(levelname)s %(name)s %(message)s"
                }
            },
            "handlers": handlers,
            "root": {
                "level": self.level,
                "handlers": list(handlers.keys()),
            },
            "loggers": {
                name: {"level": level}
                for name, level in self.component_levels.items()
            }
        }


# =============================================================================
# SENSOR PARAMETER DEFINITIONS
# =============================================================================

@dataclass
class SensorParameter:
    """Definition of a single sensor parameter."""
    name: str
    unit: str
    min_value: float
    max_value: float
    description: str
    category: str


# All 50 sensor parameters for the Rig Alpha system
SENSOR_PARAMETERS: List[SensorParameter] = [
    # Temperature sensors (10)
    SensorParameter("temp_motor_1", "°C", -20, 200, "Motor 1 temperature", "temperature"),
    SensorParameter("temp_motor_2", "°C", -20, 200, "Motor 2 temperature", "temperature"),
    SensorParameter("temp_bearing_front", "°C", -10, 150, "Front bearing temperature", "temperature"),
    SensorParameter("temp_bearing_rear", "°C", -10, 150, "Rear bearing temperature", "temperature"),
    SensorParameter("temp_oil", "°C", -20, 120, "Oil temperature", "temperature"),
    SensorParameter("temp_coolant", "°C", -30, 100, "Coolant temperature", "temperature"),
    SensorParameter("temp_ambient", "°C", -40, 60, "Ambient temperature", "temperature"),
    SensorParameter("temp_exhaust", "°C", 0, 500, "Exhaust temperature", "temperature"),
    SensorParameter("temp_intake", "°C", -20, 80, "Intake air temperature", "temperature"),
    SensorParameter("temp_hydraulic", "°C", -20, 100, "Hydraulic fluid temperature", "temperature"),

    # Pressure sensors (10)
    SensorParameter("pressure_oil", "bar", 0, 10, "Oil pressure", "pressure"),
    SensorParameter("pressure_coolant", "bar", 0, 5, "Coolant pressure", "pressure"),
    SensorParameter("pressure_hydraulic", "bar", 0, 350, "Hydraulic pressure", "pressure"),
    SensorParameter("pressure_intake", "mbar", 800, 1200, "Intake manifold pressure", "pressure"),
    SensorParameter("pressure_exhaust", "mbar", 900, 1500, "Exhaust backpressure", "pressure"),
    SensorParameter("pressure_fuel", "bar", 0, 10, "Fuel pressure", "pressure"),
    SensorParameter("pressure_differential", "mbar", -100, 100, "Filter differential pressure", "pressure"),
    SensorParameter("pressure_crankcase", "mbar", -50, 50, "Crankcase pressure", "pressure"),
    SensorParameter("pressure_boost", "bar", 0, 3, "Turbo boost pressure", "pressure"),
    SensorParameter("pressure_brake", "bar", 0, 200, "Brake system pressure", "pressure"),

    # Vibration sensors (8)
    SensorParameter("vib_motor_x", "mm/s", 0, 50, "Motor vibration X-axis", "vibration"),
    SensorParameter("vib_motor_y", "mm/s", 0, 50, "Motor vibration Y-axis", "vibration"),
    SensorParameter("vib_motor_z", "mm/s", 0, 50, "Motor vibration Z-axis", "vibration"),
    SensorParameter("vib_bearing_front", "mm/s", 0, 30, "Front bearing vibration", "vibration"),
    SensorParameter("vib_bearing_rear", "mm/s", 0, 30, "Rear bearing vibration", "vibration"),
    SensorParameter("vib_gearbox", "mm/s", 0, 40, "Gearbox vibration", "vibration"),
    SensorParameter("vib_pump", "mm/s", 0, 25, "Pump vibration", "vibration"),
    SensorParameter("vib_foundation", "mm/s", 0, 10, "Foundation vibration", "vibration"),

    # Flow sensors (6)
    SensorParameter("flow_coolant", "L/min", 0, 500, "Coolant flow rate", "flow"),
    SensorParameter("flow_oil", "L/min", 0, 100, "Oil flow rate", "flow"),
    SensorParameter("flow_fuel", "L/min", 0, 50, "Fuel flow rate", "flow"),
    SensorParameter("flow_hydraulic", "L/min", 0, 200, "Hydraulic flow rate", "flow"),
    SensorParameter("flow_intake_air", "kg/h", 0, 5000, "Intake air mass flow", "flow"),
    SensorParameter("flow_exhaust", "kg/h", 0, 5500, "Exhaust mass flow", "flow"),

    # Electrical sensors (8)
    SensorParameter("current_motor_1", "A", 0, 500, "Motor 1 current draw", "electrical"),
    SensorParameter("current_motor_2", "A", 0, 500, "Motor 2 current draw", "electrical"),
    SensorParameter("voltage_battery", "V", 0, 30, "Battery voltage", "electrical"),
    SensorParameter("voltage_bus", "V", 0, 800, "DC bus voltage", "electrical"),
    SensorParameter("power_total", "kW", 0, 500, "Total power consumption", "electrical"),
    SensorParameter("power_factor", "", 0, 1, "Power factor", "electrical"),
    SensorParameter("frequency", "Hz", 0, 100, "Electrical frequency", "electrical"),
    SensorParameter("resistance_insulation", "MΩ", 0, 1000, "Insulation resistance", "electrical"),

    # Mechanical sensors (8)
    SensorParameter("rpm_motor", "RPM", 0, 4000, "Motor speed", "mechanical"),
    SensorParameter("rpm_output", "RPM", 0, 2000, "Output shaft speed", "mechanical"),
    SensorParameter("torque_motor", "Nm", 0, 2000, "Motor torque", "mechanical"),
    SensorParameter("torque_output", "Nm", 0, 5000, "Output torque", "mechanical"),
    SensorParameter("position_actuator_1", "%", 0, 100, "Actuator 1 position", "mechanical"),
    SensorParameter("position_actuator_2", "%", 0, 100, "Actuator 2 position", "mechanical"),
    SensorParameter("load_cell_1", "kN", 0, 500, "Load cell 1", "mechanical"),
    SensorParameter("load_cell_2", "kN", 0, 500, "Load cell 2", "mechanical"),
]


# =============================================================================
# MASTER CONFIGURATION CLASS
# =============================================================================

@dataclass
class Config:
    """
    Master configuration class aggregating all config sections.

    Usage:
        from config import config

        # Access any setting
        broker = config.kafka.bootstrap_servers
        threshold = config.ml.anomaly_threshold

        # Validate for production
        issues = config.security.validate_production_settings()
    """

    environment: Environment = field(default_factory=get_environment)
    kafka: KafkaConfig = field(default_factory=KafkaConfig)
    database: DatabaseConfig = field(default_factory=DatabaseConfig)
    ml: MLConfig = field(default_factory=MLConfig)
    websocket: WebSocketConfig = field(default_factory=WebSocketConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)

    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == Environment.PRODUCTION

    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == Environment.DEVELOPMENT

    def validate_all(self) -> List[str]:
        """
        Validate all configuration sections.
        Returns list of issues found.
        """
        issues = []

        # Check ML weights
        if not self.ml.validate_weights():
            issues.append("ML ensemble weights don't sum to 1.0")

        # Check security in production
        if self.is_production():
            issues.extend(self.security.validate_production_settings())

        return issues

    def to_dict(self) -> Dict[str, Any]:
        """Export configuration as dictionary (excludes secrets)."""
        return {
            "environment": self.environment.value,
            "kafka": {
                "bootstrap_servers": self.kafka.bootstrap_servers,
                "sensor_topic": self.kafka.sensor_topic,
                "consumer_group": self.kafka.consumer_group,
            },
            "database": {
                "host": self.database.host,
                "port": self.database.port,
                "database": self.database.database,
            },
            "ml": {
                "anomaly_threshold": self.ml.anomaly_threshold,
                "feature_window_size": self.ml.feature_window_size,
            },
            "websocket": {
                "host": self.websocket.host,
                "port": self.websocket.port,
            },
        }

    def export_to_json(self, path: str) -> None:
        """Export non-sensitive config to JSON file."""
        with open(path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

# Global configuration instance
config = Config()


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_sensor_by_name(name: str) -> Optional[SensorParameter]:
    """Look up sensor parameter by name."""
    for sensor in SENSOR_PARAMETERS:
        if sensor.name == name:
            return sensor
    return None


def get_sensors_by_category(category: str) -> List[SensorParameter]:
    """Get all sensors in a category."""
    return [s for s in SENSOR_PARAMETERS if s.category == category]


def print_config_summary() -> None:
    """Print a summary of current configuration."""
    print(f"""
Rig Alpha Configuration Summary
================================
Environment: {config.environment.value}

Kafka:
  Servers: {config.kafka.bootstrap_servers}
  Topic: {config.kafka.sensor_topic}
  Group: {config.kafka.consumer_group}

Database:
  Host: {config.database.host}:{config.database.port}
  Database: {config.database.database}

ML Pipeline:
  Anomaly Threshold: {config.ml.anomaly_threshold}
  Feature Window: {config.ml.feature_window_size}
  Weights: Rules={config.ml.rule_based_weight}, IF={config.ml.isolation_forest_weight}, LSTM={config.ml.lstm_weight}

WebSocket:
  Address: {config.websocket.host}:{config.websocket.port}
  Max Connections: {config.websocket.max_connections}

Sensor Parameters: {len(SENSOR_PARAMETERS)} defined
""")


# =============================================================================
# MAIN (for testing)
# =============================================================================

if __name__ == "__main__":
    # Print configuration summary
    print_config_summary()

    # Validate configuration
    issues = config.validate_all()
    if issues:
        print("Configuration Issues:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("Configuration validated successfully!")

    # Show sensor categories
    print("\nSensor Categories:")
    categories = set(s.category for s in SENSOR_PARAMETERS)
    for cat in sorted(categories):
        count = len(get_sensors_by_category(cat))
        print(f"  {cat}: {count} sensors")
