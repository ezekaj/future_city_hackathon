import streamlit as st
import pandas as pd
import requests
import altair as alt
import time
import os
from datetime import datetime
from dotenv import load_dotenv

# --- LOAD ENVIRONMENT VARIABLES ---
load_dotenv()

# Get config from .env or fall back to defaults/empty
DEFAULT_API_URL = os.getenv("FLASK_API_URL", "")
DEFAULT_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")
ENV_TG_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ENV_TG_CHAT = os.getenv("TELEGRAM_CHAT_ID", "")

LOGO_URL = "https://www.hnvg.de/wGlobal/wGlobal/layout/images/hnvg-logo.png"

# --- PAGE SETUP ---
st.set_page_config(
    page_title="HNVG Water Platform",
    page_icon="💧",
    layout="wide"
)

# --- SHARED FUNCTIONS ---
@st.cache_data(ttl=60)
def fetch_data(api_url):
    """Fetches full forecast data from the Flask API."""
    if not api_url:
        return None
    try:
        response = requests.get(api_url, timeout=2)
        response.raise_for_status()
        return response.json()
    except Exception:
        return None

def trigger_webhook(url, payload):
    """Sends payload to n8n."""
    if not url:
        return False
    try:
        requests.post(url, json=payload, timeout=2)
        return True
    except Exception:
        return False

def send_telegram_alert(token, chat_id, message):
    """Sends a notification to Telegram."""
    if not token or not chat_id:
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    try:
        requests.post(url, json=payload, timeout=2)
        return True
    except:
        return False

# ==========================================
# 🟢 HEADER & NAVIGATION AREA
# ==========================================
col_header_logo, col_header_title, col_header_nav = st.columns([1, 4, 2], gap="medium")

with col_header_logo:
    st.image(LOGO_URL, use_container_width=True)

with col_header_title:
    st.title("Water Platform")

with col_header_nav:
    c_nav_mode, c_nav_refresh = st.columns([3, 1])
    with c_nav_mode:
        app_mode = st.radio(
            "Select Mode",
            ["📊 Planning", "⏱️ Live Sim"],
            horizontal=True,
            label_visibility="collapsed",
            key="nav_radio"
        )
    with c_nav_refresh:
        if st.button("🔄", help="Refresh Data"):
            st.cache_data.clear()
            st.rerun()

st.divider()

# Check if API URL is configured
if not DEFAULT_API_URL:
    st.error("❌ API URL is missing. Please configure `FLASK_API_URL` in your .env file.")
    st.stop()

