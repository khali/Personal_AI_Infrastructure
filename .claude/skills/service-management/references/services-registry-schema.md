# Services Registry Schema

**Location:** `/workspace/agent-infrastructure/config/system-config.json`

**Purpose:** Single source of truth for all infrastructure services, defining service configuration, health checks, and auto-recovery behavior.

---

## Top-Level Structure

```json
{
  "services": {
    "service-name": { /* daemon service definition */ }
  },
  "cron_jobs": {
    "job-name": { /* cron job definition */ }
  },
  "containers": {
    "container-name": { /* container configuration */ }
  }
}
```

---

## Daemon Service Schema

**Type:** Always-running background services (MinIO, Syncthing, Redis, databases)

```json
{
  "service-name": {
    "enabled": true,              // Boolean: Whether service should auto-start
    "type": "daemon",             // String: Must be "daemon"
    "container": "services",      // String: Container name (services|vai|agents)

    "health_check": {
      // Health check configuration (see Health Check Patterns)
      "type": "http|tcp|process|custom",
      "interval_seconds": 60,     // How often to check health
      "timeout_seconds": 5        // Max time for health check to complete
    },

    "restart_cmd": "string",      // Shell command to restart service
    "log_path": "string",         // Path to service log file
    "notify_on_fail": "string",   // ntfy.sh topic to notify on failures

    "dependencies": [],           // Array of service names this depends on
    "startup_delay_seconds": 0,   // Optional: Wait before starting after dependencies

    "ports": [                    // Optional: Ports service uses
      {"internal": 9000, "external": 9000, "protocol": "tcp"}
    ],

    "environment": {              // Optional: Environment variables
      "VAR_NAME": "value"
    },

    "volumes": [                  // Optional: Volume mounts
      {"host": "/path/host", "container": "/path/container", "mode": "rw"}
    ]
  }
}
```

### Required Fields:
- `enabled` - Boolean
- `type` - Must be "daemon"
- `container` - Container name
- `health_check` - Health check configuration object
- `restart_cmd` - Restart command string
- `log_path` - Log file path
- `notify_on_fail` - Notification topic

### Optional Fields:
- `dependencies` - Array of service names
- `startup_delay_seconds` - Integer
- `ports` - Array of port mappings
- `environment` - Object of env vars
- `volumes` - Array of volume mounts

---

## Cron Job Schema

**Type:** Scheduled tasks that run periodically

```json
{
  "job-name": {
    "enabled": true,              // Boolean: Whether job should run
    "schedule": "*/5 * * * *",    // Cron expression (minute hour day month weekday)
    "command": "string",          // Shell command to execute
    "container": "services",      // Container where job runs

    "log_path": "string",         // Path to job log file
    "timeout_seconds": 300,       // Max execution time before considered failed
    "notify_on_fail": "string",   // ntfy.sh topic to notify on failures

    "notify_on_success": false,   // Optional: Notify on successful completion
    "retry_on_failure": false,    // Optional: Retry if fails
    "max_retries": 3,             // Optional: Max retry attempts

    "environment": {              // Optional: Environment variables
      "VAR_NAME": "value"
    }
  }
}
```

### Required Fields:
- `enabled` - Boolean
- `schedule` - Cron expression string
- `command` - Command string
- `container` - Container name
- `log_path` - Log file path
- `timeout_seconds` - Integer
- `notify_on_fail` - Notification topic

### Optional Fields:
- `notify_on_success` - Boolean
- `retry_on_failure` - Boolean
- `max_retries` - Integer
- `environment` - Object of env vars

---

## Health Check Patterns

### HTTP Health Check
```json
"health_check": {
  "type": "http",
  "endpoint": "http://localhost:9000/health/live",
  "interval_seconds": 60,
  "timeout_seconds": 5,
  "expected_status": 200,          // Optional: Expected HTTP status
  "expected_body": "OK"            // Optional: Expected response body substring
}
```

**Implementation:**
```bash
curl -f -s -m 5 "http://localhost:9000/health/live" || exit 1
```

### TCP Health Check
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
timeout 5 bash -c "cat < /dev/null > /dev/tcp/localhost/6379" || exit 1
```

### Process Health Check
```json
"health_check": {
  "type": "process",
  "process_name": "redis-server",
  "interval_seconds": 60
}
```

**Implementation:**
```bash
pgrep -f "redis-server" > /dev/null || exit 1
```

### Custom Health Check
```json
"health_check": {
  "type": "custom",
  "command": "/workspace/agent-infrastructure/scripts/health/check-service.sh",
  "interval_seconds": 60,
  "timeout_seconds": 10
}
```

**Implementation:**
```bash
timeout 10 /workspace/agent-infrastructure/scripts/health/check-service.sh || exit 1
```

---

## Cron Schedule Expressions

**Format:** `minute hour day month weekday`

**Examples:**
- `*/1 * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour (at minute 0)
- `0 2 * * *` - Daily at 2 AM
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight
- `30 3 * * 1-5` - Weekdays at 3:30 AM

