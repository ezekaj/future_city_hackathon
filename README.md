# PeakFlow: Water Demand Response for Melmark District

**Hackathon**: Hack the Flow - HNVG Heilbronn  
**Innovation**: Dynamic water pricing for peak demand management

## Overview

PeakFlow uses real HNVG Melmark district data with dynamic pricing to reduce peak demand through customer behavior change.

## Real Data Integration

- **Total Delivery**: 6,359 m3/day from ZW40 meter (3-min intervals)
- **Peak Demand**: 792 m3/h at 21:00-23:00 (real data, not synthetic)
- **Smart Meters**: 5 consumer meters analyzed
- **Date Range**: June 2, 2021
- **Leak Detection**: 96.2% apparent loss (incomplete meter coverage)

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python3 main.py
# API: http://localhost:8000
```

### Frontend
```bash
npm install
npm run dev
# App: http://localhost:5173
```

## Key Features

**1. Utility Operator Dashboard**
- Real-time grid stress monitoring
- 4 scenarios: Normal, Hot Day, Football Match, Combined
- Demand response simulation
- Leak detection KPI

**2. Customer Mobile App** (619 lines)
- Dynamic pricing display
- Bill savings calculator
- 24-hour forecast timeline
- Actionable tips with financial incentives

**3. Dynamic Water Pricing**
- Peak hours (18:00-22:00): 2.80 EUR/m3
- Normal hours: 2.50 EUR/m3
- Off-peak (00:00-06:00): 2.20 EUR/m3

Average savings: 9 EUR/month per household

## Architecture

```
Operators + Residents
        |
   React Frontend
        |
   FastAPI Backend
        |
  Real Melmark Data
```

## Tech Stack

- Frontend: React 19 + TypeScript + Vite + Recharts
- Backend: FastAPI + Python + pandas
- Data: Real Melmark meters (Excel files)

## Sub-Challenge Coverage

- Sub-Challenge 2 (Data Services): 90% complete
  * Real-time consumption viz
  * Dynamic pricing (not points)
  * Leak detection
  * Behavioral nudges

- Sub-Challenge 1 (.dta Decoding): Acknowledged as future work
  * Strategic tradeoff for working prototype
  * Used Excel exports with same real data

## Results (25% participation)

- Peak demand: 792 to 790 m3/h
- Critical hours: 8 to 6 (25% reduction)
- Tank safety margin: +58% improvement

## Known Limitations

1. Only 1 day of data (June 2, 2021)
2. 5 meters vs 4000 households
3. Binary .dta files not decoded
4. Synthetic scenario modifiers

## Innovation Highlights

1. Real infrastructure data (792 m3/h peak)
2. Economics-based incentives (EUR/m3)
3. Dual-persona UX (utility + customer)
4. Production-quality mobile app
5. Resilient architecture (API + fallback)

## Team

[Your information]

## License

MIT
