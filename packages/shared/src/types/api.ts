/**
 * API Types - Request/Response types for the workshop system API
 */

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  requestId: string;
  timestamp: Date;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Workshop API
export interface CreateWorkshopRequest {
  title: string;
  description?: string;
  avatarId: string;
  knowledgeBaseId: string;
  settings?: Partial<import('./workshop.js').WorkshopSettings>;
}

export interface UpdateWorkshopRequest {
  title?: string;
  description?: string;
  avatarId?: string;
  knowledgeBaseId?: string;
  settings?: Partial<import('./workshop.js').WorkshopSettings>;
}

export interface AddSegmentRequest {
  title: string;
  script: string;
  order?: number;
  interactionPoints?: import('./workshop.js').InteractionPoint[];
}

export interface UpdateSegmentRequest {
  title?: string;
  script?: string;
  order?: number;
  interactionPoints?: import('./workshop.js').InteractionPoint[];
}

// Knowledge Base API
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  settings?: Partial<import('./knowledge-base.js').KnowledgeBaseSettings>;
}

export interface AddDocumentRequest {
  title: string;
  content?: string;
  url?: string;
  file?: {
    name: string;
    mimeType: string;
    data: string; // base64
  };
  metadata?: import('./knowledge-base.js').DocumentMetadata;
}

// Avatar API
export interface CreateAvatarRequest {
  name: string;
  description?: string;
  provider: import('./avatar.js').AvatarProvider;
  providerAvatarId: string;
  voiceId: string;
  settings?: Partial<import('./avatar.js').AvatarSettings>;
}

export interface GenerateSegmentVideoRequest {
  segmentId: string;
  regenerate?: boolean;
}

// Interactive Session API
export interface StartSessionRequest {
  workshopId: string;
  participantId?: string;
}

export interface StartSessionResponse {
  sessionId: string;
  workshopId: string;
  participantId: string;
  workshop: {
    title: string;
    totalSegments: number;
    estimatedDuration: number;
  };
}

export interface AskQuestionRequest {
  sessionId: string;
  question: string;
  currentSegmentId?: string;
  currentTimestamp?: number;
}

export interface AskQuestionResponse {
  answer: string;
  sources: import('./knowledge-base.js').SourceCitation[];
  avatarResponse?: {
    videoUrl?: string;
    audioUrl?: string;
    streamUrl?: string;
  };
}

export interface RecordInteractionRequest {
  sessionId: string;
  interactionPointId: string;
  response?: string;
  choiceId?: string;
}

export interface UpdateProgressRequest {
  sessionId: string;
  segmentId: string;
  timestamp: number;
}

// Streaming/WebSocket types
export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: Date;
}

export type WSMessageType =
  | 'connect'
  | 'disconnect'
  | 'question'
  | 'answer_start'
  | 'answer_chunk'
  | 'answer_complete'
  | 'avatar_speaking'
  | 'avatar_idle'
  | 'error';

export interface WSQuestionMessage {
  type: 'question';
  payload: {
    question: string;
    segmentId?: string;
    timestamp?: number;
  };
}

export interface WSAnswerChunkMessage {
  type: 'answer_chunk';
  payload: {
    text: string;
    isComplete: boolean;
  };
}

export interface WSAvatarStateMessage {
  type: 'avatar_speaking' | 'avatar_idle';
  payload: {
    streamUrl?: string;
  };
}
