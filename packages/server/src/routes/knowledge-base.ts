/**
 * Knowledge Base API Routes
 */

import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { knowledgeBaseService } from '../services/knowledge-base.service.js';
import { validateRequest } from '../middleware/validate.js';
import { normalizeText } from '../utils/text-processing.js';

export const knowledgeBaseRouter = Router();

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max (D-ID limit)
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, TXT, PPTX'));
    }
  },
});

// Validation schemas
const createKBSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    settings: z.object({
      chunkSize: z.number().int().min(100).max(2000).optional(),
      chunkOverlap: z.number().int().min(0).max(500).optional(),
      embeddingModel: z.enum([
        'text-embedding-3-small',
        'text-embedding-3-large',
        'text-embedding-ada-002',
        'voyage-large-2',
        'cohere-embed-v3',
      ]).optional(),
      retrievalTopK: z.number().int().min(1).max(20).optional(),
      similarityThreshold: z.number().min(0).max(1).optional(),
      responseStyle: z.enum(['conversational', 'academic', 'concise', 'explanatory']).optional(),
      groundingMode: z.enum(['strict', 'augmented', 'hybrid']).optional(),
    }).optional(),
  }),
});

const addDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).optional(),
    url: z.string().url().optional(),
    metadata: z.object({
      author: z.string().optional(),
      publishedDate: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      language: z.string().optional(),
    }).optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

const querySchema = z.object({
  body: z.object({
    query: z.string().min(1).max(1000),
    topK: z.number().int().min(1).max(20).optional(),
    includeMetadata: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string(),
  }),
});

// Create a new knowledge base
knowledgeBaseRouter.post('/', validateRequest(createKBSchema), async (req, res) => {
  try {
    const kb = await knowledgeBaseService.createKnowledgeBase(
      req.body.name,
      req.body.description,
      req.body.settings
    );
    res.status(201).json({
      success: true,
      data: kb,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: (error as Error).message },
    });
  }
});

// List all knowledge bases
knowledgeBaseRouter.get('/', async (req, res) => {
  try {
    const kbs = await knowledgeBaseService.listKnowledgeBases();
    res.json({
      success: true,
      data: kbs,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LIST_FAILED', message: (error as Error).message },
    });
  }
});

// Get a specific knowledge base
knowledgeBaseRouter.get('/:id', async (req, res) => {
  try {
    const kb = await knowledgeBaseService.getKnowledgeBase(req.params.id);
    if (!kb) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Knowledge base not found' },
      });
    }
    res.json({
      success: true,
      data: kb,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: (error as Error).message },
    });
  }
});

// Add a document (text content)
knowledgeBaseRouter.post('/:id/documents', validateRequest(addDocumentSchema), async (req, res) => {
  try {
    if (!req.body.content && !req.body.url) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Either content or url is required' },
      });
    }

    let content = req.body.content;

    // If URL provided, fetch content
    if (req.body.url && !content) {
      const response = await fetch(req.body.url);
      content = await response.text();
    }

    // Normalize the text
    content = normalizeText(content);

    const doc = await knowledgeBaseService.addDocument(
      req.params.id,
      req.body.title,
      content,
      req.body.metadata
    );

    res.status(201).json({
      success: true,
      data: {
        id: doc.id,
        title: doc.title,
        status: doc.status,
        chunkCount: doc.chunks.length,
      },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ADD_DOCUMENT_FAILED', message: (error as Error).message },
    });
  }
});

// Upload a document file
knowledgeBaseRouter.post('/:id/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
    }

    let content: string;
    const title = req.body.title || req.file.originalname;

    // Parse based on file type
    if (req.file.mimetype === 'application/pdf') {
      // Dynamic import for pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(req.file.buffer);
      content = pdfData.text;
    } else if (req.file.mimetype === 'text/plain') {
      content = req.file.buffer.toString('utf-8');
    } else {
      // For PPTX, we'd need additional parsing logic
      // For now, return error
      return res.status(400).json({
        success: false,
        error: { code: 'UNSUPPORTED_FORMAT', message: 'PPTX parsing not yet implemented' },
      });
    }

    // Normalize the text
    content = normalizeText(content);

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : undefined;

    const doc = await knowledgeBaseService.addDocument(
      req.params.id,
      title,
      content,
      metadata
    );

    res.status(201).json({
      success: true,
      data: {
        id: doc.id,
        title: doc.title,
        status: doc.status,
        chunkCount: doc.chunks.length,
      },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: (error as Error).message },
    });
  }
});

// Delete a document
knowledgeBaseRouter.delete('/:id/documents/:docId', async (req, res) => {
  try {
    await knowledgeBaseService.deleteDocument(req.params.docId);
    res.json({
      success: true,
      data: { deleted: true },
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: (error as Error).message },
    });
  }
});

// Query the knowledge base (RAG search)
knowledgeBaseRouter.post('/:id/query', validateRequest(querySchema), async (req, res) => {
  try {
    const result = await knowledgeBaseService.query({
      query: req.body.query,
      knowledgeBaseId: req.params.id,
      topK: req.body.topK,
      includeMetadata: req.body.includeMetadata,
    });

    res.json({
      success: true,
      data: result,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'QUERY_FAILED', message: (error as Error).message },
    });
  }
});

// Generate an answer (RAG + LLM)
knowledgeBaseRouter.post('/:id/answer', async (req, res) => {
  try {
    const result = await knowledgeBaseService.generateAnswer({
      question: req.body.question,
      knowledgeBaseId: req.params.id,
      context: req.body.context,
      settings: req.body.settings,
    });

    res.json({
      success: true,
      data: result,
      meta: { requestId: req.id, timestamp: new Date() },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ANSWER_FAILED', message: (error as Error).message },
    });
  }
});
