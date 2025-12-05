# Docker Integration

**Purpose:** Guide for integrating services with the container architecture and docker-compose configuration.

---

## Container Architecture

The infrastructure uses 3 main containers:

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS Host                             │
│  (31.97.226.160)                                             │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │ vai-container  │  │ services-      │  │ agents-        ││
│  │                │  │ container      │  │ container      ││
│  │ Purpose:       │  │                │  │                ││
│  │ - Orchestrator │  │ Purpose:       │  │ Purpose:       ││
│  │ - Health checks│  │ - MinIO        │  │ - Development  ││
│  │ - Monitoring   │  │ - Syncthing    │  │ - Claude Code  ││
│  │                │  │ - Cron jobs    │  │ - Git          ││
│  │ Has:           │  │                │  │                ││
│  │ - Docker socket│  │ Has:           │  │ Has:           ││
│  │ - SSH to VPS   │  │ - Port 8384    │  │ - Dev tools    ││
│  │                │  │ - Port 22000   │  │                ││
│  │                │  │ - Port 9000    │  │                ││
│  │                │  │ - Port 9001    │  │                ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│         │                     │                     │        │
│         └─────────────────────┴─────────────────────┘        │
│                           vai-network                        │
└─────────────────────────────────────────────────────────────┘
```

---

## docker-compose.yml Structure

**Location:** `/workspace/agent-infrastructure/docker/docker-compose.yml`

**Current configuration:**
```yaml
version: '3.8'

services:
  # Infrastructure services container
  services:
    container_name: services-container
    image: ubuntu:22.04
    restart: unless-stopped
    networks:
      - vai-network

    ports:
      - "8384:8384"    # Syncthing Web UI
      - "22000:22000"  # Syncthing sync protocol
      - "9000:9000"    # MinIO API
      - "9001:9001"    # MinIO Console

    volumes:
      - /workspace:/workspace:rw
      - /home/devuser:/home/devuser:rw
      - ai-global:/home/devuser/ai-global:rw

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

    command: /bin/bash -c "tail -f /dev/null"

  # Orchestration container
  vai:
    container_name: vai-container
    image: ubuntu:22.04
    restart: unless-stopped
    networks:
      - vai-network

    volumes:
      - /workspace:/workspace:rw
      - /home/devuser:/home/devuser:rw
      - ai-global:/home/devuser/ai-global:rw
      - /var/run/docker.sock:/var/run/docker.sock:ro  # Docker socket access

    depends_on:
      - services

    command: /bin/bash -c "tail -f /dev/null"

  # Development container
  agents:
    container_name: agents-container
    image: ubuntu:22.04
    restart: unless-stopped
    networks:
      - vai-network

    volumes:
      - /workspace:/workspace:rw
      - /home/devuser:/home/devuser:rw
      - ai-global:/home/devuser/ai-global:rw

    command: /bin/bash -c "tail -f /dev/null"

networks:
  vai-network:
    driver: bridge

volumes:
  ai-global:
    driver: local
```

---

## Adding Services to docker-compose.yml

### When to Modify docker-compose.yml

**Modify when:**
- Service needs external port access
- Service needs specific volume mounts
- Service needs special container configuration (resource limits, capabilities)
- Service needs dedicated container

**Don't modify when:**
- Service runs in existing container without port requirements
- Simple daemon or cron job
- Only internal (container-to-container) communication

---

## Adding External Ports

### Step 1: Identify Port Requirements

**Questions to answer:**
- What port does the service listen on?
- Does it need external access (from VPS host or internet)?
- What protocol (TCP/UDP)?

**Example:** Adding Redis
- Port: 6379
- Protocol: TCP
- External access: Yes (for external Redis clients)

### Step 2: Add Port Mapping

**Edit docker-compose.yml:**
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

**Port mapping format:** `"host_port:container_port"`

**Options:**
```yaml
# Same port on host and container
- "6379:6379"

# Different ports
- "6380:6379"  # External on 6380, internal on 6379

# Bind to specific interface
- "127.0.0.1:6379:6379"  # Only accessible from localhost

# UDP protocol
- "6379:6379/udp"
```

### Step 3: Rebuild Container

```bash
cd /workspace/agent-infrastructure/docker
docker compose up -d --build
```

### Step 4: Verify Port Accessible

```bash
# Check from VPS host
curl http://localhost:9000/health

# Check port listening
netstat -tlnp | grep 6379

