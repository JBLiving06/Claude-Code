#!/usr/bin/env bash
# Module 3 Demo Pipeline — Build Script
#
# Records three screen demo videos (Claude + NotebookLM interfaces)
# for Module 3 of the Raise the Crown AI literacy workshop.
#
# Prerequisites:
#   - Node.js >= 18
#   - Playwright with Chromium installed (npx playwright install chromium)
#
# Usage:
#   ./build.sh              # Record all three demos
#   ./build.sh --demo 1     # Record only demo 1
#   ./build.sh --demo 2     # Record only demo 2
#   ./build.sh --demo 3     # Record only demo 3

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/output"

echo "============================================================"
echo "  Module 3 Demo Pipeline"
echo "  Raise the Crown — AI Literacy Workshop"
echo "============================================================"
echo ""
echo "  This script records three screen demo videos:"
echo "    1. Rubric Engineering (Claude interface)    ~3-4 min"
echo "    2. Research Synthesis (NotebookLM interface) ~3-4 min"
echo "    3. Exam Prep System  (NotebookLM interface) ~3-4 min"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required but not found."
  exit 1
fi
echo "  Node.js: $(node --version)"

# Check Playwright browsers
PLAYWRIGHT_CACHE="${PLAYWRIGHT_BROWSERS_PATH:-${HOME}/.cache/ms-playwright}"
if [ ! -d "${PLAYWRIGHT_CACHE}" ] || [ -z "$(ls -d ${PLAYWRIGHT_CACHE}/chromium-* 2>/dev/null)" ]; then
  echo "  Installing Playwright Chromium browser..."
  npx playwright install chromium
fi
echo "  Playwright: OK"

# Check ffmpeg
FFMPEG=""
FFMPEG_DIR=$(ls -d ${PLAYWRIGHT_CACHE}/ffmpeg-* 2>/dev/null | head -1)
if [ -n "$FFMPEG_DIR" ] && [ -f "${FFMPEG_DIR}/ffmpeg-linux" ]; then
  FFMPEG="${FFMPEG_DIR}/ffmpeg-linux"
elif command -v ffmpeg &>/dev/null; then
  FFMPEG="ffmpeg"
fi
if [ -n "$FFMPEG" ]; then
  echo "  FFmpeg: ${FFMPEG}"
else
  echo "  FFmpeg: not found (videos will be .webm only)"
fi

echo ""
echo "  Output: ${OUTPUT_DIR}"
echo ""

mkdir -p "${OUTPUT_DIR}"

# Run the recorder
node "${SCRIPT_DIR}/record.mjs" --output-dir "${OUTPUT_DIR}" "$@"

echo ""
echo "============================================================"
echo "  Done! Videos are in: ${OUTPUT_DIR}"
echo "============================================================"
echo ""
ls -lh "${OUTPUT_DIR}"/*.mp4 2>/dev/null || ls -lh "${OUTPUT_DIR}"/*.webm 2>/dev/null || echo "  (no video files found)"
