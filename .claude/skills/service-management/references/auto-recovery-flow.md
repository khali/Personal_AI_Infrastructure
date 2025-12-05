# Auto-Recovery Flow

**Purpose:** Automatic service recovery system that detects failures and attempts restart without manual intervention.

---

## Overview

The auto-recovery system runs health checks periodically via cron. When a service fails its health check, the system automatically attempts to restart it and verifies recovery.

**Flow:**
```
┌─────────────────┐
│ Cron Trigger    │ Every 5 minutes (*/5 * * * *)
│ (Health Check)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run Health      │ Execute health_check command
│ Check           │ (HTTP, TCP, process, or custom)
└────────┬────────┘
         │
    ┌────▼────┐
    │ Healthy?│
    └────┬────┘
         │
    ┌────▼───────────┐
    │ YES        NO  │
    │                │
    ▼                ▼
┌────────┐    ┌──────────────┐
│ Done   │    │ Log Warning  │
└────────┘    │ (Service     │
              │  failed)     │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Run          │
              │ restart_cmd  │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Wait 5s      │
              │ (startup     │
              │  delay)      │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │ Re-check     │
              │ Health       │
              └──────┬───────┘
                     │
                ┌────▼────┐
                │ Healthy?│
                └────┬────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
    ┌──────────┐         ┌──────────────┐
    │ Log      │         │ Send Alert   │
    │ Recovered│         │ (ntfy.sh)    │
    └──────────┘         │              │
                         │ "Service X   │
                         │  failed to   │
                         │  restart"    │
                         └──────────────┘
```

---

## Implementation

### Health Check Cron Job

**Location:** VPS host crontab or services-container crontab

**Schedule:** Every 5 minutes
```cron
*/5 * * * * /workspace/agent-infrastructure/scripts/health/run-health-checks.sh >> /workspace/vai/logs/health-check.log 2>&1
```

### Health Check Runner Script

**File:** `/workspace/agent-infrastructure/scripts/health/run-health-checks.sh`

```bash
#!/bin/bash
set -euo pipefail

# Load logging library
source /workspace/agent-infrastructure/scripts/lib/log.sh
source /workspace/agent-infrastructure/scripts/lib/notify.sh

CONFIG_FILE="/workspace/agent-infrastructure/config/system-config.json"

# Read services from registry
SERVICES=$(jq -r '.services | keys[]' "$CONFIG_FILE")

for SERVICE in $SERVICES; then
    # Check if enabled
    ENABLED=$(jq -r ".services.${SERVICE}.enabled" "$CONFIG_FILE")
    if [ "$ENABLED" != "true" ]; then
        continue
    fi

    # Get health check config
    HEALTH_TYPE=$(jq -r ".services.${SERVICE}.health_check.type" "$CONFIG_FILE")
    CONTAINER=$(jq -r ".services.${SERVICE}.container" "$CONFIG_FILE")

    # Run health check
    if run_health_check "$SERVICE" "$HEALTH_TYPE" "$CONTAINER"; then
        log "INFO" "Health check passed for $SERVICE"
    else
        log "WARNING" "Health check failed for $SERVICE, attempting recovery..."

        # Attempt auto-recovery
        if recover_service "$SERVICE"; then
            log "INFO" "Successfully recovered $SERVICE"
        else
            log "ERROR" "Failed to recover $SERVICE"

            # Send alert
            NOTIFY_TOPIC=$(jq -r ".services.${SERVICE}.notify_on_fail" "$CONFIG_FILE")
            notify "CRITICAL" "SERVICE-FAILED" "$SERVICE Failed" \
                   "Service $SERVICE failed health check and could not be recovered"
        fi
    fi
done
```

### Health Check Function

