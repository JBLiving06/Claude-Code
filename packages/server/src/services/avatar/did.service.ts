/**
 * D-ID Avatar Service - Integration with D-ID Creative Reality API
 *
 * D-ID offers:
 * - Realistic talking-head avatars with excellent lip-sync
 * - Photo-to-avatar (digital twin from single photo)
 * - Visual AI Agents with GPT integration for Q&A
 * - ~$108/month for 100 minutes + API access
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

interface DIDTalkResponse {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  duration?: number;
  error?: {
    kind: string;
    description: string;
  };
}

interface DIDAgentResponse {
  id: string;
  chat_id: string;
  status: 'created' | 'active' | 'ended';
  stream_url?: string;
}

interface DIDChatResponse {
  id: string;
  chat_id: string;
  status: 'created' | 'started' | 'done' | 'error';
  result_url?: string;
  text?: string;
  duration?: number;
}

// Track active sessions
const activeSessions = new Map<string, { agentId: string; chatId: string }>();

export class DIDService extends BaseAvatarService {
  readonly provider = 'd-id' as const;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    super();
    this.apiKey = config.did.apiKey;
    this.baseUrl = config.did.baseUrl;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Basic ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List available D-ID presenters
   */
  async listAvatars(): Promise<Avatar[]> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/clips/presenters`,
      { headers: this.getHeaders() }
    );

    const data = await response.json();
    const presenters = data.presenters || [];

    return presenters.map((p: Record<string, unknown>) => this.mapToAvatar(p));
  }

  /**
   * Get a specific presenter
   */
  async getAvatar(providerAvatarId: string): Promise<Avatar | null> {
    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/clips/presenters/${providerAvatarId}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) return null;
      const data = await response.json();
      return this.mapToAvatar(data);
    } catch {
      return null;
    }
  }

  /**
   * Generate a talking-head video using D-ID Talks API
   */
  async generateVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
    const avatar = await this.getAvatar(request.avatarId);
    if (!avatar) {
      throw new Error(`Avatar not found: ${request.avatarId}`);
    }

    const talkRequest = {
      source_url: avatar.imageUrl,
      script: {
        type: 'text',
        input: request.script,
        provider: {
          type: 'microsoft',
          voice_id: avatar.voiceId,
          voice_config: {
            rate: this.formatSpeakingRate(request.outputSettings?.speakingRate || 1),
          },
        },
      },
      config: {
        fluent: true,
        pad_audio: 0.5,
        stitch: true,
      },
    };

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/talks`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(talkRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`D-ID API error: ${error.description || response.statusText}`);
    }

    const data: DIDTalkResponse = await response.json();

    return {
      jobId: data.id,
      status: this.mapStatus(data.status),
      videoUrl: data.result_url,
      duration: data.duration,
    };
  }

  /**
   * Check video generation status
   */
  async getVideoStatus(jobId: string): Promise<GenerateVideoResponse> {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/talks/${jobId}`,
      { headers: this.getHeaders() }
    );

    const data: DIDTalkResponse = await response.json();

    return {
      jobId: data.id,
      status: this.mapStatus(data.status),
      videoUrl: data.result_url,
      duration: data.duration,
      error: data.error?.description,
    };
  }

  /**
   * Start an interactive AI agent session with D-ID
   *
   * D-ID Agents combine:
   * - Visual avatar presentation
   * - GPT-3.5/4 for conversation
   * - Knowledge base grounding
   */
  async startInteractiveSession(
    avatarId: string,
    knowledgeConfig: InteractiveKnowledgeConfig
  ): Promise<InteractiveAvatarSession> {
    const avatar = await this.getAvatar(avatarId);
    if (!avatar) {
      throw new Error(`Avatar not found: ${avatarId}`);
    }

    // Create the agent with knowledge base
    const agentRequest = {
      presenter: {
        type: 'talk',
        source_url: avatar.imageUrl,
        voice: {
          type: 'microsoft',
          voice_id: avatar.voiceId,
        },
      },
      llm: {
        type: 'openai',
        provider: knowledgeConfig.llmProvider === 'anthropic' ? 'anthropic' : 'openai',
        model: knowledgeConfig.llmModel,
      },
      knowledge: {
        provider: 'pinecone', // or 'built_in'
        context: knowledgeConfig.knowledgeText || '',
        instructions: knowledgeConfig.systemPrompt,
      },
    };

    const agentResponse = await this.fetchWithRetry(
      `${this.baseUrl}/agents`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(agentRequest),
      }
    );

    if (!agentResponse.ok) {
      const error = await agentResponse.json();
      throw new Error(`Failed to create D-ID agent: ${error.description || agentResponse.statusText}`);
    }

    const agent: DIDAgentResponse = await agentResponse.json();

    // Start a chat session
    const chatResponse = await this.fetchWithRetry(
      `${this.baseUrl}/agents/${agent.id}/chats`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({}),
      }
    );

    const chat = await chatResponse.json();
    const sessionId = nanoid();

    activeSessions.set(sessionId, {
      agentId: agent.id,
      chatId: chat.id,
    });

    return {
      sessionId,
      avatarId,
      knowledgeBaseId: '', // Managed by D-ID
      status: 'ready',
      streamUrl: agent.stream_url,
      websocketUrl: chat.websocket_url,
    };
  }

  /**
   * Send a message to the interactive agent
   */
  async sendMessage(sessionId: string, message: string): Promise<AvatarResponse> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/agents/${session.agentId}/chats/${session.chatId}/messages`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: 'text',
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`D-ID message error: ${error.description || response.statusText}`);
    }

    const data: DIDChatResponse = await response.json();

    // Poll for completion if not using WebSocket
    let result = data;
    while (result.status === 'created' || result.status === 'started') {
      await new Promise(resolve => setTimeout(resolve, 500));
      const statusResponse = await this.fetchWithRetry(
        `${this.baseUrl}/agents/${session.agentId}/chats/${session.chatId}/messages/${data.id}`,
        { headers: this.getHeaders() }
      );
      result = await statusResponse.json();
    }

    return {
      text: result.text || '',
      videoUrl: result.result_url,
    };
  }

  /**
   * End an interactive session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = activeSessions.get(sessionId);
    if (!session) return;

    try {
      await this.fetchWithRetry(
        `${this.baseUrl}/agents/${session.agentId}/chats/${session.chatId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );
    } catch {
      // Ignore cleanup errors
    }

    activeSessions.delete(sessionId);
  }

  /**
   * Map D-ID presenter data to our Avatar type
   */
  private mapToAvatar(presenter: Record<string, unknown>): Avatar {
    return {
      id: nanoid(),
      name: presenter.name as string || 'D-ID Presenter',
      description: presenter.description as string,
      provider: 'd-id',
      providerAvatarId: presenter.presenter_id as string || presenter.id as string,
      voiceId: presenter.default_voice_id as string || 'en-US-JennyNeural',
      isCustom: presenter.owner_id != null,
      imageUrl: presenter.source_url as string || presenter.thumbnail_url as string,
      settings: {
        speakingRate: 1,
        pitch: 1,
        expressiveness: 0.5,
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        outputQuality: '1080p',
      },
      createdAt: new Date(presenter.created_at as string || Date.now()),
    };
  }

  /**
   * Map D-ID status to our status type
   */
  private mapStatus(status: string): GenerateVideoResponse['status'] {
    switch (status) {
      case 'created':
        return 'queued';
      case 'started':
        return 'processing';
      case 'done':
        return 'completed';
      case 'error':
        return 'failed';
      default:
        return 'processing';
    }
  }
}

export const didService = new DIDService();
