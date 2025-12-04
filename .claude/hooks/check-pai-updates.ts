#!/usr/bin/env bun

/**
 * check-pai-updates.ts
 *
 * SessionStart hook that checks for new commits on danielmiessler's PAI framework.
 *
 * What it does:
 * - Runs during SessionStart (before session begins)
 * - Fetches latest changes from upstream (danielmiessler's repo)
 * - If new commits exist, outputs a notification message
 * - Message appears in session context so Vai knows to mention it
 *
 * Setup:
 * 1. Fork danielmiessler/Personal_AI_Infrastructure to your GitHub
 * 2. Configure remotes:
 *    - origin: your fork (for pushing customizations)
 *    - upstream: danielmiessler's repo (for pulling updates)
 * 3. Add this hook to SessionStart in settings.json
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const PAI_REPO_PATH = '/workspace/PAI';

async function checkForUpdates() {
  try {
    // Verify we're in a git repo with upstream remote configured
    if (!existsSync(join(PAI_REPO_PATH, '.git'))) {
      console.error('⚠️ PAI directory is not a git repository');
      return;
    }

    // Check if upstream remote exists
    const remotes = execSync('git remote', {
      cwd: PAI_REPO_PATH,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    if (!remotes.includes('upstream')) {
      console.error('⚠️ No upstream remote configured for PAI repo');
      return;
    }

    // Fetch latest changes from upstream (silently)
    execSync('git fetch upstream --quiet', {
      cwd: PAI_REPO_PATH,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Check for new commits on upstream/main
    const newCommits = execSync('git log HEAD..upstream/main --oneline', {
      cwd: PAI_REPO_PATH,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();

    if (newCommits) {
      // Count number of new commits
      const commitCount = newCommits.split('\n').length;

      // Get short summary of commits
      const commitSummary = newCommits.split('\n').slice(0, 3).join('\n');

      // Output notification that will appear in session
      console.error('\n📦 PAI Framework Updates Available');
      console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.error(`${commitCount} new commit${commitCount > 1 ? 's' : ''} from danielmiessler/Personal_AI_Infrastructure`);
      console.error('');
      console.error('Recent changes:');
      console.error(commitSummary);
      if (commitCount > 3) {
        console.error(`... and ${commitCount - 3} more`);
      }
      console.error('');
      console.error('To review: git log HEAD..upstream/main');
      console.error('To merge: git pull upstream main');
      console.error(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

  } catch (error) {
    // Silently fail - don't break session start over update checks
    // console.error('Error checking for PAI updates:', error);
  }
}

checkForUpdates();
