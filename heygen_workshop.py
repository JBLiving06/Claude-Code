#!/usr/bin/env python3
"""
HeyGen Workshop Discovery Tool

Discovers available avatars, voices, and account information from HeyGen API.
"""

import argparse
import json
import os
import sys
from typing import Optional

try:
    import requests
except ImportError:
    print("Error: 'requests' module not found. Install with: pip install requests")
    sys.exit(1)


HEYGEN_API_BASE = "https://api.heygen.com"


def get_api_key() -> str:
    """Get API key from environment variable."""
    api_key = os.environ.get("HEYGEN_API_KEY")
    if not api_key:
        print("Error: HEYGEN_API_KEY environment variable not set")
        sys.exit(1)
    return api_key


def make_request(endpoint: str, method: str = "GET", data: Optional[dict] = None) -> dict:
    """Make an authenticated request to the HeyGen API."""
    api_key = get_api_key()

    headers = {
        "X-Api-Key": api_key,
        "Content-Type": "application/json",
    }

    url = f"{HEYGEN_API_BASE}{endpoint}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")

        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        print(f"Response: {e.response.text if e.response else 'No response'}")
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}")
        sys.exit(1)


def discover_avatars() -> list:
    """List all available avatars."""
    print("\n" + "=" * 60)
    print("DISCOVERING AVATARS")
    print("=" * 60)

    # Try v2 API first
    try:
        result = make_request("/v2/avatars")
        avatars = result.get("data", {}).get("avatars", [])
    except:
        # Fallback to v1
        result = make_request("/v1/avatar.list")
        avatars = result.get("data", {}).get("avatars", [])

    if not avatars:
        print("No avatars found.")
        return []

    # Categorize avatars
    custom_avatars = [a for a in avatars if a.get("avatar_type") in ["custom", "photo", "instant"]]
    public_avatars = [a for a in avatars if a.get("avatar_type") == "public"]

    # Display custom avatars first (most relevant)
    if custom_avatars:
        print("\n--- YOUR CUSTOM AVATARS ---")
        for avatar in custom_avatars:
            print(f"\n  Avatar ID: {avatar.get('avatar_id')}")
            print(f"  Name: {avatar.get('avatar_name', 'Unnamed')}")
            print(f"  Type: {avatar.get('avatar_type', 'unknown')}")
            if avatar.get("preview_image_url"):
                print(f"  Preview: {avatar.get('preview_image_url')}")
            if avatar.get("gender"):
                print(f"  Gender: {avatar.get('gender')}")

    # Display a sample of public avatars
    if public_avatars:
        print(f"\n--- PUBLIC AVATARS (showing first 10 of {len(public_avatars)}) ---")
        for avatar in public_avatars[:10]:
            print(f"\n  Avatar ID: {avatar.get('avatar_id')}")
            print(f"  Name: {avatar.get('avatar_name', 'Unnamed')}")
            if avatar.get("gender"):
                print(f"  Gender: {avatar.get('gender')}")

    return avatars


def discover_voices() -> list:
    """List all available voices."""
    print("\n" + "=" * 60)
    print("DISCOVERING VOICES")
    print("=" * 60)

    # Try v2 API
    try:
        result = make_request("/v2/voices")
        voices = result.get("data", {}).get("voices", [])
    except:
        # Fallback to v1
        result = make_request("/v1/voice.list")
        voices = result.get("data", {}).get("voices", [])

    if not voices:
        print("No voices found.")
        return []

    # Categorize voices
    custom_voices = [v for v in voices if v.get("type") in ["custom", "cloned"]]
    elevenlabs_voices = [v for v in voices if v.get("type") == "elevenlabs"]
    standard_voices = [v for v in voices if v.get("type") not in ["custom", "cloned", "elevenlabs"]]

    # Display custom/cloned voices first
    if custom_voices:
        print("\n--- YOUR CUSTOM/CLONED VOICES ---")
        for voice in custom_voices:
            print(f"\n  Voice ID: {voice.get('voice_id')}")
            print(f"  Name: {voice.get('name', voice.get('display_name', 'Unnamed'))}")
            print(f"  Type: {voice.get('type', 'unknown')}")
            if voice.get("language"):
                print(f"  Language: {voice.get('language')}")
            if voice.get("gender"):
                print(f"  Gender: {voice.get('gender')}")

    # Display ElevenLabs voices
    if elevenlabs_voices:
        print(f"\n--- ELEVENLABS VOICES (showing first 5 of {len(elevenlabs_voices)}) ---")
        for voice in elevenlabs_voices[:5]:
            print(f"\n  Voice ID: {voice.get('voice_id')}")
            print(f"  Name: {voice.get('name', voice.get('display_name', 'Unnamed'))}")
            if voice.get("language"):
                print(f"  Language: {voice.get('language')}")

    # Display standard voices
    if standard_voices:
        print(f"\n--- STANDARD VOICES (showing first 10 of {len(standard_voices)}) ---")
        for voice in standard_voices[:10]:
            print(f"\n  Voice ID: {voice.get('voice_id')}")
            print(f"  Name: {voice.get('name', voice.get('display_name', 'Unnamed'))}")
            if voice.get("language"):
                print(f"  Language: {voice.get('language')}")
            if voice.get("gender"):
                print(f"  Gender: {voice.get('gender')}")

    return voices


