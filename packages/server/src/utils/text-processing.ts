/**
 * Text Processing Utilities for Knowledge Base
 */

import { encoding_for_model } from 'tiktoken';

/**
 * Count tokens in text using tiktoken
 */
export function countTokens(text: string): number {
  try {
    const enc = encoding_for_model('gpt-4');
    const tokens = enc.encode(text);
    enc.free();
    return tokens.length;
  } catch {
    // Fallback: rough estimate of 4 chars per token
    return Math.ceil(text.length / 4);
  }
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  maxTokens: number = 512,
  overlapTokens: number = 50
): string[] {
  // First, split by paragraph boundaries
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = countTokens(paragraph);

    // If single paragraph exceeds max, split by sentences
    if (paragraphTokens > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }
      const sentenceChunks = chunkBySentence(paragraph, maxTokens, overlapTokens);
      chunks.push(...sentenceChunks);
      continue;
    }

    // Check if adding this paragraph would exceed limit
    if (currentTokens + paragraphTokens > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());

        // Create overlap by keeping last part of previous chunk
        const overlapText = getOverlapText(currentChunk, overlapTokens);
        currentChunk = overlapText + '\n\n' + paragraph;
        currentTokens = countTokens(currentChunk);
      } else {
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      currentTokens += paragraphTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Split a long paragraph by sentences
 */
function chunkBySentence(
  text: string,
  maxTokens: number,
  overlapTokens: number
): string[] {
  // Split by sentence-ending punctuation
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = countTokens(sentence);

    // If single sentence exceeds max, force split by words
    if (sentenceTokens > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }
      const wordChunks = chunkByWords(sentence, maxTokens);
      chunks.push(...wordChunks);
      continue;
    }

    if (currentTokens + sentenceTokens > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        const overlapText = getOverlapText(currentChunk, overlapTokens);
        currentChunk = overlapText + ' ' + sentence;
        currentTokens = countTokens(currentChunk);
      } else {
        currentChunk = sentence;
        currentTokens = sentenceTokens;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Force split by words when sentences are too long
 */
function chunkByWords(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const word of words) {
    const wordTokens = countTokens(word);

    if (currentTokens + wordTokens > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = word;
      currentTokens = wordTokens;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
      currentTokens += wordTokens;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Get the last N tokens worth of text for overlap
 */
function getOverlapText(text: string, overlapTokens: number): string {
  const words = text.split(/\s+/);
  let overlapText = '';
  let tokens = 0;

  // Work backwards to find overlap portion
  for (let i = words.length - 1; i >= 0 && tokens < overlapTokens; i--) {
    const word = words[i];
    tokens += countTokens(word);
    overlapText = word + (overlapText ? ' ' : '') + overlapText;
  }

  return overlapText;
}

/**
 * Clean and normalize text for processing
 */
export function normalizeText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    // Remove excessive blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    // Fix common OCR/PDF extraction issues
    .replace(/(?<=[a-z])-\n(?=[a-z])/g, '') // Remove hyphenation
    .replace(/\u00ad/g, '') // Remove soft hyphens
    // Normalize quotes
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Remove non-printable characters (except newlines)
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
}

/**
 * Extract text from Q&A format (useful for workshop materials)
 */
export function extractQAPairs(text: string): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];

  // Common Q&A patterns
  const patterns = [
    /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gs,
    /Question:\s*(.+?)\s*Answer:\s*(.+?)(?=Question:|$)/gis,
    /\*\*Q:\*\*\s*(.+?)\s*\*\*A:\*\*\s*(.+?)(?=\*\*Q:|$)/gs,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      pairs.push({
        question: match[1].trim(),
        answer: match[2].trim(),
      });
    }
  }

  return pairs;
}

/**
 * Detect if text appears to be in a specific format
 */
export function detectTextFormat(text: string): 'markdown' | 'plain' | 'qa' | 'outline' {
  // Check for Q&A format
  if (/Q:\s*.+\s*A:\s*/i.test(text) || /Question:\s*.+\s*Answer:/i.test(text)) {
    return 'qa';
  }

  // Check for markdown
  if (/^#+\s/m.test(text) || /\*\*[^*]+\*\*/.test(text) || /```[\s\S]*```/.test(text)) {
    return 'markdown';
  }

  // Check for outline format
  if (/^[\s]*[-•]\s/m.test(text) && (text.match(/^[\s]*[-•]\s/gm)?.length ?? 0) > 5) {
    return 'outline';
  }

  return 'plain';
}
