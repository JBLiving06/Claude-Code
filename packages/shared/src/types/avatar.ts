/**
 * Avatar Types - Configuration for AI avatar presenters
 */

export interface Avatar {
  id: string;
  name: string;
  description?: string;
  provider: AvatarProvider;
  providerAvatarId: string;
  voiceId: string;
  isCustom: boolean;
  imageUrl?: string;
  settings: AvatarSettings;
  createdAt: Date;
}

export type AvatarProvider = 'd-id' | 'heygen' | 'synthesia' | 'colossyan';

export interface AvatarSettings {
  speakingRate: number;       // 0.5 - 2.0
  pitch: number;              // 0.5 - 2.0
  expressiveness: number;     // 0 - 1
  backgroundType: BackgroundType;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  outputQuality: VideoQuality;
}

export type BackgroundType = 'solid' | 'image' | 'transparent' | 'green_screen';
export type VideoQuality = '720p' | '1080p' | '4k';

// D-ID specific types
export interface DIDConfig {
  apiKey: string;
  baseUrl: string;
}

export interface DIDTalkRequest {
  source_url: string;
  script: {
    type: 'text' | 'audio';
    input: string;
    provider?: DIDVoiceProvider;
  };
  config?: {
    fluent?: boolean;
    pad_audio?: number;
    stitch?: boolean;
  };
}

export interface DIDVoiceProvider {
  type: 'microsoft' | 'amazon' | 'elevenlabs';
  voice_id: string;
  voice_config?: {
    style?: string;
    rate?: string;
    pitch?: string;
  };
}

export interface DIDAgentConfig {
  knowledge: {
    documents: DIDDocument[];
    instructions?: string;
  };
  presenter: {
    source_url: string;
    voice_id: string;
  };
  llm: {
    provider: 'openai' | 'anthropic';
    model: string;
    instructions?: string;
  };
}

export interface DIDDocument {
  id: string;
  name: string;
  content?: string;
  url?: string;
  type: 'pdf' | 'txt' | 'pptx' | 'url';
}

// HeyGen specific types
export interface HeyGenConfig {
  apiKey: string;
  baseUrl: string;
}

export interface HeyGenVideoRequest {
  video_inputs: HeyGenVideoInput[];
  dimension?: { width: number; height: number };
  aspect_ratio?: '16:9' | '9:16' | '1:1';
}

export interface HeyGenVideoInput {
  character: {
    type: 'avatar' | 'talking_photo';
    avatar_id?: string;
    avatar_style?: string;
  };
  voice: {
    type: 'text' | 'audio';
    input_text?: string;
    voice_id?: string;
    speed?: number;
  };
  background?: {
    type: 'color' | 'image' | 'video';
    value: string;
  };
}

export interface HeyGenLiveAvatarConfig {
  avatar_id: string;
  voice_id: string;
  knowledge_base: HeyGenKnowledgeBase;
  session_config?: {
    max_duration?: number;
    language?: string;
  };
}

export interface HeyGenKnowledgeBase {
  persona: string;
  instructions: string;
  knowledge: string;
  greeting?: string;
  fallback_response?: string;
}

// Unified avatar generation request
export interface GenerateVideoRequest {
  avatarId: string;
  script: string;
  outputSettings?: Partial<AvatarSettings>;
}

export interface GenerateVideoResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  duration?: number;
  error?: string;
}

// Interactive avatar session
export interface InteractiveAvatarSession {
  sessionId: string;
  avatarId: string;
  knowledgeBaseId: string;
  status: 'connecting' | 'ready' | 'speaking' | 'listening' | 'processing' | 'ended';
  streamUrl?: string;
  websocketUrl?: string;
}

export interface AvatarResponse {
  text: string;
  audioUrl?: string;
  videoUrl?: string;
  sources?: string[];
  confidence?: number;
}
