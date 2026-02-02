/**
 * Base Avatar Service - Common interface for avatar providers
 */

import type {
  Avatar,
  AvatarProvider,
  GenerateVideoRequest,
  GenerateVideoResponse,
  InteractiveAvatarSession,
  AvatarResponse,
} from '@avatar-workshop/shared';

export interface IAvatarService {
  provider: AvatarProvider;

  /**
   * List available avatars from the provider
   */
  listAvatars(): Promise<Avatar[]>;

  /**
   * Get a specific avatar by provider ID
   */
  getAvatar(providerAvatarId: string): Promise<Avatar | null>;

  /**
   * Generate a video with the avatar speaking the given script
   */
  generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse>;

  /**
   * Check the status of a video generation job
   */
  getVideoStatus(jobId: string): Promise<GenerateVideoResponse>;

  /**
   * Start an interactive session with the avatar
   */
  startInteractiveSession(
    avatarId: string,
    knowledgeBaseConfig: InteractiveKnowledgeConfig
  ): Promise<InteractiveAvatarSession>;

  /**
   * Send a message/question to the interactive avatar
   */
  sendMessage(sessionId: string, message: string): Promise<AvatarResponse>;

  /**
   * End an interactive session
   */
  endSession(sessionId: string): Promise<void>;
}

export interface InteractiveKnowledgeConfig {
  systemPrompt: string;
  knowledgeText?: string;
  documents?: Array<{
    name: string;
    content: string;
  }>;
  llmProvider: 'openai' | 'anthropic';
  llmModel: string;
  maxResponseTokens?: number;
  temperature?: number;
}

/**
 * Abstract base class with common functionality
 */
export abstract class BaseAvatarService implements IAvatarService {
  abstract provider: AvatarProvider;
  abstract listAvatars(): Promise<Avatar[]>;
  abstract getAvatar(providerAvatarId: string): Promise<Avatar | null>;
  abstract generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse>;
  abstract getVideoStatus(jobId: string): Promise<GenerateVideoResponse>;
  abstract startInteractiveSession(
    avatarId: string,
    knowledgeBaseConfig: InteractiveKnowledgeConfig
  ): Promise<InteractiveAvatarSession>;
  abstract sendMessage(sessionId: string, message: string): Promise<AvatarResponse>;
  abstract endSession(sessionId: string): Promise<void>;

  /**
   * Helper to make HTTP requests with retry logic
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status < 500) {
          return response;
        }
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
      }

      // Exponential backoff
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Parse speaking rate to provider-specific format
   */
  protected formatSpeakingRate(rate: number): string {
    // Convert 0.5-2.0 scale to percentage change
    const percentChange = Math.round((rate - 1) * 100);
    if (percentChange >= 0) {
      return `+${percentChange}%`;
    }
    return `${percentChange}%`;
  }
}
