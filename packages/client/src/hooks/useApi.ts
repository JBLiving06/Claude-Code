/**
 * API Hook - HTTP requests to the server
 */

import { useCallback } from 'react';
import type { ApiResponse } from '@avatar-workshop/shared';

const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data!;
}

export function useApi() {
  // Workshop endpoints
  const getWorkshops = useCallback(() => {
    return fetchApi<Array<{ id: string; title: string; description: string; status: string }>>('/workshops');
  }, []);

  const getWorkshop = useCallback((workshopId: string) => {
    return fetchApi<{
      id: string;
      title: string;
      description: string;
      segments: Array<{
        id: string;
        title: string;
        duration: number;
        videoUrl?: string;
        script: string;
      }>;
      settings: Record<string, unknown>;
    }>(`/workshops/${workshopId}`);
  }, []);

  // Session endpoints
  const startSession = useCallback((workshopId: string) => {
    return fetchApi<{
      sessionId: string;
      workshopId: string;
      participantId: string;
      workshop: {
        title: string;
        totalSegments: number;
        estimatedDuration: number;
      };
    }>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ workshopId }),
    });
  }, []);

  const getSession = useCallback((sessionId: string) => {
    return fetchApi<{
      id: string;
      workshopId: string;
      currentSegmentId: string;
      currentTimestamp: number;
      progress: number;
    }>(`/sessions/${sessionId}`);
  }, []);

  const askQuestion = useCallback((sessionId: string, question: string) => {
    return fetchApi<{
      answer: string;
      sources: string[];
    }>(`/sessions/${sessionId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }, []);

  const updateProgress = useCallback((
    sessionId: string,
    segmentId: string,
    timestamp: number
  ) => {
    return fetchApi<{ progress: number }>(`/sessions/${sessionId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ segmentId, timestamp }),
    });
  }, []);

  const completeSession = useCallback((sessionId: string) => {
    return fetchApi<{ completedAt: string }>(`/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }, []);

  return {
    getWorkshops,
    getWorkshop,
    startSession,
    getSession,
    askQuestion,
    updateProgress,
    completeSession,
  };
}
