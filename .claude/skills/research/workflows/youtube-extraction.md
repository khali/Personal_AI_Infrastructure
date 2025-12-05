# YouTube Extraction Workflow

Extract transcripts from YouTube videos using Playwright browser automation. This workflow handles YouTube's bot detection by using real browser sessions.

## 🎯 Load Full PAI Context

**Before starting any task with this skill, load complete PAI context:**

`Skill("CORE")` or `read ${PAI_DIR}/skills/CORE/SKILL.md`

This provides access to:
- Stack preferences and tool configurations
- Security rules and repository safety protocols
- Response format requirements
- Personal preferences and operating instructions

## When to Activate This Skill
- Extract transcript from YouTube video
- Get YouTube transcript for learning notes
- Save YouTube content to Obsidian vault
- Process YouTube video text

## Why Playwright Instead of Fabric?

**Documented Best Practice:** Fabric with yt-dlp (`fabric -y "URL" --transcript`)

**Current Reality:** YouTube blocks yt-dlp with bot detection errors. Workaround requires browser cookies (`--cookies-from-browser`), but vai-container has no browsers installed.

**Working Solution:** Playwright + Firecrawl
- Uses real browser automation (looks human-like to YouTube)
- Bypasses bot detection
- Works in containerized environment
- Trade-off: Heavyweight but reliable

**Future:** When YouTube stops blocking yt-dlp, switch back to Fabric approach documented in `/home/devuser/ai-global/claude/skills/fabric/fabric-repo/docs/YouTube-Processing.md`

## The Working Approach

### Step 1: Extract Video Information

Use Firecrawl to get video metadata and find embedded transcript:

```typescript
// Search for the video to get the correct URL
const searchResults = await mcp__firecrawl__firecrawl_search({
  query: "Daniel Miessler [topic] site:youtube.com",
  limit: 5,
  sources: [{ type: "web" }]
});

// Or if you have the direct URL, scrape it
const videoPage = await mcp__firecrawl__firecrawl_scrape({
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  formats: ["markdown"]
});
```

### Step 2: Extract Transcript via Playwright

Navigate to video and extract transcript from embedded player:

```typescript
// Navigate to video
await mcp__playwright__playwright_navigate({
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  headless: false,  // Use visible browser to avoid detection
  timeout: 30000
});

// Wait for page to load
await new Promise(resolve => setTimeout(resolve, 5000));

// Get page content
const html = await mcp__playwright__playwright_get_visible_html({
  cleanHtml: true,
  removeScripts: true,
  maxLength: 100000
});

// Extract transcript section
// YouTube embeds transcript in page HTML - parse accordingly
```

### Step 3: Use Firecrawl to Extract Transcript

Simpler approach - let Firecrawl handle the extraction:

```typescript
const result = await mcp__firecrawl__firecrawl_scrape({
  url: "https://www.youtube.com/watch?v=VIDEO_ID",
  formats: ["markdown"],
  onlyMainContent: true,
  waitFor: 5000  // Wait for dynamic content
});

// Transcript is embedded in the markdown output
// Extract from the content
```

### Step 4: Save to Obsidian Vault

Create properly formatted note in Learning directory:

```markdown
---
title: [Video Title]
author: [Author Name]
source: [YouTube URL]
date: YYYY-MM-DD
type: video-transcript
tags: [relevant, tags, here]
related: []
status: reference
---

# [Video Title]

**Video:** [YouTube URL]
**Duration:** [Duration]
**Published:** [Date]

## Overview

[Brief description of video content]

---

## Transcript

[Transcript content here with timestamps if available]

---

## Key Concepts

[Extract key concepts after reviewing transcript]

---

## Related Resources

[Links to related videos, blog posts, etc.]

---

## Notes

[Any additional notes or observations]
```

## Complete Working Example

```typescript
// 1. Search for video
const search = await mcp__firecrawl__firecrawl_search({
  query: "Daniel Miessler OpenCode vs Claude Code site:youtube.com",
  limit: 3,
  sources: [{ type: "web" }]
});

// 2. Get video URL from search results
const videoUrl = search.results[0].url;

// 3. Navigate with Playwright
await mcp__playwright__playwright_navigate({
  url: videoUrl,
  headless: false,
  timeout: 30000
});

// Wait for content
await new Promise(resolve => setTimeout(resolve, 5000));

// 4. Extract page content with Firecrawl
const scrape = await mcp__firecrawl__firecrawl_scrape({
  url: videoUrl,
  formats: ["markdown"],
  onlyMainContent: true
});

// 5. Parse and save transcript
const transcriptContent = scrape.markdown;
// Format and save to /workspace/khali-obsidian-vault/Learning/

// 6. Close browser
await mcp__playwright__playwright_close();
```

## Error Handling

**Common Issues:**

1. **YouTube blocks scraping** → Use headless: false (visible browser)
2. **Transcript not found** → Video may not have auto-captions
3. **Timeout errors** → Increase waitFor duration
4. **Rate limiting** → Wait 30-60 seconds between requests

## Obsidian Vault Integration

**Save location:** `/workspace/khali-obsidian-vault/Learning/`

**Filename pattern:** `[Author] - [Title] (Transcript).md`

**Example:** `Daniel Miessler - OpenCode vs Claude Code (Transcript).md`

## When to Use Fabric Patterns Post-Processing

After extracting transcript, optionally process with Fabric:

```bash
# Extract wisdom from saved transcript
cat "/workspace/khali-obsidian-vault/Learning/transcript.md" | fabric -p extract_wisdom

# Summarize
cat "/workspace/khali-obsidian-vault/Learning/transcript.md" | fabric -p summarize

# Create study notes
cat "/workspace/khali-obsidian-vault/Learning/transcript.md" | fabric -p create_study_notes
```

## Supplementary Resources

- Fabric patterns: `${PAI_DIR}/docs/fabric-patterns.md`
- Fabric YouTube docs: `/home/devuser/ai-global/claude/skills/fabric/fabric-repo/docs/YouTube-Processing.md`
- Obsidian vault management: `/workspace/khali-obsidian-vault/ai-context/vai/vai-knowledge-management.md`
