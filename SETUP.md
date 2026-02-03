# HeyGen Workshop Production Pipeline - Setup Guide

This document explains how to set up and use the `heygen_workshop.py` script to programmatically generate avatar videos for the AI Literacy Workshop.

## Prerequisites

1. **HeyGen Account**: You need HeyGen with API Pro subscription ($99/month for 100 credits)
2. **Avatar Created**: Create your avatar in the HeyGen web UI first (from photo upload)
3. **Voice Cloned**: Clone your voice via ElevenLabs and integrate it with HeyGen
4. **Python 3.8+**: The script requires Python 3.8 or higher

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

Or install directly:

```bash
pip install requests python-dotenv
```

### 2. Set Up Your API Key

There are two ways to configure your API key:

**Option A: Environment Variable (Recommended)**

```bash
export HEYGEN_API_KEY='your-api-key-here'
```

Add this to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.) for persistence.

**Option B: Create a .env File**

```bash
cp .env.example .env
```

Edit `.env` and add your key:
```
HEYGEN_API_KEY=your-api-key-here
```

### 3. Discover Your Avatar and Voice IDs

Before generating videos, you need to find your avatar_id and voice_id:

```bash
python heygen_workshop.py --discover
```

This will output something like:

```
============================================================
RESOURCE DISCOVERY
============================================================

--- API Credits ---
Remaining: {'credits': 100}

--- Available Avatars ---
  ID: abc123def456
      Name: Jeff Avatar, Type: custom <-- CUSTOM (likely yours)
  ID: xyz789...
      Name: Angela, Type: public
  ...

--- Available Voices ---
  ID: voice_abc123
      Name: Jeff Clone, Source: elevenlabs <-- ELEVENLABS (likely your clone)
  ID: voice_xyz789
      Name: Matthew, Source: heygen
  ...

--- Recommended Configuration ---
export HEYGEN_AVATAR_ID='abc123def456'
export HEYGEN_VOICE_ID='voice_abc123'
============================================================
```

### 4. Set Your Avatar and Voice IDs

```bash
export HEYGEN_AVATAR_ID='your-avatar-id-from-discover'
export HEYGEN_VOICE_ID='your-voice-id-from-discover'
```

## Usage

### Test the Pipeline

Generate a short test video to verify everything works:

```bash
python heygen_workshop.py --test "Hello, this is a test of the avatar video generation pipeline."
```

This creates `output/test.mp4` with a few seconds of video.

### Generate a Single Module

```bash
python heygen_workshop.py --script scripts/module1.txt --output output/module1.mp4
```

### Generate All Modules

```bash
python heygen_workshop.py --all-modules
```

This processes all `module*.txt` files in the `scripts/` directory.

### Command Reference

| Command | Description |
|---------|-------------|
| `--discover` | List available avatars and voices |
| `--test "text"` | Generate a short test video |
| `--script PATH` | Generate video from a script file |
| `--output PATH` | Output path for generated video |
| `--all-modules` | Generate all modules from scripts/ |
| `--scripts-dir PATH` | Custom scripts directory (default: scripts/) |
| `--output-dir PATH` | Custom output directory (default: output/) |

## Script Format

Scripts are plain text files. The pipeline handles scripts longer than 5000 characters by automatically splitting them at natural boundaries (paragraphs, sentences, words).

Example `scripts/module1.txt`:
```
Take a good look at me. I'm an AI. Not a person reading a script...

[Rest of script]
```

## Cost Estimation

- API Pro: 100 credits/month
- Approximately 1 credit per minute of video
- The full 4-module workshop (~35-40 minutes) uses ~35-40 credits

## Troubleshooting

### "HEYGEN_API_KEY environment variable not set"

Make sure you've exported your API key:
```bash
export HEYGEN_API_KEY='your-key-here'
```

### "avatar_id required" or "voice_id required"

Run `--discover` first and set the environment variables:
```bash
python heygen_workshop.py --discover
export HEYGEN_AVATAR_ID='...'
export HEYGEN_VOICE_ID='...'
```

### "Script too long"

The script will automatically split long scripts. If you're getting this error, the splitting logic may not be finding good break points. Try adding paragraph breaks (double newlines) in your script.

### Video generation fails or times out

- Check your API credit balance with `--discover`
- HeyGen video generation can take 1-3 minutes per minute of content
- The default timeout is 10 minutes; long scripts may need more time

## Test Mode

For development without consuming API credits:

```bash
export HEYGEN_TEST_MODE=true
python heygen_workshop.py --test "Test message"
```

This simulates the pipeline without making actual API calls.

## Files Overview

```
.
├── heygen_workshop.py     # Main production pipeline
├── requirements.txt       # Python dependencies
├── scripts/               # Workshop scripts (input)
│   ├── module1.txt        # Module 1: The Setup
│   ├── module2.txt        # Module 2: The Protocols
│   ├── module3.txt        # Module 3: Products in Practice
│   └── module4.txt        # Module 4: The Horizon
├── output/                # Generated videos (output)
│   └── *.mp4
└── heygen_workshop.log    # Pipeline execution log
```

## The Meta-Narrative

This pipeline is itself part of the workshop content. As Module 1 states:

> "The video you're watching right now wasn't created by a human clicking buttons in a web interface. It was generated programmatically. An AI—Claude, an Anthropic model—wrote Python code. That code called the HeyGen API. The API rendered me."

The fact that Claude wrote this code, which calls the HeyGen API, which renders an avatar teaching about AI capabilities—that's the demonstration. The medium is the message.
