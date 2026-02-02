/**
 * WebSocket Hook - Real-time communication with the server
 */

import { useEffect, useRef, useCallback } from 'react';
import { useWorkshopStore } from '../store/workshop';

interface WSMessage {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export function useWebSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const {
    setWsConnected,
    addQuestion,
    setIsAvatarSpeaking,
    setCurrentAnswer,
  } = useWorkshopStore();

  const connect = useCallback(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?sessionId=${sessionId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);

      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }, [sessionId, setWsConnected]);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'connect':
        console.log('Connected with client ID:', message.payload.clientId);
        break;

      case 'answer_start':
        setIsAvatarSpeaking(true);
        setCurrentAnswer('');
        break;

      case 'answer_chunk':
        setCurrentAnswer((prev) => (prev || '') + (message.payload.text as string));
        break;

      case 'answer_complete':
        setIsAvatarSpeaking(false);
        setCurrentAnswer(message.payload.answer as string);

        // Add to question history
        addQuestion({
          id: Date.now().toString(),
          timestamp: new Date(),
          question: '', // Will be set from the UI
          answer: message.payload.answer as string,
          segmentId: '',
          segmentTimestamp: 0,
          sourcesUsed: (message.payload.sources as string[]) || [],
          responseTime: 0,
        });
        break;

      case 'avatar_speaking':
        setIsAvatarSpeaking(true);
        break;

      case 'avatar_session_started':
        console.log('Avatar session started:', message.payload);
        break;

      case 'error':
        console.error('Server error:', message.payload.message);
        setIsAvatarSpeaking(false);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [setIsAvatarSpeaking, setCurrentAnswer, addQuestion]);

  const sendMessage = useCallback((type: string, payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket not connected');
    }
  }, []);

  const askQuestion = useCallback((question: string) => {
    sendMessage('question', { question });
  }, [sendMessage]);

  const updateProgress = useCallback((segmentId: string, timestamp: number) => {
    sendMessage('progress_update', { segmentId, timestamp });
  }, [sendMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    askQuestion,
    updateProgress,
    sendMessage,
  };
}
