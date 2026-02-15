# Raise the Crown

## What This Is

A four-module AI literacy video workshop delivered via HeyGen avatar videos, targeting 30-40 high-performing African American students (primarily Morehouse College, some advanced high school). The avatar is an AI-generated version of Jeff Livingston (CEO of EdSolutions, Alpha Phi Alpha) — a Black man's AI avatar teaching about AI sophistication, where the medium IS the message. Named for Howard Thurman's philosophy: "Hold the crown above their heads and dare them to grow into it."

## Core Value

The avatar itself proves that AI has advanced far enough that students who don't close the distance will be left behind — every production element (the avatar, the voice clone, the visual polish) IS the curriculum.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Four video modules produced via HeyGen Video Agent API with full visual production (B-roll, transitions, motion graphics, typography overlays)
- [ ] Module 1: "The Setup" (~4-5 min) — avatar reveal, 8-bit to 3D face morph, "distance" concept
- [ ] Module 2: "The Protocols" (~12-15 min) — rubric engineering, research synthesis, pre-class prep, exam systems
- [ ] Module 3: "Products in Practice" (~12-15 min) — live tool demos with screen recording mockups (most visually demanding)
- [ ] Module 4: "The Horizon" (~5-6 min) — agentic AI future, Thurman close, three-photo montage
- [ ] React delivery platform: video player, module navigation, chatbot embed, mobile responsive
- [ ] Du Bois Office Hours chatbot integrated into platform (W.E.B. Du Bois persona, V3 React artifact)
- [ ] Resource kit: tool recommendation guide, tiered investment framework ($0-$100+/month), student discount paths

### Out of Scope

- LMS integration — delivery is standalone web app, not embedded in an LMS
- User accounts/authentication — 30-40 known students, no auth needed
- Analytics/tracking dashboard — not needed for initial cohort
- Module 4 Video Agent prompt — script exists but prompt needs formatting (pre-production task, not app feature)

## Context

### Target Audience

Three design personas:
- **Ethan (High School)** — Bright junior, knows AI exists, doesn't know what it can do for him
- **Ethan (College)** — Brilliant Morehouse sophomore, uses ChatGPT, hasn't built a system yet
- **Jaylen (Career)** — Amherst College graduate preparing for law school

### Cultural Requirements (NOT optional)

- B-roll must show Black students at HBCUs (Morehouse quad, suits on Fridays)
- Alpha Phi Alpha integration — Jeff wears the crest, 5-10% recruitment energy
- "Handsome Alpha from South Carolina" line preserved verbatim
- Howard Thurman philosophy in Module 4 close
- Cost-conscious framing (students can't afford $100/month)
- 8-bit to 3D face morph must use Jeff's actual face
- NO "sophistication gap" framing — replaced everywhere with "distance"

### Avatar Wardrobe

- Modules 1 & 4: Old gold vest with Alpha Phi Alpha crest
- Modules 2 & 3: Black sweater

### Visual Identity

- Dark backgrounds with old gold (#CFB53B) and amber accents
- Clean, cinematic visual style — minimalist tech-cinematic energy (Trent Reznor/Atticus Ross tone)
- Motion graphics for data visualizations, timeline graphics, text overlays
- Stock media: Black students at HBCUs, professional academic settings, tech workspaces
- Typography: bold, modern, high-contrast against dark backgrounds
- NO generic corporate stock footage

### Existing Assets

- Landing page V2: `raise-the-crown-v2.html` (319KB, embedded photos, Du Bois section)
- Office Hours V3: `office-hours-v3.jsx` (React artifact, tested and working)
- Du Bois image: archived as base64 on Notion
- Three photos for Module 4.3 montage: archived on Notion Photo Archive page
- Production package: `Raise_the_Crown_Video_Agent_Production_Package.docx`
- All scripts finalized on Notion Operations Hub

### Notion Operations Hub (Single Source of Truth)

- Page ID: 3013aae4-efa3-8176-ac7e-c4646de4623c
- Module 1 prompt: https://www.notion.so/3013aae4efa3813ebe26d91c5c9bae89
- Module 2 prompt: https://www.notion.so/3013aae4efa3817c90b3d5668b0f4578
- Module 3 prompt: https://www.notion.so/3013aae4efa381b8a075e7a5c673b717
- Module 4 prompt: NOT YET CREATED

## Constraints

- **Budget (API Credits)**: 120 HeyGen API credits total. ~37 for initial renders, ~63 for iterations. Cannot exceed.
- **Budget (Subscription)**: HeyGen API Pro at $99/month (Creator tier). 3 concurrent video renders max.
- **Script Integrity**: ALL scripts are VERBATIM. Video Agent has a known script-rewriting problem — must verify output preserves exact voiceover text.
- **Production Quality**: No talking-head-only output. Every module requires B-roll, transitions, typography overlays, motion graphics.
- **API Discovery Required**: Jeff's avatar_id and ElevenLabs voice_id have NOT been discovered via API yet. Must hit /v2/avatars and /v2/voices first.
- **Platform Consistency**: React app must be visually consistent with existing landing page (raise-the-crown-v2.html)
- **Resolution**: 1080p. Background: `#1a1a2e`. Captions: enabled.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid API approach (Video Agent + AI Studio corrections) | Video Agent provides visual production but may rewrite scripts; AI Studio allows corrections | — Pending |
| Scene-by-scene prompting (not monolithic) | Reduces script rewriting risk; easier to iterate within credit budget | — Pending |
| React for delivery platform | Consistent with existing Du Bois chatbot (React artifact); modern, mobile-responsive | — Pending |
| ElevenLabs voice clone via HeyGen | Voice clone already configured in HeyGen under "My Voices" tab | — Pending |
| No authentication | Only 30-40 known students; auth adds complexity without value | — Pending |

---
*Last updated: 2026-02-15 after initialization*
