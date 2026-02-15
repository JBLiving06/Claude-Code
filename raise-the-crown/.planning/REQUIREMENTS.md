# Requirements: Raise the Crown

**Defined:** 2026-02-15
**Core Value:** The avatar itself proves AI has advanced far enough that students who don't close the distance will be left behind — every production element IS the curriculum.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### API Infrastructure

- [ ] **API-01**: Jeff's custom avatar_id is discovered via GET /v2/avatars
- [ ] **API-02**: Jeff's ElevenLabs voice clone voice_id is discovered via GET /v2/voices
- [ ] **API-03**: A 15-second test render completes successfully using discovered avatar_id and voice_id
- [ ] **API-04**: The render-poll-download pattern is established and documented (POST generate → GET status → download URL)
- [ ] **API-05**: Scene-by-scene Video Agent API submission workflow is validated

### Module 1 — The Setup

- [ ] **MOD1-01**: Module 1 is produced via Video Agent API with full visual production (B-roll, transitions, motion graphics, typography overlays)
- [ ] **MOD1-02**: The 8-bit to 3D face morph uses Jeff's actual face (Black man's face emerging from low-res into high-fidelity)
- [ ] **MOD1-03**: The "distance" concept is introduced with supporting visual elements
- [ ] **MOD1-04**: Avatar wears old gold vest with Alpha Phi Alpha crest
- [ ] **MOD1-05**: Script is preserved verbatim — no rewriting by Video Agent
- [ ] **MOD1-06**: Module runs ~4-5 minutes with dark background (#1a1a2e), captions enabled, 1080p
- [ ] **MOD1-07**: B-roll shows Black students at HBCUs, not generic corporate stock footage

### Module 2 — The Protocols

- [ ] **MOD2-01**: Module 2 is produced via Video Agent API with full visual production
- [ ] **MOD2-02**: Four academic protocols are presented with workflow diagrams: rubric engineering, research synthesis, pre-class prep, exam systems
- [ ] **MOD2-03**: Avatar wears black sweater
- [ ] **MOD2-04**: Script is preserved verbatim
- [ ] **MOD2-05**: Module runs ~12-15 minutes with dark background, captions, 1080p
- [ ] **MOD2-06**: "Handsome Alpha from South Carolina" line preserved verbatim

### Module 3 — Products in Practice

- [ ] **MOD3-01**: Module 3 is produced via Video Agent API with full visual production
- [ ] **MOD3-02**: Screen recording mockups of AI tools are included as visual elements
- [ ] **MOD3-03**: Avatar wears black sweater
- [ ] **MOD3-04**: Script is preserved verbatim
- [ ] **MOD3-05**: Module runs ~12-15 minutes with dark background, captions, 1080p
- [ ] **MOD3-06**: Cost-conscious framing is maintained (students can't afford $100/month)

### Module 4 — The Horizon

- [ ] **MOD4-01**: Module 4 is produced via Video Agent API with full visual production
- [ ] **MOD4-02**: Three-photo montage sequence is included using archived photos from Notion
- [ ] **MOD4-03**: Howard Thurman philosophy close is presented with appropriate visual weight
- [ ] **MOD4-04**: Avatar wears old gold vest with Alpha Phi Alpha crest
- [ ] **MOD4-05**: Script is preserved verbatim
- [ ] **MOD4-06**: Module runs ~5-6 minutes with dark background, captions, 1080p
- [ ] **MOD4-07**: Video Agent prompt is created from existing script before production

### Delivery Platform

- [ ] **PLAT-01**: React web application hosts all four video modules
- [ ] **PLAT-02**: Video player supports pause and playback speed controls
- [ ] **PLAT-03**: Module navigation allows users to move between all four modules
- [ ] **PLAT-04**: Chatbot widget embed point exists for Du Bois Office Hours integration
- [ ] **PLAT-05**: Platform is mobile responsive
- [ ] **PLAT-06**: Visual identity is consistent with landing page (dark backgrounds, old gold #CFB53B, amber accents)
- [ ] **PLAT-07**: Typography is bold, modern, high-contrast against dark backgrounds

### Du Bois Chatbot

- [ ] **CHAT-01**: Du Bois Office Hours chatbot (V3 React artifact) is integrated into delivery platform
- [ ] **CHAT-02**: Chatbot maintains W.E.B. Du Bois persona and can discuss workshop protocols
- [ ] **CHAT-03**: Chatbot can discuss broader concepts from "The Souls of Black Folk"
- [ ] **CHAT-04**: Chatbot explicitly acknowledges its AI-generated nature as a teachable moment

### Resource Kit

- [ ] **RES-01**: Tool recommendation guide is generated from uploaded spreadsheet data
- [ ] **RES-02**: Tiered investment framework covers $0 to $100+/month range
- [ ] **RES-03**: Student discount access paths are documented (Google AI Pro, Perplexity Pro, Elicit free tiers)
- [ ] **RES-04**: Resource materials are accessible from the delivery platform

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Analytics & Tracking

- **ANLY-01**: Session tracking shows which modules each student completed
- **ANLY-02**: Engagement metrics capture pause points and replay behavior
- **ANLY-03**: Chatbot interaction logs for workshop improvement

### Expanded Audience

- **AUD-01**: Adaptation for non-HBCU audiences while maintaining cultural specificity
- **AUD-02**: Facilitator guide for instructors delivering the workshop independently
- **AUD-03**: Additional module content for graduate-level students

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication / accounts | Only 30-40 known students; auth adds complexity without value |
| LMS integration (Canvas, Blackboard) | Standalone web app delivery; students access directly |
| Real-time video streaming | Pre-recorded HeyGen videos; no live component |
| Mobile native app | Web-first, responsive design sufficient for cohort |
| AI Studio talking-head-only output | Explicitly prohibited — full visual production required |
| Generic corporate stock footage | Cultural requirements demand HBCU-specific media |
| "Sophistication gap" framing | Replaced everywhere with "distance" |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | 1 | Blocked |
| API-02 | 1 | Blocked |
| API-03 | 1 | Blocked |
| API-04 | 1 | Blocked |
| API-05 | 1 | Blocked |
| MOD1-01 | 2 | Pending |
| MOD1-02 | 2 | Pending |
| MOD1-03 | 2 | Pending |
| MOD1-04 | 2 | Pending |
| MOD1-05 | 2 | Pending |
| MOD1-06 | 2 | Pending |
| MOD1-07 | 2 | Pending |
| MOD2-01 | 3 | Pending |
| MOD2-02 | 3 | Pending |
| MOD2-03 | 3 | Pending |
| MOD2-04 | 3 | Pending |
| MOD2-05 | 3 | Pending |
| MOD2-06 | 3 | Pending |
| MOD3-01 | 4 | Pending |
| MOD3-02 | 4 | Pending |
| MOD3-03 | 4 | Pending |
| MOD3-04 | 4 | Pending |
| MOD3-05 | 4 | Pending |
| MOD3-06 | 4 | Pending |
| MOD4-01 | 5 | Pending |
| MOD4-02 | 5 | Pending |
| MOD4-03 | 5 | Pending |
| MOD4-04 | 5 | Pending |
| MOD4-05 | 5 | Pending |
| MOD4-06 | 5 | Pending |
| MOD4-07 | 5 | Pending |
| PLAT-01 | 6 | Complete |
| PLAT-02 | 6 | Complete |
| PLAT-03 | 6 | Complete |
| PLAT-04 | 6 | Complete |
| PLAT-05 | 6 | Complete |
| PLAT-06 | 6 | Complete |
| PLAT-07 | 6 | Complete |
| CHAT-01 | 6 | Complete |
| CHAT-02 | 6 | Complete |
| CHAT-03 | 6 | Complete |
| CHAT-04 | 6 | Complete |
| RES-01 | 7 | Complete |
| RES-02 | 7 | Complete |
| RES-03 | 7 | Complete |
| RES-04 | 7 | Complete |

**Coverage:**
- v1 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0

---
*Requirements defined: 2026-02-15*
*Last updated: 2026-02-15 after Phase 6 & 7 completion*
