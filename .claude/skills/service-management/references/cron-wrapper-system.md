# Cron Wrapper System

**Purpose:** Standardized execution wrapper for all cron jobs providing logging, pause/resume, error handling, and notifications.

---

## Overview

All cron jobs in the agent-infrastructure MUST use the cron-wrapper.sh pattern for consistent behavior and management.

**Wrapper script location:** `/usr/local/bin/cron-wrapper.sh`

**Pattern:**
```bash
SCHEDULE /usr/local/bin/cron-wrapper.sh JOB_NAME "COMMAND"
```

---

## Why Use cron-wrapper.sh?

**Without wrapper (old approach):**
```bash
*/5 * * * * /usr/local/bin/monitor-minio-sync.sh >> /workspace/vai/logs/minio-monitor.log 2>&1
```

**Problems:**
- No centralized logging
- No pause/resume capability
- No error tracking
- No execution time metrics
- No failure notifications
- Inconsistent log formats

**With wrapper (current standard):**
```bash
*/5 * * * * /usr/local/bin/cron-wrapper.sh minio-monitor "/usr/local/bin/monitor-minio-sync.sh"
```

**Benefits:**
- ✅ Standardized logging to `/var/log/cron/`
- ✅ Pause/resume via simple pause file
- ✅ Automatic error logging and notifications
- ✅ Execution time tracking
- ✅ Consistent timestamp format (ISO 8601)
- ✅ Per-job log files

---

## Usage

### Basic Pattern

```bash
SCHEDULE /usr/local/bin/cron-wrapper.sh JOB_NAME "COMMAND"
```

**Parameters:**
- `SCHEDULE` - Standard cron expression (e.g., `*/5 * * * *`)
- `JOB_NAME` - Unique identifier for the job (e.g., `minio-sync`, `backup-vault`)
- `COMMAND` - Full command to execute (quoted to preserve arguments)

### Examples

**Every minute MinIO sync:**
```bash
* * * * * /usr/local/bin/cron-wrapper.sh minio-sync "/usr/local/bin/obsidian-bisync-minio.sh"
```

**Every 5 minutes health check:**
```bash
*/5 * * * * /usr/local/bin/cron-wrapper.sh health-check "/usr/local/bin/container-health-check.sh"
```

**Daily at 3 AM log rotation:**
```bash
0 3 * * * /usr/local/bin/cron-wrapper.sh log-rotate "/usr/local/bin/rotate-logs.sh"
```

**Hourly backup with arguments:**
```bash
0 * * * * /usr/local/bin/cron-wrapper.sh backup-vault "/usr/local/bin/backup.sh --target /workspace/obsidian --compress"
```

---

## What the Wrapper Does

### 1. Pause Check

Before executing, checks if job is paused:
```bash
PAUSE_FILE="/home/devuser/ai-global/config/cron-pause/${JOB_NAME}.paused"

if [ -f "$PAUSE_FILE" ]; then
    exit 0  # Exit silently without executing
fi
```

**How to pause a job:**
```bash
# Create pause file
docker exec services-container touch /home/devuser/ai-global/config/cron-pause/minio-sync.paused

# Job will skip execution on next scheduled run
```

**How to resume a job:**
```bash
# Remove pause file
docker exec services-container rm /home/devuser/ai-global/config/cron-pause/minio-sync.paused

# Job will execute on next scheduled run
```

### 2. Command Execution

Executes the command and captures all output (stdout + stderr):
```bash
OUTPUT=$(eval "$COMMAND" 2>&1)
EXIT_CODE=$?
```

### 3. Logging

**Three log files are maintained:**

**A. Wrapper log** - All job starts/ends with exit codes and duration
- Location: `/var/log/cron/cron-wrapper.log`
- Format: `[TIMESTAMP] [JOB_NAME] STATUS exit=N duration=Ns`

Example:
```
[2025-12-05T14:30:00+0000] [minio-sync] START
[2025-12-05T14:30:03+0000] [minio-sync] END exit=0 duration=3s
[2025-12-05T14:35:00+0000] [minio-monitor] START
[2025-12-05T14:35:02+0000] [minio-monitor] FAILED exit=1 duration=2s
```

**B. Job-specific log** - Full output from each job execution
- Location: `/var/log/cron/${JOB_NAME}.log`
- Format: Job output with timestamp headers

