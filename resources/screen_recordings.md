# Screen Recording Shot List

This document lists all screen recordings needed for the workshop. These supplement the avatar videos by showing actual tool interfaces.

---

## Overview

| Category | Count | Total Duration |
|----------|-------|----------------|
| ChatGPT Protocol Demos | 4 | ~8-10 min |
| Tool Showcases | 3 | ~5-6 min |
| Pipeline Demo | 1 | ~2-3 min |
| **Total** | **8** | **~15-19 min** |

---

## Recording Specifications

- **Resolution:** 1920x1080 (match avatar video)
- **Browser:** Clean Chrome/Firefox profile (no personal bookmarks, extensions)
- **ChatGPT:** Use free tier interface (shows authenticity)
- **Audio:** No voiceover (avatar narration will reference these)
- **Speed:** Normal typing speed, can be sped up 1.5x in editing

---

## ChatGPT Protocol Demonstrations

### 1. Rubric Engineering Demo
**Duration:** 2-3 minutes
**Purpose:** Show the exact workflow from Module 2

**What to record:**
1. Open ChatGPT (free tier interface)
2. Paste a sample assignment description and rubric
   - Use a generic assignment: "2,500-word research paper on a topic of your choice related to social inequality"
   - Include a standard 4-criteria rubric
3. Type the prompt: "Analyze this rubric. What does this professor prioritize? What distinguishes an A paper from a B paper?"
4. Show ChatGPT's response (wait for full generation)
5. Type follow-up: "What are the three biggest mistakes a student might make on this assignment?"
6. Show response
7. Type: "Give me a pre-submission checklist based on this analysis"
8. Show response

**Key moments to capture:**
- The paste action (show full rubric)
- ChatGPT generating analysis
- The iterative prompting (multiple exchanges)

---

### 2. Research Synthesis Demo
**Duration:** 3-4 minutes
**Purpose:** Show research mapping + source synthesis

**What to record:**
1. Open ChatGPT
2. Type: "I'm researching income inequality and educational outcomes for a college sociology class. Give me a research framework: major perspectives, key debates, and search terms for Google Scholar."
3. Show response
4. Cut to Google Scholar (or show transition)
5. Search one of the suggested terms, show results
6. Back to ChatGPT
7. Paste 2-3 abstracts (you can prepare these in advance)
8. Type: "Based on these sources, what do they agree on? Where do they disagree? What thesis angle would engage with this conversation?"
9. Show response

**Key moments to capture:**
- The research map generation
- Actually searching in Google Scholar
- The synthesis of real sources

---

### 3. Pre-Class Prep Demo
**Duration:** 1-2 minutes
**Purpose:** Show quick preparation workflow

**What to record:**
1. Open ChatGPT
2. Paste a paragraph from a reading (use something in public domain or create a sample)
3. Type: "Summarize the main argument. What evidence does the author use? What assumptions are they making?"
4. Show response
5. Type: "What are three thoughtful questions I could ask in class that would demonstrate engagement with this reading?"
6. Show response

**Key moments to capture:**
- The paste of source material
- Getting class discussion questions

---

### 4. Exam Prep Demo
**Duration:** 2-3 minutes
**Purpose:** Show practice question generation and self-testing

**What to record:**
1. Open ChatGPT
2. Paste sample course content (syllabus excerpt or concept list)
3. Type: "Generate 10 practice questions for an exam on this material. Include factual, application, and analysis questions. Don't give answers yet."
4. Show questions generating
5. Type out a sample answer to one question (brief, can show mistakes)
6. Type: "Here's my answer to question 3: [paste answer]. Is this correct? What am I missing?"
7. Show feedback

**Key moments to capture:**
- Practice questions appearing
- The self-testing loop (answer → feedback)

---

## Tool Showcase Recordings

### 5. NotebookLM Overview
**Duration:** 2-3 minutes
**Purpose:** Show why NotebookLM is valuable for research

**What to record:**
1. Open NotebookLM (notebooklm.google.com)
2. Create a new notebook
3. Upload 2-3 sample PDFs (academic papers or documents)
4. Show the source panel populating
5. Ask a question in the chat: "What are the main arguments across these sources?"
6. Show response with citations
7. Click an "Audio Overview" if available
8. Show the FAQ feature

