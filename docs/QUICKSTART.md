# PAI Quick Start Guide

**Get PAI running in 5 minutes**

---

## Installation (2 minutes)

### 1. Clone PAI

```bash
git clone https://github.com/danielmiessler/Personal_AI_Infrastructure.git
cd Personal_AI_Infrastructure
```

### 2. Run the Setup Wizard

```bash
.claude/tools/setup/bootstrap.sh
```

The bootstrap script handles everything:
- **Shell check** — Recommends zsh or bash if you're using something else
- **Bun install** — Offers to install Bun if not found (PAI's package manager)
- **Claude Code check** — Reminds you to install Claude Code if missing
- **Setup wizard** — Launches the interactive configuration

The interactive wizard will configure everything for you:

- **PAI Directory** — Where to install (default: `~/.claude`)
- **Your Name** — Auto-detected from git config
- **Your Email** — Auto-detected from git config
- **Assistant Name** — Name your AI (default: "Kai")
- **Color Theme** — Choose blue, purple, green, cyan, or red
- **Voice Server** — Enable text-to-speech (macOS only)
- **Shell Profile** — Add PAI environment variables

#### Non-Interactive Mode (for automation)

```bash
bun run setup.ts \
  --pai-dir ~/.claude \
  --name "Your Name" \
  --email you@example.com \
  --assistant-name "Kai" \
  --force
```

#### Dry Run (preview changes)

```bash
bun run setup.ts --dry-run
```

### 3. Add Your API Keys

```bash
# Copy environment template
cp ~/.claude/.env.example ~/.claude/.env

# Edit with your API keys
nano ~/.claude/.env

# Required: ANTHROPIC_API_KEY
# Optional: ELEVENLABS_API_KEY for voice
```

### 4. Reload Your Shell

```bash
source ~/.zshrc  # or ~/.bashrc
```

---

## First Run (1 minute)

### Start Claude Code

```bash
# PAI loads automatically
claude-code
```

The CORE skill loads at session start via the `SessionStart` hook.

### Try These Commands

```
"What skills are available?"
"Show me my stack preferences"
"What agents do I have access to?"
"Read the CONSTITUTION"
```

---

## Understanding PAI (1 minute)

### The Three Primitives

**1. Skills** (`.claude/skills/`)
- Self-contained AI capabilities
- Auto-activate based on your request
- Package routing, workflows, and documentation

**2. Agents** (`.claude/agents/`)
- Specialized AI personalities
- Engineer, researcher, designer, pentester, etc.
- Each has unique voice and capabilities

**3. Hooks** (`.claude/hooks/`)
- Event-driven automation
- Capture work, provide voice feedback, manage state
- Run automatically on session start/stop, tool use, etc.

### Where Everything Lives

```
${PAI_DIR}/
├── skills/
│   └── CORE/              # Main PAI documentation
│       ├── CONSTITUTION.md    # System philosophy & architecture
│       ├── SKILL.md           # Main skill file (loaded at startup)
│       └── *.md               # Reference documentation
├── agents/                # Agent configurations
├── hooks/                 # Event automation scripts
├── voice-server/          # Text-to-speech system
└── .env                   # Your API keys (never commit!)
```

---

## Next Steps

### Learn the System

1. **Read CONSTITUTION.md** - Understand PAI philosophy
   ```
   read ${PAI_DIR}/skills/CORE/CONSTITUTION.md
   ```

2. **Explore Skills** - See what's available
   ```
   ls ${PAI_DIR}/skills/
   ```

3. **Try Voice Feedback** - Start the voice server (optional)
   ```
   ${PAI_DIR}/voice-server/start.sh
   ```

### Create Your First Skill

```bash
# Use the create-skill skill
cd ${PAI_DIR}/skills/
mkdir my-first-skill
# See create-skill/ for templates
```

Follow the guide in `.claude/skills/CORE/SKILL-STRUCTURE-AND-ROUTING.md`

### Customize Your Setup

**Hooks** - Add custom automation:
- `.claude/hooks/` - Event-driven scripts

See `.claude/skills/CORE/SKILL.md` for complete configuration options.

---

## Troubleshooting

### PAI Not Loading

**Check hook configuration:**
```bash
# Verify SessionStart hook exists
cat ${PAI_DIR}/settings.json | grep SessionStart
```

**Manually load CORE skill:**
```
read ${PAI_DIR}/skills/CORE/SKILL.md
```

### Hooks Not Running

Hooks require Bun to be installed and in your PATH. Verify:
```bash
which bun
# Should show path like /Users/yourname/.bun/bin/bun
```

If Bun isn't found, reinstall it and restart your terminal.

### Voice Server Not Working

```bash
# Check voice server status
${PAI_DIR}/voice-server/status.sh

# Restart if needed
${PAI_DIR}/voice-server/restart.sh

# Check logs
tail ${PAI_DIR}/voice-server/logs/voice-server.log
```

### API Keys Not Working

```bash
# Verify .env file exists
ls -la ${PAI_DIR}/.env

# Check format (no spaces around =)
# Correct: ANTHROPIC_API_KEY=sk-ant-...
# Wrong:   ANTHROPIC_API_KEY = sk-ant-...
```

---

## Common Tasks

### Update PAI

```bash
cd ~/Personal_AI_Infrastructure  # or wherever you cloned
git pull origin main

# Copy updates to your system
cp -r .claude/* ${PAI_DIR}/
```

### Add New Skills

```bash
# Clone or create in skills directory
cd ${PAI_DIR}/skills/
# Add your skill folder
```

Skills auto-activate based on their description triggers.

### Explore CORE Documentation

See `.claude/skills/CORE/` for complete system documentation and configuration guides.

---

## Resources

- **Full Documentation:** `.claude/skills/CORE/`
- **Video Overview:** [PAI Video](https://youtu.be/iKwRWwabkEc)
- **GitHub Issues:** [Report Problems](https://github.com/danielmiessler/Personal_AI_Infrastructure/issues)
- **Discussions:** [Ask Questions](https://github.com/danielmiessler/Personal_AI_Infrastructure/discussions)

---

## Philosophy

PAI follows three principles:

1. **Command Line First** - Build CLI tools, wrap with AI
2. **Deterministic Code First** - Same input → Same output
3. **Prompts Wrap Code** - AI orchestrates, doesn't replace

**Start clean. Start small. Build out from there.**

---

**You're ready! Start exploring and building your personal AI infrastructure.**
