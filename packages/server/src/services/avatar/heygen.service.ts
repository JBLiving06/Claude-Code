/**
 * HeyGen Avatar Service - Integration with HeyGen API
 *
 * HeyGen offers:
 * - 500+ stock avatars and custom avatar creation
 * - Voice cloning
 * - LiveAvatar for real-time interactive sessions
 * - Unlimited video creation (30-60 min per video)
 * - ~$29/month Creator + ~$99/month LiveAvatar Pro
 */

import { nanoid } from 'nanoid';
import type {
  Avatar,
  GenerateVideoRequest,
  GenerateVideoResponse,
  InteractiveAvatarSession,
  AvatarResponse,
} from '@avatar-workshop/shared';
import { BaseAvatarService, type InteractiveKnowledgeConfig } from './base.service.js';
import { config } from '../../config/index.js';

interface HeyGenVideoResponse {
  data: {
    video_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    video_url?: string;
    duration?: number;
    error?: string;
  };
}

interface HeyGenAvatarListResponse {
  data: {
    avatars: Array<{
      avatar_id: string;
      avatar_name: string;
      preview_image_url: string;
      preview_video_url?: string;
      gender: string;
      is_paid: boolean;
    }>;
  };
}

interface HeyGenLiveSessionResponse {
  data: {
    session_id: string;
    access_token: string;
    ice_servers: Array<{
      urls: string[];
      username?: string;
      credential?: string;
    }>;
    sdp_offer?: string;
  };
}

// Track active LiveAvatar sessions
const activeSessions = new Map<string, {
  heygenSessionId: string;
  accessToken: string;
  knowledgeConfig: InteractiveKnowledgeConfig;
}>();

export class HeyGenService extends BaseAvatarService {
  readonly provider = 'heygen' as const;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = config.heygen.apiKey;
    this.baseUrl = config.heygen.baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List available HeyGen avatars
   */
  async listAvatars(): Promise<Avatar[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/v2/avatars`,
      { headers: this.getHeaders() }
    );

    const data: HeyGenAvatarListResponse = await response.json();
    return data.data.avatars.map(avatar => this.mapToAvatar(avatar));
  }

  /**
   * Get a specific avatar
   */
  async getAvatar(providerAvatarId: string): Promise<Avatar | null> {
    // HeyGen doesn't have a single avatar endpoint, fetch from list
    const avatars = await this.listAvatars();
    return avatars.find(a => a.providerAvatarId === providerAvatarId) || null;
  }

  /**
   * Generate a video with HeyGen
   */
  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    const videoRequest = {
      video_inputs: [
        {
          character: {
            type: 'avatar',
            avatar_id: request.avatarId,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: request.script,
            voice_id: request.outputSettings?.speakingRate
              ? undefined  // Use default for custom rate
              : undefined,
            speed: request.outputSettings?.speakingRate || 1.0,
          },
          background: {
            type: request.outputSettings?.backgroundType === 'image' ? 'image' : 'color',
            value: request.outputSettings?.backgroundColor || '#ffffff',
          },
        },
      ],
      dimension: {
        width: request.outputSettings?.outputQuality === '4k' ? 3840 : 1920,
        height: request.outputSettings?.outputQuality === '4k' ? 2160 : 1080,
      },
    };

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/v2/video/generate`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(videoRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HeyGen API error: ${error.message || response.statusText}`);
    }

    const data: HeyGenVideoResponse = await response.json();

    return {
      jobId: data.data.video_id,
      status: this.mapStatus(data.data.status),
      videoUrl: data.data.video_url,
      duration: data.data.duration,
    };
  }

  /**
   * Check video generation status
   */
  async getVideoStatus(jobId: string): Promise<GenerateVideoResponse> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/v1/video_status.get?video_id=${jobId}`,
      { headers: this.getHeaders() }
    );

    const data: HeyGenVideoResponse = await response.json();

    return {
      jobId: data.data.video_id,
      status: this.mapStatus(data.data.status),
      videoUrl: data.data.video_url,
      duration: data.data.duration,
      error: data.data.error,
    };
  }

