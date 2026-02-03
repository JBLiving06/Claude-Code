#!/usr/bin/env python3
"""
HeyGen Avatar Workshop Production Pipeline
==========================================

This script is itself part of the workshop content. An AI (Claude) wrote this code
that calls the HeyGen API to render an AI avatar teaching about AI capabilities.
The medium IS the message.

Architecture:
    1. Load API credentials from environment
    2. Discover available avatars and voices (including your ElevenLabs clone)
    3. Parse workshop scripts (handling 5000 char limit per API call)
    4. Generate videos via HeyGen's video generation endpoint
    5. Poll for completion with exponential backoff
    6. Download final MP4 files

Usage:
    # List available avatars and voices (run first to get your IDs)
    python heygen_workshop.py --discover

    # Generate a single video from a script file
    python heygen_workshop.py --script scripts/module1.txt --output output/module1.mp4

    # Generate all workshop modules
    python heygen_workshop.py --all-modules

    # Test with a short message
    python heygen_workshop.py --test "Hello, this is a test."

Author: Claude (Anthropic) - Written programmatically as part of the workshop itself
Date: February 2026
"""

import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('heygen_workshop.log')
    ]
)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class HeyGenConfig:
    """Configuration for HeyGen API access."""
    api_key: str
    base_url: str = "https://api.heygen.com"
    avatar_id: Optional[str] = None  # Will be discovered or set manually
    voice_id: Optional[str] = None   # Your ElevenLabs clone ID

    # Video generation defaults
    dimension: Dict[str, int] = None
    test_mode: bool = False  # Set True to skip actual API calls during development

    # Rate limiting
    max_retries: int = 5
    retry_base_delay: float = 2.0  # Exponential backoff starts here

    # HeyGen limits
    max_script_chars: int = 5000  # Per API call limit

    def __post_init__(self):
        if self.dimension is None:
            self.dimension = {"width": 1920, "height": 1080}


def load_config() -> HeyGenConfig:
    """
    Load configuration from environment variables.

    Required environment variables:
        HEYGEN_API_KEY: Your HeyGen API key (from API Pro subscription)

    Optional environment variables:
        HEYGEN_AVATAR_ID: Pre-configured avatar ID (or use --discover)
        HEYGEN_VOICE_ID: Pre-configured voice ID (your ElevenLabs clone)
        HEYGEN_TEST_MODE: Set to 'true' to skip actual API calls
    """
    api_key = os.environ.get('HEYGEN_API_KEY')

    if not api_key:
        logger.error("HEYGEN_API_KEY environment variable not set!")
        logger.error("Set it with: export HEYGEN_API_KEY='your-api-key-here'")
        sys.exit(1)

    return HeyGenConfig(
        api_key=api_key,
        avatar_id=os.environ.get('HEYGEN_AVATAR_ID'),
        voice_id=os.environ.get('HEYGEN_VOICE_ID'),
        test_mode=os.environ.get('HEYGEN_TEST_MODE', '').lower() == 'true'
    )


# =============================================================================
# API CLIENT
# =============================================================================

