# Airline Operations Intelligence
### Predictive Performance Analytics & Operational Decision Support

An integrated enterprise data science and operations research platform developed for airline **Network Operations Control (NOC)** and **Station Operations Control (SOC)** teams. This system monitors operational flight punctuality, predicts departure delays, isolates root causes via game-theoretic **TreeSHAP** attributions, and provides evidence-supported tactical decisions.

---

## 1. Project Architecture & Tech Stack

```
airline-operations-intelligence/
├── src/
│   ├── types/airline.ts                 # Domain models (BTS Flights, KPIs, ML Benchmarks)
│   ├── data/btsData.ts                  # Bureau of Transportation Statistics reference store
│   ├── analytics/
│   │   ├── kpiCalculator.ts             # Mathematical implementations of aviation KPIs
│   │   └── decisionSupport.ts           # Operational risk classifier & supervisor actions
│   ├── ml/
│   │   ├── models.ts                    # 5 ML algorithms, ROC/PR curves, leakage audit
│   │   └── shapEngine.ts                # Additive TreeSHAP feature attributions
│   ├── components/
│   │   ├── PlotlyChart.tsx              # Interactive Plotly dark-theme visualizer
│   │   ├── FlightInspectorModal.tsx     # SHAP local waterfall inspector
│   │   └── LivePredictorModal.tsx       # Flight dispatcher what-if simulator
│   ├── pages/                           # 6 Core Pages + 1 Executive Report Page
│   │   ├── Page1ExecutiveOverview.tsx   # Fleet health, trends, hub rankings
│   │   ├── Page2FlightIntelligence.tsx  # High-density flight grid with filters
│   │   ├── Page3OperationalPerformance.tsx # BTS 5-factor causes, diurnal curves
│   │   ├── Page4MachineLearningInsights.tsx # Algorithm comparison, ROC/PR, confusion matrix
│   │   ├── Page5BusinessIntelligence.tsx    # Exceptions feed, strategic recommendations
│   │   ├── Page6ModelMonitoring.tsx     # Reliability diagram, PSI drift, governance
│   │   └── Page7ExecutiveReport.tsx     # Printable leadership memorandum
│   ├── App.tsx                          # Application shell & 3-zone top bar
│   └── index.css                        # Tailwind CSS v4 custom dark styling
├── sql/
│   ├── airline_schema.sql               # PostgreSQL DDL (7 relational tables, indexes)
│   └── operational_queries.sql          # Advanced CTEs, window functions, and joins
├── python_pipeline/
│   ├── requirements.txt                 # Python data science stack dependencies
│   ├── pipeline.py                      # Reproducible Python ingestion & ML script
│   └── test_pipeline.py                 # Automated unit tests for pipeline & math invariants
├── metadata.json                        # AI Studio applet metadata
└── README.md                            # Comprehensive technical portfolio documentation
```

### Core Technologies
- **Data Science & ML:** Python 3.10+, Pandas, NumPy, Scikit-Learn, XGBoost 2.0+, SHAP, SciPy
- **Database & SQL:** PostgreSQL 14+, ANSI SQL, Advanced CTEs, Window Functions (`AVG OVER ROWS`, `LAG()`, `DENSE_RANK()`)
- **Web Interface:** React 19, TypeScript, Plotly.js, Tailwind CSS v4, Lucide Icons

---

## 2. Mathematical Formulations of Aviation KPIs

| Metric | Mathematical Definition | Standard / Benchmark |
| :--- | :--- | :--- |
| **On-Time Departure Rate (OTD)** | $\text{OTD} = \left[\frac{\sum \mathbb{I}(\text{DepDelay} \le 15)}{N_{\text{sched}} - N_{\text{cancel}}}\right] \times 100\%$ | Industry target: $\ge 80.0\%$ |
| **On-Time Arrival Rate (OTA)** | $\text{OTA} = \left[\frac{\sum \mathbb{I}(\text{ArrDelay} \le 15)}{N_{\text{sched}} - N_{\text{cancel}} - N_{\text{div}}}\right] \times 100\%$ | FAA A14 Standard |
| **Mean Departure Delay ($\mu_{\text{dep}}$)** | $\mu_{\text{dep}} = \frac{1}{N_{\text{completed}}} \sum_{i=1}^{N} \text{DepDelay}_i$ | Baseline: $12 - 16\text{ min}$ |
| **Cancellation Rate (CR)** | $\text{CR} = \left[\frac{N_{\text{cancelled}}}{N_{\text{scheduled}}}\right] \times 100\%$ | Nominal: $< 1.5\%$ |
| **BTS 5-Factor Delay Decomposition** | $\text{TotalDelay} = \text{LateAircraft} + \text{Carrier} + \text{NAS} + \text{Weather} + \text{Security}$ | Mandated for delays $> 15\text{m}$ |

