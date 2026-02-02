/**
 * Knowledge Base Service - RAG pipeline for grounding avatar responses
 */

import { OpenAI } from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { nanoid } from 'nanoid';
import type {
  KnowledgeBase,
  Document,
  DocumentChunk,
  RAGQuery,
  RAGResult,
  RetrievedChunk,
  GenerateAnswerRequest,
  GenerateAnswerResponse,
  KnowledgeBaseSettings,
} from '@avatar-workshop/shared';
import { config } from '../config/index.js';
import { chunkText, countTokens } from '../utils/text-processing.js';

// In-memory store for development (replace with database in production)
const knowledgeBases = new Map<string, KnowledgeBase>();
const documents = new Map<string, Document>();

export class KnowledgeBaseService {
  private openai: OpenAI;
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    this.openai = new OpenAI({ apiKey: config.openai.apiKey });
    this.pinecone = new Pinecone({ apiKey: config.pinecone.apiKey });
    this.indexName = config.pinecone.indexName;
  }

  /**
   * Create a new knowledge base
   */
  async createKnowledgeBase(
    name: string,
    description?: string,
    settings?: Partial<KnowledgeBaseSettings>
  ): Promise<KnowledgeBase> {
    const defaultSettings: KnowledgeBaseSettings = {
      chunkSize: 512,
      chunkOverlap: 50,
      embeddingModel: 'text-embedding-3-small',
      retrievalTopK: 5,
      similarityThreshold: 0.7,
      responseStyle: 'conversational',
      groundingMode: 'augmented',
    };

    const kb: KnowledgeBase = {
      id: nanoid(),
      name,
      description,
      documents: [],
      settings: { ...defaultSettings, ...settings },
      stats: {
        totalDocuments: 0,
        totalChunks: 0,
        totalTokens: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    knowledgeBases.set(kb.id, kb);
    return kb;
  }

  /**
   * Get a knowledge base by ID
   */
  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    return knowledgeBases.get(id) || null;
  }

  /**
   * List all knowledge bases
   */
  async listKnowledgeBases(): Promise<KnowledgeBase[]> {
    return Array.from(knowledgeBases.values());
  }

  /**
   * Add a document to a knowledge base
   */
  async addDocument(
    knowledgeBaseId: string,
    title: string,
    content: string,
    metadata?: Document['metadata']
  ): Promise<Document> {
    const kb = await this.getKnowledgeBase(knowledgeBaseId);
    if (!kb) {
      throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
    }

    // Create document
    const doc: Document = {
      id: nanoid(),
      knowledgeBaseId,
      title,
      source: { type: 'text' },
      content,
      metadata: metadata || {},
      chunks: [],
      status: 'processing',
      createdAt: new Date(),
    };

    // Chunk the document
    const textChunks = chunkText(content, kb.settings.chunkSize, kb.settings.chunkOverlap);

    // Generate embeddings and create chunks
    const chunkPromises = textChunks.map(async (text, index) => {
      const embedding = await this.generateEmbedding(text);

      const chunk: DocumentChunk = {
        id: nanoid(),
        documentId: doc.id,
        content: text,
        embedding,
        startIndex: 0, // Simplified - would need proper indexing
        endIndex: text.length,
        metadata: {
          section: this.detectSection(text),
          isQuestion: text.includes('?') && text.split('?').length > 1,
          isAnswer: text.toLowerCase().startsWith('a:') || text.includes('Answer:'),
        },
      };

      return chunk;
    });

    doc.chunks = await Promise.all(chunkPromises);
    doc.status = 'indexed';
    doc.processedAt = new Date();

    // Store chunks in vector database
    await this.storeChunksInVectorDB(doc.chunks, doc.id, doc.title);

    // Update knowledge base stats
    kb.documents.push(doc);
    kb.stats.totalDocuments++;
    kb.stats.totalChunks += doc.chunks.length;
    kb.stats.totalTokens += countTokens(content);
    kb.stats.lastIndexed = new Date();
    kb.updatedAt = new Date();

    documents.set(doc.id, doc);
    return doc;
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: config.openai.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  /**
   * Store chunks in Pinecone vector database
   */
  private async storeChunksInVectorDB(
    chunks: DocumentChunk[],
    documentId: string,
    documentTitle: string
  ): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);

      const vectors = chunks.map(chunk => ({
        id: chunk.id,
        values: chunk.embedding!,
        metadata: {
          documentId,
          documentTitle,
          content: chunk.content,
          ...chunk.metadata,
        },
      }));

      // Batch upsert in groups of 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }
    } catch (error) {
      console.error('Error storing chunks in vector DB:', error);
      // Fall back to in-memory storage if Pinecone fails
    }
  }

  /**
   * Query the knowledge base using RAG
   */
  async query(request: RAGQuery): Promise<RAGResult> {
    const startTime = Date.now();
    const kb = await this.getKnowledgeBase(request.knowledgeBaseId);
    if (!kb) {
      throw new Error(`Knowledge base not found: ${request.knowledgeBaseId}`);
    }

    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(request.query);
    const topK = request.topK || kb.settings.retrievalTopK;

    // Try Pinecone first, fall back to in-memory search
    let retrievedChunks: RetrievedChunk[];
    try {
      retrievedChunks = await this.queryVectorDB(queryEmbedding, request.knowledgeBaseId, topK);
    } catch {
      retrievedChunks = this.searchInMemory(queryEmbedding, kb, topK);
    }

    // Filter by similarity threshold
    const threshold = kb.settings.similarityThreshold;
    const filteredChunks = retrievedChunks.filter(chunk => chunk.score >= threshold);

    return {
      chunks: filteredChunks,
      query: request.query,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Query Pinecone vector database
   */
  private async queryVectorDB(
    queryEmbedding: number[],
    knowledgeBaseId: string,
    topK: number
  ): Promise<RetrievedChunk[]> {
    const index = this.pinecone.index(this.indexName);

    const results = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: { knowledgeBaseId },
    });

    return results.matches?.map(match => ({
      chunkId: match.id,
      documentId: match.metadata?.documentId as string,
      documentTitle: match.metadata?.documentTitle as string,
      content: match.metadata?.content as string,
      score: match.score || 0,
      metadata: match.metadata as RetrievedChunk['metadata'],
    })) || [];
  }

  /**
   * In-memory vector similarity search (fallback)
   */
  private searchInMemory(
    queryEmbedding: number[],
    kb: KnowledgeBase,
    topK: number
  ): RetrievedChunk[] {
    const allChunks: Array<{ chunk: DocumentChunk; doc: Document; score: number }> = [];

    for (const doc of kb.documents) {
      for (const chunk of doc.chunks) {
        if (chunk.embedding) {
          const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
          allChunks.push({ chunk, doc, score });
        }
      }
    }

    return allChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ chunk, doc, score }) => ({
        chunkId: chunk.id,
        documentId: doc.id,
        documentTitle: doc.title,
        content: chunk.content,
        score,
        metadata: { ...chunk.metadata, ...doc.metadata },
      }));
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate an answer using RAG
   */
  async generateAnswer(request: GenerateAnswerRequest): Promise<GenerateAnswerResponse> {
    const kb = await this.getKnowledgeBase(request.knowledgeBaseId);
    if (!kb) {
      throw new Error(`Knowledge base not found: ${request.knowledgeBaseId}`);
    }

    // Retrieve relevant chunks
    const ragResult = await this.query({
      query: request.question,
      knowledgeBaseId: request.knowledgeBaseId,
    });

    // Build context from retrieved chunks
    const context = ragResult.chunks
      .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.content}`)
      .join('\n\n');

    // Build conversation history if provided
    const conversationHistory = request.context?.previousQuestions
      ?.map(q => `User: ${q.question}\nAssistant: ${q.answer}`)
      .join('\n\n') || '';

    // Generate system prompt based on settings
    const systemPrompt = this.buildSystemPrompt(kb.settings, request.settings);

    // Generate answer using LLM
    const completion = await this.openai.chat.completions.create({
      model: config.openai.chatModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Context from knowledge base:\n${context}\n\n${
            conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ''
          }Current question: ${request.question}`,
        },
      ],
      temperature: request.settings?.temperature ?? 0.7,
      max_tokens: request.settings?.maxLength ?? 500,
    });

    const answer = completion.choices[0].message.content || 'I apologize, but I cannot generate an answer at this time.';

    // Calculate confidence based on retrieval scores
    const avgScore = ragResult.chunks.length > 0
      ? ragResult.chunks.reduce((sum, c) => sum + c.score, 0) / ragResult.chunks.length
      : 0;

    return {
      answer: request.settings?.speakingFriendly
        ? this.makeSpeakingFriendly(answer)
        : answer,
      sources: ragResult.chunks.map(chunk => ({
        documentId: chunk.documentId,
        documentTitle: chunk.documentTitle,
        chunkId: chunk.chunkId,
        excerpt: chunk.content.slice(0, 200) + '...',
        relevanceScore: chunk.score,
      })),
      confidence: avgScore,
      suggestedFollowUps: this.generateFollowUpQuestions(request.question, ragResult.chunks),
    };
  }

  /**
   * Build system prompt based on knowledge base settings
   */
  private buildSystemPrompt(
    kbSettings: KnowledgeBaseSettings,
    answerSettings?: Partial<GenerateAnswerRequest['settings']>
  ): string {
    const styleInstructions: Record<KnowledgeBaseSettings['responseStyle'], string> = {
      conversational: 'Respond in a friendly, conversational tone as if speaking to a student. Use natural language and feel free to use contractions.',
      academic: 'Respond in a formal, academic tone. Be precise and use appropriate terminology.',
      concise: 'Be brief and to the point. Provide direct answers without unnecessary elaboration.',
      explanatory: 'Take a teaching approach. Explain concepts clearly and provide examples when helpful.',
    };

    const groundingInstructions: Record<KnowledgeBaseSettings['groundingMode'], string> = {
      strict: 'ONLY use information from the provided context. If the answer is not in the context, say so clearly.',
      augmented: 'Prioritize information from the provided context. You may supplement with general knowledge if needed, but clearly indicate when you do so.',
      hybrid: 'Use both the provided context and your general knowledge to give a comprehensive answer.',
    };

    let prompt = `You are an AI workshop instructor helping students learn about sophisticated AI use in academics.

${styleInstructions[kbSettings.responseStyle]}

${groundingInstructions[kbSettings.groundingMode]}`;

    if (answerSettings?.speakingFriendly) {
      prompt += `

IMPORTANT: Your response will be spoken aloud by an avatar. Write in a natural, spoken style:
- Use complete sentences
- Avoid bullet points and numbered lists
- Don't use special characters or formatting
- Write out numbers and abbreviations
- Keep sentences at a comfortable speaking length`;
    }

    if (answerSettings?.includeSourceCitations) {
      prompt += `

When referencing information from the context, mention the source naturally (e.g., "According to our materials on..." or "As discussed in the section about...").`;
    }

    return prompt;
  }

  /**
   * Make text more suitable for text-to-speech
   */
  private makeSpeakingFriendly(text: string): string {
    return text
      // Remove markdown formatting
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/#{1,6}\s/g, '')
      // Convert bullet points to sentences
      .replace(/^[-•]\s*/gm, '')
      // Write out common abbreviations
      .replace(/\be\.g\./g, 'for example')
      .replace(/\bi\.e\./g, 'that is')
      .replace(/\betc\./g, 'and so on')
      .replace(/\bvs\./g, 'versus')
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Generate follow-up question suggestions
   */
  private generateFollowUpQuestions(question: string, chunks: RetrievedChunk[]): string[] {
    // Simple heuristic-based follow-up generation
    const followUps: string[] = [];

    const topics = new Set<string>();
    chunks.forEach(chunk => {
      if (chunk.documentTitle) {
        topics.add(chunk.documentTitle);
      }
    });

    // Suggest exploring related topics
    topics.forEach(topic => {
      if (!question.toLowerCase().includes(topic.toLowerCase())) {
        followUps.push(`Can you tell me more about ${topic}?`);
      }
    });

    return followUps.slice(0, 3);
  }

  /**
   * Detect section from text (simple heuristic)
   */
  private detectSection(text: string): string | undefined {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.length < 100 && (line.endsWith(':') || /^[A-Z][^.!?]*$/.test(line))) {
        return line.replace(/:$/, '');
      }
    }
    return undefined;
  }

  /**
   * Delete a document from the knowledge base
   */
  async deleteDocument(documentId: string): Promise<void> {
    const doc = documents.get(documentId);
    if (!doc) return;

    const kb = knowledgeBases.get(doc.knowledgeBaseId);
    if (kb) {
      kb.documents = kb.documents.filter(d => d.id !== documentId);
      kb.stats.totalDocuments--;
      kb.stats.totalChunks -= doc.chunks.length;
      kb.updatedAt = new Date();
    }

    // Remove from vector database
    try {
      const index = this.pinecone.index(this.indexName);
      const chunkIds = doc.chunks.map(c => c.id);
      await index.deleteMany(chunkIds);
    } catch (error) {
      console.error('Error deleting from vector DB:', error);
    }

    documents.delete(documentId);
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
