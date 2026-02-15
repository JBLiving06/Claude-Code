# RAISE THE CROWN — GSD Project Brief
**Feed this document into `/gsd:new-project` when prompted. It contains everything GSD needs to build the project spec without extensive Q&A.**

---

## What This Is

"Raise the Crown" is a four-module AI literacy video workshop delivered via HeyGen avatar videos. The avatar is an AI-generated version of Jeff Livingston (CEO of EdSolutions, member of Alpha Phi Alpha Fraternity). The avatar teaches about AI sophistication — and its very existence IS the curriculum. A Black man's AI avatar teaching about AI sophistication does representational work. The medium is the message.

The name comes from Howard Thurman's philosophy: "Hold the crown above their heads and dare them to grow into it."

## Target Audience

Exclusively African American students: ~30-40 high-performing Black students, mostly college (especially Morehouse College) with some advanced high school. Three design personas:
- **Ethan (High School)** — Bright junior, knows AI exists, doesn't know what it can do for him
- **Ethan (College)** — Brilliant Morehouse sophomore, uses ChatGPT, hasn't built a system yet
- **Jaylen (Career)** — Amherst College graduate preparing for law school

## What Needs To Be Built

### Priority 1: Video Production (Modules 1-4)

Four video modules produced via HeyGen's Video Agent API. Module 1 exists in talking-head form but must be RE-PRODUCED with full visual production. All four module scripts are complete and finalized.

**Module Structure:**
- Module 1: "The Setup" (~4-5 min, ~5 credits) — Establishes the avatar, proves AI advancement, introduces the "distance" concept
- Module 2: "The Protocols" (~12-15 min, ~13 credits) — Four academic protocols: rubric engineering, research synthesis, pre-class prep, exam systems
- Module 3: "Products in Practice" (~12-15 min, ~13 credits) — Live demonstrations of tools. MOST VISUALLY DEMANDING — requires screen recording mockups
- Module 4: "The Horizon" (~5-6 min, ~6 credits) — Future of agentic AI, Thurman close, three-photo montage

**Total estimated: ~37 credits out of 120 available. ~63 credits for iterations.**

### Priority 2: Delivery Platform

A web application (React) to host the workshop:
- Video player with pause/speed controls
- Module navigation
- Chatbot widget embed point (for Du Bois Office Hours)
- Mobile responsive
- Session management
- Landing page already exists (raise-the-crown-v2.html) — platform should be visually consistent

### Priority 3: Du Bois Chatbot ("Office Hours with Brother Du Bois")

An interactive chatbot with a W.E.B. Du Bois persona that can discuss workshop protocols and broader concepts from "The Souls of Black Folk." Already built and tested as V3 React artifact (office-hours-v3.jsx). Needs integration into the delivery platform. Explicitly acknowledges its AI-generated nature as a teachable moment.

### Priority 4: Resource Kit

- Tool recommendation guide (from uploaded spreadsheet)
- Tiered investment framework ($0 to $100+/month)
- Student discount access paths (Google AI Pro, Perplexity Pro, Elicit free tiers)
- Supplementary PDFs and research materials

---

## Technical Infrastructure

### HeyGen API (Primary Production Tool)

- **Plan:** API Pro ($99/month, Creator tier)
- **Credits:** 120 remaining
- **API Key:** Stored separately (see .env)
- **DO NOT REGENERATE THIS KEY**

**Two API endpoints:**
1. `/v2/video/generate` — Verbatim script control. Each scene is JSON with exact `input_text`. Avatar-to-camera only (no B-roll).
2. `/v1/video_agent/generate` — Natural language prompt. Full visual production (B-roll, transitions, motion graphics). WARNING: may rewrite scripts.

**Hybrid approach:** Use Video Agent API for visual production, then open in AI Studio to correct any script drift and confirm voice clone.

