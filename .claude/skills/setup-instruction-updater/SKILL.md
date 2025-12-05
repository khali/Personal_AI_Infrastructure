---
skill-name: setup-instruction-updater
version: 1.0
created: 2025-12-05
last-updated: 2025-12-05
status: active
purpose: Bootstrap instruction-updater infrastructure in new projects
context: general-purpose
tags: [meta, setup, bootstrap, instructions, infrastructure]
---

# Setup Instruction-Updater Infrastructure - Skill

## Purpose

This skill helps you set up the complete instruction-updater system in new projects. It creates:
1. **Agent definition** - The instruction-updater sub-agent (user-level or project-level)
2. **Skill definition** - Recognition skill for when to trigger the agent
3. **Slash command** - `/vai:update-instruction` or custom-prefixed command
4. **Session hooks** (optional) - Auto-load operational protocols if needed

---

## When to Use This Skill

**Trigger scenarios:**
1. ✅ Setting up a new AI-assisted project
2. ✅ Adding instruction management to existing project
3. ✅ Creating project-specific instruction-updater infrastructure
4. ✅ Bootstrapping Vai-like capabilities in other contexts

**When NOT to use:**
- ❌ Just updating existing instructions (use `/vai:update-instruction` instead)
- ❌ The infrastructure already exists in the project

---

## What Gets Created

<infrastructure-components>

### 1. Instruction-Updater Agent
**Location:** `~/.claude/agents/instruction-updater.md` (user-level) OR `.claude/agents/instruction-updater.md` (project-level)

**Purpose:** Specialist sub-agent that analyzes instruction updates, checks duplication/conflicts, proposes consolidation

**Capabilities:**
- Analyzes existing instructions
- Checks for duplication across files
- Identifies conflicts and proposes trade-off framing
- Ensures behavioral specificity
- Makes educated guesses before asking questions
- Proposes consolidated updates

### 2. Skill Definition
**Location:** `.claude/skills/update-agent-instructions/SKILL.md` (or custom path)

**Purpose:** Recognition skill that knows when to launch the instruction-updater sub-agent

**Capabilities:**
- Recognizes trigger patterns (mistakes, corrections, new workflows)
- Gathers relevant context before launching agent
- Provides template for agent invocation
- Manages approval workflow

### 3. Slash Command
**Location:** `.claude/commands/vai:update-instruction.md` (or custom prefix)

**Purpose:** Quick access to instruction-update workflow

**Usage:** `/vai:update-instruction [problem description]`

### 4. Session Start Hook (Optional)
**Location:** `.claude/hooks/load-core-context.ts` (or similar)

**Purpose:** Auto-load operational protocols at session start

</infrastructure-components>

---

## Setup Workflow

<workflow name="bootstrap-instruction-updater">

### Step 1: Gather Project Context

**Questions to answer:**
1. What is the project name/context? (e.g., "Vai", "ProjectX", "MyApp")
2. Where should the agent live?
   - User-level (`~/.claude/agents/`) - shared across all projects
   - Project-level (`.claude/agents/`) - project-specific
3. What prefix for slash command? (e.g., `vai:`, `project:`, or none)
4. Where are instruction files stored?
   - Standard: `.claude/` directory
   - Custom: specify path (e.g., `/workspace/khali-obsidian-vault/ai-context/vai/`)
5. Should operational protocols auto-load at session start? (yes/no)

### Step 2: Create Agent Definition

**Source template:** `/home/devuser/.claude/agents/instruction-updater.md`

**Customizations:**
- Update role name if project-specific (e.g., "ProjectX Instruction Updater")
- Update instruction file paths if custom location
- Keep core logic identical (analysis, educated guessing, etc.)

**Actions:**
```bash
# User-level (shared across projects)
cp /home/devuser/.claude/agents/instruction-updater.md ~/.claude/agents/instruction-updater.md

# OR Project-level (project-specific)
cp /home/devuser/.claude/agents/instruction-updater.md .claude/agents/instruction-updater.md
```

### Step 3: Create Skill Definition

**Template location:** `/workspace/khali-obsidian-vault/ai-context/vai/skills/update-agent-instructions/SKILL.md`

**Customizations:**
- Update `skill-name` to match project context
- Update `context` field (e.g., "vai-specific" → "project-specific")
- Update file paths in examples to match project structure
- Update trigger scenarios if project has specific patterns

**Actions:**
```bash
# Create skill directory
mkdir -p .claude/skills/update-agent-instructions/

# Copy and customize template
cp /workspace/khali-obsidian-vault/ai-context/vai/skills/update-agent-instructions/SKILL.md \
   .claude/skills/update-agent-instructions/SKILL.md

# Edit customizations
# - Update skill-name
# - Update context field
# - Update file paths in examples
```

### Step 4: Create Slash Command

