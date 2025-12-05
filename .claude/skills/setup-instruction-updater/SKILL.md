---
skill-name: setup-instruction-updater
version: 2.0
created: 2025-12-05
last-updated: 2025-12-05
status: active
purpose: Bootstrap instruction-updater project components (skill + slash command)
context: general-purpose
tags: [meta, setup, bootstrap, instructions, infrastructure]
---

# Setup Instruction-Updater Infrastructure - Skill

## Purpose

This skill helps you set up the instruction-updater system in new projects. Since the **agent is already user-level** (`~/.claude/agents/instruction-updater.md`) and shared across all projects, you only need to create:

1. **Skill definition** - Recognition skill for when to trigger the agent (optional)
2. **Slash command** - `/vai:update-instruction` or custom-prefixed command

That's it. The agent is already available.

---

## What Gets Created

<infrastructure-components>

### 1. Instruction-Updater Agent ✅ ALREADY EXISTS

**Location:** `~/.claude/agents/instruction-updater.md` (user-level)

**Status:** Already created and shared across ALL projects automatically.

**You don't need to do anything** - the agent is available to all projects.

### 2. Skill Definition (Optional)

**Location:** `.claude/skills/update-agent-instructions/SKILL.md`

**Purpose:** Recognition skill that knows when to launch the instruction-updater sub-agent

**When to create:**
- ✅ If you want automatic trigger recognition (mistakes, corrections, patterns)
- ❌ If you'll just use the slash command manually

### 3. Slash Command

**Location:** `.claude/commands/vai:update-instruction.md` (or custom prefix)

**Purpose:** Quick access to instruction-update workflow

**Usage:** `/vai:update-instruction [problem description]`

**Always create this** - it's the primary interface.

</infrastructure-components>

---

## Quick Setup

<quick-setup>

**For most projects, just create the slash command:**

```bash
# 1. Copy slash command template
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/vai:update-instruction.md

# 2. Customize if needed (optional)
# - Change prefix: vai: → project:
# - Update instruction file paths if non-standard

# 3. Done! Test it:
/vai:update-instruction test setup
```

**That's it.** The agent is already user-level, so you're ready to go.

</quick-setup>

---

## Detailed Setup (Optional Components)

<workflow name="full-setup">

### Step 1: Create Slash Command (Required)

**Source:** `/workspace/PAI/.claude/commands/vai:update-instruction.md`

**Actions:**
```bash
# Standard setup (vai: prefix)
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/vai:update-instruction.md

# OR Custom prefix (e.g., myapp:)
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/myapp:update-instruction.md
```

**Customizations (if needed):**
1. **Change prefix** - Rename file and update `name` field in frontmatter
2. **Update instruction paths** - If your project stores instructions in non-standard location

**Example customization:**
```yaml
# Edit .claude/commands/myapp:update-instruction.md
---
name: myapp:update-instruction  # Changed from vai:update-instruction
description: ...
---

<context>
Recent instruction files: ! `find /path/to/myapp/instructions -name "*.md" ...`
...
</context>
```

### Step 2: Create Skill Definition (Optional)

**Only create if you want automatic trigger recognition.**

**Source:** `/workspace/khali-obsidian-vault/ai-context/vai/skills/update-agent-instructions/SKILL.md`

**Actions:**
```bash
# Create skill directory
mkdir -p .claude/skills/update-agent-instructions/

# Copy template
cp /workspace/khali-obsidian-vault/ai-context/vai/skills/update-agent-instructions/SKILL.md \
   .claude/skills/update-agent-instructions/SKILL.md
```

**Customizations (if needed):**
1. **Update `skill-name`** - e.g., `update-vai-instructions` → `update-myapp-instructions`
2. **Update `context`** - e.g., `vai-specific` → `myapp-specific`
3. **Update file paths in examples** - Match your project structure

**Most projects can use the skill as-is** without customization.

### Step 3: Verify Setup

**Test slash command:**
```bash
/vai:update-instruction test installation
```

**Should:**
- ✅ Expand the prompt with context
- ✅ Launch instruction-updater sub-agent
- ✅ Agent analyzes and responds

</workflow>

---

## Customization Guide

<customization-points>

### When Do You Need Customization?

**No customization needed if:**
- ✅ Using standard `vai:` prefix
- ✅ Instructions in `.claude/` directory
- ✅ Default project structure

**Customization needed if:**
- ❌ Want custom prefix (e.g., `myapp:`)
- ❌ Instructions in non-standard location
- ❌ Project-specific trigger patterns

### Slash Command Customizations

**File:** `.claude/commands/[prefix]:update-instruction.md`

**What to customize:**

1. **Filename and prefix:**
   ```bash
   # From
   vai:update-instruction.md

   # To
   myapp:update-instruction.md
   ```

2. **Frontmatter name:**
   ```yaml
   ---
   name: vai:update-instruction  # Change to: myapp:update-instruction
   ---
   ```

