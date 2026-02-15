#!/usr/bin/env bash
# Phase 1: Test Render — Submit 15-second test video via /v2/video/generate
# Run: bash scripts/test-render.sh
# Requires: HEYGEN_API_KEY, HEYGEN_AVATAR_ID, HEYGEN_VOICE_ID in .env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

if [ -z "${HEYGEN_API_KEY:-}" ]; then echo "ERROR: HEYGEN_API_KEY not set"; exit 1; fi
if [ -z "${HEYGEN_AVATAR_ID:-}" ]; then echo "ERROR: HEYGEN_AVATAR_ID not set. Run discover-ids.sh first."; exit 1; fi
if [ -z "${HEYGEN_VOICE_ID:-}" ]; then echo "ERROR: HEYGEN_VOICE_ID not set. Run discover-ids.sh first."; exit 1; fi

API_BASE="https://api.heygen.com"
AUTH_HEADER="X-Api-Key: $HEYGEN_API_KEY"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " PHASE 1: Test Render (15-second verbatim test)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Avatar ID: $HEYGEN_AVATAR_ID"
echo "Voice ID:  $HEYGEN_VOICE_ID"
echo ""

# --- Verbatim test via /v2/video/generate ---
echo "◆ Submitting test render via /v2/video/generate..."

TEST_SCRIPT="This is a 15-second test render for Raise the Crown. If you can hear my voice and see my face clearly, the API pipeline is working."

PAYLOAD=$(cat <<ENDJSON
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "$HEYGEN_AVATAR_ID",
        "avatar_style": "normal"
      },
      "voice": {
        "type": "text",
        "input_text": "$TEST_SCRIPT",
        "voice_id": "$HEYGEN_VOICE_ID"
      },
      "background": {
        "type": "color",
        "value": "#1a1a2e"
      }
    }
  ],
  "dimension": {
    "width": 1920,
    "height": 1080
  },
  "caption": true
}
ENDJSON
)

RESPONSE=$(curl -s -X POST "$API_BASE/v2/video/generate" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

VIDEO_ID=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('video_id',''))" 2>/dev/null || echo "")

if [ -z "$VIDEO_ID" ]; then
  echo ""
  echo "ERROR: No video_id returned. Check the response above."
  exit 1
fi

echo ""
echo "✓ Video submitted: $VIDEO_ID"
echo ""
echo "Saving video_id to .env..."
echo "HEYGEN_TEST_VIDEO_ID=$VIDEO_ID" >> "$PROJECT_DIR/.env"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " NEXT: Poll render status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Run: bash scripts/poll-status.sh $VIDEO_ID"
