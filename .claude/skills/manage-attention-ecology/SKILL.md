---
name: manage-attention-ecology
description: Manage Khali's 7-layer Ecology of Attention structure - read, update, maintain cross-references, detect gaps, and generate views. USE WHEN user mentions ecology, visions, strategies, projects, actions, habits, weekly planning, priorities, values alignment, weekly review, quarterly OKRs, OR requests updates to strategic structure.
version: 1.2
date-created: 2025-12-05
last-updated: 2025-12-05
layer-count: 7
status: active
tags: [ecology, strategy, knowledge-management, vai-skill]
---

# Attention Ecology Management Skill

**Purpose:** Comprehensive skill for managing Khali's 7-layer Ecology of Attention structure in the Obsidian vault.

**Root Directory:** `/workspace/khali-obsidian-vault/My-Attention-Ecology/`

---

## Quick Reference: The 7 Layers

```
1-Purpose/          → WHY (problems + missions)
2-Values/           → HOW (guiding principles)
3-Visions/          → WHAT (desired future states)
4-Strategies/       → APPROACH (how to realize visions)
5-Projects/         → EXECUTION (concrete initiatives)
6-Actions/          → IMMEDIATE (next steps)
7-Habits/           → RHYTHM (recurring practices)
```

---

## Core Workflows

### Workflow 1: Read Full Ecology Context

**USE WHEN:** Beginning strategic work, weekly review, or quarterly planning

**Steps:**
1. Read Layer 1 (Purpose): `/workspace/khali-obsidian-vault/My-Attention-Ecology/1-Purpose/purpose.md`
2. Read Layer 2 (Values): `/workspace/khali-obsidian-vault/My-Attention-Ecology/2-Values/values.md`
3. List all Visions: `ls /workspace/khali-obsidian-vault/My-Attention-Ecology/3-Visions/`
4. List all Strategies: `ls /workspace/khali-obsidian-vault/My-Attention-Ecology/4-Strategies/`
5. List all Projects: `ls /workspace/khali-obsidian-vault/My-Attention-Ecology/5-Projects/`
6. Check current Actions structure: `/workspace/khali-obsidian-vault/My-Attention-Ecology/6-Actions/`
7. List all Habits: `ls /workspace/khali-obsidian-vault/My-Attention-Ecology/7-Habits/`

**Output:** Mental map of entire ecology structure

---

### Workflow 2: Add New Vision

**USE WHEN:** User wants to add a new goal or desired future state

**Steps:**
1. Ask clarifying questions:
   - What does success look like? (qualitative + quantitative)
   - Which problem(s) does this address? (link to Layer 1)
   - Which values does this embody? (link to Layer 2)
   - What strategies will realize this vision? (Layer 4)
   - Target timeline/quarter?

2. Create vision file:
   ```bash
   /workspace/khali-obsidian-vault/My-Attention-Ecology/3-Visions/[Vision Name].md
   ```

3. Use this template:
   ```markdown
   ---
   version: 1.0
   date-created: YYYY-MM-DD
   status: active
   layer: 3-Visions
   tags: [vision, goal]
   serves-purpose: [P1/P2/P3]
   embodies-values: [V1/V2/V3/V4]
   ---

   # Vision: [Vision Name]

   **Layer 3 - Desired Future State**

   ---

   ## Connection to Purpose & Values

   **Serves Mission:** M[X] ([Mission name])

   **Addresses Problem:** P[X] ([Problem name])

   **Aligned with Values:**
   - **VALUE NAME** (V#) - [How this vision embodies this value]
   - **VALUE NAME** (V#) - [How this vision embodies this value]
   - **VALUE NAME** (V#) - [How this vision embodies this value]

   ---

   ## What Success Looks Like

   **Qualitative Success Criteria:**
   - [Descriptive statement of desired state]

   **Quantitative Success Criteria:**
   - [Measurable metric]
   - [Measurable metric]

   **Timeline:** Q[X] YYYY

   ---

   ## Strategies to Realize This Vision

   - [[4-Strategies/Strategy Name]] - [Brief description]

   ---

   ## Outcome Tracking

   | Date | Metric | Value | Notes |
   |------|--------|-------|-------|
   |      |        |       |       |

   ---

   **Last Updated:** YYYY-MM-DD
   ```

