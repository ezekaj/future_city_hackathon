# PeakFlow Monitoring Dashboard - Deployment Guide

## Overview

Production URL: **http://64.226.120.234:8501/**

Features:
- Planning Mode: Weekly forecast analysis
- Live Simulation Mode: Real-time monitoring with Telegram alerts
- n8n Integration: Automated workflow triggers

## Quick Deployment

### SSH into server:
```bash
ssh root@64.226.120.234
```

### Run automated deployment:
```bash
curl -sL https://raw.githubusercontent.com/ezekaj/future_city_hackathon/silvestri/deploy.sh | sudo bash
```

### Configure Telegram (Optional):
```bash
nano /opt/peakflow/.env
# Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
systemctl restart peakflow-dashboard
```

## Files Created

- `requirements.txt` - Fixed with altair and python-dotenv
- `.env.example` - Environment template
- `peakflow-dashboard.service` - Systemd service
- `deploy.sh` - Automated deployment script
- `DEPLOYMENT.md` - This guide

## Service Management

```bash
# Status
systemctl status peakflow-dashboard

# Logs
journalctl -u peakflow-dashboard -f

# Restart
systemctl restart peakflow-dashboard
```

## Telegram Bot Setup

1. Talk to @BotFather on Telegram, send /newbot
2. Get chat ID from @userinfobot
3. Add to /opt/peakflow/.env
4. Test in dashboard: Live Sim mode, Setup Telegram Alerts, click Test Alert

## Architecture

- **Frontend (PeakFlow v0.4)**: Customer app on localhost:5501
- **Backend API**: http://64.226.120.234:5000
- **Monitoring Dashboard**: http://64.226.120.234:8501

These are separate systems serving different users.