# Check from outside (if public)
curl http://31.97.226.160:9000/health
```

---

## Volume Mounts

### Standard Volumes

All containers have access to these volumes:

1. **/workspace** - Shared workspace (code, configs, scripts)
   ```yaml
   - /workspace:/workspace:rw
   ```

2. **/home/devuser** - User home directory
   ```yaml
   - /home/devuser:/home/devuser:rw
   ```

3. **ai-global** - Shared configuration (credentials, SSH keys)
   ```yaml
   - ai-global:/home/devuser/ai-global:rw
   ```

### Adding Service-Specific Volumes

**Example:** Adding PostgreSQL data volume

```yaml
services:
  services:
    volumes:
      - /workspace:/workspace:rw
      - /home/devuser:/home/devuser:rw
      - ai-global:/home/devuser/ai-global:rw
      - postgres-data:/var/lib/postgresql/data:rw  # NEW

volumes:
  ai-global:
    driver: local
  postgres-data:  # NEW
    driver: local
```

**Mount modes:**
- `rw` - Read-write (default)
- `ro` - Read-only
- `z` - SELinux private label
- `Z` - SELinux shared label

---

## Health Checks in docker-compose.yml

**Docker native health checks** (separate from our service registry health checks)

### Purpose
- Docker monitors container health
- Used by `docker ps` to show health status
- Can trigger container restart

### Configuration

```yaml
services:
  services:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s      # Check every 30 seconds
      timeout: 10s       # Timeout after 10 seconds
      retries: 3         # Retry 3 times before marking unhealthy
      start_period: 40s  # Grace period after container start
```

### Test Formats

**Shell form:**
```yaml
test: curl -f http://localhost:9000/health || exit 1
```

**Exec form (preferred):**
```yaml
test: ["CMD", "curl", "-f", "http://localhost:9000/health"]
```

**Script:**
```yaml
test: ["CMD-SHELL", "/workspace/scripts/health-check.sh"]
```

### Check Health Status

```bash
# View container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health check results
docker inspect services-container | jq '.[].State.Health'
```

---

## Container Dependencies

### Define Startup Order

```yaml
services:
  cache:
    container_name: cache-container
    # ...

  app:
    container_name: app-container
    depends_on:
      - cache  # Start cache before app
```

### Wait for Service Ready (Not Just Started)

**Problem:** `depends_on` only waits for container start, not service readiness

**Solution:** Use health checks with depends_on condition

```yaml
services:
  cache:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  app:
    depends_on:
      cache:
        condition: service_healthy  # Wait for health check to pass
```

---

## Resource Limits

### CPU Limits

```yaml
services:
  services:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Max 2 CPUs
        reservations:
          cpus: '1.0'      # Reserve 1 CPU
```

### Memory Limits

```yaml
services:
  services:
    deploy:
      resources:
        limits:
          memory: 2G       # Max 2 GB
        reservations:
          memory: 1G       # Reserve 1 GB
```

### Combined Example

```yaml
services:
  services:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '2.0'
          memory: 2G
```

---

## Environment Variables

### Set in docker-compose.yml

```yaml
services:
  services:
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}  # From .env file
      - LOG_LEVEL=info
```

### Load from .env file

**Create `.env` file:**
```bash
# .env (in same directory as docker-compose.yml)
MINIO_PASSWORD=secret123
POSTGRES_PASSWORD=dbpass456
```

**Reference in docker-compose.yml:**
```yaml
services:
  services:
    environment:
      - MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
```

### Load from file

```yaml
services:
  services:
    env_file:
      - /home/devuser/ai-global/config/.env
```

---

## Networking

### Bridge Network (Default)

Containers on same network can communicate using container names:

```bash
# From vai-container, access MinIO in services-container
curl http://services-container:9000/health

# Use service name from docker-compose
curl http://services:9000/health
```

### Container-to-Container Communication

**Don't use:** localhost or 127.0.0.1 (different network namespaces)

**Use:** Container name or service name
```bash
# WRONG
curl http://localhost:9000/health

# RIGHT
curl http://services-container:9000/health
```

### Expose Internal Ports (No Host Mapping)

```yaml
services:
  services:
    expose:
      - "6379"  # Accessible to other containers, not VPS host
```

---

## Container Management Commands

### Rebuild After Changes

```bash
# Rebuild all containers
cd /workspace/agent-infrastructure/docker
docker compose up -d --build

# Rebuild specific container
docker compose up -d --build services
```

### View Container Logs

```bash
# All logs
docker compose logs services

# Follow logs
docker compose logs -f services