4. Update README.md to reflect new vision count
5. Rebuild Fabric context: `build-ae-context` (if available)

---

### Workflow 3: Add New Strategy

**USE WHEN:** User identifies a new approach to realize a vision

**Steps:**
1. Ask clarifying questions:
   - Which vision(s) does this serve?
   - What is the core approach?
   - What are the key principles?
   - How will this be implemented? (habits, practices)

2. Create strategy file:
   ```bash
   /workspace/khali-obsidian-vault/My-Attention-Ecology/4-Strategies/[Strategy Name].md
   ```

3. Use this template:
   ```markdown
   ---
   version: 1.0
   date-created: YYYY-MM-DD
   status: active
   layer: 4-Strategies
   tags: [strategy, approach]
   serves-vision: [Vision Name]
   ---

   # Strategy: [Strategy Name]

   **Layer 4 - Coherent Approach**

   ---

   ## Serves Vision

   [[3-Visions/Vision Name]] - [Brief description]

   ---

   ## Why This Strategy

   [Rationale for this approach]

   ---

   ## The Approach

   [Description of how this strategy works]

   ---

   ## Key Principles

   1. [Principle 1]
   2. [Principle 2]
   3. [Principle 3]

   ---

   ## Implementation

   **Related Habits:**
   - [[7-Habits/Habit Name]] - [Brief description]

   **Related Projects:**
   - [[5-Projects/Project Name/project.md]] - [Brief description]

   ---

   **Last Updated:** YYYY-MM-DD
   ```

4. Update related vision file to link to this strategy
5. Update README.md strategy count

---

### Workflow 4: Add New Project

**USE WHEN:** User starts a concrete initiative

**Steps:**
1. Ask clarifying questions:
   - Which vision does this serve?
   - Which strategies does this use?
   - What is the current status and timeline?
   - What are the immediate next actions?

2. Create project folder and file:
   ```bash
   mkdir -p "/workspace/khali-obsidian-vault/My-Attention-Ecology/5-Projects/[Project Name]"
   ```

3. Create project.md:
   ```markdown
   ---
   version: 1.0
   date-created: YYYY-MM-DD
   status: active
   layer: 5-Projects
   tags: [project]
   serves-vision: [Vision Name]
   ---

   # Project: [Project Name]

   **Layer 5 - Concrete Initiative**

   ---

   ## Serves Vision

   [[3-Visions/Vision Name]] - [Brief description]

   ## Uses Strategies

   - [[4-Strategies/Strategy Name]] - [Brief description]

   ## Status

   **Active - [Phase]** | **Timeline:** Q[X] YYYY

   **Progress:** [Percentage or milestone]

   ---

   ## Next Actions

   - [ ] [Action 1]
   - [ ] [Action 2]
   - [ ] [Action 3]

   **Addresses:** [Problem reference]

   ---

   **Last Updated:** YYYY-MM-DD
   ```

4. Update related vision to link to this project
5. Update README.md project count

---

### Workflow 5: Add New Habit

**USE WHEN:** User wants to establish a recurring practice

**Steps:**
1. Ask clarifying questions:
   - What does this look like concretely?
   - Why does this matter? (link to strategy/vision)
   - What is the frequency? (daily/weekly/monthly)
   - How will this be tracked?

2. Create habit file:
   ```bash
   /workspace/khali-obsidian-vault/My-Attention-Ecology/7-Habits/[Habit Name].md
   ```

3. Use this template:
   ```markdown
   ---
   version: 1.0
   date-created: YYYY-MM-DD
   status: active
   layer: 7-Habits
   tags: [habit, practice]
   frequency: [daily/weekly/monthly]
   serves-strategy: [Strategy Name]
   ---

   # Habit: [Habit Name]

   **Layer 7 - Recurring Practice**

   ---

   ## What This Looks Like

   [Concrete description of the practice]

   **Frequency:** [Daily/Weekly/Monthly]

   **Duration/Scope:** [How long or how much]

   ---

   ## Why This Matters

   **Serves Strategy:** [[4-Strategies/Strategy Name]]

   **Serves Vision:** [[3-Visions/Vision Name]]

   [Explanation of connection to larger goals]

   ---

   ## Tracking

   | Date | Completed | Notes |
   |------|-----------|-------|
   |      |           |       |

   **Current Streak:** 0 days

   **Completion Rate (Last 30 Days):** 0%

   ---

   ## Learning Log

   [Observations, patterns, adjustments]

   ---

   **Last Updated:** YYYY-MM-DD
   ```

