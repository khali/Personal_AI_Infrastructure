# Workflow: Modify Service

**Purpose:** Update service configuration, health checks, schedules, or restart commands.

**References needed:**
- `references/services-registry-schema.md` - Service definition schema
- `references/health-check-patterns.md` - Health check options
- `references/deployment-procedure.md` - Deployment steps

---

## Step 1: Identify What to Modify

Ask or infer from context:
- **Health check configuration** - Interval, timeout, endpoint, type
- **Restart command** - How service starts/restarts
- **Cron schedule** - When cron job runs
- **Enable/disable service** - Toggle service on/off
- **Notification settings** - Alert topic, severity
- **Dependencies** - Service startup order
- **Timeout** - Maximum execution time for cron jobs

---

## Step 2: Read Current Configuration

**View current service configuration:**

```bash
# View specific service
cat /workspace/agent-infrastructure/config/system-config.json | jq '.services.SERVICE_NAME'

# View specific cron job
cat /workspace/agent-infrastructure/config/system-config.json | jq '.cron_jobs.JOB_NAME'
```

**Display current values:**
```
Current Configuration for 'minio':
==================================
Type: daemon
Container: services
Enabled: true

Health Check:
  Type: http
  Endpoint: http://localhost:9000/minio/health/live
  Interval: 60 seconds
  Timeout: 5 seconds

Restart Command:
  /usr/local/bin/minio server /data --console-address :9001 >> /workspace/vai/logs/minio.log 2>&1 &

Log Path: /workspace/vai/logs/minio.log
Notify On Fail: alerts
Dependencies: []
```

---

## Step 3: Make Configuration Changes

### Modify Health Check

**Change health check interval:**
```bash
jq '.services.minio.health_check.interval_seconds = 120' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

**Change health check endpoint:**
```bash
jq '.services.minio.health_check.endpoint = "http://localhost:9000/minio/health/ready"' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

**Change health check type:**
```bash
# From HTTP to process check
jq '.services.redis.health_check = {
  "type": "process",
  "process_name": "redis-server",
  "interval_seconds": 60
}' /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

### Modify Restart Command

**Update restart command:**
```bash
NEW_CMD="/usr/local/bin/minio server /data --console-address :9001 --quiet >> /workspace/vai/logs/minio.log 2>&1 &"

jq --arg cmd "$NEW_CMD" '.services.minio.restart_cmd = $cmd' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

### Modify Cron Schedule

**Change cron job schedule:**
```bash
# From every minute to every 5 minutes
jq '.cron_jobs."minio-sync".schedule = "*/5 * * * *"' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json

# Update actual crontab
docker exec services-container bash -c '
crontab -l | sed "s|^\*/1 \* \* \* \* /usr/local/bin/obsidian-bisync-minio.sh|*/5 * * * * /usr/local/bin/obsidian-bisync-minio.sh|" | crontab -
'
```

### Enable/Disable Service

**Disable service (stop it from auto-starting):**
```bash
jq '.services.minio.enabled = false' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json

# Stop the service
docker exec services-container pkill -f "minio server"
```

**Enable service (allow auto-starting):**
```bash
jq '.services.minio.enabled = true' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json

# Start the service
docker exec services-container bash -c "RESTART_COMMAND_HERE"
```

### Modify Timeout (for cron jobs)

**Change timeout for cron job:**
```bash
jq '.cron_jobs."backup-vault".timeout_seconds = 600' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

### Modify Notification Settings

**Change notification topic:**
```bash
jq '.services.minio.notify_on_fail = "critical-alerts"' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

**Disable notifications for a service:**
```bash
jq '.services.minio.notify_on_fail = null' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

---

## Step 4: Validate Changes

**Validate JSON syntax:**
```bash
jq empty /workspace/agent-infrastructure/config/system-config.json
echo "JSON syntax valid: $?"
```

**Verify specific change:**
```bash
# Check the modified field
cat /workspace/agent-infrastructure/config/system-config.json | \
  jq '.services.minio.health_check.interval_seconds'

# Expected output: 120 (if you changed it to 120)
```

---

## Step 5: Test Changes Locally

**Test new health check configuration:**
```bash
# If changed health check endpoint
docker exec services-container curl -f http://localhost:9000/minio/health/ready

# If changed to process check
docker exec services-container pgrep -f "redis-server"
```

**Test new restart command:**
```bash
# Stop service
docker exec services-container pkill -f "SERVICE_NAME"

# Run new restart command
docker exec services-container bash -c "NEW_RESTART_COMMAND"

