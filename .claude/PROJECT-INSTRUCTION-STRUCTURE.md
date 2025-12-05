# Project Instruction Structure

## Project Identity
- Name: PAI (Personal AI Infrastructure)
- Type: AI agent infrastructure framework
- Context: Skills, agents, hooks, and commands for Claude Code

## Repository Structure (CRITICAL)

### Active Repositories - OK to Commit
- ✅ **PAI**: `/workspace/PAI/` (github.com/khali/Personal_AI_Infrastructure)
  - Agent orchestration infrastructure
  - Skills, agents, hooks, commands
  - THIS PROJECT
- ✅ **agent-infrastructure**: `/workspace/agent-infrastructure/`
  - Docker/services/logging/infrastructure management
  - SINGLE SOURCE OF TRUTH for all infrastructure
- ✅ **khali-workspace**: `/workspace/` (github.com/khali/khali-workspace)
  - Workspace container repository containing:
    - khali-obsidian-vault/ - Obsidian vault (syncs to MinIO)
    - blink-config/ - Mobile SSH configuration
    - vay/ - Agent logs and data
  - Note: PAI and agent-infrastructure are separate repos within workspace
- ✅ **ai-global**: `/home/devuser/ai-global/` (github.com/khali/ai-global)
  - Global configs and instructions
  - Shared across all projects

### Repository Model (Simplified)
- **No submodule tracking** - each repo commits independently
- PAI, agent-infrastructure, ai-global are separate git repositories
- khali-workspace contains vault and workspace files
- Each repo tracked in .gitignore to prevent cross-tracking

### Commit Safety Rule
**Before EVERY commit:**
```bash
pwd  # Check current directory
git rev-parse --show-toplevel  # Verify repo root

# Verification:
# /workspace → khali-workspace (includes vault)
# /workspace/PAI → PAI repo (this project)
# /workspace/agent-infrastructure → agent-infrastructure repo
# /home/devuser/ai-global → ai-global repo
```

## Agent Instructions

### Primary Instruction Files
- Main: `/workspace/PAI/.claude/PAI.md`
- Global: `/home/devuser/ai-global/ai-global-docs/claude-global.md`
- Vai-specific: `/workspace/khali-obsidian-vault/ai-context/vai/vai-operational-protocols.md`

### Tool-Specific Instructions (Multi-Tool Support)

**Pattern:** Separate instruction files for each AI tool (Claude Code, Gemini CLI, Cursor/Codex)

**Global level** (`/home/devuser/ai-global/`):
- Symlinks in `claude/`:
  - `CLAUDE.md` → `../ai-global-docs/claude-global.md`
  - `GEMINI.md` → `../ai-global-docs/gemini-global.md`
  - `AGENTS.md` → `../ai-global-docs/codex-global.md`
- Content files in `ai-global-docs/`:
  - `claude-global.md` - Claude Code-specific features and references
  - `gemini-global.md` - Gemini CLI-specific features and references
  - `codex-global.md` - Cursor/Codex-specific features and references

**Project level** (`/workspace/PAI/.claude/`):
- `CLAUDE.md` - Claude Code-specific PAI instructions
- `GEMINI.md` - Gemini CLI-specific PAI instructions
- `AGENTS.md` - Cursor/Codex-specific PAI instructions

**Policy (CRITICAL):**
- Tool-specific files ONLY contain tool-specific operational details
- All tool-agnostic content goes in external files (vai-operational-protocols.md, claude-global.md, etc.)
- Tool files reference external files, never duplicate content
- Example: Git workflow goes in vai-operational-protocols.md, NOT in CLAUDE.md/GEMINI.md/AGENTS.md

**Why this pattern:**
- Tools read from standardized filenames (CLAUDE.md, GEMINI.md, AGENTS.md)
- Descriptive filenames for content files (-global.md suffix)
- Symlinks allow tools to find files in expected locations
- Separation prevents duplication across tools
- Each project can customize tool-specific instructions

### Hooks
- Directory: `/workspace/PAI/.claude/hooks/`
- Session start: `load-core-context.ts` loads:
  - CORE SKILL (`/workspace/PAI/.claude/skills/CORE/SKILL.md`)
  - Vai operational protocols (`/workspace/khali-obsidian-vault/ai-context/vai/vai-operational-protocols.md`)
- Notable hooks:
  - `capture-all-events.ts` - Event logging for observability
  - `update-tab-titles.ts` - Session metadata
  - `stop-hook.ts` - Session cleanup

### Skills
- Directory: `/workspace/PAI/.claude/skills/`
- Active skills:
  - CORE - Base context loader
  - agent-observability - Real-time event monitoring
  - create-skill - Meta-skill for skill creation
  - fabric - Daniel Miessler's Fabric patterns
  - setup-instruction-updater - Bootstrap instruction infrastructure
  - update-agent-instructions - (being migrated to global)

## Documentation Sources

### Primary Documentation
- Location: `/workspace/PAI/.claude/documentation/`
- Structure: Topic-based guides
- Key documents:
  - `QUICK-REFERENCE.md` - Fast lookup guide
  - `agent-system.md` - Sub-agent architecture
  - `hook-system.md` - Hook development guide
  - `skills-system.md` - Skill creation guide
  - `command-system.md` - Slash command guide

### Vai Context (User-specific)
- Location: `/workspace/khali-obsidian-vault/ai-context/vai/`
- Structure: Operational protocols, knowledge management
- Key documents:
  - `vai-operational-protocols.md` - Task management, Git workflow, testing
  - `vai-knowledge-management.md` - Information architecture
  - `vai-information-architecture.md` - Ontology and naming heuristics

### How Documentation Feeds Into Instructions

- **vai-operational-protocols.md** → Auto-loaded via `load-core-context.ts` hook at session start
- **PAI.md** → References documentation guides for specific workflows
- **CORE SKILL.md** → Points to operational protocols as "AUTO-LOADED"
- **Global instructions** → Universal patterns (testing, git, debugging)
- **Skills** → Each skill has embedded documentation in SKILL.md files

## Instruction Update Workflow

### When Instructions Change
1. Edit instruction files (vai-operational-protocols.md, claude-global.md, etc.)
2. Test changes in current session
3. Commit to git with descriptive message
4. Push to remote immediately
5. Restart Claude Code to reload hooks/skills if needed

### Testing Changes
- Session start hooks: Restart Claude Code, verify auto-loading
- Skills: Invoke skill trigger, verify behavior
- Slash commands: Run command, verify expansion
- Instructions: Test specific workflow, verify compliance

### Instruction File Locations
- **Global**: `/home/devuser/ai-global/ai-global-docs/claude-global.md` (git: ai-global repo)
- **Vai protocols**: `/workspace/khali-obsidian-vault/ai-context/vai/vai-operational-protocols.md` (git: workspace repo, syncs to Obsidian)
- **PAI-specific**: `/workspace/PAI/.claude/PAI.md` (git: PAI submodule)

## Last Updated
2025-12-05 - Initial structure document created as part of global instruction-updater skill implementation
