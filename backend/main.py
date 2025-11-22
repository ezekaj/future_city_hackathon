
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from simulation import run_simulation
from data_ingestion import get_real_baseline_profile
from household_data import get_household_profile_with_savings

app = FastAPI(title="PeakFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationRequest(BaseModel):
    scenario: str = "normal_day"
    participation_rate: float = 0.25
    shift_fraction: float = 0.3

@app.get("/")
def root():
    return {"message": "PeakFlow Water Demand Response API", "version": "1.0.0"}

@app.get("/api/baseline")
def get_baseline():
    try:
        data = get_real_baseline_profile()
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/simulation")
def simulate(request: SimulationRequest):
    try:
        result = run_simulation(
            scenario=request.scenario,
            participation_rate=request.participation_rate,
            shift_fraction=request.shift_fraction
        )
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/scenarios")
def get_scenarios():
    return {
        "success": True,
        "data": {
            "scenarios": [
                {
                    "id": "normal_day",
                    "name": "Normal Day",
                    "description": "Typical consumption pattern from real Melmark data"
                },
                {
                    "id": "hot_day",
                    "name": "Hot Summer Day",
                    "description": "1.6x usage during evening hours (18:00-22:00)"
                },
                {
                    "id": "football_day",
                    "name": "Football Match Day",
                    "description": "2.2x spike at 20:00 (halftime)"
                },
                {
                    "id": "combined",
                    "name": "Combined Stress",
                    "description": "Hot day + football match combined"
                }
            ]
        }
    }


@app.get("/api/household/profile")
def get_household_profile():
    try:
        data = get_household_profile_with_savings()
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    print("Starting PeakFlow API server on http://localhost:8001")
    print("Docs available at http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
