---
skill-name: update-agent-instructions
version: 3.0
created: 2025-12-05
last-updated: 2025-12-05
status: active
purpose: Recognize when instructions need updating, discover/maintain project structure, and launch instruction-updater sub-agent
context: global
tags: [meta, instructions, self-improvement, knowledge-management, delegation, discovery]
---

# Update Agent Instructions - Global Skill

## Purpose

This skill helps recognize when instructions need updating and **launches a specialist sub-agent** to handle the analysis and update work. It automatically discovers and maintains a document describing the project's instruction structure, avoiding token waste on repeat runs.

**Key innovation:** Self-maintaining `.claude/PROJECT-INSTRUCTION-STRUCTURE.md` that maps where instructions live and how documentation feeds into them.

---

## How It Works

<workflow>

### First Run in a Project
1. Check for `.claude/PROJECT-INSTRUCTION-STRUCTURE.md`
2. Not found → Discover project structure (~5-10k tokens)
3. Create structure document
4. Feed structure + problem to instruction-updater sub-agent
5. Sub-agent analyzes and proposes updates

### Subsequent Runs
1. Check for `.claude/PROJECT-INSTRUCTION-STRUCTURE.md`
2. Found → Read structure doc (~1-2k tokens, 3-5x cheaper!)
3. Feed structure + problem to instruction-updater sub-agent
4. Sub-agent analyzes and proposes updates
5. If structure changed → Update the doc

</workflow>

---

## When to Launch the Sub-Agent

**Trigger scenarios:**
1. ✅ User corrects behavior ("you should have done X, not Y")
2. ✅ Same mistake made twice
3. ✅ User asks "how do we make sure you do this right next time?"
4. ✅ Patterns emerge that should be codified
5. ✅ User explicitly asks to update agent instructions
6. ✅ User invokes `/vai:update-instruction` (or custom prefix)

**When in doubt:** If you think "this might be worth capturing," launch the sub-agent.

---

## Project Structure Document

<structure-document>

### Location
`.claude/PROJECT-INSTRUCTION-STRUCTURE.md`

### Purpose
- Maps where agent instructions live
- Maps where documentation sources are
- Describes how docs feed into instructions
- Self-maintained by this skill

### Template

```markdown
# Project Instruction Structure

## Project Identity
- Name: [Project Name]
- Type: [e.g., web app, CLI tool, infrastructure]
- Context: [Brief description]

## Agent Instructions

### Primary Instruction Files
- Main: [path to CLAUDE.md or equivalent]
- Global: [path to global instructions if applicable]
- Project-specific: [paths to project-specific instruction files]

### Hooks
- Directory: [e.g., .claude/hooks/]
- Session start: [which hook loads what]
- Notable hooks: [list important hooks and what they do]

### Skills
- Directory: [e.g., .claude/skills/]
- Active skills: [list of skill names]

## Documentation Sources

### Primary Documentation
- Location: [where docs live, e.g., /docs/, /ai-context/]
- Structure: [how docs are organized]
- Key documents: [list important docs]

### How Documentation Feeds Into Instructions
- [Doc A] → [How it's used, e.g., auto-loaded via hook]
- [Doc B] → [How it's used, e.g., referenced in CLAUDE.md]
- [Pattern]: [Describe any patterns]

## Instruction Update Workflow

### When Instructions Change
- [Describe the process, e.g., edit files, commit, push]

### Testing Changes
- [How to verify instructions work]

## Last Updated
[Date and what changed]
```

</structure-document>

---

## Discovery Process

<discovery>

When `.claude/PROJECT-INSTRUCTION-STRUCTURE.md` doesn't exist, discover:

### Step 1: Find Agent Instruction Files

```bash
# Search for main instruction files
find . -name "CLAUDE.md" -o -name "claude.md" -o -name ".claude.md" 2>/dev/null

# Search for .claude directory
find . -type d -name ".claude" 2>/dev/null

# Check for global instructions
ls -la ~/ai-global/ai-global-docs/*.md 2>/dev/null
```

### Step 2: Find Documentation Sources

```bash
# Common doc locations
find . -type d \( -name "docs" -o -name "documentation" -o -name "ai-context" \) 2>/dev/null

# Markdown files that might be docs
find . -name "*.md" -type f | grep -E "(README|GUIDE|PROTOCOL|CONTEXT)" 2>/dev/null
```

### Step 3: Find Hooks and Skills

```bash
# Hooks
find .claude -type d -name "hooks" 2>/dev/null
ls -la .claude/hooks/*.ts 2>/dev/null

# Skills
find .claude -type d -name "skills" 2>/dev/null
ls -la .claude/skills/*/SKILL.md 2>/dev/null
```