**Special Characters:**
- `*` - Any value
- `*/5` - Every 5th value
- `1-5` - Range from 1 to 5
- `1,3,5` - Specific values 1, 3, and 5
- `*/10` - Every 10th value

---

## Container Configuration

```json
{
  "containers": {
    "services": {
      "name": "services-container",
      "purpose": "Infrastructure services (MinIO, Syncthing)",
      "image": "ubuntu:22.04",
      "restart_policy": "unless-stopped",
      "networks": ["vai-network"],

      "ports": [
        {"internal": 8384, "external": 8384, "description": "Syncthing UI"},
        {"internal": 9000, "external": 9000, "description": "MinIO API"}
      ],

      "volumes": [
        {"host": "/workspace", "container": "/workspace", "mode": "rw"},
        {"host": "ai-global", "container": "/home/devuser/ai-global", "mode": "rw"}
      ],

      "health_check": {
        "test": "curl -f http://localhost:9000/minio/health/live || exit 1",
        "interval": "30s",
        "timeout": "10s",
        "retries": 3
      }
    }
  }
}
```

---

## Notification Topics

**Format:** ntfy.sh topic names

**Standard topics:**
- `alerts` - General service failures
- `critical-alerts` - Critical system failures
- `info` - Informational notifications
- `success` - Success notifications (usually disabled)

**Severity levels:**
- `CRITICAL` - Immediate action required, no cooldown
- `WARNING` - Attention needed, 60s cooldown
- `INFO` - Informational only, 300s cooldown

---

## Dependencies

**Purpose:** Ensure services start in correct order

**Example:**
```json
{
  "cache-service": {
    "dependencies": ["redis", "minio"]
  }
}
```

**Behavior:**
- Health checks wait until all dependencies are healthy
- Restart attempts wait for dependencies to be available
- Startup order determined by dependency graph

---

## Environment Variables

**Format:** Object with string values

```json
{
  "environment": {
    "MINIO_ROOT_USER": "admin",
    "MINIO_ROOT_PASSWORD": "${SECRET_MINIO_PASSWORD}",
    "LOG_LEVEL": "info"
  }
}
```

**Secret handling:**
- Use `${SECRET_NAME}` placeholder
- Actual secrets loaded from `/home/devuser/ai-global/config/.env`
- Never commit actual secrets to system-config.json

---

## Examples

### Complete Daemon Service Example:
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
    "dependencies": [],
    "ports": [
      {"internal": 9000, "external": 9000, "protocol": "tcp"},
      {"internal": 9001, "external": 9001, "protocol": "tcp"}
    ],
    "environment": {
      "MINIO_ROOT_USER": "admin",
      "MINIO_ROOT_PASSWORD": "${SECRET_MINIO_PASSWORD}"
    }
  }
}
```

### Complete Cron Job Example:
```json
{
  "minio-sync": {
    "enabled": true,
    "schedule": "*/1 * * * *",
    "command": "/usr/local/bin/obsidian-bisync-minio.sh",
    "container": "services",
    "log_path": "/workspace/vai/logs/minio-sync.log",
    "timeout_seconds": 300,
    "notify_on_fail": "alerts",
    "notify_on_success": false,
    "environment": {
      "RCLONE_CONFIG": "/home/devuser/.config/rclone/rclone.conf"
    }
  }
}
```

---

## Validation

**JSON syntax:**
```bash
jq empty /workspace/agent-infrastructure/config/system-config.json
```

**Required fields check:**
```bash
# Check daemon service has all required fields
jq '.services.SERVICE_NAME |
  has("enabled") and
  has("type") and
  has("container") and
  has("health_check") and
  has("restart_cmd") and
  has("log_path") and
  has("notify_on_fail")' \
  /workspace/agent-infrastructure/config/system-config.json
```

**Cron expression validation:**
```bash
# Install cronexpr or use online validator
echo "*/5 * * * *" | cronexpr
```

---

## Best Practices

1. **Always set `enabled: true` for active services** - Disabled services don't auto-start after system reboot

2. **Use specific health checks** - HTTP > TCP > Process > Custom (in order of reliability)

3. **Set appropriate intervals** - 60s for most services, 300s for slow-changing services

4. **Include dependencies** - Prevents startup failures due to missing dependencies

5. **Use standard notification topics** - "alerts" for failures, avoid per-service topics

6. **Log everything** - Every service and cron job must have a log_path

7. **Test locally first** - Always test service configuration in dev before VPS deployment

8. **Backup before changes** - Always backup system-config.json before modifications

9. **Validate after changes** - Always run `jq empty` to validate JSON syntax

10. **Document custom services** - Create Obsidian docs for all custom services