**Template location:** `/workspace/PAI/.claude/commands/vai:update-instruction.md`

**Customizations:**
- Rename file if different prefix needed (e.g., `project:update-instruction.md`)
- Update `name` field in frontmatter
- Update instruction file paths in `<context>` tag
- Keep core structure identical

**Actions:**
```bash
# Standard vai: prefix
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/vai:update-instruction.md

# OR Custom prefix
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/project:update-instruction.md
# Then edit file to update name and paths
```

### Step 5: Setup Session Start Hook (Optional)

**Only needed if:**
- Project has operational protocols that should auto-load
- Similar to Vai's `vai-operational-protocols.md` pattern

**Template location:** `/workspace/PAI/.claude/hooks/load-core-context.ts`

**Customizations:**
- Update path to operational protocols file
- Update section heading in injected content

**Actions:**
```bash
# Copy template
cp /workspace/PAI/.claude/hooks/load-core-context.ts .claude/hooks/load-core-context.ts

# Edit to update paths
# - Update vaiContextPath to project-specific protocol file
# - Update section heading in injected content
```

### Step 6: Verify Installation

**Checks:**
1. ✅ Agent file exists and is valid markdown
2. ✅ Skill file exists in correct location
3. ✅ Slash command file exists and has correct prefix
4. ✅ Hook file exists if operational protocols needed
5. ✅ Test slash command: `/vai:update-instruction test`

**Testing:**
```bash
# Test slash command expansion
/vai:update-instruction This is a test to verify the infrastructure is working

# Should trigger the skill, which launches the sub-agent
# Sub-agent should analyze and respond
```

</workflow>

---

## Quick Setup Examples

<example name="standard-project-setup">

**Scenario:** New project needs instruction management with standard structure

**Commands:**
```bash
# 1. Create agent (user-level, shared)
cp /home/devuser/.claude/agents/instruction-updater.md ~/.claude/agents/instruction-updater.md

# 2. Create skill (project-level)
mkdir -p .claude/skills/update-agent-instructions/
cp /workspace/khali-obsidian-vault/ai-context/vai/skills/update-agent-instructions/SKILL.md \
   .claude/skills/update-agent-instructions/SKILL.md

# 3. Create slash command (standard vai: prefix)
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/vai:update-instruction.md

# 4. Test
/vai:update-instruction test installation
```

**Customization needed:** None for standard setup

</example>

<example name="custom-prefix-setup">

**Scenario:** Project wants custom prefix like `myapp:` instead of `vai:`

**Commands:**
```bash
# 1. Agent (user-level)
cp /home/devuser/.claude/agents/instruction-updater.md ~/.claude/agents/instruction-updater.md

# 2. Skill (project-level)
mkdir -p .claude/skills/update-agent-instructions/
cp /workspace/khali-obsidian-vault/ai-context/vai/skills/update-agent-instructions/SKILL.md \
   .claude/skills/update-agent-instructions/SKILL.md

# 3. Slash command with custom prefix
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/myapp:update-instruction.md
```

**Customization needed:**
- Edit `.claude/commands/myapp:update-instruction.md`
- Change `name: vai:update-instruction` to `name: myapp:update-instruction`
- Update instruction file paths if different from standard

</example>

<example name="project-specific-agent">

**Scenario:** Project needs its own agent (not shared across projects)

**Commands:**
```bash
# 1. Agent (project-level, not user-level)
mkdir -p .claude/agents/
cp /home/devuser/.claude/agents/instruction-updater.md \
   .claude/agents/instruction-updater.md

# 2-3. Skill and slash command (same as standard)
```

**Customization needed:**
- Edit `.claude/agents/instruction-updater.md`
- Update role name: "Instruction Updater" → "MyApp Instruction Updater"
- Update instruction file paths to project-specific locations

</example>

---

## Customization Guide

<customization-points>

### Agent Definition Customizations

**File:** `.claude/agents/instruction-updater.md` (or `~/.claude/agents/`)

**What to customize:**
1. **Role name** (line 1):
   ```markdown
   # Instruction Updater → # ProjectX Instruction Updater
   ```

2. **Instruction file paths** (in search commands):
   ```bash
   # Before
   grep -r "pattern" /workspace/khali-obsidian-vault/ai-context/vai/

   # After
   grep -r "pattern" /path/to/project/instructions/
   ```

3. **Keep unchanged:**
   - All analysis logic
   - Educated guessing framework
   - Investigation procedures
   - Output format

### Skill Definition Customizations

**File:** `.claude/skills/update-agent-instructions/SKILL.md`

**What to customize:**
1. **Frontmatter** (lines 1-10):
   ```yaml
   skill-name: update-vai-instructions → update-projectx-instructions
   context: vai-specific → projectx-specific
   ```

