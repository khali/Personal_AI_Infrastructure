# Workflow: View Services

**Purpose:** Check service status, health, and configuration across the infrastructure.

**References needed:**
- `references/services-registry-schema.md` - Understanding service structure
- `references/service-management-commands.md` - Status check commands

---

## Step 1: Determine What to View

Ask or infer from context:
- **All services** - Full overview of system state
- **Specific service** - Detailed status for one service
- **Service type** - All daemons, all cron jobs, or all system services
- **Container** - All services in specific container
- **Failed services only** - Services currently failing health checks

---

## Step 2: View Services Registry

**Read the services registry:**

```bash
cat /workspace/agent-infrastructure/config/system-config.json | jq '.services'
```

**Parse and display:**
- Service name
- Type (daemon/cron/system)
- Enabled status
- Container location
- Health check configuration
- Restart command
- Log path
- Notification settings

**Example output format:**
```
Services Registry Overview:
==========================

DAEMON SERVICES:
- syncthing (services-container)
  Enabled: true
  Health: HTTP check on localhost:8384/rest/system/status (every 60s)
  Restart: /usr/local/bin/syncthing serve --no-browser...
  Log: /workspace/vai/logs/syncthing.log
  Notify on fail: alerts

- minio (services-container)
  Enabled: true
  Health: HTTP check on localhost:9000/minio/health/live (every 60s)
  Restart: /usr/local/bin/minio server...
  Log: /workspace/vai/logs/minio.log
  Notify on fail: alerts

CRON JOBS:
- minio-sync (services-container)
  Enabled: true
  Schedule: */1 * * * * (every minute)
  Command: /usr/local/bin/obsidian-bisync-minio.sh
  Log: /workspace/vai/logs/minio-sync.log
  Notify on fail: alerts

- health-check (vai-container)
  Enabled: true
  Schedule: */5 * * * * (every 5 minutes)
  Command: /workspace/agent-infrastructure/scripts/health-check.sh
  Log: /workspace/vai/logs/health-check.log
  Notify on fail: alerts
```

---

## Step 3: Check Live Service Status

**For daemon services, check if process is running:**

```bash
# Via docker exec in services-container
docker exec services-container pgrep -f "syncthing serve" > /dev/null && echo "Running" || echo "Not running"

# Or use service-specific health checks
curl -s http://localhost:8384/rest/system/status | jq '.myID' # Syncthing
curl -s http://localhost:9000/minio/health/live # MinIO
```

**For cron jobs, check recent execution:**

```bash
# Check if pause file exists
docker exec services-container test -f /var/run/cron-pause/minio-sync.paused && echo "Paused" || echo "Active"

# Check recent log activity
docker exec services-container tail -5 /workspace/vai/logs/minio-sync.log
```

**Display live status:**
```
Live Service Status:
===================

✅ syncthing - Running (PID 1234, uptime 5d 3h)
✅ minio - Running (healthy, uptime 5d 3h)
✅ minio-sync - Active (last run 30s ago, success)
⏸️  health-check - Paused (manual pause via .paused file)
❌ log-rotate - Failing (error in last 3 runs)
```

---

## Step 4: Check Health Check Results

**Read recent health check logs:**

```bash
# VPS host cron logs (where health checks run)
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "grep 'health check' /var/log/syslog | tail -20"

# Or check health check script output
docker exec vai-container tail -50 /workspace/vai/logs/health-check.log
```

**Look for:**
- Recent health check executions
- Services that failed health checks
- Auto-recovery attempts
- Services stuck in failed state

---

## Step 5: View Cron Job Schedules

**List all cron jobs:**

```bash
# VPS host crontab
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "crontab -l"

# Services container crontab
docker exec services-container crontab -l
```

**Display schedule overview:**
```
Cron Schedule Overview:
======================

Services Container:
- */1 * * * * - minio-sync (every minute)
- */5 * * * * - health-check (every 5 minutes)
- */5 * * * * - minio-monitor (every 5 minutes)
- 0 2 * * * - log-rotate (daily at 2 AM)

VPS Host:
- */5 * * * * - monitor-vps-resources (every 5 minutes)
- */5 * * * * - bisync-health-monitor (every 5 minutes)
```

---

## Step 6: Check Container Status

**View container health:**

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**Display container overview:**
```
Container Status:
================

services-container - Up 5 days (healthy)
  Ports: 8384, 22000, 9000, 9001
  Services: syncthing, minio, cron jobs

vai-container - Up 5 days (healthy)
  Mounts: /workspace, /home/devuser, ai-global
  Services: orchestration, health checks

agents-container - Up 5 days
  Purpose: Development environment
```

---

## Step 7: View Service Logs

**Show recent log entries for requested services:**

```bash
# Last 20 lines from specific service log
docker exec services-container tail -20 /workspace/vai/logs/minio-sync.log

# Search for errors across all service logs
docker exec services-container grep -i "error\|fail\|critical" /workspace/vai/logs/*.log | tail -50
```

---

## Step 8: Summarize Findings

**Create summary report:**

```
Service Management Summary
=========================

Total Services: 7 (4 daemons, 3 cron jobs)
Status:
  ✅ Healthy: 5
  ⏸️  Paused: 1
  ❌ Failed: 1

Action Required:
- log-rotate failing (investigate error logs)
- health-check manually paused (confirm intentional)

Recent Activity:
- minio-sync: Last run 30s ago, successful (25 files synced)
- monitor-vps-resources: Last run 2m ago, all metrics normal
- bisync-health-monitor: Last run 3m ago, all checks passed
```

---

## Completion Checklist

- [ ] Services registry displayed with all configuration details
- [ ] Live service status checked (running/paused/failed)
- [ ] Health check results reviewed
- [ ] Cron schedules listed
- [ ] Container status verified
- [ ] Recent logs reviewed for errors
- [ ] Summary report created with action items
- [ ] User informed of any issues requiring attention