  /**
   * Start a LiveAvatar interactive session
   *
   * HeyGen LiveAvatar features:
   * - Real-time two-way conversation
   * - Low latency streaming (~1-2 seconds)
   * - WebRTC-based video streaming
   * - LLM integration (ChatGPT, Claude)
   */
  async startInteractiveSession(
    avatarId: string,
    knowledgeConfig: InteractiveKnowledgeConfig
  ): Promise<InteractiveAvatarSession> {
    // Create LiveAvatar session
    const sessionRequest = {
      avatar_id: avatarId,
      quality: 'high',
      voice: {
        voice_id: 'default',
        rate: 1.0,
      },
      knowledge_base: this.buildKnowledgeBase(knowledgeConfig),
    };

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/v1/realtime.new`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(sessionRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create HeyGen session: ${error.message || response.statusText}`);
    }

    const data: HeyGenLiveSessionResponse = await response.json();
    const sessionId = nanoid();

    activeSessions.set(sessionId, {
      heygenSessionId: data.data.session_id,
      accessToken: data.data.access_token,
      knowledgeConfig,
    });

    return {
      sessionId,
      avatarId,
      knowledgeBaseId: '',
      status: 'ready',
      streamUrl: undefined, // WebRTC - handled by client
      websocketUrl: `wss://realtime.heygen.com/v1/realtime?session_id=${data.data.session_id}`,
    };
  }

  /**
   * Send a message to the LiveAvatar
   */
  async sendMessage(sessionId: string, message: string): Promise<AvatarResponse> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // For LiveAvatar, messages are typically sent via WebSocket
    // This HTTP fallback is for simpler integrations
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/v1/realtime.task`,
      {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          session_id: session.heygenSessionId,
          task_type: 'talk',
          task_input: {
            text: message,
            task_mode: 'chat', // 'chat' uses the knowledge base, 'repeat' just speaks
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HeyGen message error: ${error.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.data?.response_text || '',
      // Video/audio comes through WebRTC stream
    };
  }

  /**
   * End a LiveAvatar session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    try {
      await this.fetchWithRetry(
        `${this.baseUrl}/v1/realtime.stop`,
        {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Authorization': `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            session_id: session.heygenSessionId,
          }),
        }
      );
    } catch {
      // Ignore cleanup errors
    }

    activeSessions.delete(sessionId);
  }

  /**
   * Build HeyGen knowledge base configuration
   *
   * HeyGen uses a structured format:
   * - Persona: Character/role description
   * - Instructions: Behavior guidelines
   * - Knowledge: Facts to use in responses
   */
  private buildKnowledgeBase(config: InteractiveKnowledgeConfig): {
    persona: string;
    instructions: string;
    knowledge: string;
    greeting?: string;
    fallback_response?: string;
  } {
    // Extract persona and instructions from system prompt
    const systemPrompt = config.systemPrompt;

    // Build knowledge section from documents
    let knowledge = config.knowledgeText || '';
    if (config.documents) {
      knowledge += '\n\n' + config.documents
        .map(doc => `## ${doc.name}\n${doc.content}`)
        .join('\n\n');
    }

    return {
      persona: this.extractPersona(systemPrompt),
      instructions: this.extractInstructions(systemPrompt),
      knowledge: knowledge.trim(),
      greeting: 'Hello! I\'m here to help you learn. Feel free to ask me any questions about the workshop material.',
      fallback_response: 'I\'m not sure about that specific question. Could you rephrase it, or ask about something covered in the workshop?',
    };
  }

  /**
   * Extract persona description from system prompt
   */
  private extractPersona(prompt: string): string {
    // Look for "You are..." pattern
    const match = prompt.match(/You are\s+([^.]+\.)/i);
    if (match) {
      return match[0];
    }
    return 'An AI workshop instructor helping students learn about sophisticated AI use in academics.';
  }

  /**
   * Extract behavioral instructions from system prompt
   */
  private extractInstructions(prompt: string): string {
    // Remove persona part and return the rest as instructions
    const withoutPersona = prompt.replace(/You are\s+[^.]+\./i, '').trim();
    return withoutPersona || 'Be helpful, informative, and encouraging. Keep answers conversational and appropriate for spoken delivery.';
  }

  /**
   * Map HeyGen avatar data to our Avatar type
   */
  private mapToAvatar(avatar: {
    avatar_id: string;
    avatar_name: string;
    preview_image_url: string;
    gender: string;
    is_paid: boolean;
  }): Avatar {
    return {
      id: nanoid(),
      name: avatar.avatar_name,
      provider: 'heygen',
      providerAvatarId: avatar.avatar_id,
      voiceId: 'default', // HeyGen assigns voices per-request
      isCustom: false,
      imageUrl: avatar.preview_image_url,
      settings: {
        speakingRate: 1,
        pitch: 1,
        expressiveness: 0.5,
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        outputQuality: '1080p',
      },
      createdAt: new Date(),
    };
  }

  /**
   * Map HeyGen status to our status type
   */
  private mapStatus(status: string): GenerateVideoResponse['status'] {
    switch (status) {
      case 'pending':
        return 'queued';
      case 'processing':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'processing';
    }
  }
}

export const heygenService = new HeyGenService();
