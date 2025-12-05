# Gemini Code Assist Instructions - PAI Project

This file contains Gemini Code Assist-specific instructions for the PAI project.

---

## Shared Instructions (Tool-Agnostic)

Read these instruction files that apply across all AI tools:

- **Global Gemini Instructions:** `/home/devuser/ai-global/ai-global-docs/gemini-global.md` (Tool-agnostic principles and references)
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
- Documentation Updates: Update automatically, never ask permission

---

## Gemini Code Assist-Specific Features (PAI)

*Currently no Gemini-specific operational details to document for PAI. This section will be populated when Gemini-specific workflows, commands, or features are identified.*

**If you discover Gemini-specific capabilities, document them here:**
- Gemini-specific commands or syntax
- Gemini API interactions
- Gemini Code Assist UI features
- Tool-specific workflows for PAI

---

## PAI-Specific Workflows

### When Working on Infrastructure

- PAI is agent orchestration infrastructure
- Changes often affect multiple components (API, CLI, web UI)
- Always check impact across all three surfaces
- Test in actual deployment context (Docker, systemd services)

### When Updating Instructions

- Follow tool-specific file policy (this file should only contain Gemini-specific content)
- Tool-agnostic guidance goes in shared instruction files

---

**Note:** This file should ONLY contain Gemini Code Assist-specific operational details for PAI. Everything else belongs in shared instruction files.
