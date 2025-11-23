from flask import Flask, jsonify, json, request
import os

app = Flask(__name__)

# Configuration
DATA_FILE = 'data.json'

def load_data():
    """Helper to load the JSON file safely."""
    if not os.path.exists(DATA_FILE):
        return None
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

# --- ROUTES ---

@app.route('/', methods=['GET'])
def home():
    """Welcome route listing available endpoints."""
    return jsonify({
        "message": "Water Forecast API is running.",
        "endpoints": [
            "/api/forecast (Get full data)",
            "/api/meta (Get location/limit info)",
            "/api/day/<name_or_date> (Get specific day, e.g., 'Monday' or '2025-11-24')",
            "/api/alerts (Get all Critical/Warning hours)"
        ]
    })

@app.route('/api/forecast', methods=['GET'])
def get_full_forecast():
    """Returns the entire JSON file."""
    data = load_data()
    if not data:
        return jsonify({"error": "forecast.json not found"}), 404
    return jsonify(data)

@app.route('/api/meta', methods=['GET'])
def get_meta():
    """Returns only the metadata (location, limits)."""
    data = load_data()
    if not data:
        return jsonify({"error": "forecast.json not found"}), 404
    return jsonify(data.get('meta', {}))

@app.route('/api/day/<identifier>', methods=['GET'])
def get_day_data(identifier):
    """
    Find a specific day by name (e.g., 'Tuesday') 
    OR by date (e.g., '2025-11-25').
    """
    data = load_data()
    if not data:
        return jsonify({"error": "forecast.json not found"}), 404

    search_term = identifier.lower()
    
    # Search through the weeklyData list
    found_day = next(
        (day for day in data.get('weeklyData', []) 
         if day['day'].lower() == search_term or day['date'] == search_term), 
        None
    )

    if found_day:
        return jsonify(found_day)
    else:
        return jsonify({"error": f"Day '{identifier}' not found"}), 404

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """
    Scans all days and returns only hours with 
    WARNING, CRITICAL, or PENALTY status.
    """
    data = load_data()
    if not data:
        return jsonify({"error": "forecast.json not found"}), 404
    
    alerts = []
    
    for day_entry in data.get('weeklyData', []):
        for hour in day_entry.get('data', []):
            if hour['status'] not in ["OK"]:
                alerts.append({
                    "day": day_entry['day'],
                    "date": day_entry['date'],
                    "time": hour['time'],
                    "flowRate": hour['flowRate'],
                    "status": hour['status']
                })
                
    return jsonify({"count": len(alerts), "alerts": alerts})

if __name__ == '__main__':
    # running on port 5000 by default
    app.run(host='0.0.0.0', port=5000, debug=True)
