# Health Check Patterns

**Purpose:** Patterns and best practices for implementing service health checks in the infrastructure.

---

## Health Check Types

### 1. HTTP Health Check

**Best for:** Web services, APIs, services with HTTP endpoints

**Pros:**
- Most reliable (checks actual functionality)
- Can validate response content
- Standard health endpoint pattern

**Cons:**
- Requires HTTP server running
- Slightly slower than process checks

**Configuration:**
```json
"health_check": {
  "type": "http",
  "endpoint": "http://localhost:9000/health",
  "interval_seconds": 60,
  "timeout_seconds": 5,
  "expected_status": 200,
  "expected_body": "OK"
}
```

**Implementation:**
```bash
#!/bin/bash
# Health check script

ENDPOINT="http://localhost:9000/health"
TIMEOUT=5

if curl -f -s -m "$TIMEOUT" "$ENDPOINT" | grep -q "OK"; then
    echo "Healthy"
    exit 0
else
    echo "Unhealthy"
    exit 1
fi
```

**Common HTTP Health Endpoints:**
- MinIO: `http://localhost:9000/minio/health/live`
- Syncthing: `http://localhost:8384/rest/system/status`
- Most apps: `http://localhost:PORT/health` or `/healthz`

---

### 2. TCP Port Check

**Best for:** Network services without HTTP endpoints (Redis, PostgreSQL, MySQL)

**Pros:**
- Fast and lightweight
- No application-specific logic needed
- Works for any network service

**Cons:**
- Only checks if port is open, not if service is functional
- Can give false positives

**Configuration:**
```json
"health_check": {
  "type": "tcp",
  "host": "localhost",
  "port": 6379,
  "interval_seconds": 60,
  "timeout_seconds": 5
}
```

**Implementation:**
```bash
#!/bin/bash
# TCP port check

HOST="localhost"
PORT=6379
TIMEOUT=5

if timeout "$TIMEOUT" bash -c "cat < /dev/null > /dev/tcp/$HOST/$PORT" 2>/dev/null; then
    echo "Port $PORT open"
    exit 0
else
    echo "Port $PORT closed"
    exit 1
fi
```

**Alternative using nc (netcat):**
```bash
nc -z -w 5 localhost 6379 || exit 1
```

---

### 3. Process Check

**Best for:** Background services, daemons without network interfaces

**Pros:**
- Very fast
- No network overhead
- Simple implementation

**Cons:**
- Only checks if process exists, not if it's healthy
- Process can be hung but still "running"

**Configuration:**
```json
"health_check": {
  "type": "process",
  "process_name": "redis-server",
  "interval_seconds": 60
}
```

**Implementation:**
```bash
#!/bin/bash
# Process check

PROCESS_NAME="redis-server"

if pgrep -f "$PROCESS_NAME" > /dev/null; then
    echo "Process $PROCESS_NAME running"
    exit 0
else
    echo "Process $PROCESS_NAME not running"
    exit 1
fi
```

**Advanced process check (with PID count):**
```bash
#!/bin/bash
PROCESS_NAME="redis-server"
MIN_INSTANCES=1
MAX_INSTANCES=1

COUNT=$(pgrep -f "$PROCESS_NAME" | wc -l)

if [ "$COUNT" -ge "$MIN_INSTANCES" ] && [ "$COUNT" -le "$MAX_INSTANCES" ]; then
    echo "Process count OK: $COUNT instance(s)"
    exit 0
else
    echo "Process count wrong: $COUNT instance(s) (expected $MIN_INSTANCES-$MAX_INSTANCES)"
    exit 1
fi
```

---

### 4. Custom Health Check

**Best for:** Complex validation, multi-step checks, application-specific logic

**Pros:**
- Maximum flexibility
- Can check anything
- Can combine multiple checks

**Cons:**
- Requires custom script
- More complex to maintain
- Slower if doing multiple checks

**Configuration:**
```json
"health_check": {
  "type": "custom",
  "command": "/workspace/agent-infrastructure/scripts/health/check-redis.sh",
  "interval_seconds": 60,
  "timeout_seconds": 10
}
```