4. Update related strategy to link to this habit
5. Update README.md habit count

---

### Workflow 6: Weekly Review

**USE WHEN:** User requests weekly review or it's time for weekly planning

**Steps:**
1. **Check Project Progress:**
   - Read all project.md files in 5-Projects/
   - Identify completed actions
   - Identify blocked work
   - Note which projects got attention vs which didn't

2. **Check Habit Tracking:**
   - Read all habit files in 7-Habits/
   - Calculate completion rates
   - Identify streaks or lapses
   - Note patterns

3. **Check Actions:**
   - Review 6-Actions/ structure
   - Identify completed vs pending actions
   - Pull new actions from project next steps

4. **Generate Weekly Summary:**
   ```markdown
   # Weekly Review - [Date]

   ## Projects Active This Week
   - [Project]: [Progress made]

   ## Habits Practiced
   - [Habit]: [X of Y days completed]

   ## Key Accomplishments
   - [Accomplishment linking to vision]

   ## What Got Neglected
   - [Vision or project]: [Why]

   ## Adjustments Needed
   - [Change to make]

   ## Next Week's Focus
   - [Priority 1]
   - [Priority 2]
   ```

5. **Update Weekly Planning Note:**
   - Location: `/workspace/khali-obsidian-vault/Planning/weekly planning/`
   - Pull actions from ecology for next week

---

### Workflow 7: Quarterly OKR Creation

**USE WHEN:** Beginning of new quarter or user requests OKR planning

**Steps:**
1. **Review Ecology Context:**
   - Read all active visions (Layer 3)
   - Read associated strategies (Layer 4)
   - Check project status (Layer 5)

2. **Select Focus Visions:**
   - Identify 2-3 visions for this quarter
   - Prioritize based on:
     - Timeline urgency
     - Bandwidth availability
     - Strategic importance

3. **Create OKR Document:**
   ```markdown
   # Q[X] YYYY OKRs ([Month] - [Month])

   ## Objective 1: [Vision Name]
   From: [[3-Visions/Vision Name]]

   ### Key Results (Measurable outcomes)
   - KR1: [Metric from vision success criteria]
   - KR2: [Metric from vision success criteria]
   - KR3: [Metric from vision success criteria]

   ### Supporting Work This Quarter
   **Projects:** [[5-Projects/Project Name]]
   **Strategy:** [[4-Strategies/Strategy Name]]

   **Actions Q[X]:**
   - [ ] [Action from project next steps]
   - [ ] [Action from project next steps]

   ---

   ## Objective 2: [Another Vision]
   ...
   ```

4. **Save OKR File:**
   - Location: `/workspace/khali-obsidian-vault/OKRs/YYYY Q[X] ([Month] - [Month]).md`

5. **Link OKRs to Ecology:**
   - Update vision files with OKR reference
   - Ensure projects reflect quarterly priorities

---

### Workflow 8: Detect Gaps in Ecology

**USE WHEN:** User requests gap analysis or during quarterly review

**Steps:**
1. **Check Vision Coverage:**
   - List all visions: `ls 3-Visions/`
   - For each vision, check if it has:
     - Link to purpose/problem
     - At least one strategy
     - At least one project
     - Success criteria defined

2. **Check Strategy Implementation:**
   - List all strategies: `ls 4-Strategies/`
   - For each strategy, check if it has:
     - Vision it serves
     - Implementing habit(s) or project(s)

3. **Check Project Activity:**
   - List all projects: `ls 5-Projects/`
   - For each project, check:
     - Last updated date (stale if >30 days)
     - Has next actions defined
     - Links to vision and strategy

4. **Check Habit Practice:**
   - List all habits: `ls 7-Habits/`
   - For each habit, check:
     - Recent tracking entries
     - Completion rate calculation
     - Strategy/vision linkage

