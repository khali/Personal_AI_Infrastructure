# Claude Code Instructions - PAI Project

This file contains Claude Code-specific instructions for the PAI project.

---

## Shared Instructions (Tool-Agnostic)

Read these instruction files that apply across all AI tools:

- **Global Claude Instructions:** `/home/devuser/ai-global/ai-global-docs/claude-global.md` (Evidence-Based Development, Testing Protocol, Root Cause Analysis, etc.)
- **Vai Operational Protocols:** `/workspace/khali-obsidian-vault/ai-context/vai/vai-operational-protocols.md` (Task management, Git workflow, Repository commit policy)
- **PAI Project Structure:** `/workspace/PAI/.claude/PROJECT-INSTRUCTION-STRUCTURE.md` (PAI-specific documentation architecture)
- **Vai Personal Context:** `/workspace/PAI/.claude/VAI.md` (Vai identity, progressive disclosure, knowledge management)

**Core principles from shared instructions:**
- Documentation-first: Read official docs before implementing
- Outcome + Implementation tests required for every feature
- YAGNI: Build only what current outcomes require
- Acceptance Criteria Protocol: Propose criteria proactively
- Root Cause Analysis: Evidence before theory
- User-Context Validation: Reproduce in exact user context
- Communication: Concise, clear, reference files with `path:line_number`

---

## Claude Code-Specific Features (PAI)

### How to Use Skills

Skills are located in `/home/devuser/ai-global/claude/skills/` (symlinked from `~/.claude/skills/`).

**Available PAI skills:**
- `create-skill` - Create new Claude Code skills following best practices
- Skills are shared across all projects via symlink architecture

**Invoke skills:**
```
Use the Skill tool with skill name (no path needed)
```

### How to Use Slash Commands

Commands are located in `/home/devuser/ai-global/claude/commands/` (symlinked from `~/.claude/commands/`).

**Available PAI commands:**
- `/vai:improve-behavior` - Improve Vai's behavior through the right mechanism (instructions, skills, hooks, subagents, or slash commands)

**Invoke commands:**
```
Use the SlashCommand tool with command name (e.g., "/vai:improve-behavior")
```

### How to Use Hooks

Hooks are located in `/home/devuser/ai-global/claude/hooks/` (symlinked from `~/.claude/hooks/`).

**Active hooks in PAI:**
- Session hooks, pre-commit hooks, etc. are shared globally

### How to Use Sub-Agents

Sub-agents are located in `/home/devuser/ai-global/claude/agents/` (symlinked from `~/.claude/agents/`).

**Available sub-agents:**
- `improve-behavior` - Specialist for improving behavior through the right mechanism (triages between instructions, skills, hooks, subagents, slash commands)

**Invoke sub-agents:**
```
Use the Task tool with subagent_type parameter
```

---

## PAI-Specific Workflows

### When Working on Infrastructure

- PAI is agent orchestration infrastructure
- Changes often affect multiple components (API, CLI, web UI)
- Always check impact across all three surfaces
- Test in actual deployment context (Docker, systemd services)

### When Improving Behavior

- Use `/vai:improve-behavior` slash command
- Sub-agent will TRIAGE the request to determine the right mechanism:
  - **Instructions** - For behavioral patterns and protocols
  - **Skills** - For domain expertise and complex workflows
  - **Hooks** - For automatic enforcement
  - **Subagents** - For specialized delegation
  - **Slash Commands** - For user convenience shortcuts
- Follow tool-specific file policy (this file should only contain Claude Code-specific content)

---

**Note:** This file should ONLY contain Claude Code-specific operational details for PAI. Everything else belongs in shared instruction files.
