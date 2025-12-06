# Workflow: Add Service

**Purpose:** Create new daemon service or cron job in the agent-infrastructure system.

**References needed:**
- `references/services-registry-schema.md` - Service definition schema
- `references/health-check-patterns.md` - Health check implementation
- `references/docker-integration.md` - Container and port configuration
- `references/deployment-procedure.md` - Deployment steps

---

## Step 1: Determine Service Type

Ask or infer from context:
- **Daemon service** - Always-running background service (e.g., MinIO, Syncthing, database)
- **Cron job** - Scheduled task that runs periodically (e.g., backups, monitoring)
- **System service** - OS-level service (rarely added, usually pre-configured)

**Ask user if not clear:** "What type of service do you want to add: daemon or cron job?"

---

## Step 2: Gather Service Information

### For Daemon Services:

**Required information:**
- **Service name** - Short identifier (e.g., "minio", "postgres", "redis")
- **Container** - Which container runs this service ("services", "vai", "agents")
- **Start command** - Full command to start the service
- **Health check** - How to verify service is healthy
- **Port(s)** - Port numbers if service needs external access
- **Dependencies** - Other services this depends on

**Example questions:**
```
Service name: redis
Container: services-container
Start command: /usr/local/bin/redis-server /etc/redis/redis.conf
Health check: TCP connection to localhost:6379
Ports needed: 6379 (for external Redis clients)
Log location: /workspace/vai/logs/redis.log
Dependencies: None
```

### For Cron Jobs:

**Required information:**
- **Job name** - Short identifier (e.g., "backup-vault", "cleanup-logs")
- **Schedule** - Cron expression (e.g., "0 2 * * *" for daily at 2 AM)
- **Command** - Full command or script path to execute
- **Container** - Which container runs this job
- **Timeout** - Maximum execution time before considering it failed

**Example questions:**
```
Job name: backup-vault
Schedule: 0 3 * * * (daily at 3 AM)
Command: /workspace/agent-infrastructure/scripts/backup-obsidian-vault.sh
Container: services-container
Timeout: 300s (5 minutes)
Log location: /workspace/vai/logs/backup-vault.log
```

---

## Step 3: Design Health Check

**Choose health check type based on service:**

### HTTP Health Check (for web services)
```json
"health_check": {
  "type": "http",
  "endpoint": "http://localhost:9000/health",
  "interval_seconds": 60,
  "timeout_seconds": 5
}
```

**Test health check:**
```bash
curl -f -s -m 5 http://localhost:9000/health || echo "Failed"
```

### Process Health Check (for background services)
```json
"health_check": {
  "type": "process",
  "process_name": "redis-server",
  "interval_seconds": 60
}
```

**Test health check:**
```bash
pgrep -f "redis-server" > /dev/null || echo "Failed"
```

### TCP Health Check (for network services)
```json
"health_check": {
  "type": "tcp",
  "host": "localhost",
  "port": 6379,
  "interval_seconds": 60
}
```

**Test health check:**
```bash
timeout 5 bash -c "cat < /dev/null > /dev/tcp/localhost/6379" || echo "Failed"
```

### Custom Health Check (for complex validation)
```json
"health_check": {
  "type": "custom",
  "command": "/workspace/agent-infrastructure/scripts/health/check-redis.sh",
  "interval_seconds": 60
}
```

**Create custom health check script:**
```bash
#!/bin/bash
# /workspace/agent-infrastructure/scripts/health/check-redis.sh

# Check if Redis is responding
if redis-cli ping | grep -q "PONG"; then
    exit 0  # Healthy
else
    exit 1  # Unhealthy
fi
```

---

## Step 4: Create Restart Command

**Daemon services need restart command for auto-recovery:**

**Pattern:**
```bash
# Start the service in background with logging
/usr/local/bin/service-name --config /etc/service/config.conf >> /workspace/vai/logs/service.log 2>&1 &
```

