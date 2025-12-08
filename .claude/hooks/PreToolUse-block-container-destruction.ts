#!/usr/bin/env npx ts-node
/**
 * PreToolUse Hook: Block Container Destruction
 *
 * INCIDENT 1: 2025-12-08 - Vai restarted vai-container without permission,
 * killing user's session and losing work.
 *
 * INCIDENT 2: 2025-12-08 - Vai attempted to rebuild containers via SSH
 * despite user explicitly saying "do not rebuild containers".
 * `docker compose build` was not in the blocklist.
 *
 * PURPOSE: Prevent agents from restarting, stopping, rebuilding, or removing
 * the vai or services containers - even via SSH to VPS.
 *
 * BLOCKS:
 * - docker restart/stop/rm/kill/build vai|services
 * - docker compose restart/stop/down/rm/build vai|services
 * - Same commands wrapped in SSH (the actual incident vector)
 *
 * WHY SSH MATTERS:
 * The original incident used: ssh root@vps "docker compose restart vai services"
 * Direct deny rules don't catch SSH-wrapped commands.
 *
 * WHY BUILD IS BLOCKED:
 * - Running build from inside a container is conceptually wrong
 * - Build is almost always followed by `up -d` which recreates containers
 * - User explicitly told agent not to rebuild, but agent ignored instruction
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
  // Include container name variants (with/without -container suffix)
  const protectedContainers = ['vai', 'services', 'agents', 'vai-container', 'services-container', 'agents-container'];

  // Destructive docker operations (including build - can't rebuild from inside container)
  const destructiveOps = ['restart', 'stop', 'rm', 'kill', 'down', 'build'];

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

    // Detect which operation was attempted
    const isBuild = /docker\s+(?:compose\s+)?build/i.test(command);
    const operation = isBuild ? 'rebuild' : 'restart/stop/remove';

    return {
      allow: false,
      message: `⛔ BLOCKED: Cannot ${operation} vai or services containers.

DETECTED COMMAND:
${command.length > 200 ? command.substring(0, 200) + '...' : command}

${isViaSSH ? '⚠️  This was an SSH-wrapped command - same rules apply.\n' : ''}
WHY THIS IS BLOCKED:
• You are RUNNING INSIDE vai-container
• ${isBuild
    ? 'Rebuilding containers from inside is a conceptual error\n• Build is typically followed by `up -d` which recreates your container\n• Even if you ONLY build, you cannot apply changes without restart'
    : 'Restarting/stopping it kills your session immediately\n• User loses all unsaved work and conversation context'}
• This requires EXPLICIT user approval BEFORE execution

WHAT TO DO INSTEAD:
1. STOP and ASK: "I need to ${isBuild ? 'rebuild and restart' : 'restart'} containers to apply changes. Is that OK?"
2. WAIT for explicit "yes" from user
3. If approved, USER can run the command manually from host
4. Or user can grant one-time permission for you to run it

INCIDENT REFERENCES:
- 2025-12-08 unauthorized container restart
- 2025-12-08 attempted rebuild despite user explicitly saying "do not rebuild"`
    };
  }

  return { allow: true };
}

main();