**Example Custom Health Check Script:**
```bash
#!/bin/bash
# /workspace/agent-infrastructure/scripts/health/check-redis.sh

set -euo pipefail

# Check 1: Process running
if ! pgrep -f "redis-server" > /dev/null; then
    echo "ERROR: Redis process not running"
    exit 1
fi

# Check 2: Port listening
if ! timeout 5 bash -c "cat < /dev/null > /dev/tcp/localhost/6379" 2>/dev/null; then
    echo "ERROR: Redis port 6379 not accessible"
    exit 1
fi

# Check 3: Can execute commands
if ! echo "PING" | redis-cli 2>/dev/null | grep -q "PONG"; then
    echo "ERROR: Redis not responding to PING"
    exit 1
fi

# Check 4: Memory usage reasonable
MEMORY_USED=$(redis-cli INFO memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
echo "Redis memory usage: $MEMORY_USED"

echo "All checks passed"
exit 0
```

**Multi-service dependency check:**
```bash
#!/bin/bash
# Check if service and all dependencies are healthy

# Check Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "ERROR: Redis dependency not healthy"
    exit 1
fi

# Check MinIO
if ! curl -f -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "ERROR: MinIO dependency not healthy"
    exit 1
fi

# Check own service
if ! pgrep -f "my-service" > /dev/null; then
    echo "ERROR: Service process not running"
    exit 1
fi

echo "All dependencies and service healthy"
exit 0
```

---

## Health Check Best Practices

### 1. Choose Appropriate Interval

**Fast-changing services:**
- Interval: 30-60 seconds
- Examples: Web apps, APIs, cron jobs

**Slow-changing services:**
- Interval: 300-600 seconds (5-10 minutes)
- Examples: Backup services, monitoring

**Critical services:**
- Interval: 15-30 seconds
- Examples: Database, message queue, auth service

### 2. Set Realistic Timeouts

**Rule of thumb:** Timeout should be 10-20% of interval

**Examples:**
- Interval 60s → Timeout 5-10s
- Interval 300s → Timeout 30-60s

**Never:** Timeout >= Interval (causes overlapping checks)

### 3. Use Layered Health Checks

**Layer 1: Process check** (fastest, least reliable)
```bash
pgrep -f "service-name"
```

**Layer 2: Port check** (fast, moderately reliable)
```bash
nc -z localhost 9000
```

**Layer 3: Endpoint check** (slower, most reliable)
```bash
curl -f http://localhost:9000/health
```

**Implementation:**
```bash
#!/bin/bash
# Layered health check

# Quick check: Process running
if ! pgrep -f "minio" > /dev/null; then
    exit 1
fi

# Medium check: Port open
if ! nc -z localhost 9000 2>/dev/null; then
    exit 1
fi

# Deep check: Health endpoint responding
if ! curl -f -s -m 5 http://localhost:9000/minio/health/live; then
    exit 1
fi

exit 0
```

### 4. Return Clear Exit Codes

**Standard:**
- `exit 0` - Healthy
- `exit 1` - Unhealthy
- `exit 2` - Unknown/Warning

**Log output for debugging:**
```bash
if health_check_passes; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] Service healthy"
    exit 0
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] Service unhealthy"
    exit 1
fi
```

### 5. Handle Startup Grace Period

**Problem:** Service needs time to fully start, health checks fail immediately after restart

**Solution:** Wait period before first health check after restart

```bash
#!/bin/bash
# Health check with startup grace period

STATE_FILE="/var/run/service-restart-time"

# If service just restarted (within last 30 seconds), skip health check
if [ -f "$STATE_FILE" ]; then
    RESTART_TIME=$(cat "$STATE_FILE")
    NOW=$(date +%s)
    ELAPSED=$((NOW - RESTART_TIME))

    if [ $ELAPSED -lt 30 ]; then
        echo "Startup grace period: ${ELAPSED}s elapsed, waiting..."
        exit 0  # Consider healthy during grace period
    fi
fi

# Normal health check
curl -f http://localhost:9000/health || exit 1
```

### 6. Avoid False Positives

**Bad:** Check only if process exists
```bash
# BAD: Process could be hung
pgrep -f "service" || exit 1
```

**Good:** Check if service actually responds
```bash
# GOOD: Validates functionality
curl -f http://localhost:9000/health || exit 1
```

### 7. Implement Health Check Caching