**Examples:**
```bash
# MinIO
/usr/local/bin/minio server /data --console-address :9001 >> /workspace/vai/logs/minio.log 2>&1 &

# Redis
/usr/local/bin/redis-server /etc/redis/redis.conf >> /workspace/vai/logs/redis.log 2>&1 &

# Syncthing
/usr/local/bin/syncthing serve --no-browser --home=/workspace/syncthing-config >> /workspace/vai/logs/syncthing.log 2>&1 &
```

**Test restart command manually:**
```bash
# Stop the service first
pkill -f "service-name"

# Run the restart command
eval "YOUR_RESTART_COMMAND"

# Verify it started
pgrep -f "service-name"
```

---

## Step 5: Update system-config.json

**Read current configuration:**
```bash
cat /workspace/agent-infrastructure/config/system-config.json | jq '.services'
```

**Add new service entry:**

### For Daemon Service:
```json
"redis": {
  "enabled": true,
  "type": "daemon",
  "container": "services",
  "health_check": {
    "type": "tcp",
    "host": "localhost",
    "port": 6379,
    "interval_seconds": 60
  },
  "restart_cmd": "/usr/local/bin/redis-server /etc/redis/redis.conf >> /workspace/vai/logs/redis.log 2>&1 &",
  "log_path": "/workspace/vai/logs/redis.log",
  "notify_on_fail": "alerts",
  "dependencies": []
}
```

### For Cron Job:
Add to `cron_jobs` section:
```json
"backup-vault": {
  "enabled": true,
  "schedule": "0 3 * * *",
  "script": "/workspace/agent-infrastructure/scripts/backup-obsidian-vault.sh",
  "container": "services",
  "log_path": "/workspace/vai/logs/cron/backup-vault.log",
  "description": "Daily backup of Obsidian vault"
}
```

**CRITICAL:** Log path MUST use `/workspace/vai/logs/cron/` prefix (not `/workspace/vai/logs/` directly). This matches where cron-wrapper.sh writes logs.

### Add Service Discovery Metadata

**For agent-accessible services**, add `usage` metadata for service discovery via `/vai:services`:

```json
"usage": {
  "command": "service-command [OPTIONS] ARGS",
  "options": [
    "--option1: Description of option 1",
    "--option2: Description of option 2"
  ],
  "examples": [
    "service-command 'example 1'",
    "service-command --option1 'example 2'"
  ],
  "documentation": "/path/to/detailed/docs.md"
}
```

**Example for Telegram service:**
```json
"telegram": {
  "enabled": true,
  "config_file": "/home/devuser/ai-global/config/telegram.conf",
  "script_path": "/usr/local/bin/send-telegram",
  "description": "Send Telegram messages from agents",
  "usage": {
    "command": "send-telegram [OPTIONS] TITLE MESSAGE",
    "options": [
      "--success: Success notification (green check)",
      "--urgent: Urgent alert (red alert)"
    ],
    "examples": [
      "send-telegram 'Task Complete' 'Deployment finished'",
      "send-telegram --success 'Build' 'All tests passed'"
    ],
    "documentation": "/workspace/agent-infrastructure/agent-infra-docs/TELEGRAM-NOTIFICATIONS.md"
  }
}
```

**Why add usage metadata:**
- Agents can discover services via `/vai:services list`
- Get usage details via `/vai:services <name>`
- Shown at session start in agent-infrastructure project
- Creates self-documenting service registry

**When to add usage metadata:**
- ✅ Services that agents invoke directly (notification services, utilities)
- ✅ Background services with management commands (e.g., "redis-cli")
- ❌ Pure background daemons with no agent interaction (e.g., internal cron jobs)

**What you get for free:**
- ✅ Automatic logging to job-specific log file
- ✅ Centralized error logging to `/workspace/vai/logs/cron/cron-errors.log`
- ✅ Wrapper logging to `/workspace/vai/logs/cron/cron-wrapper.log`
- ✅ Failure notifications via ntfy.sh (automatic)
- ✅ Pause/resume capability via manage-service.sh
- ✅ Job duration tracking and logging
- ✅ Exit code propagation for monitoring