```bash
run_health_check() {
    local SERVICE=$1
    local TYPE=$2
    local CONTAINER=$3

    case "$TYPE" in
        http)
            ENDPOINT=$(jq -r ".services.${SERVICE}.health_check.endpoint" "$CONFIG_FILE")
            TIMEOUT=$(jq -r ".services.${SERVICE}.health_check.timeout_seconds" "$CONFIG_FILE")
            docker exec "$CONTAINER-container" curl -f -s -m "$TIMEOUT" "$ENDPOINT" > /dev/null
            ;;

        tcp)
            HOST=$(jq -r ".services.${SERVICE}.health_check.host" "$CONFIG_FILE")
            PORT=$(jq -r ".services.${SERVICE}.health_check.port" "$CONFIG_FILE")
            TIMEOUT=$(jq -r ".services.${SERVICE}.health_check.timeout_seconds" "$CONFIG_FILE")
            docker exec "$CONTAINER-container" timeout "$TIMEOUT" \
                bash -c "cat < /dev/null > /dev/tcp/$HOST/$PORT" 2>/dev/null
            ;;

        process)
            PROCESS=$(jq -r ".services.${SERVICE}.health_check.process_name" "$CONFIG_FILE")
            docker exec "$CONTAINER-container" pgrep -f "$PROCESS" > /dev/null
            ;;

        custom)
            COMMAND=$(jq -r ".services.${SERVICE}.health_check.command" "$CONFIG_FILE")
            TIMEOUT=$(jq -r ".services.${SERVICE}.health_check.timeout_seconds" "$CONFIG_FILE")
            docker exec "$CONTAINER-container" timeout "$TIMEOUT" bash -c "$COMMAND"
            ;;
    esac
}
```

### Service Recovery Function

```bash
recover_service() {
    local SERVICE=$1

    # Get restart command
    RESTART_CMD=$(jq -r ".services.${SERVICE}.restart_cmd" "$CONFIG_FILE")
    CONTAINER=$(jq -r ".services.${SERVICE}.container" "$CONFIG_FILE")

    # Execute restart command
    log "INFO" "Executing restart command for $SERVICE"
    docker exec "$CONTAINER-container" bash -c "$RESTART_CMD"

    # Wait for startup
    sleep 5

    # Re-check health
    HEALTH_TYPE=$(jq -r ".services.${SERVICE}.health_check.type" "$CONFIG_FILE")
    if run_health_check "$SERVICE" "$HEALTH_TYPE" "$CONTAINER"; then
        return 0  # Success
    else
        return 1  # Still failing
    fi
}
```

---

## Configuration in system-config.json

**Example daemon service with auto-recovery:**
```json
{
  "minio": {
    "enabled": true,
    "type": "daemon",
    "container": "services",

    "health_check": {
      "type": "http",
      "endpoint": "http://localhost:9000/minio/health/live",
      "interval_seconds": 60,
      "timeout_seconds": 5
    },

    "restart_cmd": "/usr/local/bin/minio server /data --console-address :9001 >> /workspace/vai/logs/minio.log 2>&1 &",

    "log_path": "/workspace/vai/logs/minio.log",
    "notify_on_fail": "alerts",
    "dependencies": []
  }
}
```

---

## Notification System Integration

**When recovery fails, send alert via ntfy.sh:**

```bash
# Via services-container with centralized cooldown
docker exec services-container bash -c "
    export NOTIFY_SOURCE='Auto-Recovery'
    source /workspace/agent-infrastructure/scripts/lib/notify.sh
    notify 'CRITICAL' 'SERVICE-RECOVERY-FAILED' 'MinIO Recovery Failed' \
           'Service minio failed health check and could not be automatically restarted'
"
```

**Notification format:**
```
Title: MinIO Recovery Failed
Priority: CRITICAL (5)
Tags: rotating_light, alert, auto-recovery
Message:
Service: minio
Status: Failed health check
Recovery attempt: Failed
Container: services-container
Action required: Manual intervention needed

Health check: HTTP GET http://localhost:9000/minio/health/live
Restart command: /usr/local/bin/minio server /data --console-address :9001

View logs: docker exec services-container tail -50 /workspace/vai/logs/minio.log
```

---

## Recovery Scenarios

### Scenario 1: Service Crashed

**Trigger:** Process died unexpectedly

**Detection:** Health check fails (process check returns non-zero)

**Recovery:**
1. Health check detects no process
2. Execute restart_cmd
3. Wait 5s for startup
4. Re-check health → Process now running
5. Recovery successful ✓

