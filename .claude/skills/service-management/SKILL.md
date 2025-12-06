---
name: service-management
description: Manage infrastructure services in agent-infrastructure system. USE WHEN user wants to add new services, add cron jobs, modify service configs, view service status, OR disable/remove services. Handles daemon services, cron jobs, health checks, auto-recovery, and docker-compose integration.
---

<essential_principles>
## How Service Management Works

This skill manages the complete service lifecycle in the agent-infrastructure system: daemon services, cron jobs, health checks, and auto-recovery.

### Principle 1: Services Registry is Source of Truth

**CRITICAL:** All services defined in `/workspace/agent-infrastructure/config/system-config.json`

**Service Types:**
- **daemon** - Always-running services (MinIO, Syncthing, rclone)
- **cron** - Scheduled jobs (minio-sync, health-check, log-rotate)
- **system** - OS-level services (cron daemon itself)

**Required fields per service:**
```json
{
  "enabled": true,
  "type": "daemon",
  "container": "services",
  "health_check": {
    "type": "http|process|custom",
    "endpoint": "http://localhost:9000/health",
    "interval_seconds": 60
  },
  "restart_cmd": "/usr/local/bin/service start",
  "log_path": "/workspace/vai/logs/service.log",
  "notify_on_fail": "alerts"
}
```

### Principle 2: Auto-Recovery Flow

Services self-heal automatically via cron health checks (every 5 minutes):

```
Health check runs
    ↓
Service healthy? ──Yes──► Done
    ↓ No
Log warning → Run restart_cmd → Wait 5s → Check again
    ↓
Healthy: Log "recovered", Done
Still failing: Notify alerts topic
```

### Principle 3: Docker Integration

**Container architecture:**
- `services-container` - Infrastructure services (MinIO, Syncthing)
- `vai-container` - Orchestrator with docker socket access
- `agents-container` - Development environment

**When adding services that need ports:**
1. Update `docker-compose.yml` with port mappings
2. Rebuild containers: `cd /workspace/agent-infrastructure/docker && docker compose up -d --build`
3. Verify port accessibility

### Principle 4: Testing Before Deployment

**MANDATORY:** Always test service additions:
1. Validate JSON syntax in system-config.json
2. Test health check command locally
3. Test restart command manually
4. Deploy to VPS and verify auto-recovery works

### Principle 5: Service Pause/Stop Mechanisms

**Cron jobs** (use cron-wrapper.sh pattern):
- All cron jobs execute via `/usr/local/bin/cron-wrapper.sh JOB_NAME "COMMAND"`
- Pause: Create `/home/devuser/ai-global/config/cron-pause/<job-name>.paused`
- Resume: Remove pause file
- Wrapper provides: logging, pause/resume, error handling, notifications

**Known Issue:** manage-service.sh uses wrong pause path (`/var/run/cron-pause/`) - use manual pause until fixed

**Daemon services:**
- Stop: API shutdown + create `/var/run/manual-stop/<service-name>.stopped`
- Start: Remove stop marker + run restart_cmd
- Use `manage-service.sh stop/start`

### Principle 6: Persistent Mounts and Storage Strategy

**CRITICAL:** Understanding which volumes persist across container rebuilds determines where to store infrastructure work.

**Persistent volumes (survive container rebuilds):**
- **ai-global** - Mounted at `/home/devuser/ai-global/` in containers
  - SSH keys, credentials, global configs
  - Docker named volume, persists across container recreation
- **y-home** - Mapped to `/home/devuser/` in containers
  - User home directory files
  - Persists across container rebuilds (not documented in docker-compose but exists on VPS)

**Non-persistent locations (lost on container rebuild):**
- `/tmp/` - Ephemeral, cleared on restart
- `/var/run/` - Runtime state, cleared on restart
- Container-specific locations outside mounted volumes

**Storage decision criteria:**

| Type of work | Storage location | Why |
|--------------|------------------|-----|
| Scripts tracked in git | `/workspace/agent-infrastructure/scripts/` | Git repo provides persistence, deployed to VPS |
| Configs tracked in git | `/workspace/agent-infrastructure/config/` or `/workspace/agent-infrastructure/docker/` | Git-tracked, version controlled |
| VPS host crontab | `/workspace/agent-infrastructure/docker/host/vps-host-cron` (git) → deployed to VPS via `crontab` command | Git-tracked source, crontab command installs to VPS host |
| Runtime configs (credentials, keys) | `/home/devuser/ai-global/config/` | Persistent volume, survives rebuilds |
| Temporary state | `/tmp/` or `/var/run/` | OK to lose on rebuild |

**Why this matters:**
- Work stored only in `/var/run/` or `/tmp/` is lost on container rebuild
- Git-tracked work in `/workspace/agent-infrastructure/` survives via version control
- Runtime configs in `ai-global` persist automatically
- VPS host crontab must be tracked in git AND installed via script for disaster recovery

**Examples:**
- ✅ **CORRECT**: Cron pause files in `/home/devuser/ai-global/config/cron-pause/` (persistent)
- ❌ **WRONG**: Cron pause files in `/var/run/cron-pause/` (lost on rebuild)
- ✅ **CORRECT**: SSH keys in `/home/devuser/ai-global/config/ssh/` (persistent)
- ✅ **CORRECT**: VPS host crontab tracked in git + install script (rebuild-resilient)