**Use jq to add service:**
```bash
# Backup first
cp /workspace/agent-infrastructure/config/system-config.json \
   /workspace/agent-infrastructure/config/system-config.json.backup

# Add daemon service
jq '.services.redis = {
  "enabled": true,
  "type": "daemon",
  "container": "services",
  "health_check": {
    "type": "tcp",
    "host": "localhost",
    "port": 6379,
    "interval_seconds": 60
  },
  "restart_cmd": "/usr/local/bin/redis-server /etc/redis/redis.conf >> /workspace/vai/logs/redis.log 2>&1 &",
  "log_path": "/workspace/vai/logs/redis.log",
  "notify_on_fail": "alerts",
  "dependencies": []
}' /workspace/agent-infrastructure/config/system-config.json > /tmp/system-config.json.new

# Validate JSON syntax
jq empty /tmp/system-config.json.new && mv /tmp/system-config.json.new /workspace/agent-infrastructure/config/system-config.json
```

---

## Step 6: Update docker-compose.yml (if needed)

**Check if service needs port mapping:**

If service needs external access, update `/workspace/agent-infrastructure/docker/docker-compose.yml`:

```yaml
services:
  services:
    container_name: services-container
    ports:
      - "8384:8384"    # Syncthing
      - "22000:22000"  # Syncthing sync
      - "9000:9000"    # MinIO API
      - "9001:9001"    # MinIO Console
      - "6379:6379"    # Redis (NEW)
```

**Rebuild containers if docker-compose changed:**
```bash
cd /workspace/agent-infrastructure/docker
docker compose up -d --build
```

---

## Step 7: Create Installation Script (if needed)

**If service requires installation:**

Create script in `/workspace/agent-infrastructure/scripts/install/`:

```bash
#!/bin/bash
# /workspace/agent-infrastructure/scripts/install/install-redis.sh

set -euo pipefail

echo "Installing Redis..."

# Download and install
wget https://download.redis.io/redis-stable.tar.gz
tar -xzf redis-stable.tar.gz
cd redis-stable
make
make install

# Create config directory
mkdir -p /etc/redis

# Create default config
cat > /etc/redis/redis.conf << 'EOF'
bind 0.0.0.0
port 6379
daemonize no
loglevel notice
EOF

echo "Redis installed successfully"
```

**Run installation inside container:**
```bash
docker exec services-container bash /workspace/agent-infrastructure/scripts/install/install-redis.sh
```

---

## Step 8: Add Cron Job to Crontab (for cron jobs)

**CRITICAL DECISION:** Where does this cron job run?

### Option A: Inside services-container (most cron jobs)
**Use when:** Job doesn't need Docker CLI access, runs containerized tools
**Crontab file:** `/workspace/agent-infrastructure/docker/services/minio-bisync-cron`
**Pattern:** MUST use cron-wrapper.sh

### Option B: On VPS host (rare, special cases)
**Use when:** Job needs Docker CLI to inspect/manage containers, images, volumes
**Examples:** disk-usage-monitor (inspects Docker), container orchestration
**Crontab file:** `/workspace/agent-infrastructure/docker/host/vps-host-cron`
**Installation:** Manual via setup script (see below)

---

### For Container Cron Jobs (Option A - Most Common)

**IMPORTANT:** All container cron jobs MUST use the cron-wrapper.sh pattern for standardized logging, pause/resume, and error handling.

**Cron wrapper pattern:**
```bash
SCHEDULE /usr/local/bin/cron-wrapper.sh JOB_NAME "COMMAND"
```

**Add to crontab file:**

1. **Edit the crontab file:**
```bash
# Open the services container crontab file
vim /workspace/agent-infrastructure/docker/services/minio-bisync-cron
```

