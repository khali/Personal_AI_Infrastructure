#!/usr/bin/env bun
/**
 * StopOrchestrator.hook.ts - Single Entry Point for Stop Hooks
 *
 * PLATFORM-WIDE-CHANGE-ACKNOWLEDGED: Stop orchestration applies to all users
 * PLATFORM-WIDE-CHANGE-ACKNOWLEDGED: Adding wrapHookHandler for consistent hook error notifications to NTFY across all users
 *
 * PURPOSE:
 * Orchestrates all Stop event handlers by reading and parsing the transcript
 * ONCE, then distributing the parsed data to isolated handlers. This prevents
 * multiple redundant transcript reads and ensures data consistency.
 *
 * TRIGGER: Stop (fires after Claude generates a response)
 *
 * INPUT:
 * - session_id: Current session identifier
 * - transcript_path: Path to the JSONL transcript file
 * - hook_event_name: "Stop"
 *
 * OUTPUT:
 * - stdout: None (no context injection)
 * - exit(0): Normal completion
 *
 * SIDE EFFECTS:
 * - Voice handler: Announces completion via voice server
 * - Capture handler: Updates WORK/ directory with response
 * - TabState handler: Resets tab title/color to default
 * - SystemIntegrity handler: Detects PAI changes and spawns background maintenance
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: UpdateTabTitle (expects tab to be in working state)
 * - COORDINATES WITH: AutoWorkCreation (updates work created by it)
 * - MUST RUN BEFORE: None
 * - MUST RUN AFTER: Claude's response generation
 *
 * HANDLERS (in hooks/handlers/):
 * - voice.ts: Extracts 🗣️ line, sends to voice server
 * - capture.ts: Updates current-work.json and WORK/ items
 * - tab-state.ts: Resets Kitty tab to default UL blue
 * - SystemIntegrity.ts: Detects PAI changes, spawns IntegrityMaintenance.ts
 *
 * ERROR HANDLING:
 * - Missing transcript: Exits gracefully
 * - Parse failures: Logged, exits gracefully
 * - Handler failures: Isolated via Promise.allSettled (one failure doesn't affect others)
 *
 * PERFORMANCE:
 * - Non-blocking: Yes
 * - Typical execution: <200ms
 * - Optimization: Single transcript read vs. 3+ separate reads
 *
 * ARCHITECTURE NOTES:
 * Before this orchestrator, each Stop handler read the transcript independently:
 * - 4 transcript reads → 1 (3x I/O reduction)
 * - Guaranteed consistency (all handlers see same data)
 * - Isolated failures (Promise.allSettled)
 */

import { parseTranscript } from '../skills/CORE/Tools/TranscriptParser';
import { handleVoice } from './handlers/voice';
import { handleCapture } from './handlers/capture';
import { handleTabState } from './handlers/tab-state';
import { handleSystemIntegrity } from './handlers/SystemIntegrity';
import { wrapHookHandler } from '/opt/soul-codes/platform/lib/hooks/error-logger';

interface HookInput {
  session_id: string;
  transcript_path: string;
  hook_event_name: string;
}

// PLATFORM-WIDE-CHANGE-ACKNOWLEDGED: Converting to wrapHookHandler for NTFY notifications on errors
const handler = wrapHookHandler('StopOrchestrator.hook', async (inputStr: string) => {
  if (!inputStr.trim()) {
    console.error('[StopOrchestrator] No input provided');
    return;
  }

  const hookInput: HookInput = JSON.parse(inputStr);

  if (!hookInput.transcript_path) {
    console.error('[StopOrchestrator] No transcript path provided');
    return;
  }

  // SINGLE READ, SINGLE PARSE
  const parsed = parseTranscript(hookInput.transcript_path);

  console.error(`[StopOrchestrator] Parsed transcript: ${parsed.plainCompletion.slice(0, 50)}...`);

  // Run handlers with pre-parsed data (isolated failures)
  const results = await Promise.allSettled([
    handleVoice(parsed, hookInput.session_id),
    handleCapture(parsed, hookInput),
    handleTabState(parsed),
    handleSystemIntegrity(parsed, hookInput),
  ]);

  // Log any failures
  results.forEach((result, index) => {
    const handlerNames = ['Voice', 'Capture', 'TabState', 'SystemIntegrity'];
    if (result.status === 'rejected') {
      console.error(`[StopOrchestrator] ${handlerNames[index]} handler failed:`, result.reason);
    }
  });
});

handler().catch(() => process.exit(1));