class HeyGenClient:
    """
    HeyGen API Client for video generation.

    This client handles all communication with HeyGen's REST API, including:
    - Authentication via API key headers
    - Avatar and voice discovery
    - Video generation requests
    - Polling for completion
    - Downloading final videos

    The code itself demonstrates the programmatic nature of the workshop -
    an AI wrote this code to generate AI avatars teaching about AI.
    """

    def __init__(self, config: HeyGenConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'X-Api-Key': config.api_key,
            'Content-Type': 'application/json'
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make an API request with error handling and retry logic."""
        url = f"{self.config.base_url}{endpoint}"

        for attempt in range(self.config.max_retries):
            try:
                response = self.session.request(method, url, **kwargs)

                # Log the request for debugging/demonstration
                logger.debug(f"API {method} {endpoint} -> {response.status_code}")

                if response.status_code == 429:  # Rate limited
                    delay = self.config.retry_base_delay * (2 ** attempt)
                    logger.warning(f"Rate limited. Waiting {delay}s before retry...")
                    time.sleep(delay)
                    continue

                response.raise_for_status()
                return response.json()

            except requests.exceptions.RequestException as e:
                delay = self.config.retry_base_delay * (2 ** attempt)
                logger.warning(f"Request failed (attempt {attempt + 1}): {e}")

                if attempt < self.config.max_retries - 1:
                    logger.info(f"Retrying in {delay}s...")
                    time.sleep(delay)
                else:
                    logger.error(f"All {self.config.max_retries} attempts failed")
                    raise

        raise Exception("Unexpected: exited retry loop without return or raise")

    # -------------------------------------------------------------------------
    # Discovery Methods
    # -------------------------------------------------------------------------

    def list_avatars(self) -> List[Dict[str, Any]]:
        """
        List all available avatars, including custom ones created from photos.

        Returns:
            List of avatar dictionaries with 'avatar_id', 'avatar_name', etc.

        This is how we find your custom avatar created from your photo.
        The API returns both HeyGen's stock avatars and your custom uploads.
        """
        logger.info("Fetching available avatars...")
        response = self._request('GET', '/v2/avatars')

        avatars = response.get('data', {}).get('avatars', [])
        logger.info(f"Found {len(avatars)} avatars")
        return avatars

    def list_voices(self) -> List[Dict[str, Any]]:
        """
        List all available voices, including ElevenLabs integrations.

        Returns:
            List of voice dictionaries with 'voice_id', 'name', 'language', etc.

        Your cloned voice from ElevenLabs should appear here after integration.
        Look for voices with source type 'elevenlabs' or your custom name.
        """
        logger.info("Fetching available voices...")
        response = self._request('GET', '/v2/voices')

        voices = response.get('data', {}).get('voices', [])
        logger.info(f"Found {len(voices)} voices")
        return voices

    def get_remaining_credits(self) -> Dict[str, Any]:
        """
        Check remaining API credits.

        API Pro gives 100 credits/month. Each minute of video costs ~1 credit.
        The 30-40 minute workshop should use 30-40 credits.
        """
        logger.info("Checking remaining credits...")
        response = self._request('GET', '/v1/user/remaining_quota')
        return response.get('data', {})

    def discover_resources(self) -> Tuple[Optional[str], Optional[str]]:
        """
        Discover your avatar_id and voice_id.

        This method helps you find:
        1. Your custom avatar (created from your photo)
        2. Your ElevenLabs cloned voice

        Run this first, then set the IDs in your environment.
        """
        print("\n" + "="*60)
        print("RESOURCE DISCOVERY")
        print("="*60)

        # Credits
        try:
            credits = self.get_remaining_credits()
            print(f"\n--- API Credits ---")
            print(f"Remaining: {credits}")
        except Exception as e:
            logger.warning(f"Could not fetch credits: {e}")

        # Avatars
        print(f"\n--- Available Avatars ---")
        avatars = self.list_avatars()

        custom_avatar_id = None
        for avatar in avatars[:20]:  # Show first 20
            avatar_id = avatar.get('avatar_id', 'N/A')
            name = avatar.get('avatar_name', 'Unnamed')
            avatar_type = avatar.get('type', 'unknown')

            # Custom avatars from photos are marked differently
            marker = " <-- CUSTOM (likely yours)" if avatar_type == 'custom' else ""
            print(f"  ID: {avatar_id}")
            print(f"      Name: {name}, Type: {avatar_type}{marker}")

            if avatar_type == 'custom' and custom_avatar_id is None:
                custom_avatar_id = avatar_id

        if len(avatars) > 20:
            print(f"  ... and {len(avatars) - 20} more")

        # Voices
        print(f"\n--- Available Voices ---")
        voices = self.list_voices()

        elevenlabs_voice_id = None
        for voice in voices[:20]:
            voice_id = voice.get('voice_id', 'N/A')
            name = voice.get('name', 'Unnamed')
            source = voice.get('source', 'unknown')
            language = voice.get('language', 'en')

            # ElevenLabs voices are marked
            marker = " <-- ELEVENLABS (likely your clone)" if 'eleven' in source.lower() else ""
            print(f"  ID: {voice_id}")
            print(f"      Name: {name}, Source: {source}, Lang: {language}{marker}")

            if 'eleven' in source.lower() and elevenlabs_voice_id is None:
                elevenlabs_voice_id = voice_id

        if len(voices) > 20:
            print(f"  ... and {len(voices) - 20} more")

        # Recommendations
        print(f"\n--- Recommended Configuration ---")
        if custom_avatar_id:
            print(f"export HEYGEN_AVATAR_ID='{custom_avatar_id}'")
        else:
            print("# No custom avatar found. Create one in HeyGen web UI first.")

        if elevenlabs_voice_id:
            print(f"export HEYGEN_VOICE_ID='{elevenlabs_voice_id}'")
        else:
            print("# No ElevenLabs voice found. Check your integration.")

        print("="*60 + "\n")

        return custom_avatar_id, elevenlabs_voice_id

    # -------------------------------------------------------------------------
    # Video Generation Methods
    # -------------------------------------------------------------------------

    def create_video(
        self,
        script: str,
        avatar_id: Optional[str] = None,
        voice_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> str:
        """
        Create a video from a script.

        Args:
            script: The text for the avatar to speak (max 5000 chars)
            avatar_id: Override the configured avatar
            voice_id: Override the configured voice
            title: Optional title for the video

        Returns:
            video_id: The ID to poll for completion

        Note: HeyGen's API processes videos asynchronously. This method
        returns immediately with a video_id. Use poll_video_status()
        to wait for completion.
        """
        avatar_id = avatar_id or self.config.avatar_id
        voice_id = voice_id or self.config.voice_id

        if not avatar_id:
            raise ValueError("avatar_id required. Run --discover to find yours.")
        if not voice_id:
            raise ValueError("voice_id required. Run --discover to find yours.")

        if len(script) > self.config.max_script_chars:
            raise ValueError(
                f"Script too long ({len(script)} chars). "
                f"Max is {self.config.max_script_chars}. "
                f"Use split_script() for longer content."
            )

        logger.info(f"Creating video: {len(script)} chars, avatar={avatar_id[:8]}...")

        if self.config.test_mode:
            logger.info("TEST MODE: Skipping actual API call")
            return "test-video-id-12345"

        payload = {
            "video_inputs": [{
                "character": {
                    "type": "avatar",
                    "avatar_id": avatar_id,
                    "avatar_style": "normal"
                },
                "voice": {
                    "type": "text",
                    "input_text": script,
                    "voice_id": voice_id
                }
            }],
            "dimension": self.config.dimension,
            "title": title or f"Workshop_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        }

        response = self._request('POST', '/v2/video/generate', json=payload)

        video_id = response.get('data', {}).get('video_id')
        if not video_id:
            raise Exception(f"No video_id in response: {response}")

        logger.info(f"Video creation started: {video_id}")
        return video_id

    def get_video_status(self, video_id: str) -> Dict[str, Any]:
        """
        Get the current status of a video.

        Returns:
            Dict with 'status' (pending, processing, completed, failed)
            and 'video_url' when completed.
        """
        response = self._request('GET', f'/v1/video_status.get?video_id={video_id}')
        return response.get('data', {})

    def poll_video_status(
        self,
        video_id: str,
        timeout: int = 600,
        poll_interval: int = 10
    ) -> Dict[str, Any]:
        """
        Poll until video is ready or timeout.

        Args:
            video_id: The video ID from create_video()
            timeout: Maximum seconds to wait (default 10 minutes)
            poll_interval: Seconds between status checks

        Returns:
            Final status dict with 'video_url' on success

        Video generation typically takes 1-3 minutes per minute of content.
        A 5-minute script might take 5-15 minutes to render.
        """
        logger.info(f"Polling for video {video_id} (timeout: {timeout}s)")
        start_time = time.time()

        if self.config.test_mode:
            logger.info("TEST MODE: Returning mock completed status")
            return {'status': 'completed', 'video_url': 'https://example.com/test.mp4'}

        while time.time() - start_time < timeout:
            status = self.get_video_status(video_id)
            current_status = status.get('status', 'unknown')

            elapsed = int(time.time() - start_time)
            logger.info(f"  [{elapsed}s] Status: {current_status}")

            if current_status == 'completed':
                logger.info("Video completed successfully!")
                return status

            if current_status == 'failed':
                error = status.get('error', 'Unknown error')
                raise Exception(f"Video generation failed: {error}")

            time.sleep(poll_interval)

        raise TimeoutError(f"Video generation timed out after {timeout}s")

    def download_video(self, video_url: str, output_path: Path) -> Path:
        """
        Download a completed video.

        Args:
            video_url: URL from completed video status
            output_path: Where to save the MP4

        Returns:
            Path to the downloaded file
        """
        logger.info(f"Downloading video to {output_path}")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        if self.config.test_mode:
            logger.info("TEST MODE: Creating mock file")
            output_path.write_text("TEST MODE - no actual video")
            return output_path

        response = requests.get(video_url, stream=True)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size:
                    pct = (downloaded / total_size) * 100
                    print(f"\r  Downloading: {pct:.1f}%", end='', flush=True)

        print()  # Newline after progress
        logger.info(f"Downloaded: {output_path} ({downloaded:,} bytes)")
        return output_path


# =============================================================================
# SCRIPT PROCESSING
# =============================================================================

def split_script(script: str, max_chars: int = 5000) -> List[str]:
    """
    Split a long script into chunks under the API limit.

    The function tries to split at natural boundaries:
    1. Paragraph breaks (double newlines)
    2. Sentence endings (. ! ?)
    3. Commas
    4. Word boundaries

    Args:
        script: Full script text
        max_chars: Maximum characters per chunk (HeyGen limit is 5000)

    Returns:
        List of script chunks, each under max_chars
    """
    if len(script) <= max_chars:
        return [script]

    chunks = []
    remaining = script

    while remaining:
        if len(remaining) <= max_chars:
            chunks.append(remaining.strip())
            break

        # Find best split point
        chunk = remaining[:max_chars]

        # Try paragraph break
        split_idx = chunk.rfind('\n\n')

        # Try sentence ending
        if split_idx < max_chars // 2:
            for ending in ['. ', '! ', '? ']:
                idx = chunk.rfind(ending)
                if idx > split_idx:
                    split_idx = idx + 1

        # Try comma
        if split_idx < max_chars // 2:
            idx = chunk.rfind(', ')
            if idx > split_idx:
                split_idx = idx + 1

        # Try any space
        if split_idx < max_chars // 2:
            split_idx = chunk.rfind(' ')

        # Last resort: hard split
        if split_idx < 1:
            split_idx = max_chars

        chunks.append(remaining[:split_idx].strip())
        remaining = remaining[split_idx:].strip()

    logger.info(f"Split script into {len(chunks)} chunks")
    return chunks


def load_script(script_path: Path) -> str:
    """Load a script from a file."""
    if not script_path.exists():
        raise FileNotFoundError(f"Script not found: {script_path}")

    script = script_path.read_text()
    logger.info(f"Loaded script: {script_path} ({len(script)} chars)")
    return script


# =============================================================================
# WORKSHOP PIPELINE
# =============================================================================

class WorkshopPipeline:
    """
    Main pipeline for generating workshop videos.

    This orchestrates the entire process:
    1. Load and validate scripts
    2. Split long scripts into API-compliant chunks
    3. Generate videos for each chunk
    4. Download and optionally concatenate results

    Usage:
        pipeline = WorkshopPipeline()
        pipeline.generate_module('scripts/module1.txt', 'output/module1.mp4')
    """

    def __init__(self, config: Optional[HeyGenConfig] = None):
        self.config = config or load_config()
        self.client = HeyGenClient(self.config)

    def generate_from_text(
        self,
        script: str,
        output_path: Path,
        title: Optional[str] = None
    ) -> Path:
        """
        Generate a video from script text.

        If the script exceeds 5000 chars, it will be split into multiple
        videos with numbered suffixes.
        """
        chunks = split_script(script, self.config.max_script_chars)

        if len(chunks) == 1:
            # Single video
            video_id = self.client.create_video(chunks[0], title=title)
            status = self.client.poll_video_status(video_id)
            return self.client.download_video(status['video_url'], output_path)

        # Multiple videos for long script
        output_paths = []
        for i, chunk in enumerate(chunks, 1):
            chunk_title = f"{title}_part{i}" if title else f"Part_{i}"
            chunk_output = output_path.with_stem(f"{output_path.stem}_part{i}")

            logger.info(f"Generating part {i}/{len(chunks)}")
            video_id = self.client.create_video(chunk, title=chunk_title)
            status = self.client.poll_video_status(video_id)
            self.client.download_video(status['video_url'], chunk_output)
            output_paths.append(chunk_output)

        logger.info(f"Generated {len(output_paths)} video parts")
        return output_paths[0]  # Return first; user can concatenate

    def generate_module(self, script_path: Path, output_path: Path) -> Path:
        """Generate a video from a script file."""
        script = load_script(script_path)
        title = script_path.stem
        return self.generate_from_text(script, output_path, title)

    def generate_all_modules(self, scripts_dir: Path, output_dir: Path):
        """Generate all workshop modules."""
        script_files = sorted(scripts_dir.glob('module*.txt'))

        if not script_files:
            logger.error(f"No module scripts found in {scripts_dir}")
            return

        logger.info(f"Found {len(script_files)} modules to generate")

        for script_path in script_files:
            output_path = output_dir / f"{script_path.stem}.mp4"
            logger.info(f"\n{'='*40}")
            logger.info(f"Generating: {script_path.name}")
            logger.info(f"{'='*40}")

            try:
                self.generate_module(script_path, output_path)
            except Exception as e:
                logger.error(f"Failed to generate {script_path.name}: {e}")
                continue

        logger.info("\nAll modules processed!")


# =============================================================================
# CLI INTERFACE
# =============================================================================

def main():
    """
    Command-line interface for the workshop pipeline.

    This is the entry point when running: python heygen_workshop.py
    """
    parser = argparse.ArgumentParser(
        description='HeyGen Avatar Workshop Production Pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # First, discover your avatar and voice IDs
    python heygen_workshop.py --discover

    # Generate a single module
    python heygen_workshop.py --script scripts/module1.txt --output output/module1.mp4

    # Generate all modules
    python heygen_workshop.py --all-modules

    # Quick test
    python heygen_workshop.py --test "Hello, I am your AI workshop instructor."

Environment Variables:
    HEYGEN_API_KEY      Your HeyGen API key (required)
    HEYGEN_AVATAR_ID    Your avatar ID (from --discover)
    HEYGEN_VOICE_ID     Your ElevenLabs voice ID (from --discover)
    HEYGEN_TEST_MODE    Set to 'true' to skip actual API calls
        """
    )

    parser.add_argument(
        '--discover',
        action='store_true',
        help='List available avatars and voices to find your IDs'
    )

    parser.add_argument(
        '--script',
        type=Path,
        help='Path to script file'
    )

    parser.add_argument(
        '--output',
        type=Path,
        default=Path('output/video.mp4'),
        help='Output path for generated video'
    )

    parser.add_argument(
        '--all-modules',
        action='store_true',
        help='Generate all modules from scripts/ directory'
    )

    parser.add_argument(
        '--test',
        type=str,
        metavar='TEXT',
        help='Generate a short test video with the given text'
    )

    parser.add_argument(
        '--scripts-dir',
        type=Path,
        default=Path('scripts'),
        help='Directory containing module scripts'
    )

    parser.add_argument(
        '--output-dir',
        type=Path,
        default=Path('output'),
        help='Directory for output videos'
    )

    args = parser.parse_args()

    # Initialize pipeline
    try:
        pipeline = WorkshopPipeline()
    except SystemExit:
        return 1

    # Execute requested action
    if args.discover:
        pipeline.client.discover_resources()
        return 0

    if args.test:
        output_path = Path('output/test.mp4')
        print(f"\nGenerating test video...")
        print(f"Text: '{args.test}'")
        print(f"Output: {output_path}\n")
        pipeline.generate_from_text(args.test, output_path, title='Test')
        return 0

    if args.script:
        if not args.script.exists():
            logger.error(f"Script not found: {args.script}")
            return 1
        pipeline.generate_module(args.script, args.output)
        return 0

    if args.all_modules:
        pipeline.generate_all_modules(args.scripts_dir, args.output_dir)
        return 0

    # No action specified
    parser.print_help()
    return 0


if __name__ == '__main__':
    sys.exit(main())