2. **Add new entry using cron-wrapper pattern:**
```bash
# Example: Daily backup at 3 AM
0 3 * * * /usr/local/bin/cron-wrapper.sh backup-vault "/workspace/agent-infrastructure/scripts/backup-obsidian-vault.sh"

# Example: Hourly cleanup
0 * * * * /usr/local/bin/cron-wrapper.sh cleanup-temp "/workspace/agent-infrastructure/scripts/cleanup-temp-files.sh"

# Example: Every 5 minutes monitoring
*/5 * * * * /usr/local/bin/cron-wrapper.sh monitor-service "/workspace/agent-infrastructure/scripts/monitor-service.sh"
```

**What cron-wrapper.sh provides:**
- Automatic logging to `/var/log/cron/${JOB_NAME}.log`
- Pause/resume capability via `/home/devuser/ai-global/config/cron-pause/${JOB_NAME}.paused`
- Error logging to `/var/log/cron/cron-errors.log`
- Failure notifications via ntfy.sh
- Execution time tracking

**Deploy updated crontab to container:**
```bash
# Copy crontab file into container
docker cp /workspace/agent-infrastructure/docker/services/minio-bisync-cron \
         services-container:/etc/cron.d/service-jobs

# Set proper permissions
docker exec services-container chmod 0644 /etc/cron.d/service-jobs

# Reload cron (may require cron restart)
docker exec services-container service cron reload
```

**Verify cron job added:**
```bash
# Check crontab file
docker exec services-container cat /etc/cron.d/service-jobs | grep "backup-vault"

# Check cron wrapper log after next execution
docker exec services-container tail -20 /var/log/cron/cron-wrapper.log | grep "backup-vault"
```

**Known Issue (Path Mismatch Bug):**
⚠️ There's currently a path mismatch between `cron-wrapper.sh` and `manage-service.sh`:
- `cron-wrapper.sh` checks pause files in: `/home/devuser/ai-global/config/cron-pause/`
- `manage-service.sh` creates pause files in: `/var/run/cron-pause/`

Until this is fixed, pause/resume may not work correctly. Use the cron-wrapper.sh path for now.

---

### For Host Cron Jobs (Option B - Special Cases Only)

**When to use:** Job needs Docker CLI access to inspect containers, images, volumes, or manage Docker itself.

**Example:** disk-usage-monitor (inspects orphaned images, volumes, build cache)

**Steps:**

1. **Edit the host crontab file:**
```bash
vim /workspace/agent-infrastructure/docker/host/vps-host-cron
```

2. **Add new entry (direct command, NO cron-wrapper):**
```bash
# Disk usage monitoring - runs hourly (needs Docker CLI)
0 * * * * /workspace/agent-infrastructure/scripts/monitoring/disk-usage-monitor.sh >> /workspace/vai/logs/cron/disk-usage-monitor.log 2>&1
```

