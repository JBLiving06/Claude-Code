/**
 * Knowledge Base Types - RAG system for grounding avatar responses
 */

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  documents: Document[];
  settings: KnowledgeBaseSettings;
  stats: KnowledgeBaseStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  source: DocumentSource;
  content: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  status: DocumentStatus;
  createdAt: Date;
  processedAt?: Date;
}

export interface DocumentSource {
  type: 'file' | 'url' | 'text';
  originalName?: string;
  url?: string;
  mimeType?: string;
  size?: number;
}

export interface DocumentMetadata {
  author?: string;
  publishedDate?: Date;
  category?: string;
  tags?: string[];
  language?: string;
  customFields?: Record<string, string>;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  startIndex: number;
  endIndex: number;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  section?: string;
  pageNumber?: number;
  isQuestion?: boolean;
  isAnswer?: boolean;
}

export type DocumentStatus = 'pending' | 'processing' | 'indexed' | 'failed';

export interface KnowledgeBaseSettings {
  chunkSize: number;          // tokens per chunk (default 512)
  chunkOverlap: number;       // overlap between chunks (default 50)
  embeddingModel: EmbeddingModel;
  retrievalTopK: number;      // number of chunks to retrieve (default 5)
  similarityThreshold: number; // minimum similarity score (default 0.7)
  responseStyle: ResponseStyle;
  groundingMode: GroundingMode;
}

export type EmbeddingModel =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002'
  | 'voyage-large-2'
  | 'cohere-embed-v3';

export type ResponseStyle =
  | 'conversational'  // Natural, spoken-friendly
  | 'academic'        // Formal, detailed
  | 'concise'         // Brief, to the point
  | 'explanatory';    // Teaching-oriented

export type GroundingMode =
  | 'strict'          // Only answer from knowledge base
  | 'augmented'       // KB first, general knowledge as fallback
  | 'hybrid';         // Blend KB and general knowledge

export interface KnowledgeBaseStats {
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  lastIndexed?: Date;
}

// RAG Query types
export interface RAGQuery {
  query: string;
  knowledgeBaseId: string;
  topK?: number;
  filters?: QueryFilter[];
  includeMetadata?: boolean;
}

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'contains' | 'in';
  value: string | string[];
}

export interface RAGResult {
  chunks: RetrievedChunk[];
  query: string;
  processingTime: number;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
  metadata: ChunkMetadata & DocumentMetadata;
}

// Answer generation types
export interface GenerateAnswerRequest {
  question: string;
  knowledgeBaseId: string;
  context?: ConversationContext;
  settings?: Partial<AnswerSettings>;
}

export interface ConversationContext {
  previousQuestions: Array<{
    question: string;
    answer: string;
  }>;
  currentSegment?: {
    title: string;
    content: string;
  };
}

export interface AnswerSettings {
  maxLength: number;          // max tokens in response
  temperature: number;        // LLM temperature (0-1)
  includeSourceCitations: boolean;
  speakingFriendly: boolean;  // Optimize for TTS
}

export interface GenerateAnswerResponse {
  answer: string;
  sources: SourceCitation[];
  confidence: number;
  suggestedFollowUps?: string[];
}

export interface SourceCitation {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  excerpt: string;
  relevanceScore: number;
}
