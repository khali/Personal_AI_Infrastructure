#!/usr/bin/env bun

/**
 * PostToolUse Hook - Smoke Test Enforcement
 *
 * Enforces the CRITICAL rule: ALL smoke tests MUST pass.
 *
 * DETECTS:
 * - Running individual test files instead of full suite
 * - Test failures in bats output
 * - Agent potentially ignoring test failures
 *
 * WARNS via system-reminder output when violations detected.
 */

interface ToolUseData {
  tool_name: string;
  tool_input: Record<string, any>;
  tool_response: Record<string, any>;
  conversation_id: string;
  timestamp: string;
}

async function main() {
  try {
    // Read input from stdin
    const input = await Bun.stdin.text();
    if (!input || input.trim() === '') {
      process.exit(0);
    }

    const data: ToolUseData = JSON.parse(input);

    // Only check Bash tool
    if (data.tool_name !== 'Bash') {
      process.exit(0);
    }

    const command = data.tool_input?.command || '';
    const output = typeof data.tool_response === 'string'
      ? data.tool_response
      : JSON.stringify(data.tool_response);

    // ==========================================================================
    // CHECK 1: Detect partial smoke test runs (individual files)
    // ==========================================================================

    // Check if running bats with a specific file instead of directory
    const isSmokeSingleFile = command.match(/bats\s+.*tests\/smoke\/[^/\s]+\.bats/);
    const isSmokeFullSuite = command.match(/bats\s+.*tests\/smoke\/?(?:\s|$)/);

    if (isSmokeSingleFile && !isSmokeFullSuite) {
      console.log(`
<system-reminder>
⚠️ SMOKE TEST WARNING: You are running a SINGLE test file, not the full suite.

COMMAND: ${command}

This defeats the purpose of smoke tests. The rule is:
  bats tests/smoke/   ← Run the ENTIRE directory

NOT:
  bats tests/smoke/test_one_file.bats   ← Partial (WRONG)

Please run the FULL smoke test suite before claiming work is complete.
See vai-operational-protocols.md section "⚠️ CRITICAL: ALL Smoke Tests MUST Pass"
</system-reminder>
`);
    }

    // ==========================================================================
    // CHECK 2: Detect test failures in bats output
    // ==========================================================================

    // Look for bats failure patterns
    const failureMatch = output.match(/(\d+)\s+tests?,\s+(\d+)\s+failures?/i);

    if (failureMatch) {
      const totalTests = parseInt(failureMatch[1], 10);
      const failedTests = parseInt(failureMatch[2], 10);

      if (failedTests > 0) {
        console.log(`
<system-reminder>
🚫 SMOKE TEST FAILURE DETECTED: ${failedTests} of ${totalTests} tests failed.

YOU CANNOT CLAIM WORK IS COMPLETE.

Before marking ANY task as done, you MUST:
1. Investigate ALL failing tests
2. Fix the failures (or update tests if they're outdated)
3. Re-run the FULL suite: bats tests/smoke/
4. Confirm ZERO failures

This is a BLOCKER. The work is NOT done until all tests pass.
See vai-operational-protocols.md section "⚠️ CRITICAL: ALL Smoke Tests MUST Pass"
</system-reminder>
`);
      } else if (failedTests === 0 && totalTests > 0) {
        // All tests passed - good!
        console.log(`
<system-reminder>
✅ Smoke tests: ${totalTests} tests, 0 failures. Good to proceed.
</system-reminder>
`);
      }
    }

    // ==========================================================================
    // CHECK 3: Detect bats not found or other errors
    // ==========================================================================

    if (command.includes('bats') && output.includes('command not found')) {
      console.log(`
<system-reminder>
⚠️ BATS NOT FOUND: Cannot run smoke tests.

Ensure bats-core is installed on the target system.
For VPS: apt-get install bats
For containers: Check Dockerfile includes bats
</system-reminder>
`);
    }

    process.exit(0);
  } catch (error) {
    // Silent failure - don't disrupt workflow
    console.error(`[Smoke Test Hook] Error: ${error}`);
    process.exit(0);
  }
}

main();
