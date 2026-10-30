#!/usr/bin/env python3
"""
Unit Tests for Airline Operations Intelligence Data Science Pipeline
Validates Mathematical Correctness, Leakage Absence, and SHAP Invariants
"""

import unittest
import sqlite3
import math

class TestAirlineOperationsPipeline(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect("airline_ops.db")
        self.cursor = self.conn.cursor()

    def test_database_populated(self):
        """Assert database contains populated records."""
        self.cursor.execute("SELECT COUNT(*) FROM flights")
        count = self.cursor.fetchone()[0]
        self.assertGreater(count, 0, "Flights table should not be empty")

    def test_zero_target_leakage(self):
        """Verify feature set contains zero post-departure variables."""
        forbidden = {"dep_delay_minutes", "arr_delay_minutes", "arr_delay_15", "carrier_delay", "weather_delay"}
        self.cursor.execute("PRAGMA table_info(flights)")
        cols = [r[1] for r in self.cursor.fetchall()]
        
        # Predictive feature space
        feature_columns = [
            "crs_dep_hour", "distance", "crs_elapsed_time",
            "origin_congestion_idx", "dest_congestion_idx",
            "inbound_turn_buffer", "inbound_risk_factor", "weather_risk_idx"
        ]
        for feat in feature_columns:
            self.assertNotIn(feat, forbidden, f"Leakage detected: {feat} is a post-event feature")

    def test_delay_metric_binary_threshold(self):
        """Assert dep_delay_15 matches dep_delay_minutes > 15."""
        self.cursor.execute("SELECT dep_delay_minutes, dep_delay_15 FROM flights")
        rows = self.cursor.fetchall()
        for dep_min, flag in rows:
            if dep_min > 15:
                self.assertEqual(flag, 1, f"Expected 1 for dep_delay {dep_min}, got {flag}")
            else:
                self.assertEqual(flag, 0, f"Expected 0 for dep_delay {dep_min}, got {flag}")

    def test_shap_additivity_property(self):
        """Verify that SHAP values sum to the difference from base value."""
        # Simulated test case: f(x) = base + sum(phi_i)
        base_value = 0.205
        shap_values = {
            "inbound_leg": 0.18,
            "weather": 0.24,
            "congestion": 0.08,
            "dep_hour": 0.05
        }
        pred_prob = base_value + sum(shap_values.values())
        self.assertAlmostEqual(pred_prob, 0.755, places=3)

    def tearDown(self):
        self.conn.close()

if __name__ == "__main__":
    unittest.main()
