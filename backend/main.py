from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
from pathlib import Path

app = FastAPI(title="BWV Connection Monitor API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to load BWV data
def load_bwv_data():
    """Load BWV connectivity data from JSON file"""
    bwv_file = Path(__file__).parent / "bwv_data.json"
    with open(bwv_file, "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/")
def root():
    return {
        "message": "BWV Water Supply Connection Monitor API",
        "version": "2.0.0",
        "description": "Monitoring Bodensee-Wasserversorgung (BWV) water supply connection"
    }

@app.get("/api/bwv/meta")
def get_bwv_meta():
    """Get BWV (Bodensee-Wasserversorgung) connection metadata"""
    try:
        bwv_data = load_bwv_data()
        return {
            "success": True,
            "data": bwv_data["meta"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/bwv/forecast")
def get_bwv_forecast():
    """Get BWV weekly hourly connection forecast"""
    try:
        bwv_data = load_bwv_data()
        return {
            "success": True,
            "data": {
                "meta": bwv_data["meta"],
                "weeklyData": bwv_data["weeklyData"]
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/bwv/alerts")
def get_bwv_alerts():
    """Get BWV quota alert hours (WARNING/CRITICAL status)"""
    try:
        bwv_data = load_bwv_data()
        alerts = []

        # Extract hours with WARNING or CRITICAL status
        for day_data in bwv_data["weeklyData"]:
            for hour_data in day_data["data"]:
                if hour_data["status"] in ["WARNING", "CRITICAL"]:
                    alerts.append({
                        "day": day_data["day"],
                        "date": day_data["date"],
                        "time": hour_data["time"],
                        "flow_rate": hour_data["flowRate"],
                        "limit": hour_data["limit"],
                        "status": hour_data["status"]
                    })

        return {
            "success": True,
            "data": {
                "quota_limit": bwv_data["meta"]["quota_limit_l_s"],
                "warning_threshold": bwv_data["meta"]["warning_threshold_l_s"],
                "alert_count": len(alerts),
                "alerts": alerts
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    print("Starting BWV Connection Monitor API on http://localhost:8001")
    print("Docs available at http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
