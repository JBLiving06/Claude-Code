#!/usr/bin/env bash
# Phase 1: API Discovery — Discover Jeff's avatar_id and voice_id
# Run locally: bash scripts/discover-ids.sh
# Requires: HEYGEN_API_KEY in .env or exported

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load API key from .env
if [ -f "$PROJECT_DIR/.env" ]; then
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

if [ -z "${HEYGEN_API_KEY:-}" ]; then
  echo "ERROR: HEYGEN_API_KEY not set. Add it to .env or export it."
  exit 1
fi

API_BASE="https://api.heygen.com"
AUTH_HEADER="X-Api-Key: $HEYGEN_API_KEY"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " PHASE 1: API Discovery"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# --- Step 1: Discover Avatars ---
echo ""
echo "◆ Fetching avatars..."
AVATARS_RESPONSE=$(curl -s -X GET "$API_BASE/v2/avatars" \
  -H "$AUTH_HEADER" \
  -H "Accept: application/json")

echo "$AVATARS_RESPONSE" | python3 -m json.tool > "$PROJECT_DIR/scripts/avatars-response.json" 2>/dev/null || \
  echo "$AVATARS_RESPONSE" > "$PROJECT_DIR/scripts/avatars-response.json"

echo "✓ Avatars saved to scripts/avatars-response.json"

# Extract custom/personal avatars (look for non-public ones)
echo ""
echo "--- Custom Avatars Found ---"
echo "$AVATARS_RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
avatars = data.get('data', {}).get('avatars', [])
for a in avatars:
    # Show all avatars — look for Jeff's custom one
    print(f\"  ID: {a.get('avatar_id', 'N/A')}\")
    print(f\"  Name: {a.get('avatar_name', 'N/A')}\")
    print(f\"  Type: {a.get('type', 'N/A')}\")
    print(f\"  Gender: {a.get('gender', 'N/A')}\")
    print()
if not avatars:
    print('  No avatars found. Check API key permissions.')
" 2>/dev/null || echo "  (Could not parse response — check avatars-response.json)"

# --- Step 2: Discover Voices ---
echo ""
echo "◆ Fetching voices..."
VOICES_RESPONSE=$(curl -s -X GET "$API_BASE/v2/voices" \
  -H "$AUTH_HEADER" \
  -H "Accept: application/json")

echo "$VOICES_RESPONSE" | python3 -m json.tool > "$PROJECT_DIR/scripts/voices-response.json" 2>/dev/null || \
  echo "$VOICES_RESPONSE" > "$PROJECT_DIR/scripts/voices-response.json"

echo "✓ Voices saved to scripts/voices-response.json"

# Extract ElevenLabs voices (Jeff's clone)
echo ""
echo "--- ElevenLabs Voice Clones Found ---"
echo "$VOICES_RESPONSE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
voices = data.get('data', {}).get('voices', [])
eleven_voices = [v for v in voices if 'elevenlabs' in str(v).lower() or 'eleven' in str(v).lower() or v.get('type') == 'custom']
for v in (eleven_voices if eleven_voices else voices):
    print(f\"  ID: {v.get('voice_id', 'N/A')}\")
    print(f\"  Name: {v.get('name', v.get('display_name', 'N/A'))}\")
    print(f\"  Engine: {v.get('voice_engine', v.get('engine', 'N/A'))}\")
    print(f\"  Type: {v.get('type', 'N/A')}\")
    print()
if not voices:
    print('  No voices found. Check API key permissions.')
" 2>/dev/null || echo "  (Could not parse response — check voices-response.json)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " NEXT STEPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Find Jeff's avatar_id from the list above"
echo "2. Find Jeff's ElevenLabs voice_id from the list above"
echo "3. Add them to .env:"
echo "   HEYGEN_AVATAR_ID=<avatar_id>"
echo "   HEYGEN_VOICE_ID=<voice_id>"
echo "4. Run: bash scripts/test-render.sh"