Example `/var/log/cron/minio-sync.log`:
```
=== 2025-12-05T14:30:00+0000 ===
Starting MinIO sync...
Syncing 142 files...
✅ Sync completed successfully

=== 2025-12-05T14:31:00+0000 ===
Starting MinIO sync...
No changes detected
```

**C. Error log** - Failed job details with last 10 lines of output
- Location: `/var/log/cron/cron-errors.log`
- Format: Timestamp, job name, exit code, command, output tail

Example:
```
[2025-12-05T14:35:02+0000] [minio-monitor] FAILED exit=1
Command: /usr/local/bin/monitor-minio-sync.sh
Last 10 lines of output:
Checking sync status...
ERROR: Sync log not updated in 10 minutes
Expected: /workspace/vai/logs/minio-sync.log
Last modified: 15 minutes ago
---
```

### 4. Error Notifications

On job failure (exit code ≠ 0), sends notification via ntfy.sh:
```bash
if [ $EXIT_CODE -ne 0 ]; then
    if [ -x /usr/local/bin/notify.sh ]; then
        /usr/local/bin/notify.sh "Cron job $JOB_NAME failed (exit=$EXIT_CODE)"
    fi
fi
```

**User receives:** Push notification to phone/desktop with job name and exit code

---

## Pause/Resume Management

### Via manage-service.sh Script

**Pause a job:**
```bash
bash /workspace/agent-infrastructure/scripts/sync/manage-service.sh pause minio-sync
```

**Resume a job:**
```bash
bash /workspace/agent-infrastructure/scripts/sync/manage-service.sh resume minio-sync
```

**Check status:**
```bash
bash /workspace/agent-infrastructure/scripts/sync/manage-service.sh status
```

### Manual Pause/Resume

**Pause:**
```bash
docker exec services-container mkdir -p /home/devuser/ai-global/config/cron-pause
docker exec services-container touch /home/devuser/ai-global/config/cron-pause/JOB_NAME.paused
```

**Resume:**
```bash
docker exec services-container rm /home/devuser/ai-global/config/cron-pause/JOB_NAME.paused
```

**Check if paused:**
```bash
docker exec services-container ls /home/devuser/ai-global/config/cron-pause/
```

---

## Monitoring Cron Jobs

### Check Wrapper Log

**View recent activity:**
```bash
docker exec services-container tail -50 /var/log/cron/cron-wrapper.log
```

**Filter by job:**
```bash
docker exec services-container grep "minio-sync" /var/log/cron/cron-wrapper.log | tail -20
```

**Find failures:**
```bash
docker exec services-container grep "FAILED" /var/log/cron/cron-wrapper.log | tail -20
```

### Check Job-Specific Log

```bash
# View last execution
docker exec services-container tail -50 /var/log/cron/minio-sync.log

# Follow live
docker exec services-container tail -f /var/log/cron/minio-sync.log
```

### Check Error Log

```bash
# View recent errors
docker exec services-container tail -100 /var/log/cron/cron-errors.log

# Filter by job
docker exec services-container grep "minio-monitor" /var/log/cron/cron-errors.log
```

### Check Execution Frequency

```bash
# Count executions in last hour
docker exec services-container grep "minio-sync.*START" /var/log/cron/cron-wrapper.log | \
    grep "$(date +%Y-%m-%d)" | tail -60 | wc -l
```

---

## Adding New Cron Jobs

### Step 1: Add to system-config.json

```json
{
  "cron_jobs": {
    "backup-vault": {
      "enabled": true,
      "container": "services",
      "schedule": "0 3 * * *",
      "script": "/workspace/agent-infrastructure/scripts/backup-obsidian-vault.sh",
      "log_path": "/var/log/cron/backup-vault.log",
      "timeout_seconds": 300,
      "notify_on_fail": "alerts"
    }
  }
}
```

### Step 2: Add to Crontab File

**Edit:** `/workspace/agent-infrastructure/docker/services/minio-bisync-cron`

**Add line:**
```bash
0 3 * * * /usr/local/bin/cron-wrapper.sh backup-vault "/workspace/agent-infrastructure/scripts/backup-obsidian-vault.sh"
```

### Step 3: Deploy to Container

```bash
# Copy updated crontab to container
docker cp /workspace/agent-infrastructure/docker/services/minio-bisync-cron \
         services-container:/etc/cron.d/service-jobs

# Set permissions
docker exec services-container chmod 0644 /etc/cron.d/service-jobs

# Reload cron
docker exec services-container service cron reload
```