def get_account_info() -> dict:
    """Get account information and quota."""
    print("\n" + "=" * 60)
    print("ACCOUNT INFORMATION")
    print("=" * 60)

    try:
        # Try to get remaining quota
        result = make_request("/v1/video.get_remaining_quota")
        quota = result.get("data", {})

        print(f"\n  Remaining Credits: {quota.get('remaining_quota', 'Unknown')}")
        if quota.get("plan_type"):
            print(f"  Plan Type: {quota.get('plan_type')}")
    except Exception as e:
        print(f"\n  Could not retrieve quota information: {e}")

    return {}


def discover_all():
    """Run full discovery."""
    print("\n" + "=" * 60)
    print("HEYGEN WORKSHOP DISCOVERY")
    print("=" * 60)

    get_account_info()
    avatars = discover_avatars()
    voices = discover_voices()

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    custom_avatars = [a for a in avatars if a.get("avatar_type") in ["custom", "photo", "instant"]]
    custom_voices = [v for v in voices if v.get("type") in ["custom", "cloned"]]

    print(f"\n  Total Avatars: {len(avatars)}")
    print(f"  Custom Avatars: {len(custom_avatars)}")
    print(f"  Total Voices: {len(voices)}")
    print(f"  Custom Voices: {len(custom_voices)}")

    if custom_avatars:
        print("\n  Recommended Avatar (your custom):")
        print(f"    ID: {custom_avatars[0].get('avatar_id')}")
        print(f"    Name: {custom_avatars[0].get('avatar_name', 'Unnamed')}")

    if custom_voices:
        print("\n  Recommended Voice (your custom):")
        print(f"    ID: {custom_voices[0].get('voice_id')}")
        print(f"    Name: {custom_voices[0].get('name', 'Unnamed')}")

    print("\n" + "=" * 60)


def export_json(output_file: str):
    """Export all discovery data to JSON."""
    data = {
        "avatars": [],
        "voices": [],
    }

    # Get avatars
    try:
        result = make_request("/v2/avatars")
        data["avatars"] = result.get("data", {}).get("avatars", [])
    except:
        try:
            result = make_request("/v1/avatar.list")
            data["avatars"] = result.get("data", {}).get("avatars", [])
        except:
            pass

    # Get voices
    try:
        result = make_request("/v2/voices")
        data["voices"] = result.get("data", {}).get("voices", [])
    except:
        try:
            result = make_request("/v1/voice.list")
            data["voices"] = result.get("data", {}).get("voices", [])
        except:
            pass

    with open(output_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Discovery data exported to: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description="HeyGen Workshop Discovery Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --discover           # Full discovery of avatars and voices
  %(prog)s --avatars            # List only avatars
  %(prog)s --voices             # List only voices
  %(prog)s --export data.json   # Export all data to JSON
        """
    )

    parser.add_argument("--discover", action="store_true", help="Run full discovery")
    parser.add_argument("--avatars", action="store_true", help="List avatars only")
    parser.add_argument("--voices", action="store_true", help="List voices only")
    parser.add_argument("--account", action="store_true", help="Show account info")
    parser.add_argument("--export", metavar="FILE", help="Export discovery data to JSON file")

    args = parser.parse_args()

    # Default to discover if no args
    if not any([args.discover, args.avatars, args.voices, args.account, args.export]):
        args.discover = True

    if args.export:
        export_json(args.export)
    elif args.discover:
        discover_all()
    else:
        if args.account:
            get_account_info()
        if args.avatars:
            discover_avatars()
        if args.voices:
            discover_voices()


if __name__ == "__main__":
    main()