### Step 4: Analyze How Docs Feed Into Instructions

```bash
# Check session start hooks for auto-loading
grep -r "readFileSync\|require\|import" .claude/hooks/*session*.ts 2>/dev/null

# Check CLAUDE.md for doc references
grep -r "ai-context\|docs/\|documentation" .claude/CLAUDE.md 2>/dev/null
```

### Step 5: Create Structure Document

Write `.claude/PROJECT-INSTRUCTION-STRUCTURE.md` with findings.

</discovery>

---

## Context to Gather Before Launching Sub-Agent

<context-gathering>

### 1. What Went Wrong (or What to Improve)
- **The mistake:** What happened that was incorrect?
- **What should have happened:** Correct behavior?
- **User's correction:** Exact quote if available

**Example:**
```
Mistake: Added tasks to Soul Codes Tasks.md
Should have: Added tasks to weekly planning note
User said: "This shouldn't go in Soul Codes tasks. My planning content is in weekly planning."
```

### 2. Relevant Context
- **When it happened:** During what kind of task?
- **Why the mistake:** What instruction missing/unclear?
- **Frequency:** First time or recurring?

**Example:**
```
Context: User asked to add tasks "for tomorrow"
Missing instruction: No clear rule about daily vs major tasks
Frequency: First time with this specific workflow
```

### 3. Project Structure
- **Load from:** `.claude/PROJECT-INSTRUCTION-STRUCTURE.md`
- **Or discover:** If file doesn't exist, run discovery

### 4. Initial Hypothesis
- **Scope:** Global (all agents) or local (this project)?
- **Related files:** Which instruction files might need updating?

**Example:**
```
Scope: Local (user's specific planning workflow)
Related: vai-operational-protocols.md (task management section)
```

</context-gathering>

---

## Launching the Sub-Agent

<launch-template>

### Prompt Template

```
I made a mistake that suggests our instructions need updating.

**Project Structure:**
[Paste contents of .claude/PROJECT-INSTRUCTION-STRUCTURE.md OR discovery findings]

**What went wrong:**
[Describe the mistake and what should have happened]

**Context:**
[When it happened, why the mistake was made, frequency]

**User's correction:**
"[Exact quote if available]"

**Initial hypothesis:**
- Scope: [Global or Local?]
- Related files: [Which instruction files might need updating?]

Please:
1. Analyze existing instructions to understand the gap
2. Check for duplication or conflicts across instruction files
3. Draft an instruction update that is:
   - General enough to apply to similar situations
   - Behaviorally specific enough to prevent the mistake
4. Propose consolidation if you find related duplicated content
5. If the instruction organization has changed, note what should be updated in PROJECT-INSTRUCTION-STRUCTURE.md
6. Return your recommendation for approval
```

### Tool Invocation

```typescript
Task({
  description: "Update instructions: [brief description]",
  subagent_type: "instruction-updater",
  prompt: [full prompt from template above]
})
```

</launch-template>

---

## After Sub-Agent Returns

<post-agent>

### Step 1: Review Recommendation
- Does it make sense?
- Does it address the root cause?
- Are there side effects?

### Step 2: Present to User
- Show proposed updates
- Explain what behavior will change
- Ask for approval

### Step 3: Apply Updates (If Approved)
- Edit instruction files as recommended
- Commit changes to git
- Push to remote

### Step 4: Update Structure Doc (If Needed)
- If sub-agent noted structure changes
- Update `.claude/PROJECT-INSTRUCTION-STRUCTURE.md`
- Commit the structure doc update

</post-agent>

---

## Example: Full Workflow

<example>

### Trigger
User corrects task placement: "This shouldn't go in Soul Codes tasks."

### Step 1: Check Structure Doc
```bash
ls .claude/PROJECT-INSTRUCTION-STRUCTURE.md
# Exists → Read it (1-2k tokens)
```

### Step 2: Gather Context
```
Mistake: Added "Import SupaBase Notes" to Soul Codes Tasks.md
Should have: Added to weekly planning note, Friday section
User said: "This shouldn't go in Soul Codes tasks. My planning is in weekly planning."
Context: User asked "add to my to-do for tomorrow"
Missing: No clear decision tree for daily vs major tasks
Frequency: First time
Scope: Local (user's planning system)
Related: vai-operational-protocols.md
```

