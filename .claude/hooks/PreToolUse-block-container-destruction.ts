#!/usr/bin/env bun
/**
 * PreToolUse Hook: Block Dangerous Commands
 *
 * INCIDENT HISTORY:
 * - 2025-12-08: Vai restarted vai-container without permission (killed session)
 * - 2025-12-08: Vai attempted rebuild despite "do not rebuild" constraint
 * - 2025-12-09: Vai ran `docker compose restart vai` killing session AGAIN
 *   Root cause: `docker compose up -d` and other patterns not caught
 *
 * PURPOSE: Prevent agents from running ANY command that could:
 * 1. Kill the user's session (container restart, process kill, reboot)
 * 2. Destroy infrastructure (rm -rf, disk wipe, format)
 * 3. Damage the system (fork bomb, permission removal)
 *
 * PHILOSOPHY: Defense in depth - catch ALL variations including SSH-wrapped
 */

interface PreToolUseInput {
  tool: string;
  input: Record<string, unknown>;
}

interface PreToolUseResult {
  allow: boolean;
  message?: string;
}

// Read from stdin (Claude Code passes tool info as JSON)
async function main() {
  const input = await readStdin();

  if (!input) {
    // No input = allow (fail open for hook errors)
    console.log(JSON.stringify({ allow: true }));
    return;
  }

  try {
    const params: PreToolUseInput = JSON.parse(input);
    const result = checkCommand(params);
    console.log(JSON.stringify(result));
  } catch (e) {
    // Parse error = allow (fail open)
    console.log(JSON.stringify({ allow: true }));
  }
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    // Timeout after 1 second if no input
    setTimeout(() => resolve(data), 1000);
  });
}

interface BlockedPattern {
  pattern: RegExp;
  category: string;
  reason: string;
  suggestion: string;
}

