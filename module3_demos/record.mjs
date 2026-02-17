#!/usr/bin/env node
/**
 * Module 3 Demo Pipeline — Video Recorder
 *
 * Records three HTML demo pages as 1920×1080 .mp4 videos using Playwright.
 * Each demo auto-plays its content animation; this script opens the page,
 * waits for the 'demo-complete' event, then stops recording.
 *
 * Usage:
 *   node record.mjs                    # Record all three demos
 *   node record.mjs --demo 1           # Record only demo 1
 *   node record.mjs --output-dir /path # Custom output directory
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find ffmpeg — prefer system ffmpeg (has libx264) over Playwright's (VP8-only)
function findFfmpeg() {
  // System ffmpeg first (supports libx264 for MP4 output)
  try {
    const systemFfmpeg = execSync('which ffmpeg', { stdio: 'pipe' }).toString().trim();
    if (systemFfmpeg) return systemFfmpeg;
  } catch { /* not found */ }

  // Fallback: Playwright's bundled ffmpeg (VP8/WebM only)
  const playwrightCache = process.env.PLAYWRIGHT_BROWSERS_PATH
    || path.join(process.env.HOME || '/root', '.cache', 'ms-playwright');
  try {
    const ffmpegDir = fs.readdirSync(playwrightCache).find(d => d.startsWith('ffmpeg-'));
    if (ffmpegDir) {
      const candidate = path.join(playwrightCache, ffmpegDir, 'ffmpeg-linux');
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch { /* cache dir doesn't exist */ }

  return null;
}

const FFMPEG = findFfmpeg();

const demos = [
  {
    id: 1,
    html: path.join(__dirname, 'html', 'demo1_claude.html'),
    outputName: 'M3_Demo1_Rubric_Claude',
    maxDuration: 240_000,  // 4 min safety cap
  },
  {
    id: 2,
    html: path.join(__dirname, 'html', 'demo2_notebooklm.html'),
    outputName: 'M3_Demo2_Research_NotebookLM',
    maxDuration: 270_000,  // 4.5 min safety cap
  },
  {
    id: 3,
    html: path.join(__dirname, 'html', 'demo3_notebooklm.html'),
    outputName: 'M3_Demo3_Exam_NotebookLM',
    maxDuration: 270_000,
  },
];

// Parse CLI args
const args = process.argv.slice(2);
let selectedDemo = null;
let outputDir = path.join(__dirname, 'output');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--demo' && args[i + 1]) {
    selectedDemo = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--output-dir' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  }
}

fs.mkdirSync(outputDir, { recursive: true });

async function recordDemo(demo) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Recording Demo ${demo.id}: ${demo.outputName}`);
  console.log(`${'='.repeat(60)}`);

  const webmPath = path.join(outputDir, `${demo.outputName}.webm`);
  const mp4Path = path.join(outputDir, `${demo.outputName}.mp4`);

  // Launch browser with video recording
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  // Navigate to the demo HTML
  const fileUrl = `file://${demo.html}`;
  console.log(`  Loading: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'load' });

  // Wait for demo to complete or timeout
  console.log(`  Waiting for demo to finish (max ${demo.maxDuration / 1000}s)...`);
  try {
    await page.evaluate((maxDuration) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve('timeout'), maxDuration);
        document.addEventListener('demo-complete', () => {
          clearTimeout(timeout);
          resolve('complete');
        });
      });
    }, demo.maxDuration);
    console.log('  Demo animation completed.');
  } catch (e) {
    console.log('  Demo timed out, stopping recording.');
  }

  // Extra 2s buffer at the end
  await page.waitForTimeout(2000);

  // Close and get video
  await page.close();
  const video = page.video();
  const recordedPath = await video.path();

  await context.close();
  await browser.close();

  // Rename webm to expected location
  if (recordedPath !== webmPath) {
    fs.renameSync(recordedPath, webmPath);
  }
  console.log(`  WebM saved: ${webmPath}`);

  // Convert to MP4 with ffmpeg
  if (FFMPEG) {
    console.log(`  Converting to MP4...`);
    try {
      execSync(
        `"${FFMPEG}" -y -i "${webmPath}" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -movflags +faststart -an "${mp4Path}" 2>&1`,
        { stdio: 'pipe', timeout: 120_000 }
      );
      console.log(`  MP4 saved: ${mp4Path}`);

      // Report file sizes
      const webmSize = (fs.statSync(webmPath).size / 1024 / 1024).toFixed(1);
      const mp4Size = (fs.statSync(mp4Path).size / 1024 / 1024).toFixed(1);
      console.log(`  Sizes: WebM=${webmSize}MB, MP4=${mp4Size}MB`);
    } catch (e) {
      console.error(`  FFmpeg conversion failed: ${e.message}`);
      console.log(`  WebM file is still available at: ${webmPath}`);
    }
  } else {
    console.log('  ffmpeg not found — skipping MP4 conversion.');
    console.log(`  WebM file available at: ${webmPath}`);
  }

  return mp4Path || webmPath;
}

async function main() {
  console.log('Module 3 Demo Pipeline — Video Recorder');
  console.log(`Output directory: ${outputDir}`);
  if (FFMPEG) {
    console.log(`FFmpeg: ${FFMPEG}`);
  } else {
    console.log('FFmpeg: not found (will output .webm only)');
  }

  const toRecord = selectedDemo
    ? demos.filter(d => d.id === selectedDemo)
    : demos;

  if (toRecord.length === 0) {
    console.error(`Demo ${selectedDemo} not found. Available: 1, 2, 3`);
    process.exit(1);
  }

  const results = [];
  for (const demo of toRecord) {
    const result = await recordDemo(demo);
    results.push(result);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('COMPLETE');
  console.log(`${'='.repeat(60)}`);
  results.forEach(r => console.log(`  ${r}`));

  // If user specified Desktop output, also copy there
  const desktopDir = path.join(process.env.HOME || '/root', 'Desktop', 'module3_demos');
  if (outputDir !== desktopDir) {
    try {
      fs.mkdirSync(desktopDir, { recursive: true });
      for (const r of results) {
        const basename = path.basename(r);
        const dest = path.join(desktopDir, basename);
        fs.copyFileSync(r, dest);
        console.log(`  Copied to Desktop: ${dest}`);
      }
    } catch {
      // Desktop might not exist in headless environments — that's fine
    }
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