### Step 3: Launch Sub-Agent
```
Project Structure:
[Contents of PROJECT-INSTRUCTION-STRUCTURE.md showing:
 - vai-operational-protocols.md auto-loads via hook
 - CLAUDE.md references operational protocols
 - Documentation in /workspace/khali-obsidian-vault/ai-context/vai/]

What went wrong:
User asked to "add to my to-do for tomorrow: Import SupaBase Notes"
I added it to Soul Codes Tasks.md
Should have added to weekly planning note, Friday section

Context:
Happened when user requested daily tasks for specific day
I didn't have clear rule distinguishing daily vs major tasks
First time encountering this workflow

User's correction:
"This shouldn't go in Soul Codes tasks. My planning content is in weekly planning."

Initial hypothesis:
- Scope: LOCAL (user's specific planning workflow)
- Related files: vai-operational-protocols.md (task management)

Please analyze and propose instruction updates.
```

### Step 4: Sub-Agent Analyzes
- Reads vai-operational-protocols.md
- Identifies gap (no task placement decision tree)
- Proposes update with clear trigger patterns
- Notes: No structure changes needed

### Step 5: Review & Apply
- Review recommendation
- Present to user
- Get approval
- Apply update to vai-operational-protocols.md
- Commit changes

### Step 6: Update Structure Doc (If Needed)
In this case: No changes to structure, skip.

</example>

---

## Important Notes

**Quality over efficiency:**
- Don't worry about token burn for instruction updates
- Better to get instructions right than save tokens
- Structure doc keeps repeat runs cheap

**Trust the sub-agent:**
- It's trained to check duplication, conflicts, specificity
- It knows consolidation patterns
- It understands global vs local decisions

**Your job:**
- Recognize the trigger
- Check/create structure doc
- Gather context
- Launch sub-agent
- Present recommendation
- Update structure doc if needed

**Don't do yourself:**
- Analyze existing instructions in detail
- Check for conflicts or duplication
- Draft the update
- Figure out consolidation

---

## Maintaining the Structure Document

<maintenance>

### When to Update

Update `.claude/PROJECT-INSTRUCTION-STRUCTURE.md` when:

1. **New instruction files added**
   - New CLAUDE.md variant
   - New project-specific protocols
   - New global instruction references

2. **New hooks or skills added**
   - Session start hooks that auto-load docs
   - Skills that reference specific documentation

3. **Documentation reorganized**
   - Docs moved to new location
   - New documentation sections created
   - Documentation structure changed

4. **Sub-agent notes changes**
   - If recommendation includes "update PROJECT-INSTRUCTION-STRUCTURE.md"
   - If instruction organization changed

### How to Update

1. Read current document
2. Identify what changed
3. Update relevant section
4. Add note in "Last Updated" section
5. Commit with other instruction changes

</maintenance>

---

## Integration with Slash Command

This skill works seamlessly with `/vai:update-instruction` (or custom prefix):

1. User runs: `/vai:update-instruction [problem description]`
2. Slash command expands with context
3. This skill recognizes the trigger
4. Checks/creates structure doc
5. Launches sub-agent with full context
6. Returns recommendation
7. Updates structure doc if needed

---

## Token Economics

**First run (discovery):**
- Find files: ~1k tokens
- Read samples: ~2k tokens
- Analyze structure: ~2k tokens
- Create doc: ~1k tokens
- **Total: ~5-10k tokens**

**Subsequent runs (structure doc exists):**
- Read structure doc: ~1-2k tokens
- **Savings: 3-5x cheaper**

**Over 10 instruction updates:**
- With discovery each time: ~50-100k tokens
- With structure doc: ~10-20k tokens
- **Savings: ~30-80k tokens**

---

## Success Criteria

A successful instruction update should:

**Process:**
- ✅ Structure doc checked/created automatically
- ✅ Sub-agent receives complete project context
- ✅ Recommendation is concrete and behavioral
- ✅ Structure doc updated if organization changed

**Quality:**
- ✅ Proposed update addresses root cause
- ✅ Update is general + behaviorally specific
- ✅ Duplication consolidated
- ✅ Conflicts resolved with trade-off framing

**Maintenance:**
- ✅ Structure doc stays current
- ✅ Changes committed to git
- ✅ Documentation updated if needed

---

## Version History

- **v3.0** (2025-12-05):
  - Made skill global (not project-specific)
  - Added PROJECT-INSTRUCTION-STRUCTURE.md discovery and maintenance
  - Optimized for token efficiency (3-5x savings on repeat runs)
  - Self-maintaining structure documentation
- **v0.3** (2025-12-05):
  - Rewritten to use sub-agent delegation model
  - Simplified to: recognize trigger → gather context → launch sub-agent
- **v0.2** (2025-12-05):
  - Made skill project-specific
  - Added global vs local instruction decision framework
- **v0.1** (2025-12-05):
  - Initial skill creation