function checkCommand(params: PreToolUseInput): PreToolUseResult {
  const { tool, input } = params;

  // Only check Bash commands
  if (tool !== "Bash") {
    return { allow: true };
  }

  const command = (input.command as string) || "";

  // ============================================================
  // CATEGORY 1: Container Operations (Session Killers)
  // ============================================================

  const protectedContainers = ['vai', 'services', 'agents', 'vai-container', 'services-container', 'agents-container'];
  const containerPattern = protectedContainers.join('|');

  const containerPatterns: BlockedPattern[] = [
    // Direct docker commands on protected containers
    {
      pattern: new RegExp(`docker\\s+(restart|stop|rm|kill)\\s+.*(${containerPattern})`, 'i'),
      category: 'CONTAINER_DESTRUCTION',
      reason: 'This would kill your active session inside vai-container',
      suggestion: 'Ask user to run this manually from VPS host'
    },
    // docker compose with destructive ops on protected containers
    {
      pattern: new RegExp(`docker\\s+compose\\s+(restart|stop|rm|kill|build)\\s+.*(${containerPattern})`, 'i'),
      category: 'CONTAINER_DESTRUCTION',
      reason: 'This would kill/rebuild your active session',
      suggestion: 'Ask user to run this manually from VPS host'
    },
    // docker compose down (affects ALL containers)
    {
      pattern: /docker\s+compose\s+down/i,
      category: 'CONTAINER_DESTRUCTION',
      reason: 'docker compose down stops ALL containers including vai',
      suggestion: 'Ask user to run this manually from VPS host'
    },
    // docker compose up (recreates containers even without explicit names)
    {
      pattern: /docker\s+compose\s+up(?:\s|$)/i,
      category: 'CONTAINER_DESTRUCTION',
      reason: 'docker compose up recreates containers, killing your session',
      suggestion: 'Ask user to run this manually from VPS host'
    },
    // docker compose with --build flag anywhere
    {
      pattern: /docker\s+compose\s+.*--build/i,
      category: 'CONTAINER_DESTRUCTION',
      reason: '--build flag rebuilds containers which requires restart',
      suggestion: 'Ask user to run this manually from VPS host'
    },
    // systemctl restart docker (restarts ALL containers)
    {
      pattern: /systemctl\s+(restart|stop)\s+docker/i,
      category: 'CONTAINER_DESTRUCTION',
      reason: 'Restarting docker daemon kills ALL containers',
      suggestion: 'Ask user to run this manually from VPS host'
    },
  ];

  // ============================================================
  // CATEGORY 2: System Reboot/Shutdown
  // ============================================================

  const systemPatterns: BlockedPattern[] = [
    {
      pattern: /\breboot\b/i,
      category: 'SYSTEM_REBOOT',
      reason: 'This would reboot the VPS, killing all sessions',
      suggestion: 'Ask user if they really want to reboot'
    },
    {
      pattern: /\bshutdown\b/i,
      category: 'SYSTEM_SHUTDOWN',
      reason: 'This would shut down the VPS',
      suggestion: 'Ask user if they really want to shutdown'
    },
    {
      pattern: /\binit\s+[06]\b/i,
      category: 'SYSTEM_REBOOT',
      reason: 'init 0/6 triggers shutdown/reboot',
      suggestion: 'Ask user if they really want to reboot/shutdown'
    },
    {
      pattern: /\bpoweroff\b/i,
      category: 'SYSTEM_SHUTDOWN',
      reason: 'This would power off the VPS',
      suggestion: 'Ask user if they really want to power off'
    },
    {
      pattern: /\bhalt\b/i,
      category: 'SYSTEM_SHUTDOWN',
      reason: 'This would halt the VPS',
      suggestion: 'Ask user if they really want to halt'
    },
  ];

  // ============================================================
  // CATEGORY 3: Process Killing (Session Killers)
  // ============================================================

  const processPatterns: BlockedPattern[] = [
    // pkill/killall targeting critical processes
    {
      pattern: /\b(pkill|killall)\s+(-9\s+)?(claude|mosh|tmux|node)/i,
      category: 'PROCESS_KILL',
      reason: 'This would kill your Claude Code session or terminal',
      suggestion: 'Do not kill these processes - they are your session'
    },
    // kill -9 with signal
    {
      pattern: /\bkill\s+-9\s+/i,
      category: 'PROCESS_KILL',
      reason: 'kill -9 force-kills processes without cleanup',
      suggestion: 'Be careful with kill -9 - verify the PID is not critical'
    },
  ];

  // ============================================================
  // CATEGORY 4: Destructive File Operations
  // ============================================================

  const filePatterns: BlockedPattern[] = [
    // rm -rf on critical paths
    {
      pattern: /rm\s+(-[rf]+\s+)+\/(workspace|home|root|etc|var|usr)?\/?(\s|$|;|&|\|)/i,
      category: 'DESTRUCTIVE_DELETE',
      reason: 'This would delete critical system or workspace files',
      suggestion: 'Be very specific about what to delete, never use rm -rf on root paths'
    },
    // rm -rf /* or rm -rf /
    {
      pattern: /rm\s+(-[rf]+\s+)+\/(\*|$|\s)/i,
      category: 'DESTRUCTIVE_DELETE',
      reason: 'This would delete the entire filesystem',
      suggestion: 'NEVER run rm -rf on root paths'
    },
    // Disk wiping
    {
      pattern: /\bdd\s+.*if=\/dev\/(zero|random|urandom).*of=\/dev\/(sd|hd|nvme|vd)/i,
      category: 'DISK_WIPE',
      reason: 'This would wipe the disk',
      suggestion: 'NEVER wipe disks without explicit user approval'
    },
    // Filesystem formatting
    {
      pattern: /\b(mkfs|mke2fs|mkfs\.\w+)\s+/i,
      category: 'DISK_FORMAT',
      reason: 'This would format a filesystem, destroying all data',
      suggestion: 'NEVER format filesystems without explicit user approval'
    },
  ];

  // ============================================================
  // CATEGORY 5: Permission/Ownership Destruction
  // ============================================================

  const permissionPatterns: BlockedPattern[] = [
    // chmod 000 or chmod -R on critical paths
    {
      pattern: /chmod\s+(-R\s+)?0{3}\s+\//i,
      category: 'PERMISSION_DESTRUCTION',
      reason: 'This would remove all permissions from system files',
      suggestion: 'NEVER chmod 000 on root paths'
    },
    // chown -R to nobody/root on workspace
    {
      pattern: /chown\s+-R\s+(nobody|root).*\/(workspace|home)/i,
      category: 'PERMISSION_DESTRUCTION',
      reason: 'This would change ownership of critical directories',
      suggestion: 'Be very careful with recursive chown'
    },
  ];

  // ============================================================
  // CATEGORY 6: Fork Bomb / Resource Exhaustion
  // ============================================================

  const resourcePatterns: BlockedPattern[] = [
    // Classic fork bomb
    {
      pattern: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/,
      category: 'FORK_BOMB',
      reason: 'This is a fork bomb that would crash the system',
      suggestion: 'NEVER run fork bombs'
    },
    // Infinite loops that spawn processes
    {
      pattern: /while\s*\(?true\)?\s*;\s*do.*&.*done/i,
      category: 'RESOURCE_EXHAUSTION',
      reason: 'This infinite loop could exhaust system resources',
      suggestion: 'Be careful with infinite loops that spawn background processes'
    },
  ];

  // Combine all patterns
  const allPatterns = [
    ...containerPatterns,
    ...systemPatterns,
    ...processPatterns,
    ...filePatterns,
    ...permissionPatterns,
    ...resourcePatterns,
  ];

  // Check command against all patterns
  for (const blocked of allPatterns) {
    if (blocked.pattern.test(command)) {
      const isViaSSH = command.includes('ssh ') || command.includes('ssh\t');

      return {
        allow: false,
        message: `⛔ BLOCKED [${blocked.category}]

DETECTED COMMAND:
${command.length > 300 ? command.substring(0, 300) + '...' : command}

${isViaSSH ? '⚠️  SSH-wrapped command detected - same rules apply.\n\n' : ''}REASON: ${blocked.reason}

SUGGESTION: ${blocked.suggestion}

This hook exists because of multiple incidents where Vai killed the user's session.
If you believe this is a false positive, ask the user for explicit approval.

INCIDENT HISTORY:
- 2025-12-08: Unauthorized container restart (killed session)
- 2025-12-08: Attempted rebuild despite explicit constraint
- 2025-12-09: AGAIN killed session with docker compose restart`
      };
    }
  }

  return { allow: true };
}

main();
