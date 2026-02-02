/**
 * Workshop Service - Manages workshop content and sessions
 */

import { nanoid } from 'nanoid';
import type {
  Workshop,
  WorkshopSegment,
  WorkshopSession,
  WorkshopSettings,
  VideoStatus,
  CreateWorkshopRequest,
  AddSegmentRequest,
} from '@avatar-workshop/shared';
import { getAvatarService } from './avatar/index.js';
import { knowledgeBaseService } from './knowledge-base.service.js';

// In-memory stores (replace with database in production)
const workshops = new Map<string, Workshop>();
const sessions = new Map<string, WorkshopSession>();

const defaultSettings: WorkshopSettings = {
  allowSpeedControl: true,
  allowPause: true,
  allowRewind: true,
  enableQA: true,
  qaMode: 'always_available',
  showTranscript: true,
  language: 'en',
};

export class WorkshopService {
  /**
   * Create a new workshop
   */
  async createWorkshop(request: CreateWorkshopRequest): Promise<Workshop> {
    const workshop: Workshop = {
      id: nanoid(),
      title: request.title,
      description: request.description || '',
      avatarId: request.avatarId,
      knowledgeBaseId: request.knowledgeBaseId,
      segments: [],
      settings: { ...defaultSettings, ...request.settings },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft',
    };

    workshops.set(workshop.id, workshop);
    return workshop;
  }

  /**
   * Get a workshop by ID
   */
  async getWorkshop(id: string): Promise<Workshop | null> {
    return workshops.get(id) || null;
  }

  /**
   * List all workshops
   */
  async listWorkshops(): Promise<Workshop[]> {
    return Array.from(workshops.values());
  }

  /**
   * Update a workshop
   */
  async updateWorkshop(id: string, updates: Partial<Workshop>): Promise<Workshop | null> {
    const workshop = workshops.get(id);
    if (!workshop) return null;

    const updated: Workshop = {
      ...workshop,
      ...updates,
      updatedAt: new Date(),
    };

    workshops.set(id, updated);
    return updated;
  }

  /**
   * Add a segment to a workshop
   */
  async addSegment(workshopId: string, request: AddSegmentRequest): Promise<WorkshopSegment> {
    const workshop = workshops.get(workshopId);
    if (!workshop) {
      throw new Error(`Workshop not found: ${workshopId}`);
    }

    const order = request.order ?? workshop.segments.length;

    const segment: WorkshopSegment = {
      id: nanoid(),
      workshopId,
      order,
      title: request.title,
      duration: this.estimateDuration(request.script),
      videoUrl: undefined,
      videoStatus: 'pending',
      script: request.script,
      interactionPoints: request.interactionPoints || [],
      transitions: [],
    };

    // Insert at correct position
    workshop.segments.splice(order, 0, segment);

    // Reorder subsequent segments
    workshop.segments.forEach((s, i) => {
      s.order = i;
    });

    workshop.updatedAt = new Date();
    return segment;
  }

  /**
   * Update a segment
   */
  async updateSegment(
    workshopId: string,
    segmentId: string,
    updates: Partial<WorkshopSegment>
  ): Promise<WorkshopSegment | null> {
    const workshop = workshops.get(workshopId);
    if (!workshop) return null;

    const segmentIndex = workshop.segments.findIndex(s => s.id === segmentId);
    if (segmentIndex === -1) return null;

    const updated = {
      ...workshop.segments[segmentIndex],
      ...updates,
    };

    // Recalculate duration if script changed
    if (updates.script) {
      updated.duration = this.estimateDuration(updates.script);
      updated.videoStatus = 'pending'; // Needs re-rendering
    }

    workshop.segments[segmentIndex] = updated;
    workshop.updatedAt = new Date();

    return updated;
  }

  /**
   * Delete a segment
   */
  async deleteSegment(workshopId: string, segmentId: string): Promise<boolean> {
    const workshop = workshops.get(workshopId);
    if (!workshop) return false;

    const index = workshop.segments.findIndex(s => s.id === segmentId);
    if (index === -1) return false;

    workshop.segments.splice(index, 1);
    workshop.segments.forEach((s, i) => {
      s.order = i;
    });

    workshop.updatedAt = new Date();
    return true;
  }

  /**
   * Generate video for a segment
   */
  async generateSegmentVideo(
    workshopId: string,
    segmentId: string
  ): Promise<{ jobId: string; status: VideoStatus }> {
    const workshop = workshops.get(workshopId);
    if (!workshop) {
      throw new Error(`Workshop not found: ${workshopId}`);
    }

    const segment = workshop.segments.find(s => s.id === segmentId);
    if (!segment) {
      throw new Error(`Segment not found: ${segmentId}`);
    }

    // Get avatar provider from the avatar configuration
    // For now, assume D-ID as default
    const avatarService = getAvatarService('d-id');

    segment.videoStatus = 'generating';

    try {
      const result = await avatarService.generateVideo({
        avatarId: workshop.avatarId,
        script: segment.script,
      });

      return {
        jobId: result.jobId,
        status: result.status === 'completed' ? 'ready' : 'generating',
      };
    } catch (error) {
      segment.videoStatus = 'failed';
      throw error;
    }
  }

  /**
   * Generate videos for all segments in a workshop
   */
  async generateAllVideos(workshopId: string): Promise<Array<{ segmentId: string; jobId: string }>> {
    const workshop = workshops.get(workshopId);
    if (!workshop) {
      throw new Error(`Workshop not found: ${workshopId}`);
    }

    workshop.status = 'rendering';

    const results: Array<{ segmentId: string; jobId: string }> = [];

    for (const segment of workshop.segments) {
      if (segment.videoStatus === 'pending' || segment.videoStatus === 'failed') {
        const { jobId } = await this.generateSegmentVideo(workshopId, segment.id);
        results.push({ segmentId: segment.id, jobId });
      }
    }

    return results;
  }

