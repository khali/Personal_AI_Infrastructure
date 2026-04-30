---
name: Art
description: Complete visual content system. USE WHEN user wants to create visual content, illustrations, diagrams, OR mentions art, header images, visualizations, mermaid, flowchart, technical diagram, infographic, PAI icon, pack icon, or PAI pack icon.
---

# Art Skill

Complete visual content system for creating illustrations, diagrams, and visual content.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Art/`

If this directory exists, load and apply:
- `PREFERENCES.md` - Aesthetic preferences, default model, output location
- `CharacterSpecs.md` - Character design specifications
- `SceneConstruction.md` - Scene composition guidelines

These override default behavior. If the directory does not exist, proceed with skill defaults.

## MANDATORY: Output to Downloads First

```
ALL GENERATED IMAGES GO TO ~/Downloads/ FIRST
NEVER output directly to project directories
User MUST preview in Finder/Preview before use
```

**This applies to ALL workflows in this skill.**

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the Art skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **Art** skill...
   ```

---

## Workflow Routing

Route to the appropriate workflow based on the request.

  - Blog header or editorial illustration -> `Workflows/Essay.md`
  - Visualization or chart -> `Workflows/Visualize.md`
  - Mermaid flowchart or sequence diagram -> `Workflows/Mermaid.md`
  - Technical or architecture diagram -> `Workflows/TechnicalDiagrams.md`
  - Framework or 2x2 matrix -> `Workflows/Frameworks.md`
  - Stat card or big number visual -> `Workflows/Stats.md`
  - PAI pack icon -> `Workflows/CreatePAIPackIcon.md`

---

## Core Aesthetic

**Default:** Production-quality concept art style appropriate for editorial and technical content.

**UL Editorial Color Palette:**
```
Background: Light Cream #F5E6D3 or White #FFFFFF
Primary Accent: Deep Purple #4A148C (strategic, 10-20%)
Secondary Accent: Deep Teal #00796B (5-10%)
Structure: Black #000000
Text: Charcoal #2D2D2D
```

**Typography System (3-Tier):**
- Tier 1 (Headers): Valkyrie-style elegant wedge-serif italic
- Tier 2 (Labels): Concourse-style geometric sans-serif
- Tier 3 (Insights): Advocate-style condensed italic for callouts

**Load customizations from:** `~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/Art/PREFERENCES.md`

---

## Image Generation

**Default model:** Check user customization at `SKILLCUSTOMIZATIONS/Art/PREFERENCES.md`
**Fallback:** nano-banana-pro (best text rendering)
**OpenAI option:** `gpt-image-2` is available through `Tools/Generate.ts` for direct agent-driven image generation.

### Model Selection Rules

Use these rules when choosing a model. If the user does not specify a model, choose based on the actual job instead of defaulting blindly.

### Decision Checklist

Before choosing a model, answer these questions explicitly:

1. Does the image need readable in-image text, labels, or annotations?
2. Does it need reference-image consistency, recurring characters, or brand continuity?
3. Does it need transparency?
4. Is this a fast draft/edit pass or a final-quality deliverable?
5. Does the user want to stay inside the OpenAI stack?

Pick the model from the answers:
- `Yes` to 1 or 2 -> `nano-banana-pro`
- `Yes` to 3 -> avoid `gpt-image-2`
- `Yes` to 4 for speed -> `nano-banana`
- `Yes` to 5 with little/no text pressure -> `gpt-image-2`

#### Use `nano-banana` when:
- You need fast draft iterations or multiple quick options
- You are editing conversationally from an existing image
- You care more about speed than perfect final quality
- You want character/style consistency from reference images without paying for a heavier model

#### Use `nano-banana-pro` when:
- The image contains important in-image text, labels, annotations, or typography
- You are making diagrams, infographics, frameworks, posters, or educational visuals
- You need strong multilingual text rendering
- You need multi-image fusion or strong reference-image consistency
- You need higher-resolution Google output, up to 4K
- You need the most controlled editing workflow in the current art stack

