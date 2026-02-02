/**
 * Avatar API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import { getAvatarService, listAllAvatars } from '../services/avatar/index.js';
import { validateRequest } from '../middleware/validate.js';
import type { AvatarProvider } from '@avatar-workshop/shared';

export const avatarRouter = Router();

// Validation schemas
const generateVideoSchema = z.object({
  body: z.object({
    avatarId: z.string().min(1),
    script: z.string().min(1).max(10000),
    outputSettings: z.object({
      speakingRate: z.number().min(0.5).max(2).optional(),
      pitch: z.number().min(0.5).max(2).optional(),
      expressiveness: z.number().min(0).max(1).optional(),
      backgroundType: z.enum(['solid', 'image', 'transparent', 'green_screen']).optional(),
      backgroundColor: z.string().optional(),
      backgroundImageUrl: z.string().url().optional(),
      outputQuality: z.enum(['720p', '1080p', '4k']).optional(),
    }).optional(),
  }),
  params: z.object({
    provider: z.enum(['d-id', 'heygen']),
  }),
});

const startSessionSchema = z.object({
  body: z.object({
    avatarId: z.string().min(1),
    knowledgeConfig: z.object({
      systemPrompt: z.string().min(1),
      knowledgeText: z.string().optional(),
      documents: z.array(z.object({
        name: z.string(),
        content: z.string(),
      })).optional(),
      llmProvider: z.enum(['openai', 'anthropic']),
      llmModel: z.string(),
      maxResponseTokens: z.number().int().optional(),
      temperature: z.number().min(0).max(2).optional(),
    }),
  }),
  params: z.object({
    provider: z.enum(['d-id', 'heygen']),
  }),
});

// List all avatars from all providers
avatarRouter.get('/', async (req, res) => {
  try {
    const avatars = await listAllAvatars();
    res.json({
      success: true,
      data: avatars,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LIST_FAILED', message: (error as Error).message },
    });
  }
});

// List avatars from a specific provider
avatarRouter.get('/provider/:provider', async (req, res) => {
  try {
    const service = getAvatarService(req.params.provider as AvatarProvider);
    const avatars = await service.listAvatars();
    res.json({
      success: true,
      data: avatars,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LIST_FAILED', message: (error as Error).message },
    });
  }
});

// Get a specific avatar
avatarRouter.get('/provider/:provider/:avatarId', async (req, res) => {
  try {
    const service = getAvatarService(req.params.provider as AvatarProvider);
    const avatar = await service.getAvatar(req.params.avatarId);
    if (!avatar) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Avatar not found' },
      });
    }
    res.json({
      success: true,
      data: avatar,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: (error as Error).message },
    });
  }
});

// Generate a video with an avatar
avatarRouter.post('/provider/:provider/generate', validateRequest(generateVideoSchema), async (req, res) => {
  try {
    const service = getAvatarService(req.params.provider as AvatarProvider);
    const result = await service.generateVideo(req.body);
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

// Check video generation status
avatarRouter.get('/provider/:provider/jobs/:jobId', async (req, res) => {
  try {
    const service = getAvatarService(req.params.provider as AvatarProvider);
    const result = await service.getVideoStatus(req.params.jobId);
    res.json({
      success: true,
      data: result,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_FAILED', message: (error as Error).message },
    });
  }
});

// Start an interactive avatar session
avatarRouter.post('/provider/:provider/sessions', validateRequest(startSessionSchema), async (req, res) => {
  try {
    const service = getAvatarService(req.params.provider as AvatarProvider);
    const session = await service.startInteractiveSession(
      req.body.avatarId,
      req.body.knowledgeConfig
    );
    res.json({
      success: true,
      data: session,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SESSION_START_FAILED', message: (error as Error).message },
    });
  }
});

// Send a message to an interactive session
avatarRouter.post('/provider/:provider/sessions/:sessionId/message', async (req, res) => {
  try {
    const service = getAvatarService(req.params.provider as AvatarProvider);
    const response = await service.sendMessage(req.params.sessionId, req.body.message);
    res.json({
      success: true,
      data: response,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'MESSAGE_FAILED', message: (error as Error).message },
    });
  }
});

// End an interactive session
avatarRouter.delete('/provider/:provider/sessions/:sessionId', async (req, res) => {
  try {
    const service = getAvatarService(req.params.provider as AvatarProvider);
    await service.endSession(req.params.sessionId);
    res.json({
      success: true,
      data: { ended: true },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SESSION_END_FAILED', message: (error as Error).message },
    });
  }
});
