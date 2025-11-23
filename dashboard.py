import streamlit as st
import pandas as pd
import requests
import altair as alt

# --- CONFIGURATION ---
# Default values from your original dashboard.py
DEFAULT_API_URL = "http://64.226.120.234:5000/api/forecast"
DEFAULT_WEBHOOK_URL = "https://n8n.ligaime.com/webhook/ca98f397-cf85-4021-a6bf-4a9253b9f848"

# --- PAGE SETUP ---
st.set_page_config(
    page_title="HNVG Water Monitor",
    page_icon="💧",
    layout="wide"
)

# --- FUNCTIONS ---
@st.cache_data(ttl=60)
def fetch_data(api_url):
    """Fetches full forecast data from the Flask API."""
    try:
        response = requests.get(api_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return None

def trigger_webhook(url, payload):
    """Sends payload to n8n."""
    try:
        response = requests.post(url, json=payload, timeout=5)
        return response.status_code
    except Exception as e:
        return 500

# --- MAIN APP ---
col_title, col_settings = st.columns([3, 1])

with col_title:
    st.title("💧 HNVG Water Forecast")

# --- SETTINGS (Moved from Sidebar) ---
with st.expander("⚙️ Connection Settings", expanded=False):
    col_s1, col_s2, col_s3 = st.columns([2, 2, 1])
    
    with col_s1:
        api_url = st.text_input("Flask API URL", value=DEFAULT_API_URL)
    
    with col_s2:
        webhook_url = st.text_input("n8n Webhook URL", value=DEFAULT_WEBHOOK_URL)
        
    with col_s3:
        st.write("") # Vertical spacer
        st.write("") 
        if st.button("🔄 Refresh Data", use_container_width=True):
            st.cache_data.clear()
            st.rerun()

# 1. Fetch Data
data_json = fetch_data(api_url)

if not data_json:
    st.error(f"❌ Could not connect to API at `{api_url}`. Please check the settings above.")
    st.stop()

# 2. Process Data
meta = data_json.get('meta', {})
weekly_data = data_json.get('weeklyData', [])
limit_val = meta.get('quota_limit_l_s', 400)

# Flatten data for global analysis
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

# --- TABS UI ---
tab1, tab2, tab3 = st.tabs(["📊 Overview", "📅 Daily Deep Dive", "⚠️ Alerts & Actions"])

# === TAB 1: OVERVIEW ===
with tab1:
    # KPI Row
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

    st.markdown("---")
    
    col_chart, col_heat = st.columns([2, 1])
    
    with col_chart:
        st.subheader("Weekly Flow Trend")
        # Line Chart using Altair for better threshold visualization
        base = alt.Chart(df).encode(x='Date:T')
        
        line = alt.Chart(df.reset_index()).mark_line().encode(
            x=alt.X('index', title='Hours throughout the week'),
            y=alt.Y('Flow Rate', title='Flow Rate (L/s)'),
            tooltip=['Day', 'Time', 'Flow Rate', 'Status']
        )
        
        rule = alt.Chart(pd.DataFrame({'y': [limit_val]})).mark_rule(color='red', strokeDash=[5,5]).encode(y='y')
        
        st.altair_chart((line + rule).interactive(), use_container_width=True)

    with col_heat:
        st.subheader("Intensity Heatmap")
        st.caption("Quickly spot peak times (Red = High Flow)")
        
        heatmap = alt.Chart(df).mark_rect().encode(
            x=alt.X('Time:O', title=None),
            y=alt.Y('Day:O', sort=['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], title=None),
            color=alt.Color('Flow Rate', scale=alt.Scale(scheme='yelloworangered')),
            tooltip=['Day', 'Time', 'Flow Rate', 'Status']
        ).properties(height=350)
        
        st.altair_chart(heatmap, use_container_width=True)

# === TAB 2: DAILY DEEP DIVE ===
with tab2:
    col_sel, col_info = st.columns([1, 3])
    
    with col_sel:
        day_list = [d['day'] for d in weekly_data]
        selected_day_name = st.selectbox("Select Day to Inspect:", day_list)
    
    # Filter data for selected day
    day_data = next(d for d in weekly_data if d['day'] == selected_day_name)
    scenario_text = day_data.get('scenario', 'Normal Operation')
    
    with col_info:
        st.info(f"**Predicted Scenario:** {scenario_text}")
    
    # Create specific dataframe for this day
    day_df = df[df['Day'] == selected_day_name].copy()
    
    # Visuals for the day
    st.bar_chart(day_df.set_index('Time')['Flow Rate'], color="#3182bd")
    
    # Detailed Table with coloring
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

# === TAB 3: ALERTS & ACTIONS ===
with tab3:
    st.subheader("🚨 Critical Event Management")
    
    # Filter only bad rows
    alert_df = df[df['Status'] != 'OK'].copy()
    
    if alert_df.empty:
        st.success("✅ No operational breaches predicted for this week.")
    else:
        st.warning(f"⚠️ Detected {len(alert_df)} hours of operational risk.")
        
        col_table, col_action = st.columns([3, 1])
        
        with col_table:
            st.dataframe(
                alert_df[['Day', 'Time', 'Flow Rate', 'Status', 'Scenario']],
                use_container_width=True,
                hide_index=True
            )
            
        with col_action:
            st.markdown("### Take Action")
            st.markdown("Send this report to the engineering team immediately.")
            
            with st.form("n8n_trigger"):
                notes = st.text_area("Add Notes (Optional)", "Review critical peaks.")
                submit = st.form_submit_button("🚀 Trigger Workflow", type="primary")
                
                if submit:
                    payload = {
                        "source": "Streamlit Dashboard",
                        "alert_count": len(alert_df),
                        "notes": notes,
                        "breaches": alert_df.to_dict(orient="records")
                    }
                    
                    status_code = trigger_webhook(webhook_url, payload)
                    
                    if status_code == 200:
                        st.toast("Workflow Triggered Successfully!", icon="✅")
                    else:
                        st.error(f"Failed to trigger workflow. Status: {status_code}")
