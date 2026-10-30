-- ============================================================================
-- AIRLINE OPERATIONS INTELLIGENCE: Advanced SQL Analytical Queries
-- Demonstrating CTEs, Window Functions, Ranking, and Analytical Joins
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: Carrier Rolling 7-Day Performance & Punctuality Trends
-- Uses CTEs and Window Functions (AVG OVER ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)
-- ----------------------------------------------------------------------------
WITH DailyCarrierStats AS (
    SELECT 
        f.flight_date,
        f.carrier_code,
        a.carrier_name,
        COUNT(f.flight_id) AS scheduled_flights,
        SUM(CASE WHEN p.is_cancelled = 1 THEN 1 ELSE 0 END) AS cancelled_flights,
        SUM(CASE WHEN p.is_cancelled = 0 AND p.dep_delay_15 = 0 THEN 1 ELSE 0 END) AS on_time_departures,
        AVG(CASE WHEN p.is_cancelled = 0 THEN p.dep_delay_minutes ELSE NULL END) AS daily_avg_dep_delay,
        AVG(CASE WHEN p.is_cancelled = 0 THEN p.arr_delay_minutes ELSE NULL END) AS daily_avg_arr_delay
    FROM flights f
    JOIN airlines a ON f.carrier_code = a.carrier_code
    JOIN flight_performance p ON f.flight_id = p.flight_id
    GROUP BY f.flight_date, f.carrier_code, a.carrier_name
),
CarrierPunctualityMetrics AS (
    SELECT 
        flight_date,
        carrier_code,
        carrier_name,
        scheduled_flights,
        ROUND((on_time_departures::NUMERIC / NULLIF(scheduled_flights - cancelled_flights, 0)) * 100, 2) AS daily_otd_pct,
        ROUND(daily_avg_dep_delay::NUMERIC, 2) AS daily_avg_dep_delay,
        -- 7-Day Rolling Window Functions
        ROUND(AVG((on_time_departures::NUMERIC / NULLIF(scheduled_flights - cancelled_flights, 0)) * 100) 
            OVER (PARTITION BY carrier_code ORDER BY flight_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS rolling_7d_otd_pct,
        ROUND(AVG(daily_avg_dep_delay) 
            OVER (PARTITION BY carrier_code ORDER BY flight_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW), 2) AS rolling_7d_avg_dep_delay,
        -- Window Rank across carriers on each operational date
        DENSE_RANK() OVER (
            PARTITION BY flight_date 
            ORDER BY (on_time_departures::NUMERIC / NULLIF(scheduled_flights - cancelled_flights, 0)) DESC NULLS LAST
        ) AS daily_carrier_punctuality_rank
    FROM DailyCarrierStats
)
SELECT * 
FROM CarrierPunctualityMetrics
ORDER BY flight_date DESC, daily_carrier_punctuality_rank ASC;

-- ----------------------------------------------------------------------------
-- QUERY 2: Aircraft Turnaround Buffer vs Delay Propagation Analysis
-- Uses LAG() window function to model downstream cascade effects
-- ----------------------------------------------------------------------------
WITH RotationalLegSequence AS (
    SELECT 
        f.flight_id,
        f.flight_number,
        f.carrier_code,
        f.origin_code,
        f.dest_code,
        f.flight_date,
        f.crs_dep_time,
        f.scheduled_turnaround_buffer,
        p.dep_delay_minutes,
        p.arr_delay_minutes,
        p.late_aircraft_delay,
        -- Lag previous leg arrival delay for the aircraft
        LAG(p.arr_delay_minutes, 1) OVER (
            PARTITION BY f.carrier_code, f.flight_date 
            ORDER BY f.crs_dep_time
        ) AS prev_leg_arr_delay,
        LAG(f.dest_code, 1) OVER (
            PARTITION BY f.carrier_code, f.flight_date 
            ORDER BY f.crs_dep_time
        ) AS prev_leg_dest_airport
    FROM flights f
    JOIN flight_performance p ON f.flight_id = p.flight_id
    WHERE p.is_cancelled = 0
),
CascadeQuantification AS (
    SELECT 
        flight_id,
        flight_number,
        carrier_code,
        origin_code,
        dest_code,
        scheduled_turnaround_buffer,
        dep_delay_minutes,
        prev_leg_arr_delay,
        -- Net absorption: did scheduled turnaround buffer absorb the upstream delay?
        CASE 
            WHEN prev_leg_arr_delay > 0 THEN 
                GREATEST(0, prev_leg_arr_delay - scheduled_turnaround_buffer)
            ELSE 0 
        END AS theoretical_unabsorbed_delay,
        late_aircraft_delay AS actual_bts_late_aircraft_delay
    FROM RotationalLegSequence
    WHERE prev_leg_dest_airport = origin_code -- aircraft continuity check
)
SELECT 
    carrier_code,
    COUNT(*) AS connected_turns_evaluated,
    ROUND(AVG(scheduled_turnaround_buffer), 1) AS avg_turnaround_buffer_min,
    ROUND(AVG(prev_leg_arr_delay), 1) AS avg_inbound_delay_min,
    ROUND(AVG(theoretical_unabsorbed_delay), 1) AS avg_cascade_delay_min,
    ROUND(AVG(actual_bts_late_aircraft_delay), 1) AS avg_reported_late_acft_delay
FROM CascadeQuantification
GROUP BY carrier_code
ORDER BY avg_cascade_delay_min DESC;

-- ----------------------------------------------------------------------------
-- QUERY 3: Airport Peak Bank Congestion vs Ground Delays
-- Investigates departure bank queuing and taxi-out duration inflation
-- ----------------------------------------------------------------------------
WITH HourlyAirportBankStats AS (
    SELECT 
        f.origin_code,
        f.crs_dep_hour,
        COUNT(f.flight_id) AS scheduled_departures,
        AVG(ap.hourly_capacity) AS nominal_hourly_capacity,
        AVG(p.taxi_out_minutes) AS avg_observed_taxi_out,
        AVG(ap.avg_taxi_out_minutes) AS baseline_uncongested_taxi_out,
        AVG(p.dep_delay_minutes) AS avg_dep_delay,
        SUM(CASE WHEN p.dep_delay_15 = 1 THEN 1 ELSE 0 END) AS delayed_flight_count,
        SUM(p.nas_delay) AS total_nas_delay_minutes
    FROM flights f
    JOIN airports ap ON f.origin_code = ap.airport_code
    JOIN flight_performance p ON f.flight_id = p.flight_id
    WHERE p.is_cancelled = 0
    GROUP BY f.origin_code, f.crs_dep_hour
)
SELECT 
    origin_code,
    crs_dep_hour,
    scheduled_departures,
    ROUND(nominal_hourly_capacity, 0) AS nominal_capacity,
    ROUND((scheduled_departures::NUMERIC / NULLIF(nominal_hourly_capacity, 0)) * 100, 1) AS bank_demand_capacity_ratio_pct,
    ROUND(avg_observed_taxi_out, 1) AS avg_taxi_out_min,
    ROUND(avg_observed_taxi_out - baseline_uncongested_taxi_out, 1) AS taxi_time_queue_inflation_min,
    ROUND(avg_dep_delay, 1) AS avg_dep_delay_min,
    ROUND((delayed_flight_count::NUMERIC / NULLIF(scheduled_departures, 0)) * 100, 1) AS delay_rate_pct,
    total_nas_delay_minutes
FROM HourlyAirportBankStats
WHERE scheduled_departures >= 5
ORDER BY bank_demand_capacity_ratio_pct DESC, avg_dep_delay_min DESC;

-- ----------------------------------------------------------------------------
-- QUERY 4: ML Prediction Calibration & High-Risk Exception Auditing
-- Compares model probability brackets against observed delay rates
-- ----------------------------------------------------------------------------
WITH PredictionCalibrationBands AS (
    SELECT 
        f.flight_id,
        f.flight_number,
        f.carrier_code,
        f.origin_code,
        f.dest_code,
        mp.risk_level,
        mp.predicted_delay_probability,
        -- Group into 10% probability deciles
        FLOOR(mp.predicted_delay_probability * 10) / 10.0 AS prob_decile,
        p.dep_delay_15 AS actual_dep_delay_15,
        p.dep_delay_minutes AS actual_dep_delay_min
    FROM flights f
    JOIN model_predictions mp ON f.flight_id = mp.flight_id
    JOIN flight_performance p ON f.flight_id = p.flight_id
    WHERE p.is_cancelled = 0
)
SELECT 
    prob_decile AS predicted_risk_bracket_min,
    prob_decile + 0.10 AS predicted_risk_bracket_max,
    COUNT(*) AS flights_in_bucket,
    ROUND(AVG(predicted_delay_probability) * 100, 1) AS mean_predicted_prob_pct,
    ROUND(AVG(actual_dep_delay_15) * 100, 1) AS observed_empirical_delay_rate_pct,
    ROUND(AVG(actual_dep_delay_min), 1) AS avg_observed_delay_minutes,
    -- Reliability Error (Calibration Gap)
    ROUND(ABS(AVG(predicted_delay_probability) - AVG(actual_dep_delay_15)) * 100, 2) AS calibration_gap_pct
FROM PredictionCalibrationBands
GROUP BY prob_decile
ORDER BY prob_decile ASC;
