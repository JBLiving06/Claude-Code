# HeyGen API Workflow — Raise the Crown

## Overview

Two API paths for video production:

| Endpoint | Use Case | Script Control | Visual Production |
|----------|----------|---------------|-------------------|
| `/v2/video/generate` | Verbatim scripts | Exact `input_text` | Avatar-to-camera only (no B-roll) |
| `/v1/video_agent/generate` | Full production | Natural language prompt | B-roll, transitions, motion graphics |

**Hybrid approach:** Use Video Agent for visual production, then review in AI Studio to correct any script drift.

## Authentication

All requests use header: `X-Api-Key: <your_api_key>`

API key stored in `.env` (git-ignored).

## Workflow: Render → Poll → Download

```
POST /v2/video/generate (or /v1/video_agent/generate)
  → Returns { data: { video_id: "..." } }

GET /v1/video_status.get?video_id={id}
  → Poll every 10s
  → Status: "processing" | "completed" | "failed"
  → When completed: { data: { video_url: "..." } }

GET {video_url}
  → Download MP4
```

## Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `discover-ids.sh` | Find Jeff's avatar_id and voice_id | `bash scripts/discover-ids.sh` |
| `test-render.sh` | Submit 15-second test render | `bash scripts/test-render.sh` |
| `poll-status.sh` | Poll render status + download | `bash scripts/poll-status.sh <video_id>` |
| `video-agent-render.sh` | Submit Video Agent prompt | `bash scripts/video-agent-render.sh <prompt_file>` |

## Phase 1 Execution Steps

1. **Run discovery:** `bash scripts/discover-ids.sh`
2. **Identify Jeff's IDs** from the output and add to `.env`:
   ```
   HEYGEN_AVATAR_ID=<found_avatar_id>
   HEYGEN_VOICE_ID=<found_voice_id>
   ```
3. **Submit test render:** `bash scripts/test-render.sh`
4. **Poll and download:** `bash scripts/poll-status.sh`
5. **Verify:** Watch the downloaded video — confirm avatar looks correct, voice clone sounds right

## Concurrency

API Pro allows **3 concurrent video renders**. Can submit 3 scenes simultaneously.

## Credit Budget

| Module | Estimated Credits | Cumulative |
|--------|-------------------|------------|
| Test render | ~1 | 1 |
| Module 1 (4-5 min) | ~5 | 6 |
| Module 2 (12-15 min) | ~13 | 19 |
| Module 3 (12-15 min) | ~13 | 32 |
| Module 4 (5-6 min) | ~6 | 38 |
| **Iteration budget** | **~82** | **120** |

## Script Rewriting Risk Mitigation

1. Scene-by-scene prompting (not one massive prompt)
2. Include "Use VERBATIM — do not rewrite or paraphrase" in every prompt
3. Include exact script text in prompt as reference
4. Post-generation review in AI Studio for corrections
5. Compare generated voiceover text against original script

## Production Defaults

```json
{
  "background": { "type": "color", "value": "#1a1a2e" },
  "dimension": { "width": 1920, "height": 1080 },
  "caption": true
}
```
