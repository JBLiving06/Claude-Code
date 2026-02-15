#!/usr/bin/env bash
# Phase 1: Poll Render Status — Check video render and download when complete
# Run: bash scripts/poll-status.sh <video_id>
# Or: bash scripts/poll-status.sh (uses HEYGEN_TEST_VIDEO_ID from .env)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

VIDEO_ID="${1:-${HEYGEN_TEST_VIDEO_ID:-}}"

if [ -z "${HEYGEN_API_KEY:-}" ]; then echo "ERROR: HEYGEN_API_KEY not set"; exit 1; fi
if [ -z "$VIDEO_ID" ]; then echo "ERROR: No video_id. Pass as argument or set HEYGEN_TEST_VIDEO_ID in .env"; exit 1; fi

API_BASE="https://api.heygen.com"
AUTH_HEADER="X-Api-Key: $HEYGEN_API_KEY"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Polling render status for: $VIDEO_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

MAX_POLLS=60
POLL_INTERVAL=10

for i in $(seq 1 $MAX_POLLS); do
  RESPONSE=$(curl -s -X GET "$API_BASE/v1/video_status.get?video_id=$VIDEO_ID" \
    -H "$AUTH_HEADER" \
    -H "Accept: application/json")

  STATUS=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('status','unknown'))" 2>/dev/null || echo "unknown")

  echo "[$i/$MAX_POLLS] Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    VIDEO_URL=$(echo "$RESPONSE" | python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('video_url',''))" 2>/dev/null || echo "")

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " ✓ RENDER COMPLETE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Video URL: $VIDEO_URL"
    echo ""

    if [ -n "$VIDEO_URL" ]; then
      mkdir -p "$PROJECT_DIR/output"
      OUTPUT_FILE="$PROJECT_DIR/output/test-render.mp4"
      echo "◆ Downloading to $OUTPUT_FILE..."
      curl -s -L "$VIDEO_URL" -o "$OUTPUT_FILE"
      echo "✓ Downloaded: $OUTPUT_FILE"
      echo ""
      echo "Full response:"
      echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    fi
    exit 0
  fi

  if [ "$STATUS" = "failed" ]; then
    echo ""
    echo "ERROR: Render failed."
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
  fi

  sleep $POLL_INTERVAL
done

echo ""
echo "TIMEOUT: Render did not complete after $((MAX_POLLS * POLL_INTERVAL)) seconds."
echo "Last response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
exit 1