**API Reference:**
- Auth: `X-Api-Key` header
- `GET /v2/avatars` — list avatars (find Jeff's avatar_id)
- `GET /v2/voices` — list voices (find ElevenLabs voice_id)
- `POST /v2/video/generate` — verbatim video creation
- `POST /v1/video_agent/generate` — Video Agent creation
- `GET /v1/video_status.get?video_id={id}` — poll render status

**Concurrency:** API Pro allows 3 concurrent video renders.

**IMPORTANT:** Avatar ID and voice clone ID have NOT been discovered via API yet. First task must be API discovery: hit /v2/avatars and /v2/voices to find Jeff's custom avatar_id and ElevenLabs voice_id.

### Voice Clone

Jeff's ElevenLabs voice clone. In HeyGen web UI, found under "My Voices" tab (NOT "Jeff Livingston's Voices"). Voice Engine: ElevenLabs. Must be identified via API by listing voices.

### Domain Access

`api.heygen.com` has been added to Claude's allowed domains. Requires a fresh session to take effect.

---

## Production Specifications (HARD CONSTRAINTS)

### Visual Identity
- Dark backgrounds with old gold (#CFB53B) and amber accents
- Clean, cinematic visual style
- Motion graphics for data visualizations, timeline graphics, text overlays
- Stock media showing Black students at HBCUs, professional academic settings, tech workspaces
- AI-generated imagery for concept visualizations
- Typography: bold, modern, high-contrast against dark backgrounds
- Minimalist tech-cinematic energy (Trent Reznor/Atticus Ross tone)
- NO generic corporate stock footage

### Avatar Wardrobe
- Modules 1 & 4: Old gold vest with Alpha Phi Alpha crest
- Modules 2 & 3: Black sweater

### Script Handling
- ALL scripts are VERBATIM — every word matters
- Video Agent has a known script-rewriting problem
- Scene-by-scene prompting is the recommended approach
- Must verify output preserves exact voiceover text

### What Is NOT Acceptable
- Defaulting to AI Studio talking-head-only output
- Producing videos without B-roll, transitions, typography overlays
- Treating visual production specs as optional
- Any remnant of "sophistication gap" framing — replaced everywhere with "distance"

### Cultural Requirements (NOT optional)
- B-roll must show Black students at HBCUs (Morehouse quad, suits on Fridays)
- Alpha Phi Alpha integration — Jeff wears the crest, 5-10% recruitment energy
- "Handsome Alpha from South Carolina" line preserved verbatim
- Howard Thurman philosophy in Module 4 close
- Cost-conscious framing (students can't afford $100/month)
- 8-bit to 3D face morph must use Jeff's actual face (a Black man's face emerging from low-resolution into high-fidelity)

### Background and Caption Defaults
- Background: `{"type": "color", "value": "#1a1a2e"}`
- Captions: `"caption": true`
- Resolution: 1080p

---

## Complete Scripts

All four module scripts are finalized and stored in the Notion Operations Hub:
- Notion page ID: 3013aae4-efa3-8176-ac7e-c4646de4623c
- Module 1 prompt: https://www.notion.so/3013aae4efa3813ebe26d91c5c9bae89
- Module 2 prompt: https://www.notion.so/3013aae4efa3817c90b3d5668b0f4578
- Module 3 prompt: https://www.notion.so/3013aae4efa381b8a075e7a5c673b717
- Module 4 prompt: NOT YET CREATED (script exists, prompt needs formatting)

Module 2 complete script is also embedded directly in the Notion hub (see above).

---

## Existing Assets

- Landing page V2: `raise-the-crown-v2.html` (319KB, embedded photos, Du Bois section)
- Office Hours V3: `office-hours-v3.jsx` (React artifact, tested and working)
- Du Bois image: archived as base64 on Notion
- Three photos for Module 4.3 montage: archived on Notion Photo Archive page
- Production package: `Raise_the_Crown_Video_Agent_Production_Package.docx`

---

## GSD Configuration Recommendations

### Model Profile: `balanced`
- Planning: Opus (for production manifest, creative decisions)
- Execution: Sonnet (for API calls, file generation, web app building)
- Verification: Sonnet

### Phases (Recommended)

**Phase 1: API Discovery & Test Render**
- Hit /v2/avatars and /v2/voices to find Jeff's avatar_id and voice_id
- Submit 15-second test render
- Validate avatar + voice clone work through API
- Establish the render-poll-download pattern

**Phase 2: Module 1 Production**
- Scene-by-scene Video Agent API submission
- 8 scenes, ~4-5 min total
- Includes the signature 8-bit to 3D face morph
- Review and iterate within credit budget

**Phase 3: Module 2 Production**
- 6 scenes, ~12-15 min
- Protocol workflow diagrams as visual elements
- Wardrobe: black sweater

**Phase 4: Module 3 Production**
- 5+ scenes, ~12-15 min
- MOST VISUALLY DEMANDING — screen recording mockups of AI tools
- Wardrobe: black sweater
- May require generating mockup screenshots as pre-production assets

**Phase 5: Module 4 Production**
- 4+ scenes, ~5-6 min
- Three-photo montage sequence
- Howard Thurman close
- Wardrobe: old gold vest
- Module 4 Video Agent prompt must be created first

**Phase 6: Delivery Platform**
- React web application
- Video player, module navigation, chatbot widget
- Integrate Du Bois Office Hours
- Mobile responsive, consistent with landing page visual identity

**Phase 7: Resource Kit**
- Tool recommendation guide
- Tiered investment framework
- Student discount access documentation

### Workflow Settings
- `workflow.research`: true (for Phase 4 screen mockups especially)
- `workflow.plan_check`: true
- `workflow.verifier`: true
- `parallelization.enabled`: true
- `mode`: interactive (Jeff reviews between phases)

---

## Key Risk: Video Agent Script Rewriting

The single biggest production risk is HeyGen's Video Agent rewriting the scripts instead of using verbatim text. Mitigation strategies:
1. Scene-by-scene prompting (not one massive prompt)
2. Upload PDF as reference with "Use VERBATIM" instruction
3. Include style descriptor in every prompt
4. Post-generation review in AI Studio for corrections
5. Budget includes ~63 credits for iteration/correction

---

## Context Hub

The Notion Operations Hub is the single source of truth:
- Page ID: 3013aae4-efa3-8176-ac7e-c4646de4623c
- URL: https://www.notion.so/3013aae4efa38176ac7ec4646de4623c
- Contains: all scripts, API credentials, production specs, learnings, status tracking
- Any new Claude instance should read this page FIRST
