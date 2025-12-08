#!/usr/bin/env npx ts-node
/**
 * PreToolUse Hook: Block Container Destruction
 *
 * INCIDENT: 2025-12-08 - Vai restarted vai-container without permission,
 * killing user's session and losing work.
 *
 * PURPOSE: Prevent agents from restarting, stopping, or removing the
 * vai or services containers - even via SSH to VPS.
 *
 * BLOCKS:
 * - docker restart/stop/rm/kill vai|services
 * - docker compose restart/stop/down/rm vai|services
 * - Same commands wrapped in SSH (the actual incident vector)
 *
 * WHY SSH MATTERS:
 * The original incident used: ssh root@vps "docker compose restart vai services"
 * Direct deny rules don't catch SSH-wrapped commands.
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

function checkCommand(params: PreToolUseInput): PreToolUseResult {
  const { tool, input } = params;

  // Only check Bash commands
  if (tool !== "Bash") {
    return { allow: true };
  }

  const command = (input.command as string) || "";

  // Protected containers - these are critical infrastructure
  const protectedContainers = ['vai', 'services'];

  // Destructive docker operations
  const destructiveOps = ['restart', 'stop', 'rm', 'kill', 'down'];

  // Pattern 1: Direct docker commands
  // e.g., "docker restart vai", "docker compose stop services"
  const directDockerPattern = new RegExp(
    `docker\\s+(?:compose\\s+)?(${destructiveOps.join('|')})\\s+.*\\b(${protectedContainers.join('|')})\\b`,
    'i'
  );

  // Pattern 2: docker compose down (affects all containers)
  const composeDownPattern = /docker\s+compose\s+down/i;

  // Check if command matches dangerous patterns
  // This catches both direct commands AND SSH-wrapped commands
  if (directDockerPattern.test(command) || composeDownPattern.test(command)) {
    const isViaSSH = command.includes('ssh ') || command.includes('ssh\t');

    return {
      allow: false,
      message: `⛔ BLOCKED: Cannot restart/stop/remove vai or services containers.

DETECTED COMMAND:
${command.length > 200 ? command.substring(0, 200) + '...' : command}

${isViaSSH ? '⚠️  This was an SSH-wrapped command - same rules apply.\n' : ''}
WHY THIS IS BLOCKED:
• You are RUNNING INSIDE vai-container
• Restarting/stopping it kills your session immediately
• User loses all unsaved work and conversation context
• This requires EXPLICIT user approval BEFORE execution

WHAT TO DO INSTEAD:
1. STOP and ASK: "I need to restart containers to apply changes. Is that OK?"
2. WAIT for explicit "yes" from user
3. If approved, USER can run the command manually
4. Or user can grant one-time permission for you to run it

INCIDENT REFERENCE: 2025-12-08 unauthorized container restart`
    };
  }

  return { allow: true };
}

main();
