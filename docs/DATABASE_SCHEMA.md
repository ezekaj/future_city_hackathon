# PeakFlow Database Schema

**Version:** 1.0
**Last Updated:** 2025-11-22
**Based on:** German BDEW water consumption statistics + HNVG Melmark real meter data

## Overview

This schema supports household-level water demand response with activity-specific pricing and personalized savings calculations.

## Tables

### 1. Households

Stores individual household profiles from digital water meters.

```sql
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "8APA0180428234"
    address VARCHAR(255),
    num_people INT,
    annual_consumption_m3 DECIMAL(10, 2),
    estimated_household_size DECIMAL(3, 1),  -- Based on 125 L/person/day German average
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_households_meter_id ON households(meter_id);
```

**Example Data:**
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "meter_id": "8APA0180428234",
    "address": "Melmark District, Heilbronn",
    "num_people": 2,
    "annual_consumption_m3": 65.0,
    "estimated_household_size": 1.4
}
```

---

### 2. Water Activities

Catalog of water use activities based on German BDEW statistics.

```sql
CREATE TABLE water_activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "laundry", "dishwasher", "garden"
    display_name VARCHAR(100) NOT NULL,
    typical_volume_L INT NOT NULL,
    flexibility_score DECIMAL(3, 2) NOT NULL CHECK (flexibility_score BETWEEN 0 AND 1),
    -- 0.0 = completely inflexible (toilet, drinking)
    -- 1.0 = completely flexible (garden, laundry)
    category VARCHAR(50) NOT NULL,  -- 'flexible', 'semi_flexible', 'inflexible'
    typical_hours JSONB,  -- Array of hours when activity typically occurs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_activities_flexibility ON water_activities(flexibility_score DESC);
CREATE INDEX idx_activities_category ON water_activities(category);
```

**Default Data (BDEW Statistics):**
```sql
INSERT INTO water_activities (name, display_name, typical_volume_L, flexibility_score, category, typical_hours) VALUES
('shower', 'Shower/Bath', 70, 0.1, 'inflexible', '[7, 8, 19, 20]'),
('toilet', 'Toilet Flushing', 6, 0.0, 'inflexible', '[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]'),
('laundry', 'Washing Machine', 50, 1.0, 'flexible', '[10, 11, 18, 19]'),
('dishwasher', 'Dishwasher', 10, 0.9, 'flexible', '[20, 21, 22]'),
('garden', 'Garden Watering', 500, 1.0, 'flexible', '[18, 19, 20]'),
('cooking', 'Cooking & Drinking', 5, 0.2, 'semi_flexible', '[7, 12, 18, 19]');
```

**BDEW Breakdown:**
- Body care (shower/bath): 36% → 16 m³/person/year
- Toilet: 27% → 12 m³/person/year
- Laundry: 12% → 5.5 m³/person/year
- Dishwashing: 6% → 2.7 m³/person/year
- Garden/Cleaning: 6% → 2.7 m³/person/year
- Cooking/Drinking: 4% → 1.8 m³/person/year

---

### 3. Household Activities

Links households to their specific water activities and typical usage patterns.

```sql
CREATE TABLE household_activities (
    id SERIAL PRIMARY KEY,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    activity_id INT REFERENCES water_activities(id),
    frequency_per_day DECIMAL(4, 2),  -- Average occurrences per day
    preferred_hour INT CHECK (preferred_hour BETWEEN 0 AND 23),
    volume_override_L INT,  -- Custom volume if different from default
    auto_schedule BOOLEAN DEFAULT FALSE,  -- Enable smart scheduling
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(household_id, activity_id)
);

-- Indexes
CREATE INDEX idx_household_activities_household ON household_activities(household_id);
CREATE INDEX idx_household_activities_auto_schedule ON household_activities(auto_schedule);
```

**Example Data:**
```json
{
    "household_id": "550e8400-e29b-41d4-a716-446655440000",
    "activity_id": 3,
    "frequency_per_day": 0.5,
    "preferred_hour": 19,
    "auto_schedule": true
}
```

---

### 4. Meter Readings

Stores hourly water consumption data from digital meters.

```sql
CREATE TABLE meter_readings (
    id BIGSERIAL PRIMARY KEY,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    cumulative_m3 DECIMAL(12, 3),  -- Cumulative meter reading
    hourly_delta_m3 DECIMAL(8, 3),  -- Consumption during this hour
    data_source VARCHAR(50),  -- 'meter', 'estimated', 'manual'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(household_id, timestamp)
);

-- Indexes
CREATE INDEX idx_meter_readings_household_time ON meter_readings(household_id, timestamp DESC);
CREATE INDEX idx_meter_readings_timestamp ON meter_readings(timestamp);

-- Partitioning by month for performance
CREATE TABLE meter_readings_2025_11 PARTITION OF meter_readings
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

