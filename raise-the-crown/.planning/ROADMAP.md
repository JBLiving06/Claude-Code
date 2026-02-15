# Roadmap: Raise the Crown

**Created:** 2026-02-15
**Phases:** 7
**Requirements:** 45 mapped

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | API Discovery & Test Render | Validate HeyGen API workflow and discover avatar/voice IDs | API-01 through API-05 (5) | Avatar and voice IDs discovered; test render completes; workflow documented |
| 2 | Module 1 Production | Produce "The Setup" module with avatar reveal and distance concept | MOD1-01 through MOD1-07 (7) | 4-5 min video with morph, Alpha vest, HBCU B-roll, verbatim script |
| 3 | Module 2 Production | Produce "The Protocols" module with academic workflow diagrams | MOD2-01 through MOD2-06 (6) | 12-15 min video with protocols, black sweater, Alpha line preserved |
| 4 | Module 3 Production | Produce "Products in Practice" module with tool demos | MOD3-01 through MOD3-06 (6) | 12-15 min video with screen mockups, cost-conscious framing intact |
| 5 | Module 4 Production | Produce "The Horizon" module with Thurman close | MOD4-01 through MOD4-07 (7) | 5-6 min video with photo montage, Alpha vest, Thurman philosophy |
| 6 | Delivery Platform | Build React platform with chatbot integration | PLAT-01 through PLAT-07, CHAT-01 through CHAT-04 (11) | Responsive platform hosts all modules with Du Bois chatbot |
| 7 | Resource Kit | Generate and integrate student resource materials | RES-01 through RES-04 (4) | Tool guide, tiered pricing, discount paths accessible from platform |

## Phase 1: API Discovery & Test Render

**Goal:** Validate the HeyGen API workflow and discover Jeff's custom avatar_id and voice_id
**Requirements:** API-01, API-02, API-03, API-04, API-05

### Success Criteria
1. Jeff's custom avatar_id is discovered via GET /v2/avatars
2. Jeff's ElevenLabs voice clone voice_id is discovered via GET /v2/voices
3. A 15-second test render completes successfully using discovered IDs
4. The render-poll-download pattern is established and documented
5. Scene-by-scene Video Agent API submission workflow is validated

### Key Risks
- Avatar or voice IDs may not be accessible via API
- Video Agent may rewrite test script (early validation signal)
- API credit budget (120 total) begins here

### Deliverables
- Documented avatar_id and voice_id
- Working test video (15 seconds)
- API workflow documentation (POST generate → GET status → download)

---

## Phase 2: Module 1 Production

**Goal:** Produce "The Setup" module (~4-5 min) with avatar reveal, 8-bit to 3D face morph, and "distance" concept
**Requirements:** MOD1-01, MOD1-02, MOD1-03, MOD1-04, MOD1-05, MOD1-06, MOD1-07

### Success Criteria
1. Video Agent produces full visual production (B-roll, transitions, motion graphics, typography)
2. 8-bit to 3D face morph uses Jeff's actual face (Black man's face emerging into high-fidelity)
3. Script is preserved verbatim — no rewriting detected
4. Avatar wears old gold vest with Alpha Phi Alpha crest
5. B-roll shows Black students at HBCUs (Morehouse quad, suits on Fridays), not generic stock footage

### Key Risks
- Video Agent script rewriting (highest risk in first production module)
- 8-bit morph may require custom asset preparation
- HBCU-specific B-roll may be limited in Video Agent's media library

