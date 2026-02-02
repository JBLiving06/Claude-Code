/**
 * WebSocket Handler for Real-time Q&A
 *
 * Enables real-time interaction between students and the avatar
 * during workshop sessions.
 */

import type { Application } from 'express';
import type WebSocket from 'ws';
import { workshopService } from '../services/workshop.service.js';
import { getAvatarService } from '../services/avatar/index.js';

interface WSClient {
  ws: WebSocket;
  sessionId: string;
  avatarSessionId?: string;
}

const clients = new Map<string, WSClient>();

export function setupWebSocket(app: Application) {
  // @ts-expect-error - express-ws types
  app.ws('/ws', (ws: WebSocket, req: { query: { sessionId?: string } }) => {
    const sessionId = req.query.sessionId;

    if (!sessionId) {
      ws.close(4000, 'Session ID required');
      return;
    }

    // Register client
    const clientId = Math.random().toString(36).slice(2);
    clients.set(clientId, { ws, sessionId });

    console.log(`WebSocket connected: ${clientId} (session: ${sessionId})`);

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connect',
      payload: { clientId, sessionId },
      timestamp: new Date(),
    }));

    // Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(clientId, message);
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: new Date(),
        }));
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      const client = clients.get(clientId);
      if (client?.avatarSessionId) {
        // End avatar session if active
        try {
          getAvatarService('d-id').endSession(client.avatarSessionId);
        } catch {
          // Ignore cleanup errors
        }
      }
      clients.delete(clientId);
      console.log(`WebSocket disconnected: ${clientId}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    });
  });
}

async function handleMessage(
  clientId: string,
  message: { type: string; payload: Record<string, unknown> }
) {
  const client = clients.get(clientId);
  if (!client) return;

  const { ws, sessionId } = client;

  switch (message.type) {
    case 'question': {
      const question = message.payload.question as string;
      if (!question) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Question is required' },
          timestamp: new Date(),
        }));
        return;
      }

      // Notify that we're processing
      ws.send(JSON.stringify({
        type: 'answer_start',
        payload: {},
        timestamp: new Date(),
      }));

      try {
        // Get answer from knowledge base
        const result = await workshopService.handleQuestion(sessionId, question);

        // Send the answer
        ws.send(JSON.stringify({
          type: 'answer_complete',
          payload: {
            answer: result.answer,
            sources: result.sources,
          },
          timestamp: new Date(),
        }));

        // If avatar session is active, have the avatar speak
        if (client.avatarSessionId) {
          ws.send(JSON.stringify({
            type: 'avatar_speaking',
            payload: { text: result.answer },
            timestamp: new Date(),
          }));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: (error as Error).message },
          timestamp: new Date(),
        }));
      }
      break;
    }

    case 'start_avatar_session': {
      // Start an interactive avatar session for live Q&A
      const avatarId = message.payload.avatarId as string;
      const provider = (message.payload.provider as 'd-id' | 'heygen') || 'd-id';

      try {
        const session = await workshopService.getSession(sessionId);
        if (!session) {
          throw new Error('Workshop session not found');
        }

        const workshop = await workshopService.getWorkshop(session.workshopId);
        if (!workshop) {
          throw new Error('Workshop not found');
        }

        const avatarService = getAvatarService(provider);
        const avatarSession = await avatarService.startInteractiveSession(avatarId, {
          systemPrompt: `You are an AI workshop instructor helping students learn about sophisticated AI use in academics.
            The student is currently in a workshop titled "${workshop.title}".
            Be helpful, encouraging, and keep answers conversational.`,
          knowledgeText: '', // Would be populated from knowledge base
          llmProvider: 'openai',
          llmModel: 'gpt-4-turbo-preview',
        });

        client.avatarSessionId = avatarSession.sessionId;

        ws.send(JSON.stringify({
          type: 'avatar_session_started',
          payload: {
            avatarSessionId: avatarSession.sessionId,
            streamUrl: avatarSession.streamUrl,
            websocketUrl: avatarSession.websocketUrl,
          },
          timestamp: new Date(),
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: (error as Error).message },
          timestamp: new Date(),
        }));
      }
      break;
    }

    case 'end_avatar_session': {
      if (client.avatarSessionId) {
        try {
          await getAvatarService('d-id').endSession(client.avatarSessionId);
          client.avatarSessionId = undefined;

          ws.send(JSON.stringify({
            type: 'avatar_session_ended',
            payload: {},
            timestamp: new Date(),
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: (error as Error).message },
            timestamp: new Date(),
          }));
        }
      }
      break;
    }

    case 'progress_update': {
      // Update the session progress
      const segmentId = message.payload.segmentId as string;
      const timestamp = message.payload.timestamp as number;

      if (segmentId && typeof timestamp === 'number') {
        await workshopService.updateSessionProgress(sessionId, segmentId, timestamp);
      }
      break;
    }

    default:
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: `Unknown message type: ${message.type}` },
        timestamp: new Date(),
      }));
  }
}
