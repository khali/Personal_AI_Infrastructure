# Workflow: Delete Service

**Purpose:** Remove or temporarily disable services and cron jobs from the infrastructure.

**References needed:**
- `references/services-registry-schema.md` - Service definition structure
- `references/deployment-procedure.md` - Deployment steps
- `references/service-management-commands.md` - Management commands

---

## Step 1: Determine Action Type

Ask or infer from context:
- **Pause/Resume** - Temporarily stop service without removing (reversible, preferred)
- **Disable** - Mark service as disabled in config (doesn't run on startup)
- **Delete** - Completely remove service from system-config.json (permanent)

**Decision guide:**
- **Pause:** Use for temporary maintenance, testing, troubleshooting
- **Disable:** Use when service not needed but might be needed later
- **Delete:** Use only when service permanently no longer needed

---

## Step 2: Identify Service Dependencies

**Check if other services depend on this service:**

```bash
# Search for service name in dependencies
cat /workspace/agent-infrastructure/config/system-config.json | \
  jq -r '.services[] | select(.dependencies[]? | contains("SERVICE_NAME")) | .name // "unnamed"'
```

**If dependencies exist:**
1. Warn user about dependent services
2. Ask if they want to disable/delete dependent services too
3. Update dependencies array in dependent services

**Example output:**
```
Warning: The following services depend on 'redis':
- session-manager (daemon)
- cache-warmer (cron)

Options:
1. Remove redis from dependencies and proceed
2. Also disable/delete dependent services
3. Cancel operation
```

---

## Step 3: Pause Service (Reversible)

### For Cron Jobs:

**Create pause file:**
```bash
docker exec services-container touch /var/run/cron-pause/JOB_NAME.paused
```

**Verify paused:**
```bash
docker exec services-container test -f /var/run/cron-pause/JOB_NAME.paused && \
  echo "Paused" || echo "Not paused"
```

**Resume later:**
```bash
docker exec services-container rm /var/run/cron-pause/JOB_NAME.paused
```

### For Daemon Services:

**Create manual stop marker:**
```bash
docker exec services-container mkdir -p /var/run/manual-stop
docker exec services-container touch /var/run/manual-stop/SERVICE_NAME.stopped
```

**Stop the service:**
```bash
# Using API shutdown if available (preferred)
docker exec services-container curl -X POST http://localhost:PORT/shutdown

# Or kill process
docker exec services-container pkill -f "SERVICE_NAME"
```

**Resume later:**
```bash
# Remove stop marker
docker exec services-container rm /var/run/manual-stop/SERVICE_NAME.stopped

# Start service
docker exec services-container bash -c "RESTART_COMMAND"
```

---

## Step 4: Disable Service (Config Change)

**Set enabled = false in system-config.json:**

```bash
# For daemon service
jq '.services.SERVICE_NAME.enabled = false' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json

# For cron job
jq '.cron_jobs.JOB_NAME.enabled = false' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

**Stop the service:**
```bash
# For daemon
docker exec services-container pkill -f "SERVICE_NAME"

# For cron job
docker exec services-container touch /var/run/cron-pause/JOB_NAME.paused
```

**Re-enable later:**
```bash
# Set enabled = true
jq '.services.SERVICE_NAME.enabled = true' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json

# Start the service
docker exec services-container bash -c "RESTART_COMMAND"

# Or resume cron job
docker exec services-container rm /var/run/cron-pause/JOB_NAME.paused
```

---

## Step 5: Delete Service (Permanent Removal)

**⚠️ WARNING: This is permanent. Service configuration will be lost.**

**Confirm with user before proceeding.**

### Remove from system-config.json:

```bash
# Backup first
cp /workspace/agent-infrastructure/config/system-config.json \
   /workspace/PAI/.claude/history/backups/system-config-before-delete-$(date +%Y%m%d-%H%M%S).json

# Delete daemon service
jq 'del(.services.SERVICE_NAME)' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json

# Delete cron job
jq 'del(.cron_jobs.JOB_NAME)' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
```

### Stop the service:

```bash
# For daemon
docker exec services-container pkill -f "SERVICE_NAME"

# For cron job - remove from crontab
docker exec services-container bash -c 'crontab -l | grep -v "JOB_NAME" | crontab -'
```

### Clean up related files:

**Remove log files (optional):**
```bash
docker exec services-container rm /workspace/vai/logs/SERVICE_NAME.log
```

**Remove configuration files:**
```bash
docker exec services-container rm -rf /etc/SERVICE_NAME
```

**Remove data directories:**
```bash
# CAREFUL: This deletes data!
docker exec services-container rm -rf /data/SERVICE_NAME
```

**Remove installation scripts:**
```bash
rm /workspace/agent-infrastructure/scripts/install/install-SERVICE_NAME.sh
```

### Remove from docker-compose.yml (if has ports):

**Edit docker-compose.yml to remove port mappings:**

```yaml
# Before:
services:
  services:
    ports:
      - "8384:8384"    # Syncthing
      - "9000:9000"    # MinIO
      - "6379:6379"    # Redis (REMOVE THIS)

# After:
services:
  services:
    ports:
      - "8384:8384"    # Syncthing
      - "9000:9000"    # MinIO
```

**Rebuild containers:**
```bash
cd /workspace/agent-infrastructure/docker
docker compose up -d --build
```

---

## Step 6: Update Dependencies

**Remove service from dependencies arrays:**

```bash
# Find services that have this service as dependency
DEPENDENT_SERVICES=$(cat /workspace/agent-infrastructure/config/system-config.json | \
  jq -r '.services | to_entries[] | select(.value.dependencies[]? | contains("SERVICE_NAME")) | .key')

# For each dependent service, remove from dependencies
for svc in $DEPENDENT_SERVICES; do
  jq ".services.$svc.dependencies |= map(select(. != \"SERVICE_NAME\"))" \
     /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
  mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json
done
```

---

## Step 7: Validate Changes

**Validate JSON syntax:**
```bash
jq empty /workspace/agent-infrastructure/config/system-config.json
echo "JSON valid: $?"
```

**Verify service removed:**
```bash
# Should return null
cat /workspace/agent-infrastructure/config/system-config.json | jq '.services.SERVICE_NAME'
```

**Verify dependencies updated:**
```bash
# Should not contain SERVICE_NAME
cat /workspace/agent-infrastructure/config/system-config.json | \
  jq '[.services[].dependencies[]?] | unique'
```

---

## Step 8: Commit Changes

**Commit configuration changes:**

```bash
cd /workspace/agent-infrastructure

git add config/system-config.json
git add docker/docker-compose.yml  # If modified
git add scripts/install/  # If deleted installation script

git commit -m "feat: Remove SERVICE_NAME from infrastructure

Action: [Paused|Disabled|Deleted]
Reason: [Brief explanation]

Changes:
- Removed SERVICE_NAME from services registry
- Stopped service process/cron job
- [Other cleanup actions]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

---

## Step 9: Deploy to VPS

### For Pause (No deployment needed):
```bash
# Just create pause file on VPS
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container touch /var/run/cron-pause/JOB_NAME.paused"
```

### For Disable or Delete:

**Deploy updated system-config.json:**
```bash
scp -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    /workspace/agent-infrastructure/config/system-config.json \
    root@31.97.226.160:/workspace/agent-infrastructure/config/system-config.json
```

**Stop service on VPS:**
```bash
# For daemon
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container pkill -f 'SERVICE_NAME'"

# For cron job
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container bash -c 'crontab -l | grep -v \"JOB_NAME\" | crontab -'"
```

**If docker-compose changed, rebuild containers:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "cd /workspace/agent-infrastructure/docker && docker compose up -d --build"
```

---

## Step 10: Verify Removal

**Verify service not running on VPS:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container pgrep -f 'SERVICE_NAME'"

# Should return no results (empty output)
```

**Verify cron job removed:**
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "docker exec services-container crontab -l | grep 'JOB_NAME'"

# Should return no results
```

**Check no errors from health checks:**
```bash
# Wait 15 minutes for health check cycles
sleep 900

# Check for errors about missing service
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "grep 'SERVICE_NAME' /var/log/syslog | tail -20"
```

---

## Step 11: Update Documentation

### For Pause:

**Add note to service documentation:**

File: `/workspace/khali-obsidian-vault/Infrastructure/Services/SERVICE_NAME.md`

```markdown
## Status

⏸️ **PAUSED** as of 2025-12-05

Reason: [Why paused]
Expected duration: [How long]
Resume command: `docker exec services-container rm /var/run/cron-pause/JOB_NAME.paused`
```

### For Disable:

**Update service documentation:**

```markdown
## Status

❌ **DISABLED** as of 2025-12-05

Reason: [Why disabled]
Config location: Still in system-config.json with enabled=false
Re-enable: Set enabled=true and run restart command
```

### For Delete:

**Archive or delete service documentation:**

Option 1 - Archive:
```bash
mkdir -p /workspace/khali-obsidian-vault/Infrastructure/Services/Archived
mv /workspace/khali-obsidian-vault/Infrastructure/Services/SERVICE_NAME.md \
   /workspace/khali-obsidian-vault/Infrastructure/Services/Archived/SERVICE_NAME-deleted-2025-12-05.md
```

Add deletion note at top:
```markdown
---
status: deleted
deleted-date: 2025-12-05
reason: [Why deleted]
---

# ❌ SERVICE_NAME (DELETED)

**This service was deleted on 2025-12-05**

Reason: [Why deleted]
Backup config: /workspace/PAI/.claude/history/backups/system-config-before-delete-TIMESTAMP.json

[Original documentation below]
...
```

Option 2 - Delete entirely:
```bash
rm /workspace/khali-obsidian-vault/Infrastructure/Services/SERVICE_NAME.md
```

---

## Step 12: Clean Up Health Checks

**If service had custom health check script, remove it:**

```bash
rm /workspace/agent-infrastructure/scripts/health/check-SERVICE_NAME.sh
```

**Update health check cron if needed:**

If there was a dedicated health check cron job for this service, remove it:
```bash
ssh -i /home/devuser/ai-global/config/ssh/id_ed25519_container \
    -o UserKnownHostsFile=/home/devuser/ai-global/config/ssh/known_hosts \
    root@31.97.226.160 "crontab -l | grep -v 'check-SERVICE_NAME' | crontab -"
```

---

## Completion Checklist

- [ ] Determined action type (pause/disable/delete)
- [ ] Checked for service dependencies
- [ ] Warned user if dependencies exist
- [ ] Executed pause/disable/delete action
- [ ] Updated system-config.json if needed
- [ ] Stopped service process or cron job
- [ ] Removed from crontab if cron job
- [ ] Updated dependent services' dependency arrays
- [ ] Validated JSON syntax
- [ ] Committed changes to git
- [ ] Deployed changes to VPS
- [ ] Verified service not running on VPS
- [ ] Verified no health check errors
- [ ] Updated or archived service documentation
- [ ] Cleaned up health check scripts if needed
- [ ] User informed of service removal/pause status

---

## Rollback Procedure

### To Undo Pause:
```bash
docker exec services-container rm /var/run/cron-pause/JOB_NAME.paused
docker exec services-container rm /var/run/manual-stop/SERVICE_NAME.stopped
docker exec services-container bash -c "RESTART_COMMAND"  # For daemons
```

### To Undo Disable:
```bash
jq '.services.SERVICE_NAME.enabled = true' \
   /workspace/agent-infrastructure/config/system-config.json > /tmp/config.json
mv /tmp/config.json /workspace/agent-infrastructure/config/system-config.json

# Deploy and restart as per modify-service workflow
```

### To Undo Delete:
```bash
# Restore from backup
cp /workspace/PAI/.claude/history/backups/system-config-before-delete-TIMESTAMP.json \
   /workspace/agent-infrastructure/config/system-config.json

# Restore crontab entry manually if cron job

# Restore docker-compose.yml if modified
cd /workspace/agent-infrastructure
git revert HEAD  # If committed

# Deploy and restart service
```
