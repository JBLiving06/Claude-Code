/**
 * Avatar Workshop System - Server Entry Point
 */

import express from 'express';
import cors from 'cors';
import expressWs from 'express-ws';
import { config } from './config/index.js';
import { workshopRouter } from './routes/workshop.js';
import { knowledgeBaseRouter } from './routes/knowledge-base.js';
import { avatarRouter } from './routes/avatar.js';
import { sessionRouter } from './routes/session.js';
import { setupWebSocket } from './websocket/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';

const { app } = expressWs(express());

// Middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '50mb' }));
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/workshops', workshopRouter);
app.use('/api/knowledge-bases', knowledgeBaseRouter);
app.use('/api/avatars', avatarRouter);
app.use('/api/sessions', sessionRouter);

// WebSocket for real-time Q&A
setupWebSocket(app);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🎭 Avatar Workshop Server running on port ${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
});

export { app };