# Last 100 lines
docker compose logs --tail=100 services
```

### Restart Container

```bash
# Restart single container
docker compose restart services

# Restart all
docker compose restart
```

### Stop/Start Containers

```bash
# Stop all
docker compose stop

# Start all
docker compose start

# Stop specific
docker compose stop services

# Start specific
docker compose start services
```

---

## Deployment Procedure

### Local Development

1. **Edit docker-compose.yml**
   ```bash
   vim /workspace/agent-infrastructure/docker/docker-compose.yml
   ```

2. **Test locally**
   ```bash
   cd /workspace/agent-infrastructure/docker
   docker compose up -d --build
   ```

3. **Verify changes**
   ```bash
   docker ps
   docker compose logs services
   ```

### Deploy to VPS

1. **Commit changes**
   ```bash
   cd /workspace/agent-infrastructure
   git add docker/docker-compose.yml
   git commit -m "feat: Add Redis port mapping"
   git push
   ```

2. **Pull on VPS**
   ```bash
   ssh root@31.97.226.160 "cd /workspace/agent-infrastructure && git pull"
   ```

3. **Rebuild containers on VPS**
   ```bash
   ssh root@31.97.226.160 "cd /workspace/agent-infrastructure/docker && docker compose up -d --build"
   ```

4. **Verify deployment**
   ```bash
   ssh root@31.97.226.160 "docker ps"
   ```

---

## Common Patterns

### Pattern 1: Web Service with External Access

**Service:** Web API on port 8080

```yaml
services:
  services:
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
```

**system-config.json:**
```json
{
  "web-api": {
    "enabled": true,
    "type": "daemon",
    "container": "services",
    "health_check": {
      "type": "http",
      "endpoint": "http://localhost:8080/health",
      "interval_seconds": 60
    },
    "restart_cmd": "/usr/local/bin/api-server >> /workspace/vai/logs/api.log 2>&1 &",
    "log_path": "/workspace/vai/logs/api.log",
    "notify_on_fail": "alerts"
  }
}
```

### Pattern 2: Database with Data Volume

**Service:** PostgreSQL

```yaml
services:
  services:
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data:rw
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

volumes:
  postgres-data:
    driver: local
```

**system-config.json:**
```json
{
  "postgres": {
    "enabled": true,
    "type": "daemon",
    "container": "services",
    "health_check": {
      "type": "tcp",
      "host": "localhost",
      "port": 5432,
      "interval_seconds": 60
    },
    "restart_cmd": "/usr/lib/postgresql/14/bin/postgres -D /var/lib/postgresql/data >> /workspace/vai/logs/postgres.log 2>&1 &",
    "log_path": "/workspace/vai/logs/postgres.log",
    "notify_on_fail": "alerts"
  }
}
```

### Pattern 3: Background Service (No External Ports)

**Service:** Background worker

```yaml
# No docker-compose.yml changes needed
```

**system-config.json:**
```json
{
  "worker": {
    "enabled": true,
    "type": "daemon",
    "container": "services",
    "health_check": {
      "type": "process",
      "process_name": "worker-daemon",
      "interval_seconds": 60
    },
    "restart_cmd": "/usr/local/bin/worker-daemon >> /workspace/vai/logs/worker.log 2>&1 &",
    "log_path": "/workspace/vai/logs/worker.log",
    "notify_on_fail": "alerts"
  }
}
```

---

## Troubleshooting

### Port Already in Use

**Error:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:9000: bind: address already in use
```

**Solution:**
```bash
# Find process using port
lsof -i :9000
netstat -tlnp | grep 9000

# Kill process or change port mapping in docker-compose.yml
```

### Container Can't Access Service in Another Container

**Problem:** Using `localhost` instead of container name

**Wrong:**
```bash
curl http://localhost:9000/health  # Fails
```

**Right:**
```bash
curl http://services-container:9000/health  # Works
```

### Volume Mount Permission Denied

**Error:**
```
mkdir: cannot create directory '/data': Permission denied
```

**Solutions:**
1. **Run container as root** (default)
2. **Fix permissions on host:**
   ```bash
   sudo chown -R $(whoami):$(whoami) /path/to/volume
   ```
3. **Use volume instead of bind mount:**
   ```yaml
   volumes:
     - data-volume:/data  # Docker-managed volume
   ```

### Health Check Always Failing

**Debug:**
```bash
# Run health check command manually in container
docker exec services-container curl -f http://localhost:9000/health

# Check container logs
docker logs services-container

# Inspect health check results
docker inspect services-container | jq '.[].State.Health'
```