**Timeline:**
```
10:00:00 - Service crashes
10:05:00 - Health check runs, detects failure
10:05:01 - Restart command executed
10:05:06 - Health re-check (after 5s delay)
10:05:06 - Service healthy ✓
```

### Scenario 2: Service Hung (Not Responding)

**Trigger:** Process exists but not responding to requests

**Detection:** Health check fails (HTTP/TCP check times out)

**Recovery:**
1. Health check detects unresponsive service
2. Execute restart_cmd (may need to kill first)
3. Wait 5s
4. Re-check → Service now responding
5. Recovery successful ✓

**Improvement:** Kill process before restart if restart_cmd doesn't handle it:
```bash
# In system-config.json restart_cmd:
"pkill -f 'service-name'; sleep 2; /usr/local/bin/service start"
```

### Scenario 3: Dependency Failure

**Trigger:** Service depends on another service that failed

**Detection:** Health check fails due to missing dependency

**Recovery:**
1. Check dependencies first (order by dependency graph)
2. Recover dependencies before dependent services
3. After dependency recovered, attempt service recovery
4. Re-check → Service now healthy
5. Recovery successful ✓

**Implementation:**
```bash
# Check and recover dependencies first
DEPENDENCIES=$(jq -r ".services.${SERVICE}.dependencies[]?" "$CONFIG_FILE")
for DEP in $DEPENDENCIES; do
    if ! run_health_check "$DEP"; then
        log "WARNING" "Dependency $DEP unhealthy, recovering..."
        recover_service "$DEP"
    fi
done

# Now recover main service
recover_service "$SERVICE"
```

### Scenario 4: Resource Exhaustion

**Trigger:** Service fails due to out of memory, disk space, etc.

**Detection:** Health check fails, restart fails too

**Recovery:**
1. Health check fails
2. Execute restart_cmd
3. Restart fails (resource issue)
4. Re-check → Still failing
5. Alert sent to user ✗

**Manual intervention needed:**
- Check system resources (memory, disk, CPU)
- Free up resources
- Manually restart service

---

## Recovery Best Practices

### 1. Include Cleanup in Restart Command

**Bad:** Assumes previous process is gone
```json
"restart_cmd": "/usr/local/bin/service start"
```

**Good:** Ensures clean restart
```json
"restart_cmd": "pkill -f 'service-name' || true; sleep 2; /usr/local/bin/service start"
```

### 2. Use Appropriate Startup Delay

**Too short (1s):** Service hasn't fully started, re-check fails
```bash
docker exec container bash -c "$RESTART_CMD"
sleep 1  # Too short!
run_health_check
```

**Good (5s):** Enough time for most services to initialize
```bash
docker exec container bash -c "$RESTART_CMD"
sleep 5  # Good for most services
run_health_check
```

**Slow services (30s+):** Adjust per service
```json
{
  "startup_delay_seconds": 30,
  "health_check": {
    "interval_seconds": 120  // Also increase interval
  }
}
```

### 3. Log Everything

**Log health check results:**
```bash
if run_health_check "$SERVICE"; then
    log "INFO" "Health check passed: $SERVICE"
else
    log "WARNING" "Health check failed: $SERVICE"
fi
```

**Log recovery attempts:**
```bash
log "INFO" "Attempting recovery: $SERVICE"
log "INFO" "Executing: $RESTART_CMD"

if recover_service "$SERVICE"; then
    log "INFO" "Recovery successful: $SERVICE"
else
    log "ERROR" "Recovery failed: $SERVICE"
fi
```

### 4. Implement Rate Limiting

**Problem:** Service repeatedly fails and restarts (crash loop)

**Solution:** Track failures, limit restart attempts