2. **File paths in examples** (throughout):
   ```markdown
   # Before
   Related: vai-operational-protocols.md

   # After
   Related: projectx-config.md
   ```

3. **Keep unchanged:**
   - Trigger scenarios
   - Context gathering framework
   - Launch template
   - Workflow steps

### Slash Command Customizations

**File:** `.claude/commands/[prefix]:update-instruction.md`

**What to customize:**
1. **Filename:** `vai:update-instruction.md` → `project:update-instruction.md`

2. **Frontmatter name** (line 2):
   ```yaml
   name: vai:update-instruction → project:update-instruction
   ```

3. **Context file paths** (line 23-25):
   ```markdown
   # Before
   Recent instruction files: ! `find /workspace/khali-obsidian-vault/ai-context/vai ...`

   # After
   Recent instruction files: ! `find /path/to/project/instructions ...`
   ```

4. **Keep unchanged:**
   - All XML structure
   - Process steps
   - Success criteria
   - Verification checks

</customization-points>

---

## Decision Framework

<decisions>

### User-level vs Project-level Agent?

**User-level (`~/.claude/agents/`):**
- ✅ Share analysis logic across all projects
- ✅ Single source of truth for instruction updates
- ✅ Less duplication
- ❌ Can't customize per-project

**Project-level (`.claude/agents/`):**
- ✅ Customize agent for project-specific needs
- ✅ Version control with project
- ✅ Team can share agent definition
- ❌ Duplication if multiple projects

**Recommendation:** Start with user-level, move to project-level only if customization needed

### Standard vs Custom Slash Command Prefix?

**Standard `vai:` prefix:**
- ✅ Consistent with reference implementation
- ✅ Clear meaning ("Vai agent infrastructure")
- ❌ Might confuse if project isn't "Vai"

**Custom prefix (e.g., `myapp:`):**
- ✅ Matches project naming
- ✅ Clear context
- ❌ Requires find/replace in documentation

**Recommendation:** Use `vai:` unless project has strong identity

### Auto-load Operational Protocols?

**Yes (create session start hook):**
- ✅ Instructions always available
- ✅ No need to manually load
- ✅ Ensures compliance

**No (manual loading):**
- ✅ Simpler setup
- ✅ Less overhead
- ❌ Might forget to load protocols

**Recommendation:** Yes if project has operational protocols, No otherwise

</decisions>

---

## Success Criteria

A successful setup should have:

**Infrastructure Files:**
- ✅ Agent definition exists (user or project level)
- ✅ Skill definition exists in `.claude/skills/`
- ✅ Slash command exists in `.claude/commands/`
- ✅ Hook exists if operational protocols needed

**Functionality:**
- ✅ Slash command expands correctly: `/[prefix]:update-instruction test`
- ✅ Skill recognizes trigger patterns
- ✅ Sub-agent launches and analyzes
- ✅ Recommendations are concrete and actionable

**Quality:**
- ✅ File paths updated to match project structure
- ✅ Prefix matches project naming convention
- ✅ Agent can find instruction files
- ✅ No broken references or dead paths

---

## Troubleshooting

<troubleshooting>

### Agent Not Found Error

**Symptom:** `Agent type 'instruction-updater' not found`

**Causes:**
1. Agent file not in correct location
2. Agent file has syntax errors
3. Claude Code needs restart

**Fixes:**
```bash
# Verify agent file exists
ls -la ~/.claude/agents/instruction-updater.md
# OR
ls -la .claude/agents/instruction-updater.md

# Check for syntax errors
head -20 ~/.claude/agents/instruction-updater.md

# Restart Claude Code
# Exit and restart terminal/IDE
```

### Slash Command Doesn't Work

**Symptom:** `/vai:update-instruction` not recognized

**Causes:**
1. File not in `.claude/commands/` directory
2. Filename doesn't match command name
3. YAML frontmatter invalid

**Fixes:**
```bash
# Verify file exists
ls -la .claude/commands/vai:update-instruction.md

# Check frontmatter
head -5 .claude/commands/vai:update-instruction.md
# Should see: name: vai:update-instruction

# Verify YAML is valid (no tabs, proper indentation)
```

### Agent Can't Find Instruction Files

**Symptom:** Agent reports "no instruction files found"

**Causes:**
1. File paths not updated for project
2. Instruction directory doesn't exist
3. Paths have typos

**Fixes:**
```bash
# Test the find command from agent
find /workspace/khali-obsidian-vault/ai-context/vai -name "*.md" -type f

# Update paths in agent definition
# Edit: .claude/agents/instruction-updater.md
# Update all grep/find commands to correct paths
```

</troubleshooting>

---

## Version History

- **v1.0** (2025-12-05):
  - Initial skill creation
  - Supports user-level and project-level setup
  - Includes agent, skill, slash command, and hook setup
  - Provides customization guide and troubleshooting
