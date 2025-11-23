#!/bin/bash
# PeakFlow Monitoring Dashboard Deployment Script
# Server: http://64.226.120.234:8501/

set -e  # Exit on error

echo "======================================"
echo "PeakFlow Dashboard Deployment"
echo "======================================"

# Configuration
DEPLOY_DIR="/opt/peakflow"
REPO_URL="https://github.com/ezekaj/future_city_hackathon.git"
BRANCH="silvestri"
SERVICE_FILE="peakflow-dashboard.service"

# Step 1: Check existing installation
echo -e "\n[1/8] Checking for existing Streamlit processes..."
if lsof -i :8501 2>/dev/null; then
    echo "⚠️  Port 8501 is in use. Stopping existing services..."
    systemctl stop peakflow-dashboard 2>/dev/null || true
    pkill -f "streamlit run" 2>/dev/null || true
    sleep 2
fi

# Step 2: Check Python version
echo -e "\n[2/8] Checking Python version..."
python3 --version || { echo "❌ Python3 not found. Install it first."; exit 1; }

# Step 3: Clone or update repository
echo -e "\n[3/8] Setting up code repository..."
if [ -d "$DEPLOY_DIR" ]; then
    echo "Repository exists. Pulling latest changes..."
    cd "$DEPLOY_DIR"
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    git checkout $BRANCH
fi

# Step 4: Set up virtual environment
echo -e "\n[4/8] Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# Step 5: Install dependencies
echo -e "\n[5/8] Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Step 6: Configure environment
echo -e "\n[6/8] Configuring environment..."
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env file to add Telegram credentials!"
    echo "   Telegram Bot Token and Chat ID are required for alerts."
else
    echo ".env file already exists."
fi

# Step 7: Install systemd service
echo -e "\n[7/8] Installing systemd service..."
if [ -f "$SERVICE_FILE" ]; then
    cp "$SERVICE_FILE" /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable peakflow-dashboard
    echo "✅ Systemd service installed and enabled."
else
    echo "⚠️  Service file not found. Skipping systemd setup."
fi

# Step 8: Start the service
echo -e "\n[8/8] Starting dashboard service..."
systemctl start peakflow-dashboard
sleep 3

# Verify deployment
echo -e "\n======================================"
echo "Deployment Status Check"
echo "======================================"

if systemctl is-active --quiet peakflow-dashboard; then
    echo "✅ Dashboard is RUNNING"
    echo "   URL: http://64.226.120.234:8501/"
    echo ""
    echo "📋 Useful Commands:"
    echo "   Status:  systemctl status peakflow-dashboard"
    echo "   Logs:    journalctl -u peakflow-dashboard -f"
    echo "   Restart: systemctl restart peakflow-dashboard"
    echo "   Stop:    systemctl stop peakflow-dashboard"
else
    echo "❌ Dashboard failed to start"
    echo "   Check logs: journalctl -u peakflow-dashboard -xe"
fi

echo ""
echo "⚠️  Don't forget to configure Telegram bot in .env file!"
echo "======================================"