**Example Data:**
```json
{
    "household_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-11-22 19:00:00",
    "cumulative_m3": 234.567,
    "hourly_delta_m3": 0.042,
    "data_source": "meter"
}
```

---

### 5. Pricing Tiers

Dynamic water pricing based on network stress levels.

```sql
CREATE TABLE pricing_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL,  -- 'peak', 'normal', 'off_peak'
    hour_start INT CHECK (hour_start BETWEEN 0 AND 23),
    hour_end INT CHECK (hour_end BETWEEN 0 AND 23),
    price_per_m3 DECIMAL(6, 3) NOT NULL,
    color_code VARCHAR(20),  -- 'red', 'yellow', 'green'
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pricing_effective ON pricing_tiers(effective_from, effective_to);
```

**Current Pricing (Melmark District):**
```sql
INSERT INTO pricing_tiers (tier_name, hour_start, hour_end, price_per_m3, color_code, effective_from) VALUES
('off_peak', 0, 6, 2.20, 'green', '2025-01-01'),
('normal', 6, 18, 2.50, 'yellow', '2025-01-01'),
('peak', 18, 22, 2.80, 'red', '2025-01-01'),
('normal', 22, 24, 2.50, 'yellow', '2025-01-01');
```

**Price Calculation:**
- Base rate: €2.50/m³ (Heilbronn typical)
- Peak surcharge: +€0.30/m³ (12% increase)
- Off-peak discount: -€0.30/m³ (12% decrease)

---

### 6. Savings Transactions

Tracks actual savings achieved by household.

```sql
CREATE TABLE savings_transactions (
    id BIGSERIAL PRIMARY KEY,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    activity_id INT REFERENCES water_activities(id),
    original_hour INT,
    shifted_hour INT,
    volume_m3 DECIMAL(8, 3),
    original_price_eur DECIMAL(8, 3),
    shifted_price_eur DECIMAL(8, 3),
    savings_eur DECIMAL(8, 3) GENERATED ALWAYS AS (original_price_eur - shifted_price_eur) STORED,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_savings_household_date ON savings_transactions(household_id, transaction_date DESC);
CREATE INDEX idx_savings_activity ON savings_transactions(activity_id);
```

**Example Data:**
```json
{
    "household_id": "550e8400-e29b-41d4-a716-446655440000",
    "activity_id": 3,
    "original_hour": 19,
    "shifted_hour": 23,
    "volume_m3": 0.050,
    "original_price_eur": 0.140,
    "shifted_price_eur": 0.125,
    "savings_eur": 0.015
}
```

---

## Queries

### Calculate Household Savings Potential

```sql
SELECT
    h.meter_id,
    h.annual_consumption_m3,
    (h.annual_consumption_m3 * 0.24) as flexible_consumption_m3,  -- 24% flexible
    (h.annual_consumption_m3 * 0.24 * 0.60) as max_annual_savings_eur,  -- €0.60 price diff
    (h.annual_consumption_m3 * 0.24 * 0.60 * 0.7) as realistic_annual_savings_eur  -- 70% adoption
FROM households h
WHERE meter_id = '8APA0180428234';
```

**Result:**
```
meter_id         | 8APA0180428234
annual_m3        | 65.0
flexible_m3      | 15.6
max_savings_eur  | 9.36
realistic_savings| 6.55
```

### Get Activity-Specific Savings

```sql
SELECT
    wa.display_name,
    wa.typical_volume_L,
    (wa.typical_volume_L / 1000.0 * 2.80) as peak_price_eur,
    (wa.typical_volume_L / 1000.0 * 2.20) as offpeak_price_eur,
    (wa.typical_volume_L / 1000.0 * 0.60) as savings_per_event_eur
FROM water_activities wa
WHERE wa.flexibility_score >= 0.5
ORDER BY savings_per_event_eur DESC;
```

**Result:**
```
Garden Watering  | 500L | €1.40 | €1.10 | €0.30
Washing Machine  |  50L | €0.14 | €0.11 | €0.03
Dishwasher       |  10L | €0.03 | €0.02 | €0.01
```

---

## Implementation Notes

### Current Status (Hackathon)
- Using **JSON/TypeScript** objects instead of PostgreSQL
- Schema designed for **easy migration** to production database
- All calculations validated against **real HNVG Melmark meter data**

### Future Enhancements
1. **Real-time pricing API**: Dynamic pricing based on network stress
2. **Smart scheduling**: Automated appliance control via IoT integration
3. **Neighborhood comparison**: Gamification and leaderboards
4. **Predictive analytics**: ML models for consumption forecasting

---

## References

- **BDEW**: Bundesverband der Energie- und Wasserwirtschaft (German water statistics)
- **HNVG**: Heilbronn municipal utility real meter data
- **German average**: 125 L/person/day
- **Melmark District**: 4,000 households, pilot program with 5 digital meters

---

**Schema Version History:**
- v1.0 (2025-11-22): Initial schema based on BDEW data and Melmark pilot