#### Use `gpt-image-2` when:
- You want OpenAI-native generation or editing from the existing OpenAI API stack
- You want a high-quality editorial or concept image without heavy in-image text
- You want OpenAI Responses API multi-turn iteration around the same image concept
- You want flexible output sizes beyond the older fixed-size OpenAI image path
- You want to stay inside one OpenAI-driven agent workflow without switching providers

#### Avoid `gpt-image-2` when:
- You need transparent backgrounds
- You need precise text placement, infographic labels, or reliable poster typography
- You need strong recurring character or brand consistency across many generations
- You need the art tool's reference-image-heavy Google workflow as the primary strategy

#### Avoid `nano-banana` / `nano-banana-pro` when:
- You specifically want to standardize on OpenAI billing, tooling, or agent orchestration
- You want OpenAI Responses API-based image iteration in the same conversation state

### Practical Default

If the user just says "make an image" and gives no model preference:
- Editorial illustration, concept art, hero image with little/no text -> `gpt-image-2`
- Diagram, infographic, framework, chart, poster, or any text-heavy visual -> `nano-banana-pro`
- Fast rough options or quick edits -> `nano-banana`

### Important Caveats

- `gpt-image-2` currently does not support transparent backgrounds.
- OpenAI's docs say text rendering is improved, but it can still struggle with precise placement and clarity.
- OpenAI's docs also note recurring character and brand consistency can still drift across generations.
- Nano Banana Pro is the safer default for diagrams, labels, educational visuals, and reference-driven consistency in this skill.

### CRITICAL: Always Output to Downloads First

**ALL generated images MUST go to `~/Downloads/` first for preview and selection.**

Never output directly to a project's `public/images/` directory. User needs to review images in Preview before they're used.

**Workflow:**
1. Generate to `~/Downloads/[descriptive-name].png`
2. User reviews in Preview
3. If approved, THEN copy to final destination
4. Create WebP and thumbnail versions at final destination

```bash
# CORRECT - Output to Downloads for preview
bun run ~/.claude/skills/Art/Tools/Generate.ts \
  --model nano-banana-pro \
  --prompt "[PROMPT]" \
  --size 2K \
  --aspect-ratio 1:1 \
  --thumbnail \
  --output ~/Downloads/blog-header-concept.png

# After approval, copy to final location
cp ~/Downloads/blog-header-concept.png ~/Projects/Website/cms/public/images/
```

### Multiple Reference Images (Character/Style Consistency)

For improved character or style consistency, use multiple `--reference-image` flags:

```bash
# Multiple reference images for better likeness
bun run ~/.claude/skills/Art/Tools/Generate.ts \
  --model nano-banana-pro \
  --prompt "Person from references at a party..." \
  --reference-image face1.jpg \
  --reference-image face2.jpg \
  --reference-image face3.jpg \
  --size 2K \
  --aspect-ratio 16:9 \
  --output ~/Downloads/character-scene.png
```

**API keys in:** `${PAI_DIR}/.env`

## Examples

**Example 1: Blog header image**
```
User: "create a header for my AI agents post"
-> Invokes ESSAY workflow
-> Generates editorial illustration prompt
-> Creates image with consistent aesthetic
-> Saves to ~/Downloads/ for preview
-> After approval, copies to public/images/
```

**Example 2: Technical architecture diagram**
```
User: "make a diagram showing the SPQA pattern"
-> Invokes TECHNICALDIAGRAMS workflow
-> Creates structured architecture visual
-> Outputs PNG with consistent styling
```

**Example 3: Framework visualization**
```
User: "create a 2x2 matrix for security vs convenience"
-> Invokes FRAMEWORKS workflow
-> Creates hand-drawn framework visual
-> Purple highlights optimal quadrant
```

**Example 4: PAI pack icon**
```
User: "create icon for the skill system pack"
-> Invokes CREATEPAIPACKICON workflow
-> Generates 1K image with --remove-bg for transparency
-> Resizes to 256x256 RGBA PNG
-> Outputs to ~/Downloads/ for preview
```
