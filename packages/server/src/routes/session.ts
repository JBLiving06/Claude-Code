/**
 * Session API Routes - Workshop participant sessions
 */

import { Router } from 'express';
import { z } from 'zod';
import { workshopService } from '../services/workshop.service.js';
import { validateRequest } from '../middleware/validate.js';

export const sessionRouter = Router();

// Validation schemas
const startSessionSchema = z.object({
  body: z.object({
    workshopId: z.string().min(1),
    participantId: z.string().optional(),
  }),
});

const askQuestionSchema = z.object({
  body: z.object({
    question: z.string().min(1).max(1000),
  }),
  params: z.object({
    sessionId: z.string(),
  }),
});

const updateProgressSchema = z.object({
  body: z.object({
    segmentId: z.string().min(1),
    timestamp: z.number().min(0),
  }),
  params: z.object({
    sessionId: z.string(),
  }),
});

// Start a new workshop session
sessionRouter.post('/', validateRequest(startSessionSchema), async (req, res) => {
  try {
    const session = await workshopService.startSession(
      req.body.workshopId,
      req.body.participantId
    );

    const workshop = await workshopService.getWorkshop(req.body.workshopId);

    res.status(201).json({
      success: true,
      data: {
        sessionId: session.id,
        workshopId: session.workshopId,
        participantId: session.participantId,
        workshop: {
          title: workshop?.title,
          totalSegments: workshop?.segments.length || 0,
          estimatedDuration: workshop?.segments.reduce((sum, s) => sum + s.duration, 0) || 0,
        },
      },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'START_SESSION_FAILED', message: (error as Error).message },
    });
  }
});

// Get session details
sessionRouter.get('/:sessionId', async (req, res) => {
  try {
    const session = await workshopService.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }
    res.json({
      success: true,
      data: session,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_SESSION_FAILED', message: (error as Error).message },
    });
  }
});

// Ask a question during the session
sessionRouter.post('/:sessionId/questions', validateRequest(askQuestionSchema), async (req, res) => {
  try {
    const result = await workshopService.handleQuestion(
      req.params.sessionId,
      req.body.question
    );

    res.json({
      success: true,
      data: {
        answer: result.answer,
        sources: result.sources,
      },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUESTION_FAILED', message: (error as Error).message },
    });
  }
});

// Update session progress (video position)
sessionRouter.patch('/:sessionId/progress', validateRequest(updateProgressSchema), async (req, res) => {
  try {
    const session = await workshopService.updateSessionProgress(
      req.params.sessionId,
      req.body.segmentId,
      req.body.timestamp
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    res.json({
      success: true,
      data: {
        currentSegmentId: session.currentSegmentId,
        currentTimestamp: session.currentTimestamp,
        progress: session.progress,
      },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_PROGRESS_FAILED', message: (error as Error).message },
    });
  }
});

// Complete the session
sessionRouter.post('/:sessionId/complete', async (req, res) => {
  try {
    const session = await workshopService.completeSession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    res.json({
      success: true,
      data: {
        completedAt: session.completedAt,
        totalQuestions: session.questionsAsked.length,
        totalDuration: session.completedAt && session.startedAt
          ? Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 1000)
          : 0,
      },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'COMPLETE_FAILED', message: (error as Error).message },
    });
  }
});

// Get session question history
sessionRouter.get('/:sessionId/questions', async (req, res) => {
  try {
    const session = await workshopService.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Session not found' },
      });
    }

    res.json({
      success: true,
      data: session.questionsAsked,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_QUESTIONS_FAILED', message: (error as Error).message },
    });
  }
});