5. **Generate Gap Report:**
   ```markdown
   # Ecology Gap Analysis - [Date]

   ## Visions Without Strategies
   - [Vision Name] - needs strategic approach

   ## Strategies Without Implementation
   - [Strategy Name] - no habits or projects implementing this

   ## Stale Projects (>30 days since update)
   - [Project Name] - last updated [date]

   ## Habits Without Recent Tracking
   - [Habit Name] - last entry [date]

   ## Orphaned Elements (Not Linked to Higher Layers)
   - [Element] - missing connection to vision/strategy

   ## Recommendations
   1. [Specific action to close gap]
   2. [Specific action to close gap]
   ```

---

### Workflow 9: Update Cross-References

**USE WHEN:** Adding/modifying any element that links to other layers

**Steps:**
1. **Identify Affected Files:**
   - Determine which layers are linked
   - List all files that need updating

2. **Update Bidirectional Links:**
   - If adding strategy to vision → update vision to link to strategy
   - If adding project to strategy → update strategy to link to project
   - If adding habit to strategy → update strategy to link to habit

3. **Verify Link Syntax:**
   - Use `[[filename]]` for file links
   - Use `[[filename#section]]` for section links
   - Ensure paths are correct

4. **Update README if Needed:**
   - New vision/strategy/project/habit → update counts
   - Status changes → update status indicators

---

### Workflow 10: Generate Aggregated Views

**USE WHEN:** User requests consolidated view of actions, habits, or progress

**Available Views:**

1. **All Next Actions (Across All Projects):**
   ```bash
   grep -h "^- \[ \]" /workspace/khali-obsidian-vault/My-Attention-Ecology/5-Projects/*/project.md
   ```

2. **All Active Habits:**
   ```bash
   ls /workspace/khali-obsidian-vault/My-Attention-Ecology/7-Habits/
   ```

3. **All Visions with Timelines:**
   ```bash
   grep -h "Timeline:" /workspace/khali-obsidian-vault/My-Attention-Ecology/3-Visions/*.md
   ```

4. **Stale Projects (Not Updated Recently):**
   ```bash
   find /workspace/khali-obsidian-vault/My-Attention-Ecology/5-Projects/ -name "project.md" -mtime +30
   ```

5. **Full Ecology Tree:**
   ```bash
   tree /workspace/khali-obsidian-vault/My-Attention-Ecology/
   ```

---

### Workflow 11: Update Values Alignment Across Ecology

**USE WHEN:** Values in Layer 2 have been refactored or updated

**Context:** When Layer 2 (Values) changes, all references to values across the ecology need updating to maintain coherence.

**Steps:**

1. **Identify All Values References:**
   ```bash
   grep -r "Aligned with Values:" /workspace/khali-obsidian-vault/My-Attention-Ecology/3-Visions/
   grep -r "embodies-values:" /workspace/khali-obsidian-vault/My-Attention-Ecology/*/
   ```

