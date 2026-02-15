#!/usr/bin/env bash
# Video Agent API render — for scene-by-scene production with visual production
# Run: bash scripts/video-agent-render.sh <prompt_file>
# Or pipe prompt: echo "Create a video..." | bash scripts/video-agent-render.sh
#
# This uses /v1/video_agent/generate which provides full visual production
# (B-roll, transitions, motion graphics) but WARNING: may rewrite scripts.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

if [ -z "${HEYGEN_API_KEY:-}" ]; then echo "ERROR: HEYGEN_API_KEY not set"; exit 1; fi

API_BASE="https://api.heygen.com"
AUTH_HEADER="X-Api-Key: $HEYGEN_API_KEY"

# Read prompt from file argument or stdin
if [ -n "${1:-}" ] && [ -f "$1" ]; then
  PROMPT=$(cat "$1")
  echo "◆ Reading prompt from: $1"
elif [ ! -t 0 ]; then
  PROMPT=$(cat)
  echo "◆ Reading prompt from stdin"
else
  echo "Usage: bash scripts/video-agent-render.sh <prompt_file>"
  echo "   Or: echo 'prompt text' | bash scripts/video-agent-render.sh"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Video Agent Render"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Prompt length: ${#PROMPT} chars"
echo ""

# Escape prompt for JSON
ESCAPED_PROMPT=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$PROMPT")

PAYLOAD=$(cat <<ENDJSON
{
  "video_inputs": $ESCAPED_PROMPT
}
ENDJSON
)

# Actually the Video Agent API uses a different format
PAYLOAD=$(cat <<ENDJSON
{
  "prompt": $ESCAPED_PROMPT
}
ENDJSON
)

echo "◆ Submitting to Video Agent API..."

RESPONSE=$(curl -s -X POST "$API_BASE/v1/video_agent/generate" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

VIDEO_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('data',{}).get('video_id', d.get('video_id','')))" 2>/dev/null || echo "")

if [ -n "$VIDEO_ID" ]; then
  echo ""
  echo "✓ Video submitted: $VIDEO_ID"
  echo ""
  echo "Poll status: bash scripts/poll-status.sh $VIDEO_ID"
else
  echo ""
  echo "WARNING: No video_id found in response. Check output above."
fi