### Deliverables
- Module 1 video file (1080p, ~4-5 min, dark background #1a1a2e, captions enabled)
- Visual QA report (script integrity, cultural elements, production quality)

---

## Phase 3: Module 2 Production

**Goal:** Produce "The Protocols" module (~12-15 min) with four academic workflow diagrams
**Requirements:** MOD2-01, MOD2-02, MOD2-03, MOD2-04, MOD2-05, MOD2-06

### Success Criteria
1. Video Agent produces full visual production with workflow diagrams
2. Four protocols presented clearly: rubric engineering, research synthesis, pre-class prep, exam systems
3. "Handsome Alpha from South Carolina" line preserved verbatim
4. Avatar wears black sweater
5. Script is preserved verbatim across 12-15 minutes

### Key Risks
- Longer runtime increases script rewriting risk
- Workflow diagrams may require specific visual prompting
- API credit consumption increases with longer videos

### Deliverables
- Module 2 video file (1080p, ~12-15 min, dark background, captions enabled)
- Visual QA report (workflow diagrams, script integrity)

---

## Phase 4: Module 3 Production

**Goal:** Produce "Products in Practice" module (~12-15 min) with AI tool screen recording mockups
**Requirements:** MOD3-01, MOD3-02, MOD3-03, MOD3-04, MOD3-05, MOD3-06

### Success Criteria
1. Video Agent produces full visual production with screen recording mockups
2. Screen mockups of AI tools are visually clear and instructive
3. Cost-conscious framing is maintained (students can't afford $100/month)
4. Avatar wears black sweater
5. Script is preserved verbatim across 12-15 minutes

### Key Risks
- Most visually demanding module (screen mockups + avatar + B-roll)
- Video Agent may struggle with complex screen recording visual prompts
- Cost messaging must remain intact (no softening by AI)

### Deliverables
- Module 3 video file (1080p, ~12-15 min, dark background, captions enabled)
- Visual QA report (screen mockups, cost-conscious framing)

---

## Phase 5: Module 4 Production

**Goal:** Produce "The Horizon" module (~5-6 min) with agentic AI future and Howard Thurman close
**Requirements:** MOD4-01, MOD4-02, MOD4-03, MOD4-04, MOD4-05, MOD4-06, MOD4-07

### Success Criteria
1. Video Agent prompt is created from existing script before production begins
2. Three-photo montage sequence uses archived photos from Notion
3. Howard Thurman philosophy close is presented with appropriate visual weight
4. Avatar wears old gold vest with Alpha Phi Alpha crest
5. Script is preserved verbatim

### Key Risks
- Module 4 Video Agent prompt does NOT exist yet (must be created from script)
- Three-photo montage requires photo assets from Notion archive
- Thurman close is emotionally critical — visual execution must match tone

### Deliverables
- Module 4 Video Agent prompt (formatted from script)
- Module 4 video file (1080p, ~5-6 min, dark background, captions enabled)
- Visual QA report (photo montage, Thurman close visual weight)

---

## Phase 6: Delivery Platform

**Goal:** Build React web application to host all four modules with Du Bois chatbot integration
**Requirements:** PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, PLAT-06, PLAT-07, CHAT-01, CHAT-02, CHAT-03, CHAT-04

### Success Criteria
1. All four video modules are hosted and playable with pause and playback speed controls
2. Module navigation allows users to move between modules
3. Du Bois Office Hours chatbot (V3 React artifact) is integrated and functional
4. Platform is mobile responsive
5. Visual identity matches landing page (dark backgrounds, old gold #CFB53B, amber accents, bold typography)

### Key Risks
- Chatbot integration may require API configuration beyond existing V3 artifact
- Visual consistency with landing page (raise-the-crown-v2.html) requires CSS alignment
- Mobile video playback can be unreliable across devices

### Deliverables
- React web application (production build)
- Du Bois chatbot integrated into platform
- Visual QA report (consistency with landing page, mobile responsiveness)

---

## Phase 7: Resource Kit

**Goal:** Generate tool recommendation guide and integrate resource materials into delivery platform
**Requirements:** RES-01, RES-02, RES-03, RES-04

### Success Criteria
1. Tool recommendation guide is generated from uploaded spreadsheet data
2. Tiered investment framework covers $0 to $100+/month range
3. Student discount access paths are documented (Google AI Pro, Perplexity Pro, Elicit free tiers)
4. Resource materials are accessible from the delivery platform

### Key Risks
- Spreadsheet data may require cleaning or transformation
- Student discount paths may change (Google AI Pro expiration, etc.)
- Resource kit UI must not distract from video content

### Deliverables
- Tool recommendation guide (PDF or embedded web page)
- Tiered investment framework document
- Student discount access path documentation
- Resource kit integrated into platform UI

---

*Created: 2026-02-15*