**Key moments to capture:**
- Document upload
- Grounded responses (citations visible)
- The Audio Overview feature (differentiator)

---

### 6. Perplexity Demo
**Duration:** 1-2 minutes
**Purpose:** Show AI search with sources

**What to record:**
1. Open Perplexity (perplexity.ai)
2. Search: "What is the current federal minimum wage and when was it last raised?"
3. Show response with source links
4. Click on a source to show it's real
5. Ask follow-up: "How does this compare to state minimum wages?"

**Key moments to capture:**
- Source citations appearing
- The real-time search integration
- Clicking through to verify sources

---

### 7. Google Scholar Basics
**Duration:** 1-2 minutes
**Purpose:** Show academic source finding for students unfamiliar

**What to record:**
1. Open Google Scholar (scholar.google.com)
2. Search a topic: "socioeconomic status academic achievement"
3. Show results, point out citation counts
4. Click "Cited by" on a result
5. Show how to filter by date
6. Click a result, show the abstract

**Key moments to capture:**
- The Scholar interface
- Citation tracking
- Finding full text (via university access or "PDF" links)

---

## Meta/Pipeline Recording

### 8. HeyGen Pipeline Demo (Optional)
**Duration:** 2-3 minutes
**Purpose:** Show that the avatar was generated programmatically (referenced in Module 1)

**What to record:**
1. Open terminal
2. Show the heygen_workshop.py file briefly (code visible)
3. Run: `python heygen_workshop.py --discover` (show avatar/voice IDs)
4. Run: `python heygen_workshop.py --test "Hello, this is a demonstration of the programmatic video generation pipeline."`
5. Show polling for completion
6. Show the output video playing

**Key moments to capture:**
- The code that calls the API
- The API responding
- The resulting video (proof it works)

**Note:** This recording is optional but powerful for the "medium is the message" narrative. Can be used as supplementary content or integrated into Module 1.

---

## Recording Checklist

Use this checklist when recording:

**Before Recording:**
- [ ] Clean browser profile (no personal bookmarks, extensions, autofill)
- [ ] Log out of personal accounts
- [ ] Close unnecessary tabs
- [ ] Disable notifications
- [ ] Prepare all sample text in a separate document for easy copy/paste
- [ ] Test that all tools are working

**During Recording:**
- [ ] Move cursor deliberately (audiences need to follow)
- [ ] Pause briefly after important actions
- [ ] Allow full AI responses to generate
- [ ] Don't rush—can speed up in editing

**After Recording:**
- [ ] Verify all text is readable at 1080p
- [ ] Check that no personal info was captured
- [ ] Trim dead time at start/end
- [ ] Label files clearly (e.g., `01_rubric_engineering_demo.mp4`)

---

## File Naming Convention

```
[number]_[protocol/tool]_[type].mp4

Examples:
01_rubric_engineering_demo.mp4
02_research_synthesis_demo.mp4
03_preclass_prep_demo.mp4
04_exam_prep_demo.mp4
05_notebooklm_showcase.mp4
06_perplexity_showcase.mp4
07_google_scholar_basics.mp4
08_heygen_pipeline_demo.mp4
```

---

## Integration Notes

**Module 1:** Can reference Screen Recording #8 (pipeline demo) when discussing programmatic creation

**Module 2:** Insert protocol demos (#1-4) after each protocol explanation in the avatar video, OR provide as supplementary "see it in action" links

**Module 3:** Can use the same protocol demos or record scenario-specific versions if time permits

**Tool Ecosystem:** NotebookLM and Perplexity showcases (#5-6) can be embedded in the tool ecosystem document

---

## Equipment Notes

These recordings don't require fancy equipment:

- **Screen capture:** OBS (free), Loom, or QuickTime (Mac)
- **Resolution:** Native 1080p display or scale appropriately
- **Audio:** None needed (avatar provides narration)
- **Editing:** Minimal—just trim and speed up if needed

Total recording time (including mistakes/retakes): Estimate 1-2 hours
Total finished content: ~15-19 minutes