  /**
   * Publish a workshop (make it available to students)
   */
  async publishWorkshop(workshopId: string): Promise<Workshop | null> {
    const workshop = workshops.get(workshopId);
    if (!workshop) return null;

    // Check all segments have videos ready
    const allReady = workshop.segments.every(s => s.videoStatus === 'ready');
    if (!allReady) {
      throw new Error('Cannot publish: some segments do not have generated videos');
    }

    workshop.status = 'published';
    workshop.publishedAt = new Date();
    workshop.updatedAt = new Date();

    return workshop;
  }

  // ============ Session Management ============

  /**
   * Start a new workshop session for a participant
   */
  async startSession(workshopId: string, participantId?: string): Promise<WorkshopSession> {
    const workshop = workshops.get(workshopId);
    if (!workshop) {
      throw new Error(`Workshop not found: ${workshopId}`);
    }

    if (workshop.status !== 'published') {
      throw new Error('Workshop is not published');
    }

    const session: WorkshopSession = {
      id: nanoid(),
      workshopId,
      participantId: participantId || nanoid(),
      startedAt: new Date(),
      currentSegmentId: workshop.segments[0]?.id || '',
      currentTimestamp: 0,
      questionsAsked: [],
      interactions: [],
      progress: 0,
    };

    sessions.set(session.id, session);
    return session;
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<WorkshopSession | null> {
    return sessions.get(sessionId) || null;
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(
    sessionId: string,
    segmentId: string,
    timestamp: number
  ): Promise<WorkshopSession | null> {
    const session = sessions.get(sessionId);
    if (!session) return null;

    const workshop = workshops.get(session.workshopId);
    if (!workshop) return null;

    session.currentSegmentId = segmentId;
    session.currentTimestamp = timestamp;

    // Calculate overall progress
    const currentSegmentIndex = workshop.segments.findIndex(s => s.id === segmentId);
    const totalDuration = workshop.segments.reduce((sum, s) => sum + s.duration, 0);
    const completedDuration = workshop.segments
      .slice(0, currentSegmentIndex)
      .reduce((sum, s) => sum + s.duration, 0) + timestamp;

    session.progress = Math.round((completedDuration / totalDuration) * 100);

    return session;
  }

  /**
   * Handle a Q&A question in a session
   */
  async handleQuestion(
    sessionId: string,
    question: string
  ): Promise<{ answer: string; sources: string[] }> {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const workshop = workshops.get(session.workshopId);
    if (!workshop) {
      throw new Error(`Workshop not found: ${session.workshopId}`);
    }

    const startTime = Date.now();

    // Get current segment context
    const currentSegment = workshop.segments.find(s => s.id === session.currentSegmentId);
    const context = currentSegment ? {
      previousQuestions: session.questionsAsked.slice(-3).map(q => ({
        question: q.question,
        answer: q.answer,
      })),
      currentSegment: {
        title: currentSegment.title,
        content: currentSegment.script,
      },
    } : undefined;

    // Generate answer using RAG
    const result = await knowledgeBaseService.generateAnswer({
      question,
      knowledgeBaseId: workshop.knowledgeBaseId,
      context,
      settings: {
        speakingFriendly: true,
        includeSourceCitations: true,
      },
    });

    // Record the question
    session.questionsAsked.push({
      id: nanoid(),
      timestamp: new Date(),
      question,
      answer: result.answer,
      segmentId: session.currentSegmentId,
      segmentTimestamp: session.currentTimestamp,
      sourcesUsed: result.sources.map(s => s.documentTitle),
      responseTime: Date.now() - startTime,
    });

    return {
      answer: result.answer,
      sources: result.sources.map(s => s.documentTitle),
    };
  }

  /**
   * Complete a session
   */
  async completeSession(sessionId: string): Promise<WorkshopSession | null> {
    const session = sessions.get(sessionId);
    if (!session) return null;

    session.completedAt = new Date();
    session.progress = 100;

    return session;
  }

  /**
   * Get session analytics for a workshop
   */
  async getWorkshopAnalytics(workshopId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageProgress: number;
    totalQuestions: number;
    commonQuestions: Array<{ question: string; count: number }>;
  }> {
    const workshopSessions = Array.from(sessions.values())
      .filter(s => s.workshopId === workshopId);

    const completedSessions = workshopSessions.filter(s => s.completedAt);
    const allQuestions = workshopSessions.flatMap(s => s.questionsAsked);

    // Count question frequency (simplified - would use NLP similarity in production)
    const questionCounts = new Map<string, number>();
    allQuestions.forEach(q => {
      const normalized = q.question.toLowerCase().trim();
      questionCounts.set(normalized, (questionCounts.get(normalized) || 0) + 1);
    });

    const commonQuestions = Array.from(questionCounts.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: workshopSessions.length,
      completedSessions: completedSessions.length,
      averageProgress: workshopSessions.length > 0
        ? workshopSessions.reduce((sum, s) => sum + s.progress, 0) / workshopSessions.length
        : 0,
      totalQuestions: allQuestions.length,
      commonQuestions,
    };
  }

  /**
   * Estimate video duration from script (words per minute)
   */
  private estimateDuration(script: string): number {
    const words = script.split(/\s+/).length;
    const wordsPerMinute = 150; // Average speaking rate
    return Math.ceil((words / wordsPerMinute) * 60);
  }
}

export const workshopService = new WorkshopService();