2. **For Each Vision:**
   - Read current values section
   - Map vision to new values framework (which V1-V8 does this vision embody?)
   - Update "Aligned with Values" section showing:
     - Which values (use V# and NAME)
     - HOW this vision embodies each value (concrete connection, not vague)
     - Optional: Reference typology roots in parentheses

3. **For Each Strategy (if applicable):**
   - Determine if strategies should explicitly state values alignment
   - If yes: Add 2-3 key values per strategy with brief rationale

4. **Check Habits:**
   - Ensure habits show which values they reinforce
   - Update habit frontmatter if needed: `reinforces-values: [V1, V5, V8]`

5. **Update Templates:**
   - Modify vision template (Workflow 2) to use new values format
   - Update strategy template if values alignment added
   - Update habit template with values reinforcement field

6. **Document the Propagation:**
   - Add change log entry to each updated file
   - Note the values refactor in a single git commit

**Example Update for Vision:**
```markdown
**Aligned with Values:**
- **WISDOM** (V1) - Platform integrates soul-level context (embodied wisdom) with technical knowledge
- **SOVEREIGNTY** (V4) - Users own data and infrastructure (clear boundaries)
- **BEAUTY** (V6) - Elegant architecture treating infrastructure as sacred
```

---

### Workflow 12: Check Cross-Layer Coherence

**USE WHEN:** Quarterly review, after major changes, or when alignment feels off

**Purpose:** Verify that all layers align with values and each other

**Steps:**

1. **Values → Visions Coherence:**
   - Read all 8 values (V1-V8) from Layer 2
   - For each vision in Layer 3:
     - Check which values it claims to embody
     - Verify the connection is authentic (not forced)
     - Flag if vision violates any core values

2. **Visions → Strategies Coherence:**
   - For each vision:
     - Check that all linked strategies actually serve this vision
     - Verify strategies don't contradict vision values
     - Identify visions lacking strategic approaches

3. **Strategies → Projects/Habits Coherence:**
   - For each strategy:
     - Verify it has implementing projects OR habits
     - Check that projects/habits actually use this strategy
     - Flag strategies with no implementation

4. **Projects → Actions Coherence:**
   - For each project:
     - Verify next actions exist and are current
     - Check actions align with project vision
     - Identify stalled projects (no actions, no updates)

5. **Generate Coherence Report:**
   ```markdown
   # Cross-Layer Coherence Check - [Date]

   ## ✅ Strong Alignments
   - [Vision X] → [Strategy Y] → [Project Z] → [Habit A] (well-integrated)

   ## ⚠️ Weak Links
   - [Vision without strategies]
   - [Strategy without implementation]
   - [Project disconnected from vision]

   ## ❌ Incoherence Detected
   - [Vision claims Value X but actions violate it]
   - [Strategy contradicts vision success criteria]

   ## Recommendations
   1. [Specific fix]
   2. [Specific fix]
   ```

6. **Use Report for Planning:**
   - Prioritize closing coherence gaps
   - Archive truly disconnected elements
   - Strengthen weak links with new strategies/projects

---

### Workflow 13: Values-Based Decision Making

**USE WHEN:** User faces decision or tradeoff, OR evaluating new opportunity

**Purpose:** Use Layer 2 values as evaluation criteria for decisions

**Steps:**

1. **Frame the Decision:**
   - What is being decided?
   - What are the options (A, B, C)?
   - What's at stake?

2. **Load Values Context:**
   - Read all 8 values from `/workspace/khali-obsidian-vault/My-Attention-Ecology/2-Values/values.md`
   - Pay attention to "When Honored" vs "When Violated" sections

3. **Evaluate Each Option Against Values:**

   Create matrix:
   ```markdown
   | Value | Option A | Option B | Option C |
   |-------|----------|----------|----------|
   | WISDOM (V1) | Honors: [how] / Violates: [how] | ... | ... |
   | TRUTH (V2) | ... | ... | ... |
   | COMPASSION (V3) | ... | ... | ... |
   | SOVEREIGNTY (V4) | ... | ... | ... |
   | COURAGE (V5) | ... | ... | ... |
   | BEAUTY (V6) | ... | ... | ... |
   | PEACE (V7) | ... | ... | ... |
   | PRESENCE (V8) | ... | ... | ... |
   ```

4. **Identify Value Conflicts:**
   - Which options honor multiple values?
   - Which options violate core values?
   - Are there unavoidable tradeoffs? (e.g., COURAGE vs PEACE)

5. **Check Purpose Alignment:**
   - Read Layer 1 (Purpose): Which option best addresses the problems?
   - Which option best serves the missions?

6. **Generate Recommendation:**
   ```markdown
   # Decision: [Name]

   ## Recommendation: [Option X]

   **Values Honored:**
   - V1 (WISDOM): [How this option honors wisdom]
   - V4 (SOVEREIGNTY): [How this option honors sovereignty]

   **Values Risked:**
   - V7 (PEACE): [Potential conflict, mitigation strategy]

   **Purpose Alignment:**
   - Addresses P2 (Meta-crisis leadership)
   - Serves M1 (Build AI infrastructure)

   **Red Flags if Choosing Other Options:**
   - Option A: Violates TRUTH (V2) - [explanation]
   - Option B: Violates SOVEREIGNTY (V4) - [explanation]
   ```

7. **Document Decision:**
   - Add to relevant vision/project as reflection
   - Capture decision rationale for future reference

---

## Change Attribution for Ecology Documents

**CRITICAL:** Before editing any ecology document, follow the Change Attribution Protocol.

**Quick reference:**
1. **Before editing:** Run `git diff <file>` to check for Khali's uncommitted changes
2. **If uncommitted changes exist:** Add change log entry for Khali (factual WHAT only, no WHY)
3. **Make your edit:** Add your changes
4. **Add your change log entry:** Include rationale (you know why you made changes)
5. **Commit with mixed authorship note:** Acknowledge both contributors in commit message

**Full protocol:** See `/workspace/khali-obsidian-vault/ai-context/vai/vai-knowledge-management.md#change-attribution-protocol`

**Example workflow when editing values.md:**

```bash
# 1. Check for uncommitted changes
git diff /workspace/khali-obsidian-vault/My-Attention-Ecology/2-Values/values.md

# Output shows Khali updated V3 definition
# → Must add change log entry for Khali's work

# 2. Edit values.md to add your change + both change log entries
# Change Log:
# - **2025-12-05** (Khali) Updated V3 operational definition
# - **2025-12-05** (Vai) Added V9: CREATIVITY based on Wing 4

# 3. Commit with mixed authorship
git add /workspace/khali-obsidian-vault/My-Attention-Ecology/2-Values/values.md
git commit -m "Add V9: CREATIVITY value (+ uncommitted edits from Khali)

Added V9 based on Enneagram Wing 4 aesthetic sensitivity.

Note: Commit also includes Khali's uncommitted edits to V3 definition
(see change log for attribution)."
```

**Safe inference rules:**
- ✅ CAN infer: Typos, formatting, metadata-only changes
- ❌ CANNOT infer: Content changes, structural changes, strategic changes

---

## Integration Points

### Weekly Planning Integration

**Current Location:** `/workspace/khali-obsidian-vault/Planning/weekly planning/`

**How to Pull from Ecology:**
1. List all project next actions (Workflow 10, View 1)
2. Check habit frequencies for this week
3. Create weekly planning note with ecology-sourced tasks
4. Include references back to projects/visions

**Example:**
```markdown
# Weekly Planning - Mon [Date]

## This Week's Focus (from ecology)
**Vision:** [[Soul Codes Multi-Tenant Platform]]
**Project:** [[Soul Codes Platform]]

## Monday:
- [ ] Email Anthropic for reseller approval ← FROM project next actions
- [ ] Define MVP ISVARA features ← FROM project next actions

## Daily (from habits):
- [ ] Morning breathwork (10 min) ← FROM Layer 7
```

### OKR Integration

**Current Location:** `/workspace/khali-obsidian-vault/OKRs/`

**How to Create from Ecology:**
- Use Workflow 7 (Quarterly OKR Creation)
- Pull objectives from Layer 3 (Visions)
- Pull key results from vision success criteria
- Pull actions from Layer 5 (Projects)
- Link everything back to ecology

### Tactical Projects

**Current Location:** `/workspace/khali-obsidian-vault/projects/WIP/`

**Three Options:**
1. **Migrate to Layer 5** - Move into 5-Projects/ with "Tactical" prefix
2. **Keep Separate** - Not everything needs ecology integration
3. **Archive** - If already completed, move to archive

**Recommendation:** Keep separate - life admin ≠ life strategy

---

## Maintenance Tasks

### Daily
- Update habit tracking entries when prompted
- Mark completed actions in project files

### Weekly
- Run Workflow 6 (Weekly Review)
- Update weekly planning from ecology
- Check for stale projects

### Monthly
- Update all habit completion rates
- Review vision progress metrics
- Update outcome tracking tables

### Quarterly
- Run Workflow 7 (Quarterly OKR Creation)
- Run Workflow 8 (Detect Gaps in Ecology)
- Update vision timelines
- Archive completed projects

---

## Troubleshooting

**Issue:** Cross-references broken
- **Fix:** Run Workflow 9 to rebuild links

**Issue:** Can't find recent actions
- **Fix:** Run Workflow 10, View 1 to aggregate all actions

**Issue:** Vision seems disconnected from work
- **Fix:** Run Workflow 8 to detect missing strategies/projects

**Issue:** Habits not being tracked
- **Fix:** Add tracking tables to habit files, set up weekly review reminder

---

## Success Criteria

**Ecology is working well if:**
- ✅ Can trace any action back to fundamental problem
- ✅ Weekly planning feels connected to visions
- ✅ OKRs clearly derived from ecology
- ✅ No cognitive overhead managing multiple systems
- ✅ Gaps are visible and addressable

**Ecology needs adjustment if:**
- ❌ Feels bureaucratic or burdensome
- ❌ Still maintaining parallel systems
- ❌ Can't quickly answer "Why am I doing this?"
- ❌ Weekly planning disconnected from strategic work

---

### Workflow 14: Weekly Planning Management (Layer 6 Operations)

**USE WHEN:** User asks to add tasks to weekly planning, manage to-dos, or help with priorities

**Context:** Weekly planning IS Layer 6 (Actions) of the ecology. It's the interface where strategic work becomes concrete daily tasks.

**Location:** `/workspace/khali-obsidian-vault/Planning/weekly planning/`
**Naming:** `Weekly planning - Mon [date] '[year].md` (e.g., `Weekly planning - Mon 8th Dec '25.md`)

---

#### 14.1: Add Task to Specific Day

**Steps:**
1. Find current week's note in weekly planning directory
2. Find or CREATE day section (e.g., `Monday:`, `Friday:`)
3. Add task as `- [ ] Task description`
4. If task relates to a Project (Layer 5), optionally note the connection

**Example:**
```markdown
Monday:
- [ ] Set up Git pipeline for infrastructure deployment
- [ ] Figure out Soul Codes infrastructure for Rory
```

**CRITICAL RULES:**
- ✅ Add tasks in Khali's voice (what to do, not questions)
- ✅ Keep task descriptions actionable and concrete
- ❌ DO NOT add Vai's questions to Khali's documents
- ❌ DO NOT add "current status?" or similar prompts

---

#### 14.2: Expand Priorities Brainstorm

**When asked to help with priorities, reference ecology Layers 4-5:**

**Steps:**
1. Read active Strategies (Layer 4): `ls /workspace/khali-obsidian-vault/My-Attention-Ecology/4-Strategies/`
2. Read active Projects (Layer 5): `ls /workspace/khali-obsidian-vault/My-Attention-Ecology/5-Projects/`
3. Suggest priorities based on:
   - Active project status
   - Strategy alignment
   - Current bandwidth (check current-state.md)

**Priorities brainstorm format:**
```markdown
Priorities brainstorm:
- [Category]
  - [Specific actionable item]
  - [Specific actionable item]
```

**CRITICAL RULES:**
- ✅ Add sub-bullets with actionable specifics
- ✅ Draw from Projects and Strategies for context
- ❌ DO NOT inject questions into the document
- ❌ DO NOT add verbose explanations

---

#### 14.3: Provide Priority Context (Thinking Partner Mode)

**When discussing priorities verbally (not editing documents):**

1. **Reference ecology context:**
   - Which Visions are these priorities serving?
   - Which Strategies apply?
   - Are there gaps (priorities not connected to ecology)?

2. **Keep feedback lightweight:**
   - 1-2 sentences of observation
   - One question or consideration
   - Don't overwhelm with strategic analysis

3. **Respect bottom-up nature:**
   - Weekly planning is ground-level, practical
   - Don't impose top-down strategic thinking
   - User manages connection between layers

**Example of CORRECT thinking partner feedback:**
```
"Good call front-loading infrastructure work - that unblocks Soul Codes.
One question: do you know if any client work has deadlines this week?"
```

**Example of INCORRECT behavior:**
```
"Based on your Vision G1 (Soul Codes Multi-Tenant Platform) and Strategy S1
(Phased Implementation with BMAD Hybrid), I recommend restructuring your
priorities to align with the Q2 2026 timeline..." [too much]
```

---

#### 14.4: Weekly → Ecology Tracing

**When user asks "why am I doing this?" or needs motivation:**

1. Trace task back through layers:
   - Task (Layer 6) → Project (Layer 5) → Strategy (Layer 4) → Vision (Layer 3) → Purpose (Layer 1)

2. Show the connection briefly:
   - "This VPS work supports Soul Codes Platform → serves your vision of infrastructure that maintains coherence"

3. Don't overdo it - one sentence is often enough

---

**Version:** 1.2
**Created:** 2025-12-05
**Last Updated:** 2025-12-08
**Status:** Active - Ready for use

---

## Change Log

- **2025-12-08** (Vai) v1.2 - Added Workflow 14 (Weekly Planning Management), moved skill to active PAI location
- **2025-12-05** (Vai) v1.1 - Renamed to Attention Ecology Management, added Workflows 11-13 (values alignment, coherence checking, values-based decisions)