```bash
STATE_FILE="/var/run/service-failures/${SERVICE}"
MAX_FAILURES=3
FAILURE_WINDOW=300  # 5 minutes

# Read failure count
if [ -f "$STATE_FILE" ]; then
    FAILURES=$(cat "$STATE_FILE")
    LAST_FAILURE=$(stat -c %Y "$STATE_FILE")
    NOW=$(date +%s)

    # Reset if outside failure window
    if [ $((NOW - LAST_FAILURE)) -gt "$FAILURE_WINDOW" ]; then
        echo "0" > "$STATE_FILE"
        FAILURES=0
    fi
else
    FAILURES=0
fi

# Check if exceeded max failures
if [ "$FAILURES" -ge "$MAX_FAILURES" ]; then
    log "ERROR" "$SERVICE exceeded max failures ($MAX_FAILURES in ${FAILURE_WINDOW}s), giving up"
    notify "CRITICAL" "SERVICE-CRASH-LOOP" "$SERVICE Crash Loop" \
           "Service has failed $FAILURES times in last ${FAILURE_WINDOW}s"
    exit 1
fi

# Increment failure count
echo "$((FAILURES + 1))" > "$STATE_FILE"
```

### 5. Handle Manual Stop Markers

**Problem:** Auto-recovery restarts services that were intentionally stopped

**Solution:** Check for manual-stop marker before recovery

```bash
STOP_MARKER="/var/run/manual-stop/${SERVICE}.stopped"

if [ -f "$STOP_MARKER" ]; then
    log "INFO" "$SERVICE manually stopped, skipping auto-recovery"
    exit 0
fi

# Proceed with recovery
recover_service "$SERVICE"
```

---

## Monitoring Auto-Recovery

### Check Recovery Logs

```bash
# View recent health check executions
docker exec vai-container tail -100 /workspace/vai/logs/health-check.log

# Filter for specific service
docker exec vai-container grep "minio" /workspace/vai/logs/health-check.log | tail -20

# Filter for failures only
docker exec vai-container grep "failed\|error" /workspace/vai/logs/health-check.log
```

### Check Recovery Success Rate

```bash
# Count total health checks
TOTAL=$(grep "Health check" /workspace/vai/logs/health-check.log | wc -l)

# Count failures
FAILURES=$(grep "Health check failed" /workspace/vai/logs/health-check.log | wc -l)

# Count recoveries
RECOVERIES=$(grep "Successfully recovered" /workspace/vai/logs/health-check.log | wc -l)

# Calculate success rate
SUCCESS_RATE=$(( (TOTAL - FAILURES) * 100 / TOTAL ))

echo "Health check success rate: ${SUCCESS_RATE}%"
echo "Auto-recovery success rate: $(( RECOVERIES * 100 / FAILURES ))%"
```

### Alert History

```bash
# Query ntfy.sh for recovery-related alerts
curl -s "https://ntfy.sh/khali-vps-alerts/json?poll=1&since=24h" | \
  jq -r '.[] | select(.title | contains("Recovery") or contains("Failed")) |
  "\(.time | strftime("%Y-%m-%d %H:%M:%S")) [\(.priority)] \(.title)"'
```

---

## Troubleshooting Auto-Recovery

### Recovery Keeps Failing

**Possible causes:**
1. restart_cmd doesn't actually start service
2. Startup delay too short
3. Resource exhaustion (memory, disk)
4. Dependency missing
5. Configuration error in service

**Debug:**
```bash
# Test restart command manually
docker exec services-container bash -c "RESTART_CMD_HERE"

# Check if process started
docker exec services-container pgrep -f "service-name"

# Check logs for errors
docker exec services-container tail -50 /workspace/vai/logs/service.log

# Check resources
docker stats services-container
df -h
free -h
```

### Auto-Recovery Not Running

**Possible causes:**
1. Cron job not configured
2. Health check script has syntax error
3. Health check script not executable

**Debug:**
```bash
# Check crontab
crontab -l | grep health-check

# Test health check script manually
bash -x /workspace/agent-infrastructure/scripts/health/run-health-checks.sh

# Check script permissions
ls -la /workspace/agent-infrastructure/scripts/health/run-health-checks.sh
```

### Too Many Recovery Attempts (Crash Loop)

**Solution:** Implement rate limiting (see Best Practices above)

**Temporary fix:**
```bash
# Create manual stop marker to prevent auto-recovery
docker exec services-container touch /var/run/manual-stop/SERVICE.stopped

# Fix underlying issue

# Remove stop marker to re-enable auto-recovery
docker exec services-container rm /var/run/manual-stop/SERVICE.stopped
```
