-- ============================================================================
-- AIRLINE OPERATIONS INTELLIGENCE: Relational Database Schema
-- Standard: PostgreSQL 14+ / ANSI SQL
-- Tables: airports, airlines, routes, flights, flight_performance, model_predictions, operational_kpis
-- ============================================================================

-- 1. Airports Reference Table
CREATE TABLE IF NOT EXISTS airports (
    airport_code VARCHAR(3) PRIMARY KEY,
    airport_name VARCHAR(120) NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(2) NOT NULL,
    latitude NUMERIC(8, 4) NOT NULL,
    longitude NUMERIC(8, 4) NOT NULL,
    hub_type VARCHAR(20) CHECK (hub_type IN ('Large Hub', 'Medium Hub', 'Small Hub', 'Non-Hub')),
    runway_count INT NOT NULL DEFAULT 1,
    avg_taxi_out_minutes NUMERIC(4, 1) DEFAULT 18.0,
    hourly_capacity INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Airlines Reference Table
CREATE TABLE IF NOT EXISTS airlines (
    carrier_code VARCHAR(3) PRIMARY KEY,
    carrier_name VARCHAR(100) NOT NULL,
    fleet_size INT NOT NULL,
    headquarters VARCHAR(100) NOT NULL,
    market_share_pct NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. City-Pair Routes Table
CREATE TABLE IF NOT EXISTS routes (
    route_id SERIAL PRIMARY KEY,
    origin_airport VARCHAR(3) NOT NULL REFERENCES airports(airport_code) ON DELETE RESTRICT,
    dest_airport VARCHAR(3) NOT NULL REFERENCES airports(airport_code) ON DELETE RESTRICT,
    distance_miles INT NOT NULL,
    scheduled_elapsed_time_min INT NOT NULL,
    avg_historical_delay_rate NUMERIC(5, 4) DEFAULT 0.2000,
    active_carrier_count INT DEFAULT 1,
    CONSTRAINT uq_route_pair UNIQUE (origin_airport, dest_airport)
);

-- 4. Scheduled Flights Master Table
CREATE TABLE IF NOT EXISTS flights (
    flight_id VARCHAR(32) PRIMARY KEY,
    flight_number VARCHAR(12) NOT NULL,
    carrier_code VARCHAR(3) NOT NULL REFERENCES airlines(carrier_code),
    origin_code VARCHAR(3) NOT NULL REFERENCES airports(airport_code),
    dest_code VARCHAR(3) NOT NULL REFERENCES airports(airport_code),
    flight_date DATE NOT NULL,
    crs_dep_time TIME NOT NULL,
    crs_arr_time TIME NOT NULL,
    crs_dep_hour INT NOT NULL CHECK (crs_dep_hour BETWEEN 0 AND 23),
    crs_arr_hour INT NOT NULL CHECK (crs_arr_hour BETWEEN 0 AND 23),
    crs_elapsed_time INT NOT NULL,
    distance_miles INT NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    is_origin_peak_bank BOOLEAN DEFAULT FALSE,
    scheduled_turnaround_buffer INT DEFAULT 45,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Observed Flight Performance & DOT/BTS Delay Attribution
CREATE TABLE IF NOT EXISTS flight_performance (
    performance_id SERIAL PRIMARY KEY,
    flight_id VARCHAR(32) UNIQUE NOT NULL REFERENCES flights(flight_id) ON DELETE CASCADE,
    actual_dep_time TIME,
    actual_arr_time TIME,
    dep_delay_minutes INT NOT NULL DEFAULT 0,
    arr_delay_minutes INT NOT NULL DEFAULT 0,
    dep_delay_15 SMALLINT NOT NULL CHECK (dep_delay_15 IN (0, 1)),
    arr_delay_15 SMALLINT NOT NULL CHECK (arr_delay_15 IN (0, 1)),
    is_cancelled SMALLINT NOT NULL DEFAULT 0 CHECK (is_cancelled IN (0, 1)),
    cancellation_code CHAR(1) CHECK (cancellation_code IN ('A', 'B', 'C', 'D')),
    is_diverted SMALLINT NOT NULL DEFAULT 0 CHECK (is_diverted IN (0, 1)),
    taxi_out_minutes INT DEFAULT 18,
    taxi_in_minutes INT DEFAULT 8,
    carrier_delay INT DEFAULT 0,
    weather_delay INT DEFAULT 0,
    nas_delay INT DEFAULT 0,
    security_delay INT DEFAULT 0,
    late_aircraft_delay INT DEFAULT 0,
    observed_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Machine Learning Model Predictions & SHAP Explainability
CREATE TABLE IF NOT EXISTS model_predictions (
    prediction_id SERIAL PRIMARY KEY,
    flight_id VARCHAR(32) NOT NULL REFERENCES flights(flight_id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL DEFAULT 'xgboost_v1.4_calibrated',
    predicted_delay_probability NUMERIC(5, 4) NOT NULL CHECK (predicted_delay_probability BETWEEN 0.0000 AND 1.0000),
    predicted_class SMALLINT NOT NULL CHECK (predicted_class IN (0, 1)),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Low Risk', 'Medium Risk', 'High Risk')),
    shap_turnaround_factor NUMERIC(6, 4),
    shap_weather_factor NUMERIC(6, 4),
    shap_congestion_factor NUMERIC(6, 4),
    shap_dep_hour_factor NUMERIC(6, 4),
    shap_carrier_prior_factor NUMERIC(6, 4),
    inference_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_flight_model UNIQUE (flight_id, model_version)
);

-- 7. Operational Aggregated KPIs Table
CREATE TABLE IF NOT EXISTS operational_kpis (
    kpi_id SERIAL PRIMARY KEY,
    reporting_date DATE NOT NULL,
    carrier_code VARCHAR(3) REFERENCES airlines(carrier_code),
    airport_code VARCHAR(3) REFERENCES airports(airport_code),
    total_scheduled_flights INT NOT NULL,
    total_completed_flights INT NOT NULL,
    on_time_departure_rate NUMERIC(5, 2) NOT NULL,
    on_time_arrival_rate NUMERIC(5, 2) NOT NULL,
    avg_departure_delay_min NUMERIC(5, 2) NOT NULL,
    avg_arrival_delay_min NUMERIC(5, 2) NOT NULL,
    cancellation_rate NUMERIC(5, 2) NOT NULL,
    diversion_rate NUMERIC(5, 2) NOT NULL,
    high_risk_flagged_count INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Optimized Performance Indexes
CREATE INDEX IF NOT EXISTS idx_flights_date_carrier ON flights (flight_date, carrier_code);
CREATE INDEX IF NOT EXISTS idx_flights_origin_dep_hour ON flights (origin_code, crs_dep_hour);
CREATE INDEX IF NOT EXISTS idx_performance_dep_delay ON flight_performance (dep_delay_15, dep_delay_minutes);
CREATE INDEX IF NOT EXISTS idx_predictions_risk ON model_predictions (risk_level, predicted_delay_probability DESC);
