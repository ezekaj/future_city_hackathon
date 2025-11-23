import streamlit as st
import pandas as pd
import requests
import altair as alt
import time
from datetime import datetime, timedelta

# --- CONFIGURATION ---
DEFAULT_API_URL = "http://64.226.120.234:5000/api/forecast"
DEFAULT_WEBHOOK_URL = "https://n8n.ligaime.com/webhook/ca98f397-cf85-4021-a6bf-4a9253b9f848"

# --- PAGE SETUP ---
st.set_page_config(
    page_title="HNVG Live Simulation",
    page_icon="⏱️",
    layout="wide"
)

# --- SESSION STATE INITIALIZATION ---
if 'sim_active' not in st.session_state:
    st.session_state.sim_active = False
if 'sim_start_time' not in st.session_state:
    st.session_state.sim_start_time = None
if 'sim_speed' not in st.session_state:
    st.session_state.sim_speed = 1
if 'last_processed_hour' not in st.session_state:
    st.session_state.last_processed_hour = -1

# --- FUNCTIONS ---
@st.cache_data(ttl=300)
def fetch_data(api_url):
    """Fetches full forecast data."""
    try:
        response = requests.get(api_url, timeout=2)
        response.raise_for_status()
        return response.json()
    except:
        return None

def trigger_webhook(url, payload):
    """Sends payload to n8n."""
    try:
        requests.post(url, json=payload, timeout=2)
        return True
    except:
        return False

# --- UI LAYOUT ---
col_title, col_controls = st.columns([3, 2])

with col_title:
    st.title("⏱️ HNVG FutureCity Simulation")

# --- SIMULATION CONTROLS ---
with col_controls:
    with st.expander("🎮 Simulation Controls", expanded=True):
        c1, c2, c3 = st.columns([1, 1, 1])
        
        # Speed Selector
        speed = c1.select_slider("Speed", options=[1, 2, 5, 10, 20], value=1, key="speed_selector")
        st.session_state.sim_speed = speed
        
        # Start/Stop Buttons
        with c2:
            st.write("") # Spacer
            if st.button("▶️ Start", use_container_width=True):
                st.session_state.sim_active = True
                if st.session_state.sim_start_time is None:
                    st.session_state.sim_start_time = time.time()
                st.rerun()

        with c3:
            st.write("") # Spacer
            if st.button("⏹️ Reset", use_container_width=True):
                st.session_state.sim_active = False
                st.session_state.sim_start_time = None
                st.session_state.last_processed_hour = -1
                st.rerun()

# --- DATA PREPARATION ---
api_url = st.sidebar.text_input("API URL", DEFAULT_API_URL)
webhook_url = st.sidebar.text_input("Webhook URL", DEFAULT_WEBHOOK_URL)
data_json = fetch_data(api_url)

if not data_json:
    st.warning("Waiting for data connection...")
    st.stop()

# Flatten data
weekly_data = data_json.get('weeklyData', [])
limit_val = data_json.get('meta', {}).get('quota_limit_l_s', 400)

all_rows = []
for day in weekly_data:
    for hour in day['data']:
        all_rows.append({
            "Day": day['day'],
            "Time": hour['time'],
            "Flow Rate": hour['flowRate'],
            "Status": hour['status'],
            "Scenario": day.get('scenario', 'Normal'),
            "Limit": limit_val,
            "FullLabel": f"{day['day']} {hour['time']}"
        })
df = pd.DataFrame(all_rows)
total_hours = len(df)

# --- SIMULATION ENGINE ---
current_hour_index = 0

if st.session_state.sim_active and st.session_state.sim_start_time:
    # Calculate elapsed real time
    elapsed_real_seconds = time.time() - st.session_state.sim_start_time
    
    # 1 Minute Real Time = 1 Day (24 hours) Simulated
    # 60 seconds = 24 hours -> 1 hour = 2.5 seconds (at 1x speed)
    seconds_per_hour = 2.5 / st.session_state.sim_speed
    
    current_hour_index = int(elapsed_real_seconds / seconds_per_hour)
    
    # Loop capability (restart if end of week reached)
    if current_hour_index >= total_hours:
        current_hour_index = total_hours - 1
        st.success("🏁 Simulation Complete")
        st.session_state.sim_active = False

else:
    # If stopped, show 0 or last state
    current_hour_index = 0 if st.session_state.sim_start_time is None else st.session_state.last_processed_hour

# Slice Data based on Simulation Time
history_df = df.iloc[:current_hour_index+1]
current_row = df.iloc[current_hour_index]

# --- DASHBOARD UI ---

# 1. Progress Bar
progress = min(current_hour_index / total_hours, 1.0)
st.progress(progress, text=f"Simulation Progress: {current_row['Day']} {current_row['Time']}")

# 2. Live Metrics
m1, m2, m3, m4 = st.columns(4)
m1.metric("Current Time", f"{current_row['Time']}")
m2.metric("Flow Rate", f"{current_row['Flow Rate']} L/s", 
          delta=f"{current_row['Flow Rate'] - limit_val} vs Limit", 
          delta_color="inverse")
m3.metric("Status", current_row['Status'], 
          delta_color="off" if current_row['Status']=="OK" else "inverse")
m4.metric("Scenario", current_row['Scenario'])

st.divider()

# 3. Live Animated Chart
c1, c2 = st.columns([3, 1])

with c1:
    st.subheader("📈 Live Flow Monitor")
    
    # Dynamic Line Chart
    chart = alt.Chart(history_df.reset_index()).mark_area(
        line={'color':'#29b5e8'},
        color=alt.Gradient(
            gradient='linear',
            stops=[alt.GradientStop(color='white', offset=0),
                   alt.GradientStop(color='#29b5e8', offset=1)],
            x1=1, x2=1, y1=1, y2=0
        )
    ).encode(
        x=alt.X('index', title='Hours Elapsed'),
        y=alt.Y('Flow Rate', scale=alt.Scale(domain=[0, 600])),
        tooltip=['Day', 'Time', 'Flow Rate', 'Status']
    )
    
    # Limit Line
    rule = alt.Chart(pd.DataFrame({'y': [limit_val]})).mark_rule(color='red', strokeDash=[3,3]).encode(y='y')
    
    st.altair_chart((chart + rule).interactive(), use_container_width=True)

with c2:
    st.subheader("⚠️ Live Alerts")
    
    # Show status box
    if current_row['Status'] in ["WARNING", "CRITICAL", "PENALTY"]:
        st.error(f"**{current_row['Status']} DETECTED**")
        st.write(f"Flow: {current_row['Flow Rate']} L/s")
        st.write(f"Time: {current_row['Day']} {current_row['Time']}")
        
        # Webhook Trigger Button
        if st.button("🚨 Trigger n8n Workflow", key=f"btn_{current_hour_index}"):
             payload = {
                 "simulation_mode": True,
                 "timestamp": datetime.now().isoformat(),
                 "simulated_time": f"{current_row['Day']} {current_row['Time']}",
                 "flow_rate": int(current_row['Flow Rate']),
                 "status": current_row['Status']
             }
             if trigger_webhook(webhook_url, payload):
                 st.toast("Alert sent to n8n!", icon="🚀")
             else:
                 st.toast("Failed to send alert.", icon="❌")
    else:
        st.success("System Normal")
        st.caption("No active alerts.")

# --- AUTO-REFRESH LOGIC ---
if st.session_state.sim_active:
    time.sleep(1) # Refresh every second to update the UI
    st.rerun()