# Verify started
docker exec services-container pgrep -f "SERVICE_NAME"
```

**Test new cron schedule (manual run):**
```bash
# Run cron job command manually
docker exec services-container bash /path/to/cron/script.sh

# Check exit code
echo $?

# Verify crontab updated
docker exec services-container crontab -l | grep "JOB_NAME"
```

---

## Step 6: Backup and Commit Changes

**Create backup before committing:**
```bash
cp /workspace/agent-infrastructure/config/system-config.json \
   /workspace/PAI/.claude/history/backups/system-config-$(date +%Y%m%d-%H%M%S).json.backup
```

**Commit changes:**
```bash
cd /workspace/agent-infrastructure

git add config/system-config.json

git commit -m "feat: Modify SERVICE_NAME configuration

- Changed health check interval from 60s to 120s
- Updated health check endpoint to /health/ready
- [Other changes as applicable]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

---

## Step 7: Deploy to VPS

**Deploy updated configuration:**
```bash
scp -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    /workspace/agent-infrastructure/config/system-config.json \
    root@31.97.226.160:/workspace/agent-infrastructure/config/system-config.json
```

**If restart command changed, restart service on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container pkill -f 'SERVICE_NAME'"

ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container bash -c 'NEW_RESTART_COMMAND'"
```

**If cron schedule changed, update VPS crontab:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container bash -c 'crontab -l | sed \"s/OLD_SCHEDULE/NEW_SCHEDULE/\" | crontab -'"
```

---

## Step 8: Verify Deployment

**Verify service is running with new config:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container pgrep -f 'SERVICE_NAME'"
```

**Test new health check on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container NEW_HEALTH_CHECK_COMMAND"
```

**Monitor health checks for 15 minutes:**
```bash
# If interval changed to 120s, wait for at least 2 cycles (240s = 4 minutes)
# If interval is 60s, wait for 3 cycles (180s = 3 minutes)

sleep 900  # 15 minutes to be safe

# Check logs for health check results
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "grep 'SERVICE_NAME' /var/log/syslog | tail -20"
```

**Verify cron schedule on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container crontab -l | grep 'JOB_NAME'"
```

---

## Step 9: Update Documentation

**Update service documentation in Obsidian:**

Find the service doc in `/workspace/khali-obsidian-vault/Infrastructure/Services/SERVICE_NAME.md`

Update relevant sections:
```markdown
## Recent Changes

### 2025-12-05: Health Check Modification
- Changed interval from 60s to 120s
- Updated endpoint from `/health/live` to `/health/ready`
- Reason: Reduce health check overhead, use more accurate endpoint

### 2025-12-05: Restart Command Update
- Added `--quiet` flag to reduce log verbosity
- Reason: Logs were too noisy during normal operation
```

---

## Step 10: Monitor for Issues

**Check for alerts in next 24 hours:**
```bash
# Query ntfy.sh for recent alerts about this service
curl -s "https://ntfy.sh/khali-vps-alerts/json?poll=1&since=24h" | \
  jq -r '.[] | select(.title | contains("SERVICE_NAME")) |
  "\(.time | strftime("%Y-%m-%d %H:%M:%S")) [\(.priority)] \(.title): \(.message)"'
```

**Check service logs for errors:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container grep -i 'error\|fail\|critical' /workspace/vai/logs/SERVICE_NAME.log | tail -50"
```

---

## Completion Checklist

- [ ] Identified what configuration to modify
- [ ] Read current configuration
- [ ] Made changes to system-config.json using jq
- [ ] Validated JSON syntax
- [ ] Tested changes locally in dev environment
- [ ] Created backup of configuration
- [ ] Committed changes to git
- [ ] Deployed updated config to VPS
- [ ] Restarted affected services on VPS
- [ ] Updated crontab if cron schedule changed
- [ ] Verified deployment with health checks (multiple cycles)
- [ ] Updated service documentation
- [ ] Monitored for issues in first 24 hours
- [ ] User informed of configuration changes

---

## Rollback Procedure

**If modification causes issues:**

1. **Restore previous configuration:**
```bash
scp -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    /workspace/PAI/.claude/history/backups/system-config-TIMESTAMP.json.backup \
    root@31.97.226.160:/workspace/agent-infrastructure/config/system-config.json
```

2. **Restart service with old configuration:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container pkill -f 'SERVICE_NAME'"

ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container bash -c 'OLD_RESTART_COMMAND'"
```

3. **Revert crontab if needed:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container bash -c 'crontab -l | sed \"s/NEW_SCHEDULE/OLD_SCHEDULE/\" | crontab -'"
```

4. **Revert git commit:**
```bash
cd /workspace/agent-infrastructure
git revert HEAD
git push
```