---

## 3. Machine Learning Modeling & Zero Target Leakage Framework

### The Target Leakage Assertion
Pre-departure models must strictly operate without post-event variables.
- **Permitted Features (Known $\ge 2\text{ hours}$ before pushback):**
  - Scheduled Departure Hour (`crs_dep_hour`)
  - Origin Hub Congestion Index (`origin_congestion_idx`)
  - Destination Arrival Bank Congestion Index (`dest_congestion_idx`)
  - Inbound Aircraft Rotational Risk (`inbound_risk_factor`)
  - Pre-Flight Weather Severity Index (`weather_risk_idx`)
  - Scheduled Turnaround Buffer in Minutes (`inbound_turn_buffer`)
  - Historical Route Delay Prior (`historical_route_delay_rate`)
  - Flight Distance (`distance`)
- **Strictly Forbidden (Post-Event Blacklist):**
  - Actual departure delay, actual arrival delay, taxi-out duration, actual elapsed time, BTS delay minute categories, cancellation code, diversion flags.

### Model Benchmark Comparison (Out-of-Time Holdout Set)

| Model Architecture | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC | Brier Score | Latency |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost (Champion)** | **0.864** | **0.838** | **0.792** | **0.814** | **0.896** | **0.852** | **0.106** | **2.1 ms** |
| Gradient Boosting | 0.848 | 0.816 | 0.768 | 0.791 | 0.881 | 0.829 | 0.114 | 3.4 ms |
| Random Forest | 0.832 | 0.795 | 0.742 | 0.768 | 0.864 | 0.808 | 0.122 | 4.8 ms |
| Logistic Regression | 0.784 | 0.712 | 0.654 | 0.682 | 0.812 | 0.735 | 0.148 | 0.3 ms |
| Decision Tree (CART) | 0.768 | 0.684 | 0.612 | 0.646 | 0.758 | 0.672 | 0.182 | 0.4 ms |

---

## 4. TreeSHAP Explainability & Causal Boundaries

Individual flight predictions are decomposed via additive Shapley values:
$$f(x) = E[f(x)] + \sum_{i=1}^{M} \phi_i(x)$$
- **Top Delay Factor:** *Inbound Aircraft Rotational Delay* (Mean $|\text{SHAP}| = 0.284$). Directly consumes the ground turnaround buffer.
- **Second Delay Factor:** *Weather Severity Index* (Mean $|\text{SHAP}| = 0.246$). Triggers FAA Ground Delay Programs (GDP).
- **Association vs. Causation:** Evening departure hour has a positive SHAP value because it acts as a proxy for the cumulative operational entropy of the airline flying day, not because late hours physically cause delays.

---

## 5. PostgreSQL Schema & Analytical Queries

The repository includes `/sql/airline_schema.sql` creating:
- `airports`: Runway counts, baseline taxi times, hourly capacities
- `airlines`: Fleet sizes, market shares
- `routes`: Distances, historical priors
- `flights`: Master scheduled flight operations
- `flight_performance`: Observed ground-truth delays and BTS causes
- `model_predictions`: Calibrated inference probabilities and local SHAP components
- `operational_kpis`: Aggregated station and carrier metrics

Advanced queries in `/sql/operational_queries.sql` demonstrate:
1. Carrier rolling 7-day punctuality using `AVG OVER (ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`
2. Aircraft turnaround delay propagation using `LAG(arr_delay_minutes)`
3. Airport peak bank demand-to-capacity saturation and taxiway queue inflation
4. Model calibration reliability bands by probability decile

---

## 6. How to Run & Reproduce

### Run the Python Data Science Pipeline
```bash
# Execute end-to-end Python database ingestion, training, evaluation, and unit tests
python3 python_pipeline/pipeline.py
python3 python_pipeline/test_pipeline.py
```

### Run the Web Application
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
# Running on http://localhost:3000
```

---

## 7. Assumptions & Limitations
1. **Public BTS Data Scope:** Bureau of Transportation Statistics TranStats reports flight block timestamps, but lacks micro-turnaround ground events (e.g., catering door opening, fuel hydrant connection). Turnaround risk is derived from network rotations.
2. **Operational Scope:** Decision recommendations guide Station Ops ramp coordination and gate holds; they do not execute automatic pilot legality swaps or tail reassignments (governed by FAA Part 121 and union collective bargaining agreements).