**Problem:** Health checks can be expensive, running too frequently wastes resources

**Solution:** Cache health check results for short period

```bash
#!/bin/bash
CACHE_FILE="/tmp/health-check-cache"
CACHE_TTL=10  # seconds

# Check if cache is valid
if [ -f "$CACHE_FILE" ]; then
    CACHE_TIME=$(stat -c %Y "$CACHE_FILE")
    NOW=$(date +%s)
    AGE=$((NOW - CACHE_TIME))

    if [ $AGE -lt $CACHE_TTL ]; then
        cat "$CACHE_FILE"
        exit $?
    fi
fi

# Run actual health check
if curl -f http://localhost:9000/health > /dev/null 2>&1; then
    echo "0" > "$CACHE_FILE"
    exit 0
else
    echo "1" > "$CACHE_FILE"
    exit 1
fi
```

---

## Common Patterns by Service Type

### Web Services (MinIO, Syncthing)
**Recommended:** HTTP health check
```json
{
  "type": "http",
  "endpoint": "http://localhost:PORT/health",
  "interval_seconds": 60,
  "timeout_seconds": 5
}
```

### Databases (Redis, PostgreSQL)
**Recommended:** TCP + command check
```bash
# Check port open
nc -z localhost 6379 || exit 1

# Check can execute command
redis-cli ping | grep -q "PONG" || exit 1
```

### Background Workers
**Recommended:** Process + log check
```bash
# Check process running
pgrep -f "worker" || exit 1

# Check recent activity in logs (processed something in last 5 min)
if find /workspace/vai/logs/worker.log -mmin -5 | grep -q "worker.log"; then
    exit 0
else
    exit 1
fi
```

### Cron Jobs
**Recommended:** Log timestamp check
```bash
# Check log file modified recently (within expected interval)
LOG_FILE="/workspace/vai/logs/cron-job.log"
MAX_AGE_MINUTES=10

if [ -f "$LOG_FILE" ]; then
    AGE=$(( ($(date +%s) - $(stat -c %Y "$LOG_FILE")) / 60 ))
    if [ $AGE -le $MAX_AGE_MINUTES ]; then
        exit 0
    fi
fi

exit 1
```

---

## Troubleshooting Health Checks

### Health Check Always Fails

**Possible causes:**
1. Timeout too short for service response time
2. Wrong endpoint or port
3. Service not fully started (increase grace period)
4. Permissions issue (health check can't access endpoint)

**Debug:**
```bash
# Run health check manually with verbose output
bash -x /path/to/health-check.sh

# Check service logs for errors
tail -50 /workspace/vai/logs/service.log

# Test endpoint directly
curl -v http://localhost:9000/health
```

### Health Check Never Fails (False Positives)

**Possible causes:**
1. Checking only process existence, not functionality
2. Health check script has bug (always returns 0)
3. Checking cached result instead of live status

**Fix:**
```bash
# Add functional check, not just process check
# Before:
pgrep -f "service" || exit 1

# After:
pgrep -f "service" || exit 1
curl -f http://localhost:9000/health || exit 1
```

### Health Check Takes Too Long

**Solution:** Reduce timeout, simplify check
```bash
# Before: Multiple sequential checks
curl http://localhost:9000/health
redis-cli ping
nc -z localhost 5432

# After: Parallel checks with timeout
timeout 5 bash -c '
    curl -f http://localhost:9000/health &
    redis-cli ping &
    wait
' || exit 1
```

---

## Testing Health Checks

**Test script manually:**
```bash
# Run in container
docker exec services-container bash /workspace/agent-infrastructure/scripts/health/check-service.sh
echo "Exit code: $?"
```

**Test with timeout:**
```bash
# Ensure completes within timeout
timeout 10 docker exec services-container bash /path/to/health-check.sh
```

**Test failure scenarios:**
```bash
# Stop service
docker exec services-container pkill -f "service-name"

# Run health check (should fail)
docker exec services-container bash /path/to/health-check.sh
echo "Exit code: $?" # Should be 1

# Restart service
docker exec services-container bash -c "RESTART_COMMAND"

# Run health check (should pass)
docker exec services-container bash /path/to/health-check.sh
echo "Exit code: $?" # Should be 0
```
