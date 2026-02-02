/**
 * Workshop API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { workshopService } from '../services/workshop.service.js';
import { validateRequest } from '../middleware/validate.js';
import type { ApiResponse } from '@avatar-workshop/shared';

export const workshopRouter = Router();

// Validation schemas
const createWorkshopSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    avatarId: z.string().min(1),
    knowledgeBaseId: z.string().min(1),
    settings: z.object({
      allowSpeedControl: z.boolean().optional(),
      allowPause: z.boolean().optional(),
      allowRewind: z.boolean().optional(),
      enableQA: z.boolean().optional(),
      qaMode: z.enum(['always_available', 'at_interaction_points', 'end_of_segment', 'disabled']).optional(),
      showTranscript: z.boolean().optional(),
      language: z.string().optional(),
    }).optional(),
  }),
});

const addSegmentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    script: z.string().min(1),
    order: z.number().int().min(0).optional(),
    interactionPoints: z.array(z.object({
      id: z.string(),
      timestamp: z.number(),
      type: z.enum(['free_question', 'multiple_choice', 'reflection_pause', 'quiz', 'poll']),
      prompt: z.string().optional(),
      options: z.array(z.object({
        id: z.string(),
        text: z.string(),
        targetSegmentId: z.string().optional(),
        responseScript: z.string().optional(),
      })).optional(),
      pauseVideo: z.boolean(),
    })).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Create a new workshop
workshopRouter.post('/', validateRequest(createWorkshopSchema), async (req, res) => {
  try {
    const workshop = await workshopService.createWorkshop(req.body);
    const response: ApiResponse<typeof workshop> = {
      success: true,
      data: workshop,
      meta: { requestId: req.id, timestamp: new Date() },
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: (error as Error).message },
    });
  }
});

// List all workshops
workshopRouter.get('/', async (req, res) => {
  try {
    const workshops = await workshopService.listWorkshops();
    res.json({
      success: true,
      data: workshops,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LIST_FAILED', message: (error as Error).message },
    });
  }
});

// Get a specific workshop
workshopRouter.get('/:id', async (req, res) => {
  try {
    const workshop = await workshopService.getWorkshop(req.params.id);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Workshop not found' },
      });
    }
    res.json({
      success: true,
      data: workshop,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: (error as Error).message },
    });
  }
});

// Update a workshop
workshopRouter.patch('/:id', async (req, res) => {
  try {
    const workshop = await workshopService.updateWorkshop(req.params.id, req.body);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Workshop not found' },
      });
    }
    res.json({
      success: true,
      data: workshop,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: (error as Error).message },
    });
  }
});

// Add a segment to a workshop
workshopRouter.post('/:id/segments', validateRequest(addSegmentSchema), async (req, res) => {
  try {
    const segment = await workshopService.addSegment(req.params.id, req.body);
    res.status(201).json({
      success: true,
      data: segment,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ADD_SEGMENT_FAILED', message: (error as Error).message },
    });
  }
});

// Update a segment
workshopRouter.patch('/:id/segments/:segmentId', async (req, res) => {
  try {
    const segment = await workshopService.updateSegment(req.params.id, req.params.segmentId, req.body);
    if (!segment) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Segment not found' },
      });
    }
    res.json({
      success: true,
      data: segment,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_SEGMENT_FAILED', message: (error as Error).message },
    });
  }
});

// Delete a segment
workshopRouter.delete('/:id/segments/:segmentId', async (req, res) => {
  try {
    const deleted = await workshopService.deleteSegment(req.params.id, req.params.segmentId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Segment not found' },
      });
    }
    res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_SEGMENT_FAILED', message: (error as Error).message },
    });
  }
});

// Generate video for a segment
workshopRouter.post('/:id/segments/:segmentId/generate', async (req, res) => {
  try {
    const result = await workshopService.generateSegmentVideo(req.params.id, req.params.segmentId);
    res.json({
      success: true,
      data: result,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GENERATE_FAILED', message: (error as Error).message },
    });
  }
});

// Generate all videos for a workshop
workshopRouter.post('/:id/generate-all', async (req, res) => {
  try {
    const results = await workshopService.generateAllVideos(req.params.id);
    res.json({
      success: true,
      data: results,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GENERATE_ALL_FAILED', message: (error as Error).message },
    });
  }
});

// Publish a workshop
workshopRouter.post('/:id/publish', async (req, res) => {
  try {
    const workshop = await workshopService.publishWorkshop(req.params.id);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Workshop not found' },
      });
    }
    res.json({
      success: true,
      data: workshop,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'PUBLISH_FAILED', message: (error as Error).message },
    });
  }
});

// Get workshop analytics
workshopRouter.get('/:id/analytics', async (req, res) => {
  try {
    const analytics = await workshopService.getWorkshopAnalytics(req.params.id);
    res.json({
      success: true,
      data: analytics,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_FAILED', message: (error as Error).message },
    });
  }
});