### Step 4: Verify

```bash
# Check crontab
docker exec services-container cat /etc/cron.d/service-jobs | grep "backup-vault"

# Wait for first execution, then check logs
docker exec services-container tail -20 /var/log/cron/cron-wrapper.log | grep "backup-vault"
```

---

## Troubleshooting

### Job Not Executing

**Check if paused:**
```bash
docker exec services-container test -f /home/devuser/ai-global/config/cron-pause/JOB_NAME.paused && echo "PAUSED" || echo "NOT PAUSED"
```

**Check crontab syntax:**
```bash
docker exec services-container cat /etc/cron.d/service-jobs | grep "JOB_NAME"
```

**Check cron service running:**
```bash
docker exec services-container service cron status
```

### Job Failing Repeatedly

**Check error log:**
```bash
docker exec services-container grep "JOB_NAME" /var/log/cron/cron-errors.log | tail -5
```

**Run job manually:**
```bash
docker exec services-container /usr/local/bin/cron-wrapper.sh JOB_NAME "COMMAND"
echo "Exit code: $?"
```

**Check job-specific log:**
```bash
docker exec services-container tail -100 /var/log/cron/JOB_NAME.log
```

### Logs Not Appearing

**Check log directory exists:**
```bash
docker exec services-container ls -la /var/log/cron/
```

**Create if missing:**
```bash
docker exec services-container mkdir -p /var/log/cron
```

**Check wrapper script exists:**
```bash
docker exec services-container ls -la /usr/local/bin/cron-wrapper.sh
```

---

## Known Issues

### Path Mismatch Bug (CRITICAL)

**Problem:** Pause directory paths differ between scripts

**cron-wrapper.sh uses:**
```bash
PAUSE_DIR="/home/devuser/ai-global/config/cron-pause"
```

**manage-service.sh uses:**
```bash
PAUSE_DIR="/var/run/cron-pause"
```

**Impact:** Pause files created by manage-service.sh are NOT checked by cron-wrapper.sh

**Workaround until fixed:**

**Option 1: Use cron-wrapper path manually**
```bash
# Pause
docker exec services-container touch /home/devuser/ai-global/config/cron-pause/JOB_NAME.paused

# Resume
docker exec services-container rm /home/devuser/ai-global/config/cron-pause/JOB_NAME.paused
```

**Option 2: Fix manage-service.sh**
Change line 16 in `/workspace/agent-infrastructure/scripts/sync/manage-service.sh`:
```bash
# Before
PAUSE_DIR="/var/run/cron-pause"

# After
PAUSE_DIR="/home/devuser/ai-global/config/cron-pause"
```

**Proper fix:** Align both scripts to use the same centralized path in ai-global.

---

## Best Practices

1. **Always use cron-wrapper** - Never add cron jobs without the wrapper
2. **Use descriptive job names** - Clear identifiers like `backup-vault`, not `backup1`
3. **Quote commands** - Always quote the COMMAND parameter: `"..."`
4. **Test manually first** - Run with wrapper manually before deploying to crontab
5. **Monitor error log** - Check `/var/log/cron/cron-errors.log` weekly
6. **Document in system-config.json** - Keep registry and crontab in sync
7. **Use pause, not disable** - Pause jobs temporarily instead of removing from crontab
8. **Set appropriate timeouts** - Allow enough time for job to complete in system-config.json

---

## Reference: Current Cron Jobs

**File:** `/workspace/agent-infrastructure/docker/services/minio-bisync-cron`

```bash
# MinIO sync (every minute)
* * * * * /usr/local/bin/cron-wrapper.sh minio-sync "/usr/local/bin/obsidian-bisync-minio.sh"

# Service health check (every 5 minutes)
*/5 * * * * /usr/local/bin/cron-wrapper.sh health-check "/usr/local/bin/container-health-check.sh"

# MinIO sync monitoring (every 5 minutes)
*/5 * * * * /usr/local/bin/cron-wrapper.sh minio-monitor "/usr/local/bin/monitor-minio-sync.sh"

# Log rotation (daily at 3 AM)
0 3 * * * /usr/local/bin/cron-wrapper.sh log-rotate "/usr/local/bin/rotate-logs.sh"
```