# ==========================================
# MODE 1: PLANNING DASHBOARD
# ==========================================
if app_mode == "📊 Planning":
    
    # 1. FETCH & PROCESS DATA
    data_json = fetch_data(DEFAULT_API_URL)

    if not data_json:
        st.error(f"❌ Could not connect to API at `{DEFAULT_API_URL}`.")
        st.stop()

    meta = data_json.get('meta', {})
    weekly_data = data_json.get('weeklyData', [])
    limit_val = meta.get('quota_limit_l_s', 400)

    # Flatten data
    all_rows = []
    for day in weekly_data:
        for hour in day['data']:
            all_rows.append({
                "Day": day['day'],
                "Date": day['date'],
                "Time": hour['time'],
                "Flow Rate": hour['flowRate'],
                "Status": hour['status'],
                "Limit": limit_val,
                "Scenario": day.get('scenario', 'Normal')
            })
    df = pd.DataFrame(all_rows)

    # 2. TABS UI
    tab1, tab2, tab3 = st.tabs(["Overview", "Daily Deep Dive", "Alerts & Actions"])

    with tab1:
        max_flow = df['Flow Rate'].max()
        avg_flow = int(df['Flow Rate'].mean())
        total_alerts = df[df['Status'] != 'OK'].shape[0]
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Provider", meta.get('provider', 'N/A'))
        col2.metric("Quota Limit", f"{limit_val} L/s")
        col3.metric("Weekly Peak", f"{max_flow} L/s", 
                    delta=limit_val - max_flow, delta_color="normal")
        col4.metric("Risk Hours", f"{total_alerts} hrs", 
                    delta="High" if total_alerts > 0 else "Low", delta_color="inverse")

        st.markdown("#### Analytics")
        col_chart, col_heat = st.columns([2, 1])
        with col_chart:
            base = alt.Chart(df).encode(x='Date:T')
            line = alt.Chart(df.reset_index()).mark_line().encode(
                x=alt.X('index', title='Hours throughout the week'),
                y=alt.Y('Flow Rate', title='Flow Rate (L/s)'),
                tooltip=['Day', 'Time', 'Flow Rate', 'Status']
            )
            rule = alt.Chart(pd.DataFrame({'y': [limit_val]})).mark_rule(color='red', strokeDash=[5,5]).encode(y='y')
            st.altair_chart((line + rule).interactive(), use_container_width=True)

        with col_heat:
            heatmap = alt.Chart(df).mark_rect().encode(
                x=alt.X('Time:O', title=None, axis=alt.Axis(labels=False)),
                y=alt.Y('Day:O', sort=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], title=None),
                color=alt.Color('Flow Rate', scale=alt.Scale(scheme='yelloworangered'), legend=None),
                tooltip=['Day', 'Time', 'Flow Rate', 'Status']
            ).properties(height=300)
            st.altair_chart(heatmap, use_container_width=True)

    with tab2:
        col_sel, col_info = st.columns([1, 3])
        with col_sel:
            day_list = [d['day'] for d in weekly_data]
            selected_day_name = st.selectbox("Select Day:", day_list)
        
        day_data = next(d for d in weekly_data if d['day'] == selected_day_name)
        scenario_text = day_data.get('scenario', 'Normal Operation')
        
        with col_info:
            st.info(f"**Scenario:** {scenario_text}")
        
        day_df = df[df['Day'] == selected_day_name].copy()
        st.bar_chart(day_df.set_index('Time')['Flow Rate'], color="#3182bd", height=250)
        
        st.dataframe(
            day_df[['Time', 'Flow Rate', 'Status', 'Limit']],
            use_container_width=True,
            hide_index=True,
            column_config={
                "Flow Rate": st.column_config.ProgressColumn(
                    "Flow Rate", format="%d L/s", min_value=0, max_value=600
                )
            }
        )

    with tab3:
        st.subheader("Critical Event Management")
        alert_df = df[df['Status'] != 'OK'].copy()
        
        if alert_df.empty:
            st.success("✅ No operational breaches predicted.")
        else:
            st.warning(f"⚠️ Detected {len(alert_df)} hours of operational risk.")
            col_table, col_action = st.columns([3, 1])
            with col_table:
                st.dataframe(alert_df[['Day', 'Time', 'Flow Rate', 'Status', 'Scenario']], use_container_width=True, hide_index=True)
            with col_action:
                st.markdown("### Take Action")
                with st.form("n8n_trigger"):
                    notes = st.text_area("Notes", "Review critical peaks.")
                    submit = st.form_submit_button("🚀 Trigger Workflow", type="primary")
                    if submit:
                        payload = {
                            "source": "Planning Dashboard",
                            "alert_count": len(alert_df),
                            "notes": notes,
                            "breaches": alert_df.to_dict(orient="records")
                        }
                        if trigger_webhook(DEFAULT_WEBHOOK_URL, payload):
                            st.toast("Workflow Triggered!", icon="✅")
                        else:
                            st.error("Failed to trigger workflow.")

