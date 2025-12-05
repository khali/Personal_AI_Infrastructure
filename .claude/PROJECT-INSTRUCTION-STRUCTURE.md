# Project Instruction Structure

## Project Identity
- Name: PAI (Personal AI Infrastructure)
- Type: AI agent infrastructure framework
- Context: Skills, agents, hooks, and commands for Claude Code

## Agent Instructions

### Primary Instruction Files
- Main: `/workspace/PAI/.claude/PAI.md`
- Global: `/home/devuser/ai-global/ai-global-docs/claude-global.md`
- Vai-specific: `/workspace/khali-obsidian-vault/ai-context/vai/vai-operational-protocols.md`

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
