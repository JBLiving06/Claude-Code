/**
 * Workshop Store - State management for workshop sessions
 */

import { create } from 'zustand';
import type {
  Workshop,
  WorkshopSession,
  WorkshopSegment,
  SessionQuestion,
} from '@avatar-workshop/shared';

interface WorkshopState {
  // Current workshop data
  workshop: Workshop | null;
  session: WorkshopSession | null;
  currentSegment: WorkshopSegment | null;

  // Playback state
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  volume: number;

  // Q&A state
  isQAPanelOpen: boolean;
  questionHistory: SessionQuestion[];
  isAvatarSpeaking: boolean;
  currentAnswer: string | null;

  // WebSocket connection
  wsConnected: boolean;

  // Actions
  setWorkshop: (workshop: Workshop) => void;
  setSession: (session: WorkshopSession) => void;
  setCurrentSegment: (segment: WorkshopSegment) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleQAPanel: () => void;
  addQuestion: (question: SessionQuestion) => void;
  setIsAvatarSpeaking: (speaking: boolean) => void;
  setCurrentAnswer: (answer: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  reset: () => void;
}

const initialState = {
  workshop: null,
  session: null,
  currentSegment: null,
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1,
  volume: 1,
  isQAPanelOpen: false,
  questionHistory: [],
  isAvatarSpeaking: false,
  currentAnswer: null,
  wsConnected: false,
};

export const useWorkshopStore = create<WorkshopState>((set) => ({
  ...initialState,

  setWorkshop: (workshop) => set({ workshop }),
  setSession: (session) => set({ session }),
  setCurrentSegment: (segment) => set({ currentSegment: segment }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setVolume: (volume) => set({ volume }),
  toggleQAPanel: () => set((state) => ({ isQAPanelOpen: !state.isQAPanelOpen })),
  addQuestion: (question) =>
    set((state) => ({ questionHistory: [...state.questionHistory, question] })),
  setIsAvatarSpeaking: (isAvatarSpeaking) => set({ isAvatarSpeaking }),
  setCurrentAnswer: (currentAnswer) => set({ currentAnswer }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  reset: () => set(initialState),
}));