**CRITICAL:** Host cron jobs do NOT use cron-wrapper.sh because:
- They run on VPS host (cron-wrapper is in containers)
- They need Docker CLI (containers don't have it)
- Logging is handled directly with `>>` redirect

3. **Commit the host crontab file:**
```bash
git add docker/host/vps-host-cron
git commit -m "feat: Add host cron job for X"
```

4. **Deploy to VPS (must be done manually):**
```bash
# Copy files to VPS
scp -i ~/.ssh/id_ed25519_container \
    docker/host/vps-host-cron \
    root@31.97.226.160:/workspace/agent-infrastructure/docker/host/vps-host-cron

scp -i ~/.ssh/id_ed25519_container \
    scripts/setup/install-host-crontab.sh \
    root@31.97.226.160:/workspace/agent-infrastructure/scripts/setup/install-host-crontab.sh

# Install on VPS host
ssh root@31.97.226.160 "bash /workspace/agent-infrastructure/scripts/setup/install-host-crontab.sh"
```

5. **Verify installation:**
```bash
ssh root@31.97.226.160 "crontab -l | grep your-job-name"
```

**Disaster Recovery:** After VPS rebuild, run install-host-crontab.sh to restore all host cron jobs.

---

## Step 9: Write Tests

**MANDATORY:** All services and cron jobs MUST have automated tests to verify configuration and functionality.

### Test File Location

Create test file in `/workspace/agent-infrastructure/tests/unit/`:
- **Naming pattern:** `test_<service-name>.bats`
- **Example:** `test_vault_github_sync.bats`, `test_redis_service.bats`

### Generic Infrastructure Tests (Automatic)

**Good news:** Most infrastructure is tested automatically!

Run `/workspace/agent-infrastructure/tests/unit/test_service_infrastructure.bats` to validate:
- ✅ cron-wrapper.sh configuration and logging
- ✅ Notification infrastructure (notify.sh library + wrapper)
- ✅ Log directory structure and permissions
- ✅ ALL services have required fields (enabled, container, schedule, script, log_path)
- ✅ ALL log paths use /workspace/vai/logs/cron/ prefix
- ✅ ALL scripts exist and are executable
- ✅ ALL enabled services appear in crontab
- ✅ ALL services use cron-wrapper pattern
- ✅ Service de-registration (disabled services don't run)

**When you add a new service, the generic tests automatically validate it.**

### What to Test (Service-Specific)

**Focus your per-service tests on:**

1. **Service-specific configuration:**
   - Correct schedule/frequency for this service
   - Correct script path for this service
   - Service-specific settings (timeout, retries, etc.)

2. **Script logic validation:**
   - Script has correct structure (set -euo pipefail, error handling)
   - Script implements expected behavior (e.g., checks for changes before committing)
   - Script uses correct paths and configuration

3. **Error scenarios (optional but recommended):**
   - Script handles expected failures gracefully
   - Script logs errors appropriately
   - Script exits with correct codes

### Test Template for Cron Jobs

```bash
#!/usr/bin/env bats
# Unit tests for <service-name> cron job

# Setup - runs before each test
setup() {
  TEST_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")" && pwd)"
  PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"

  export CONFIG_PATH="$PROJECT_ROOT/config/system-config.json"
  export DEPLOY_ENV="vps"

  source "$PROJECT_ROOT/config/load-config.sh"
  export CURRENT_ENV="vps"
}

# =============================================================================
# CRON JOB CONFIGURATION
# =============================================================================

@test "<job-name> job exists in system-config.json" {
  result=$(cfg_get '.cron_jobs["<job-name>"]')
  [ -n "$result" ]
}

@test "<job-name> job is enabled" {
  enabled=$(cfg_get '.cron_jobs["<job-name>"].enabled')
  [ "$enabled" = "true" ]
}

@test "<job-name> has correct schedule" {
  schedule=$(cron_job_schedule "<job-name>")
  [ "$schedule" = "<expected-schedule>" ]
}

@test "<job-name> has correct script path" {
  script=$(cron_job_script "<job-name>")
  [ "$script" = "/workspace/agent-infrastructure/scripts/<path-to-script>" ]
}

# =============================================================================
# SCRIPT EXISTENCE AND PERMISSIONS
# =============================================================================

@test "<job-name> script exists" {
  [ -f "$PROJECT_ROOT/scripts/<path-to-script>" ]
}

@test "<job-name> script is executable" {
  [ -x "$PROJECT_ROOT/scripts/<path-to-script>" ]
}

@test "<job-name> script has correct shebang" {
  first_line=$(head -1 "$PROJECT_ROOT/scripts/<path-to-script>")
  [ "$first_line" = "#!/bin/bash" ]
}

# =============================================================================
# CRONTAB FILE VALIDATION
# =============================================================================

@test "<job-name> appears in crontab file" {
  grep -q "<job-name>" "$PROJECT_ROOT/docker/services/minio-bisync-cron"
}

@test "<job-name> uses cron-wrapper pattern in crontab" {
  grep -q "/usr/local/bin/cron-wrapper.sh <job-name>" "$PROJECT_ROOT/docker/services/minio-bisync-cron"
}

# =============================================================================
# MONITORING AND LOGGING (examples - generic tests cover most of this)
# =============================================================================

@test "<job-name> log path uses correct /workspace/vai/logs/cron/ prefix" {
  log_path=$(cfg_get '.cron_jobs["<job-name>"].log_path')
  [[ "$log_path" == "/workspace/vai/logs/cron/"* ]]
}
```

**Note:** Most monitoring/logging infrastructure is validated by `test_service_infrastructure.bats`. Only add service-specific logging tests if needed.

### Test Template for Daemon Services

```bash
#!/usr/bin/env bats
# Unit tests for <service-name> daemon service

setup() {
  TEST_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")" && pwd)"
  PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"

  export CONFIG_PATH="$PROJECT_ROOT/config/system-config.json"
  export DEPLOY_ENV="vps"

  source "$PROJECT_ROOT/config/load-config.sh"
  export CURRENT_ENV="vps"
}

# =============================================================================
# SERVICE CONFIGURATION
# =============================================================================

@test "<service-name> service exists in system-config.json" {
  result=$(cfg_get '.services["<service-name>"]')
  [ -n "$result" ]
}

@test "<service-name> service is enabled" {
  enabled=$(cfg_get '.services["<service-name>"].enabled')
  [ "$enabled" = "true" ]
}

@test "<service-name> has correct type" {
  type=$(cfg_get '.services["<service-name>"].type')
  [ "$type" = "daemon" ]
}

@test "<service-name> has health check configured" {
  health_cmd=$(service_health_cmd "<service-name>")
  [ -n "$health_cmd" ]
}

@test "<service-name> has restart command configured" {
  restart_cmd=$(service_restart_cmd "<service-name>")
  [ -n "$restart_cmd" ]
}
```

### Running Tests

**Run all tests:**
```bash
cd /workspace/agent-infrastructure
bats tests/unit/
```

**Run specific test file:**
```bash
bats tests/unit/test_<service-name>.bats
```

**Expected output:**
```
1..15
ok 1 service-name job exists in system-config.json
ok 2 service-name job is enabled
ok 3 service-name has correct schedule
...
ok 15 service-name exits cleanly when no changes detected
```

### Commit Tests with Service

**Tests MUST be committed in the same commit as the service:**
```bash
git add config/system-config.json
git add scripts/sync/<service-script>.sh
git add tests/unit/test_<service-name>.bats
git commit -m "feat: Add <service-name> service with tests

- Created <service-name> script/configuration
- Added to cron jobs / services registry
- Wrote 15 unit tests covering configuration and behavior
- All tests passing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Step 10: Test Service Locally

**Test the complete service lifecycle:**

### For Daemon Services:

1. **Start the service manually:**
```bash
docker exec services-container bash -c "YOUR_RESTART_COMMAND"
```

2. **Verify it's running:**
```bash
docker exec services-container pgrep -f "service-name"
```

3. **Test health check:**
```bash
# HTTP check
docker exec services-container curl -f http://localhost:9000/health

# Process check
docker exec services-container pgrep -f "redis-server"

# TCP check
docker exec services-container timeout 5 bash -c "cat < /dev/null > /dev/tcp/localhost/6379"
```

4. **Test restart (simulate failure):**
```bash
# Kill the service
docker exec services-container pkill -f "service-name"

# Run health check (should fail)
docker exec services-container YOUR_HEALTH_CHECK_COMMAND

# Run restart command (auto-recovery)
docker exec services-container bash -c "YOUR_RESTART_COMMAND"

# Verify recovered
docker exec services-container YOUR_HEALTH_CHECK_COMMAND
```

### For Cron Jobs:

1. **Run job manually:**
```bash
docker exec services-container bash /workspace/agent-infrastructure/scripts/backup-obsidian-vault.sh
```

2. **Check exit code:**
```bash
echo $?  # Should be 0 for success
```

3. **Verify log output:**
```bash
docker exec services-container tail -20 /workspace/vai/logs/backup-vault.log
```

---

## Step 11: Commit Changes

**Commit system-config.json changes:**

```bash
cd /workspace/agent-infrastructure
git add config/system-config.json
git add docker/docker-compose.yml  # If modified
git add scripts/install/  # If created installation script
git commit -m "feat: Add redis service to infrastructure

- Added Redis daemon service to services registry
- Configured TCP health check on port 6379
- Added port mapping in docker-compose.yml
- Created installation script

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

---

## Step 11: Deploy to VPS

**Deploy system-config.json to VPS:**

```bash
# Copy updated config to VPS
scp -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    /workspace/agent-infrastructure/config/system-config.json \
    root@31.97.226.160:/workspace/agent-infrastructure/config/system-config.json
```

**If docker-compose changed, rebuild containers on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "cd /workspace/agent-infrastructure/docker && docker compose up -d --build"
```

**Start the service on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container bash -c 'YOUR_RESTART_COMMAND'"
```

---

## Step 12: Verify Deployment

**Check service is running on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container pgrep -f 'service-name'"
```

**Test health check on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container YOUR_HEALTH_CHECK_COMMAND"
```

**Monitor for 15 minutes (3 health check cycles):**
```bash
# Wait and check health check logs
sleep 900  # 15 minutes

# Check if health checks are passing
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "grep 'redis' /var/log/syslog | tail -20"
```

---

## Step 13: Document the Service

**Create service documentation in Obsidian vault:**

File: `/workspace/khali-obsidian-vault/Infrastructure/Services/Redis.md`

```markdown
---
service: redis
type: daemon
container: services-container
health-check: TCP port 6379
added-date: 2025-12-05
tags: [infrastructure, database, cache]
---

# Redis Service

## Overview
In-memory data structure store, used for caching and message queuing.

## Configuration
- **Port:** 6379
- **Config:** `/etc/redis/redis.conf`
- **Log:** `/workspace/vai/logs/redis.log`
- **Health Check:** TCP connection to localhost:6379 every 60s

## Management Commands

### Start
\`\`\`bash
docker exec services-container bash -c "/usr/local/bin/redis-server /etc/redis/redis.conf >> /workspace/vai/logs/redis.log 2>&1 &"
\`\`\`

### Stop
\`\`\`bash
docker exec services-container pkill -f "redis-server"
\`\`\`

### Check Status
\`\`\`bash
docker exec services-container redis-cli ping
\`\`\`

### View Logs
\`\`\`bash
docker exec services-container tail -f /workspace/vai/logs/redis.log
\`\`\`

## Auto-Recovery
Health check runs every 60 seconds. On failure:
1. Warning logged
2. Restart command executed
3. 5s wait for startup
4. Health re-checked
5. Alert sent if still failing

## Dependencies
None

## Added By
Service added via service-management skill on 2025-12-05
```

---

## Completion Checklist

- [ ] Service type determined (daemon or cron)
- [ ] Service information gathered (name, command, ports, etc.)
- [ ] Health check designed and tested locally
- [ ] Restart command created and tested
- [ ] system-config.json updated and validated
- [ ] docker-compose.yml updated if needed
- [ ] Installation script created if needed
- [ ] Service tested locally in dev environment
- [ ] Changes committed to git
- [ ] Configuration deployed to VPS
- [ ] Service started on VPS
- [ ] Health checks verified on VPS (3+ cycles)
- [ ] Service documentation created
- [ ] User informed of service availability

---

## Rollback Procedure

**If service fails in production:**

1. **Restore previous system-config.json:**
```bash
scp -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    /workspace/agent-infrastructure/config/system-config.json.backup \
    root@31.97.226.160:/workspace/agent-infrastructure/config/system-config.json
```

2. **Stop the failed service:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container pkill -f 'service-name'"
```

3. **Remove from crontab if cron job:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container crontab -l | grep -v 'service-name' | docker exec -i services-container crontab -"
```

4. **Revert docker-compose if changed:**
```bash
cd /workspace/agent-infrastructure
git revert HEAD
git push
ssh root@31.97.226.160 "cd /workspace/agent-infrastructure/docker && git pull && docker compose up -d"
```
