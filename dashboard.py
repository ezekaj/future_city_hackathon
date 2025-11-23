import streamlit as st
import pandas as pd
import requests
import time

# --- CONFIGURATION ---
# The public IP of your DigitalOcean Droplet running the Flask app
FLASK_API_URL = "http://64.226.120.234:5000/api/forecast"

# PASTE YOUR N8N WEBHOOK URL HERE
# (e.g. "https://n8n.your-domain.com/webhook/test")
N8N_WEBHOOK_URL = "https://n8n.ligaime.com/webhook-test/ca98f397-cf85-4021-a6bf-4a9253b9f848" 

# --- PAGE SETUP ---
st.set_page_config(
    page_title="Water Monitor Dashboard",
    page_icon="💧",
    layout="wide"
)

# --- FUNCTIONS ---
@st.cache_data(ttl=60)
def fetch_forecast_data():
    """Fetches data from the Flask API on the Droplet."""
    try:
        response = requests.get(FLASK_API_URL, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return None

def trigger_n8n_workflow(payload):
    """Sends the current alert data to n8n."""
    try:
        response = requests.post(N8N_WEBHOOK_URL, json=payload, timeout=5)
        return response.status_code, response.text
    except Exception as e:
        return 500, str(e)

# --- MAIN UI ---
st.title("💧 Water Flow Forecast & Control")
st.markdown(f"Connected to: `{FLASK_API_URL}`")

# 1. Load Data
data_json = fetch_forecast_data()

if not data_json:
    st.error("❌ Connection Failed.")
    st.warning("Make sure your Flask script is running on the Droplet (`python app.py`) and port 5000 is open in the firewall.")
    if st.button("Retry Connection"):
        st.rerun()
else:
    # 2. Process Data into DataFrame
    weekly_data = data_json.get('weeklyData', [])
    meta = data_json.get('meta', {})
    limit_val = meta.get('quota_limit_l_s', 400)

    # Flatten JSON to List
    rows = []
    for day in weekly_data:
        day_name = day['day']
        date_str = day['date']
        for hour in day['data']:
            rows.append({
                "Day": day_name,
                "Date": date_str,
                "Time": hour['time'],
                "DateTime Label": f"{day_name[:3]} {hour['time']}", # For X-Axis
                "Flow Rate": hour['flowRate'],
                "Limit": limit_val,
                "Status": hour['status']
            })
    
    df = pd.DataFrame(rows)

    # 3. KPI Metrics
    current_max = df['Flow Rate'].max()
    alert_count = df[df['Status'] != "OK"].shape[0]
    
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Quota Limit", f"{limit_val} L/s")
    col2.metric("Weekly Peak", f"{current_max} L/s", 
                delta=limit_val - current_max, delta_color="normal")
    col3.metric("Projected Alerts", f"{alert_count} Hours", 
                delta="-High Risk" if alert_count > 0 else "Safe", delta_color="inverse")
    col4.metric("Provider", meta.get('provider', 'Unknown'))

    st.divider()

    # 4. Visualization (Charts)
    st.subheader("📈 Flow Rate Analysis")
    
    # Create a simplified dataframe for the chart
    chart_df = df.set_index('DateTime Label')[['Flow Rate', 'Limit']]
    
    # Render Line Chart
    st.line_chart(
        chart_df,
        color=["#0000FF", "#FF0000"], # Blue for Flow, Red for Limit
        height=400
    )

    # 5. Critical Alerts Section
    st.subheader("⚠️ Critical Breach Log")
    
    # Filter only problematic hours
    bad_scenarios = df[df['Status'].isin(['WARNING', 'CRITICAL', 'PENALTY'])].copy()

    if not bad_scenarios.empty:
        col_left, col_right = st.columns([2, 1])
        
        with col_left:
            st.dataframe(
                bad_scenarios[['Day', 'Time', 'Flow Rate', 'Status']],
                use_container_width=True,
                hide_index=True,
                column_config={
                    "Status": st.column_config.TextColumn(
                        "Status",
                        help="Operational Status",
                        validate="^(OK|WARNING|CRITICAL|PENALTY)$"
                    ),
                    "Flow Rate": st.column_config.ProgressColumn(
                        "Flow Load",
                        format="%d L/s",
                        min_value=0,
                        max_value=600,
                    ),
                }
            )

        # 6. ACTION: Trigger n8n
        with col_right:
            st.info("⚡ **Action Center**")
            st.write("Send this report to the engineering team via n8n.")
            
            if st.button("🚀 Trigger n8n Workflow", type="primary"):
                with st.spinner("Sending signal to n8n..."):
                    # Prepare payload
                    payload = {
                        "source": "Streamlit Dashboard",
                        "location": meta.get("location"),
                        "alert_count": int(alert_count),
                        "details": bad_scenarios.to_dict(orient="records")
                    }
                    
                    # Send Request
                    status, msg = trigger_n8n_workflow(payload)
                    
                    if status == 200:
                        st.success("✅ Success! Workflow triggered.")
                    else:
                        st.error(f"❌ Failed: {status}")
                        st.caption(msg)
    else:
        st.success("✅ No critical alerts predicted for the coming week.")