3. **Instruction file paths:**
   ```markdown
   <context>
   # Before
   Recent instruction files: ! `find /workspace/khali-obsidian-vault/ai-context/vai ...`

   # After
   Recent instruction files: ! `find /path/to/myapp/docs ...`
   </context>
   ```

**Keep unchanged:**
- All XML structure
- Process steps
- Success criteria
- Tool restrictions

### Skill Definition Customizations (Optional)

**File:** `.claude/skills/update-agent-instructions/SKILL.md`

**What to customize:**

1. **Frontmatter:**
   ```yaml
   skill-name: update-vai-instructions  # Change to: update-myapp-instructions
   context: vai-specific  # Change to: myapp-specific
   ```

2. **File paths in examples:**
   ```markdown
   # Before
   Related: vai-operational-protocols.md

   # After
   Related: myapp-config.md
   ```

**Keep unchanged:**
- Trigger scenarios
- Context gathering framework
- Launch template
- Workflow steps

</customization-points>

---

## Decision Framework

<decisions>

### Standard vs Custom Slash Command Prefix?

**Standard `vai:` prefix:**
- ✅ Consistent with reference implementation
- ✅ No customization needed
- ✅ Works immediately
- ❌ Might be confusing if project isn't "Vai-related"

**Custom prefix (e.g., `myapp:`):**
- ✅ Matches project naming
- ✅ Clear context for team
- ❌ Requires renaming file and updating frontmatter

**Recommendation:** Use `vai:` unless project has strong naming conventions.

### Create Skill Definition or Just Slash Command?

**Just slash command:**
- ✅ Simpler setup (1 file)
- ✅ Explicit invocation only
- ✅ Enough for most projects
- ❌ No automatic trigger recognition

**Slash command + skill:**
- ✅ Automatic trigger recognition
- ✅ Gathers context automatically
- ✅ Better for complex projects
- ❌ More setup

**Recommendation:** Start with just slash command, add skill if needed.

</decisions>

---

## Examples

<example name="minimal-setup">

**Scenario:** Quick setup for new project

**Commands:**
```bash
# Create slash command (standard vai: prefix)
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/vai:update-instruction.md

# Test
/vai:update-instruction test
```

**Done!** Agent is user-level, slash command ready.

</example>

<example name="custom-prefix-setup">

**Scenario:** Project wants `myapp:` prefix

**Commands:**
```bash
# 1. Create slash command with custom name
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/myapp:update-instruction.md

# 2. Edit the file
# Change: name: vai:update-instruction
# To: name: myapp:update-instruction

# 3. Test
/myapp:update-instruction test
```

</example>

<example name="full-setup-with-skill">

**Scenario:** Complex project needs automatic trigger recognition

**Commands:**
```bash
# 1. Slash command
cp /workspace/PAI/.claude/commands/vai:update-instruction.md \
   .claude/commands/vai:update-instruction.md

# 2. Skill definition
mkdir -p .claude/skills/update-agent-instructions/
cp /workspace/khali-obsidian-vault/ai-context/vai/skills/update-agent-instructions/SKILL.md \
   .claude/skills/update-agent-instructions/SKILL.md

# 3. Test
/vai:update-instruction test
```

</example>

---

## Troubleshooting

<troubleshooting>

### Slash Command Doesn't Work

**Symptom:** `/vai:update-instruction` not recognized

**Fixes:**
```bash
# Verify file exists
ls -la .claude/commands/vai:update-instruction.md

# Check frontmatter has correct name
head -5 .claude/commands/vai:update-instruction.md
# Should see: name: vai:update-instruction
```

### Agent Not Found

**Symptom:** `Agent type 'instruction-updater' not found`

**This shouldn't happen** since agent is user-level, but if it does:
```bash
# Verify user-level agent exists
ls -la ~/.claude/agents/instruction-updater.md

# Restart Claude Code if needed
```

### Paths Don't Work

**Symptom:** Agent can't find instruction files

**Fixes:**
```bash
# Test the find command from slash command
find /workspace/khali-obsidian-vault/ai-context/vai -name "*.md" -type f

# If path is wrong, edit slash command:
# .claude/commands/vai:update-instruction.md
# Update the find command in <context> section
```

</troubleshooting>

---

## Summary

**Remember:** The agent is already user-level and shared across all projects. You only need to create:

1. **Slash command** (required) - 1 file to copy
2. **Skill definition** (optional) - 1 file to copy if you want auto-triggers

That's it. Simple setup, powerful capability.

---

## Version History

- **v2.0** (2025-12-05):
  - Removed agent creation from workflow (already user-level)
  - Focused on per-project components only
  - Simplified to: slash command + optional skill
  - Reduced complexity significantly
- **v1.0** (2025-12-05):
  - Initial skill creation (over-engineered)