### Principle 6A: ai-global Path Differences (CRITICAL)

**PROBLEM:** The ai-global Docker volume has **different paths** depending on execution context. Using the wrong path causes "file not found" errors.

**Path mapping:**

| Execution context | ai-global path | When you use this |
|-------------------|----------------|-------------------|
| **Inside containers** (services, vai, agents) | `/home/devuser/ai-global/` | Most common - installing services from services-container, running agents |
| **VPS host** (SSH to root@31.97.226.160) | `/root/ai-global/` | Rare - host cron jobs, host-level monitoring scripts |

**How to know which path to use:**

1. **Are you working inside a container?** → Use `/home/devuser/ai-global/`
   - Running commands in services-container, vai-container, agents-container
   - Installing cron jobs that run via container crontab
   - Writing scripts that execute inside containers
   - **This is 95% of service installations**

2. **Are you working on VPS host directly?** → Use `/root/ai-global/`
   - SSH'd to VPS host as root
   - Installing VPS host cron jobs (host crontab, not container crontab)
   - Writing scripts that run directly on VPS host (not in containers)
   - **Rare - only for host-level monitoring needing Docker CLI access**

**Real-world examples:**

| Service | Runs where | ai-global path | Why |
|---------|------------|----------------|-----|
| minio-sync cron job | services-container | `/home/devuser/ai-global/` | Container cron job |
| disk-usage-monitor | VPS host | `/root/ai-global/` | Needs Docker CLI on host |
| cron pause files | services-container | `/home/devuser/ai-global/config/cron-pause/` | Checked by container scripts |
| SSH keys | Both contexts | Auto-detect or both paths work | Volume mounted in both |

**When scripts need to work in both contexts:**

If a script might run on VPS host OR in containers, use auto-detection:

```bash
# Auto-detect ai-global location
if [[ -d "/root/ai-global" ]]; then
    AI_GLOBAL="/root/ai-global"
else
    AI_GLOBAL="/home/devuser/ai-global"
fi

STATE_FILE="$AI_GLOBAL/config/monitoring/my-state"
```

**Decision tree for service installation:**

```
Where does this service need to run?
├─ Inside container (most common)
│   ├─ Use container path: /home/devuser/ai-global/
│   └─ Install from services-container
│
└─ On VPS host (rare)
    ├─ Does it need Docker CLI? → YES → Host cron job required
    │   ├─ Use host path: /root/ai-global/
    │   ├─ SSH to VPS host to install
    │   └─ Add to docker/host/vps-host-cron (tracked in git)
    │
    └─ Does it need Docker CLI? → NO → Use container instead
        └─ Install in services-container with container path
```

**Common mistakes:**

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Using `/home/devuser/ai-global/` in VPS host script | "No such file or directory" | Change to `/root/ai-global/` or add auto-detection |
| Using `/root/ai-global/` in container script | "No such file or directory" | Change to `/home/devuser/ai-global/` |
| Assuming path is same everywhere | Intermittent failures | Check execution context, use correct path |

**Key takeaway:** Always ask "Where is this script running?" before writing ai-global paths in configuration.
</essential_principles>

<intake>
What would you like to do?

1. **Add new service** - Create new daemon service or cron job
2. **Modify service** - Change health checks, restart commands, schedules
3. **View services** - Check service status, configuration, health
4. **Delete/disable service** - Remove or temporarily disable service

**Wait for response before proceeding.**
</intake>

<routing>
| Response | Workflow |
|----------|----------|
| 1, "add", "create", "new service", "new daemon", "new cron" | `workflows/add-service.md` |
| 2, "modify", "change", "update", "config" | `workflows/modify-service.md` |
| 3, "view", "check", "status", "list", "show" | `workflows/view-services.md` |
| 4, "delete", "remove", "disable", "pause", "stop" | `workflows/delete-service.md` |

**Intent-based routing** (if user provides clear intent):
- "add MinIO service", "create health check", "new cron job" → `workflows/add-service.md`
- "change health check interval", "update restart command" → `workflows/modify-service.md`
- "what services are running", "show me service status" → `workflows/view-services.md`
- "disable minio-sync", "pause health checks" → `workflows/delete-service.md`

**After reading the workflow, follow it exactly.**
</routing>

<reference_index>
All domain knowledge in `references/`:

**Core Concepts:**
- `services-registry-schema.md` - Complete schema for service definitions
- `auto-recovery-flow.md` - Health check and auto-recovery implementation
- `cron-wrapper-system.md` - Cron wrapper pattern for standardized job execution

**Implementation:**
- `health-check-patterns.md` - Health check implementation patterns (HTTP, process, custom)
- `docker-integration.md` - Container architecture and port mapping
</reference_index>

<workflows_index>
| Workflow | Purpose |
|----------|------------|
| add-service.md | Create new daemon service or cron job with health checks |
| modify-service.md | Update service configuration, health checks, schedules |
| view-services.md | Check service status, health, and configuration |
| delete-service.md | Remove or disable services and cron jobs |
</workflows_index>

<success_criteria>
Skill is successfully invoked when:
- [ ] Intake question displays available operations
- [ ] User response routes to correct workflow
- [ ] Workflow loads required references
- [ ] Service changes update system-config.json
- [ ] Changes deployed to VPS with verification
- [ ] Health checks and auto-recovery tested
</success_criteria>
