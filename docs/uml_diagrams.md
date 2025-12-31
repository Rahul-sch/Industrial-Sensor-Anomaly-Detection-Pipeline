# UML Diagram Pack

Comprehensive UML views of the sensor pipeline. Paste the diagrams into any Mermaid-compatible viewer (e.g., VS Code Mermaid extension, mermaid.live) to render them. Each section highlights a different concern: structure, runtime flow, classes, and deployment.

---

## 1. Component Diagram

```mermaid
graph LR
    subgraph Operator_Laptop["Operator Laptop"]
        UI["Flask Dashboard\n(dashboard.py)"]
        Runner["Process Controller\n(subprocess + PowerShell)"]
        ProducerProc["SensorDataProducer\n(producer.py)"]
        ConsumerProc["SensorDataConsumer\n(consumer.py)"]
    end

    subgraph Docker_Host["Docker Host (docker-compose)"]
        Kafka["Kafka Broker"]
        Zookeeper["Zookeeper"]
        Postgres["PostgreSQL"]
    end

    UI -->|start/stop commands| Runner
    Runner -->|run python producer.py| ProducerProc
    Runner -->|run python consumer.py| ConsumerProc
    ProducerProc -->|publish sensor readings| Kafka
    Kafka -->|stream topic data| ConsumerProc
    ConsumerProc -->|INSERT sensor_readings| Postgres
    ConsumerProc -->|INSERT alerts| Postgres
    UI -->|query stats/history| Postgres
    UI -->|Kafka heartbeat| Kafka
```

---

## 2. Sequence Diagram (Start + Data Flow)

```mermaid
sequenceDiagram
    actor Operator
    participant UI as "Dashboard UI"
    participant API as "Flask API"
    participant Runner as "Process Runner"
    participant Producer as "SensorDataProducer"
    participant Kafka
    participant Consumer as "SensorDataConsumer"
    participant DB as "PostgreSQL"

    Operator ->> UI: Click "Start Consumer"
    UI ->> API: POST /api/start/consumer
    API ->> Runner: Spawn consumer process
    Runner ->> Consumer: python consumer.py
    Consumer ->> Kafka: Subscribe topic
    Consumer ->> DB: Open DB connection

    Operator ->> UI: Click "Start Producer"
    UI ->> API: POST /api/start/producer
    API ->> Runner: Spawn producer process
    Runner ->> Producer: python producer.py
    Producer ->> Kafka: Send sensor batch

    loop For each reading
        Producer ->> Kafka: Publish message
        Kafka ->> Consumer: Deliver message
        Consumer ->> DB: INSERT sensor_readings
        alt Value out of range
            Consumer ->> DB: INSERT alerts
        end
        par Dashboard polling
            UI ->> API: GET /api/stats
            API ->> UI: JSON stats
            UI ->> API: GET /api/alerts
            API ->> UI: JSON alerts
        end
    end
```

---

## 3. Class Diagram (Core Python Types)

```mermaid
classDiagram
    class Config {
        <<module>>
        +KAFKA_* constants
        +DB_CONFIG
        +SENSOR_RANGES
        +LOG_* settings
    }

    class SensorDataProducer {
        -producer
        -message_count
        -total_messages
        -should_shutdown
        +connect_to_kafka()
        +generate_sensor_data()
        +send_to_kafka(data)
        +run()
        +signal_handler(signum, frame)
    }

    class SensorDataConsumer {
        -consumer
        -db_conn
        -db_cursor
        -message_count
        -should_shutdown
        +connect_to_kafka()
        +connect_to_database()
        +consume()
        +insert_reading(reading)
        +detect_anomalies(reading)
        +record_alert(type, message, severity)
        +signal_handler(signum, frame)
    }

    class DashboardController {
        +start_component(name)
        +stop_component(name)
        +get_stats()
        +update_config(payload)
        +heartbeat_worker()
        +record_alert(type, message)
    }

    SensorDataProducer --> Config : uses
    SensorDataConsumer --> Config : uses
    DashboardController --> Config : reads
    DashboardController --> SensorDataProducer : manages process
    DashboardController --> SensorDataConsumer : manages process
```

---

## 4. Deployment Diagram

```mermaid
graph TB
    subgraph Laptop["Developer/Operator Machine"]
        Dashboard["Flask Dashboard\n(venv)"]
        Scripts["start-pipeline.ps1\n+ subprocess"]
        Dashboard -->|start/stop producer & consumer| Scripts
    end

    subgraph Containers["Docker Compose Stack"]
        Kafka["Kafka"]
        ZK["Zookeeper"]
        DB["PostgreSQL"]
    end

    Scripts -->|spawn| Producer["Producer Process"]
    Scripts -->|spawn| Consumer["Consumer Process"]
    Producer -->|publish| Kafka
    Kafka -->|deliver| Consumer
    Consumer -->|write data| DB
    Dashboard -->|metrics + config| DB
    Dashboard -->|heartbeat| Kafka
```

---

## 5. Code Structure Diagram

High-level view of the modules and the main entry points/functions exposed by each file.

```mermaid
classDiagram
    class ConfigModule {
        <<module>>
        +DB_CONFIG
        +KAFKA_* constants
        +LOG_* settings
        +SENSOR_RANGES
        +SENSOR_DEFAULTS
    }

    class ProducerModule {
        <<module>>
        +SensorDataProducer
        +main()
    }

    class ConsumerModule {
        <<module>>
        +SensorDataConsumer
        +main()
    }

    class DashboardModule {
        <<module>>
        +get_db_connection()
        +record_alert()
        +get_stats()/get_alerts()
        +update_config()/reset_config()
        +start_component()/stop_component()
        +clear_data()/export_data()
        +check_kafka_health()
        +Flask routes (/api/*, /)
    }

    class TemplateLayer {
        <<templates>>
        +templates/dashboard.html
        +JS polling + controls
    }

    class ScriptLayer {
        <<scripts>>
        +start-pipeline.ps1
        +venv activation helpers
    }

    ProducerModule --> ConfigModule : uses
    ConsumerModule --> ConfigModule : uses
    DashboardModule --> ConfigModule : reads defaults
    DashboardModule --> ProducerModule : manages process
    DashboardModule --> ConsumerModule : manages process
    DashboardModule --> TemplateLayer : renders
    ScriptLayer --> ProducerModule : launches manually
    ScriptLayer --> ConsumerModule : launches manually
```

Use this diagram alongside the others for a complete picture of how every module fits into the project.

Render the diagrams with any Mermaid tool or integrate them into existing docs as-needed.
