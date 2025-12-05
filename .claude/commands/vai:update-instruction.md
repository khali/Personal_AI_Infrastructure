---
name: vai:update-instruction
description: Analyze and update agent instructions based on behavior that needs correcting or improving. USE WHEN you want to improve how I handle a specific situation, fix a behavioral pattern, or capture a new workflow. Launches the instruction-updater sub-agent.
argument-hint: [problem description or desired behavior]
allowed-tools: Task, Read, Grep, Glob, Bash
---

<objective>
Analyze instruction updates needed based on: $ARGUMENTS

This helps improve my behavioral patterns, capture lessons from mistakes, and codify workflows that should be automated.
</objective>

<context>
Recent instruction files: ! `find /workspace/khali-obsidian-vault/ai-context/vai -name "*.md" -type f -exec ls -lt {} + | head -10`
Recent global instructions: @ /home/devuser/ai-global/ai-global-docs/claude-global.md
Recent commits: ! `cd /workspace && git log --oneline -10`
</context>

<process>
1. **Understand the problem** from your description ($ARGUMENTS)
   - What behavior needs to change?
   - What should happen instead?
   - Is this a mistake pattern or a new workflow to codify?

2. **Load relevant instruction context**
   - Check existing instructions for related guidance
   - Identify global vs local scope
   - Look for duplication or conflicts

3. **Launch the instruction-updater sub-agent**
   - Provide comprehensive context about the issue
   - Ask the sub-agent to analyze and propose updates
   - Sub-agent will check duplication, conflicts, specificity

4. **Review the recommendation**
   - Understand the proposed instruction changes
   - Verify they address your concern
   - Check for side effects or unintended consequences

5. **Approve and apply** (or iterate if needed)
   - Give approval to apply recommended updates
   - Commit changes if instructions were updated
</process>

<success_criteria>
- Problem clearly understood and documented
- Relevant instruction files identified
- Sub-agent provides concrete recommendation for updates
- Proposed updates are specific and behavioral (not vague)
- Recommendation addresses root cause, not just symptom
- Clear before/after showing what will change
</success_criteria>

<verification>
After sub-agent provides recommendation:
- Can you explain what behavior will change?
- Will this fix the problem without breaking other behavior?
- Does the update apply to relevant instruction files?
- Is the instruction concrete enough to prevent recurrence?
</verification>
