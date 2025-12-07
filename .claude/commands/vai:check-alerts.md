---
description: Check recent VPS infrastructure alerts from ntfy.sh (quick view of notification history)
argument-hint: [time window: 1h, 4h, 12h, 24h, 48h - default 12h]
---

# Check Infrastructure Alerts

Query the `khali-vps-alerts` ntfy.sh topic and summarize recent notifications.

## Time Window

Use the argument to specify time window. Default is 12h if not specified.
- `1h` - Last hour (quick check)
- `4h` - Last 4 hours
- `12h` - Last 12 hours (default)
- `24h` - Last 24 hours
- `48h` - Last 48 hours

**Argument provided:** $ARGUMENTS

## Steps

1. **Query ntfy.sh API:**
```bash
curl -s "https://ntfy.sh/khali-vps-alerts/json?poll=1&since=${TIME_WINDOW}" | jq -r '"[\(.time | strftime("%Y-%m-%d %H:%M"))] [\(.priority)] \(.title)"'
```

2. **For each alert, get details:**
```bash
curl -s "https://ntfy.sh/khali-vps-alerts/json?poll=1&since=${TIME_WINDOW}" | jq -r '"=== \(.time | strftime("%Y-%m-%d %H:%M:%S")) ===\nTitle: \(.title)\nPriority: \(.priority)\nMessage:\n\(.message)\n"'
```

3. **Summarize findings:**
   - Count total alerts by priority (3=default, 4=high/warning, 5=urgent/critical)
   - Identify any repeated alerts (same title multiple times = ongoing issue)
   - Note any critical (priority 5) alerts that need immediate attention
   - Flag known benign patterns (rclone CPU spikes during sync are normal)

4. **Provide interpretation:**
   - What's normal vs concerning
   - Any patterns suggesting systemic issues
   - Suggested follow-up actions if needed

## Priority Reference
- **Priority 5 (urgent):** Critical issues requiring immediate attention
- **Priority 4 (high):** Warnings, sustained threshold breaches
- **Priority 3 (default):** Informational alerts
- **Priority 2-1 (low):** Minor notifications

## Known Benign Patterns
- rclone CPU spikes during MinIO bisync (normal, brief)
- Disk usage warnings at 75-80% (monitor, not critical)
