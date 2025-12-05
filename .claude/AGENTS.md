# Cursor/Codex Agent Instructions - PAI Project

This file contains Cursor/Codex-specific instructions for the PAI project.

---

## Shared Instructions (Tool-Agnostic)

Read these instruction files that apply across all AI tools:

- **Global Codex Instructions:** `/home/devuser/ai-global/ai-global-docs/codex-global.md` (Tool-agnostic principles and references)
- **Development Philosophy:** `/home/devuser/ai-global/ai-global-docs/claude-global.md` (Evidence-Based Development, Testing Protocol, Root Cause Analysis, etc.)
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

## Cursor/Codex-Specific Features (PAI)

*Currently no Cursor/Codex-specific operational details to document for PAI. This section will be populated when Cursor-specific workflows, commands, or features are identified.*

**If you discover Cursor/Codex-specific capabilities, document them here:**
- Cursor agent system usage
- Codex-specific keyboard shortcuts
- IDE-specific workflows
- Tool-specific commands or features for PAI

---

## PAI-Specific Workflows

### When Working on Infrastructure

- PAI is agent orchestration infrastructure
- Changes often affect multiple components (API, CLI, web UI)
- Always check impact across all three surfaces
- Test in actual deployment context (Docker, systemd services)

### When Updating Instructions

- Follow tool-specific file policy (this file should only contain Cursor/Codex-specific content)
- Tool-agnostic guidance goes in shared instruction files

---

**Note:** This file should ONLY contain Cursor/Codex-specific operational details for PAI. Everything else belongs in shared instruction files.