# ==========================================
# MODE 2: LIVE SIMULATION
# ==========================================
elif app_mode == "⏱️ Live Sim":
    
    # --- SAFE INITIALIZATION ---
    # We initialize these to None to prevent NameError if the expander block is skipped or moved
    tg_token = None
    tg_chat = None

    # Initialize Session State
    if 'sim_active' not in st.session_state:
        st.session_state.sim_active = False
    if 'sim_start_time' not in st.session_state:
        st.session_state.sim_start_time = None
    if 'last_processed_hour' not in st.session_state:
        st.session_state.last_processed_hour = -1
    if 'sent_alerts' not in st.session_state:
        st.session_state.sent_alerts = set()

    # --- TELEGRAM SETTINGS ---
    with st.expander("📲 Setup Telegram Alerts (Click to Open)", expanded=False):
        st.markdown("Enter your credentials to receive real-time alerts during the simulation.")
        t_col1, t_col2, t_col3 = st.columns([2, 2, 1])
        
        # Pre-fill with value from ENV if available
        tg_token = t_col1.text_input("Bot Token", value=ENV_TG_TOKEN, type="password", key="tg_token_input")
        tg_chat = t_col2.text_input("Chat ID", value=ENV_TG_CHAT, key="tg_chat_input")
        
        with t_col3:
            st.write("") 
            st.write("")
            if st.button("Test Alert"):
                if send_telegram_alert(tg_token, tg_chat, "✅ **HNVG Bot Connected!**"):
                    st.toast("Test message sent!", icon="✅")
                else:
                    st.error("Failed. Check Token/ID.")

    # --- SIMULATION CONTROLS ---
    c_start, c_reset = st.columns(2)
    with c_start:
        if st.button("▶️ Start Simulation", use_container_width=True, type="primary"):
            st.session_state.sim_active = True
            if st.session_state.sim_start_time is None:
                st.session_state.sim_start_time = time.time()
            st.rerun()
            
    with c_reset:
        if st.button("⏹️ Reset System", use_container_width=True):
            st.session_state.sim_active = False
            st.session_state.sim_start_time = None
            st.session_state.last_processed_hour = -1
            st.session_state.sent_alerts = set()
            st.rerun()

    st.divider()

    # Fetch Data
    data_json = fetch_data(DEFAULT_API_URL)
    
    if not data_json:
        st.warning("Waiting for data connection...")
        st.stop()

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
                "Limit": limit_val
            })
    df = pd.DataFrame(all_rows)
    total_hours = len(df)

    # Simulation Engine
    current_hour_index = 0
    if st.session_state.sim_active and st.session_state.sim_start_time:
        elapsed = time.time() - st.session_state.sim_start_time
        # Fixed Speed: 1 hr = 2.5s
        current_hour_index = int(elapsed / 2.5)
        
        if current_hour_index >= total_hours:
            current_hour_index = total_hours - 1
            st.success("🏁 Simulation Complete")
            st.session_state.sim_active = False
    else:
        current_hour_index = 0 if st.session_state.sim_start_time is None else st.session_state.last_processed_hour

    st.session_state.last_processed_hour = current_hour_index
    
    # Slicing
    history_df = df.iloc[:current_hour_index+1]
    current_row = df.iloc[current_hour_index]

    # Display Metrics
    progress = min(current_hour_index / total_hours, 1.0)
    st.progress(progress, text=f"Simulation Progress: {current_row['Day']} {current_row['Time']}")

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Current Time", f"{current_row['Time']}")
    m2.metric("Flow Rate", f"{current_row['Flow Rate']} L/s", 
              delta=f"{current_row['Flow Rate'] - limit_val} vs Limit", delta_color="inverse")
    m3.metric("Status", current_row['Status'], 
              delta_color="off" if current_row['Status']=="OK" else "inverse")
    m4.metric("Scenario", current_row['Scenario'])

    st.divider()

    # --- TELEGRAM ALERT LOGIC (Background) ---
    alert_key = f"{current_row['Day']}_{current_row['Time']}"
    
    if current_row['Status'] in ["WARNING", "CRITICAL", "PENALTY"]:
        if alert_key not in st.session_state.sent_alerts:
            # Build Message
            msg = (f"🚨 *HNVG ALERT DETECTED*\n"
                   f"Status: {current_row['Status']}\n"
                   f"Time: {current_row['Day']} {current_row['Time']}\n"
                   f"Flow: {current_row['Flow Rate']} L/s (Limit: {limit_val})")
            
            # Send (if credentials exist and valid)
            if tg_token and tg_chat:
                send_telegram_alert(tg_token, tg_chat, msg)
                st.toast(f"📲 Telegram sent for {current_row['Status']}!", icon="📨")
            
            st.session_state.sent_alerts.add(alert_key)

    # --- LIVE CHART & ALERTS UI ---
    c1, c2 = st.columns([3, 1])
    with c1:
        st.subheader("📈 Live Flow Monitor")
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
        rule = alt.Chart(pd.DataFrame({'y': [limit_val]})).mark_rule(color='red', strokeDash=[3,3]).encode(y='y')
        st.altair_chart((chart + rule).interactive(), use_container_width=True)

    with c2:
        st.subheader("⚠️ Alerts")
        if current_row['Status'] in ["WARNING", "CRITICAL", "PENALTY"]:
            st.error(f"**{current_row['Status']}**")
            st.write(f"Flow: {current_row['Flow Rate']} L/s")
            
            if st.button("🚨 Trigger Workflow", key=f"btn_{current_hour_index}"):
                 payload = {
                     "simulation_mode": True,
                     "timestamp": datetime.now().isoformat(),
                     "simulated_time": f"{current_row['Day']} {current_row['Time']}",
                     "flow_rate": int(current_row['Flow Rate']),
                     "status": current_row['Status']
                 }
                 if trigger_webhook(DEFAULT_WEBHOOK_URL, payload):
                     st.toast("Alert sent to n8n!", icon="🚀")
                 else:
                     st.toast("Failed to send alert.", icon="❌")
        else:
            st.success("System Normal")
            st.caption("No active alerts.")

    # Auto-Refresh Loop
    if st.session_state.sim_active:
        time.sleep(1)
        st.rerun()
