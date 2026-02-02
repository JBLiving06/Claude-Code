/**
 * Workshop Types - Core data structures for avatar-led workshops
 */

export interface Workshop {
  id: string;
  title: string;
  description: string;
  avatarId: string;
  knowledgeBaseId: string;
  segments: WorkshopSegment[];
  settings: WorkshopSettings;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  status: WorkshopStatus;
}

export interface WorkshopSegment {
  id: string;
  workshopId: string;
  order: number;
  title: string;
  duration: number; // seconds
  videoUrl?: string;
  videoStatus: VideoStatus;
  script: string;
  interactionPoints: InteractionPoint[];
  transitions: SegmentTransition[];
}

export interface InteractionPoint {
  id: string;
  timestamp: number; // seconds into segment
  type: InteractionType;
  prompt?: string;
  options?: BranchOption[];
  pauseVideo: boolean;
}

export type InteractionType =
  | 'free_question'      // Open Q&A with avatar
  | 'multiple_choice'    // Branching scenario
  | 'reflection_pause'   // Pause for reflection
  | 'quiz'               // Knowledge check
  | 'poll';              // Engagement poll

export interface BranchOption {
  id: string;
  text: string;
  targetSegmentId?: string;
  responseScript?: string;
}

export interface SegmentTransition {
  fromSegmentId: string;
  toSegmentId: string;
  condition?: TransitionCondition;
}

export interface TransitionCondition {
  type: 'choice' | 'quiz_score' | 'always';
  value?: string | number;
}

export interface WorkshopSettings {
  allowSpeedControl: boolean;
  allowPause: boolean;
  allowRewind: boolean;
  enableQA: boolean;
  qaMode: QAMode;
  maxQuestionsPerSession?: number;
  showTranscript: boolean;
  language: string;
}

export type QAMode =
  | 'always_available'   // Q&A available anytime
  | 'at_interaction_points' // Only at designated points
  | 'end_of_segment'     // After each segment
  | 'disabled';

export type WorkshopStatus = 'draft' | 'rendering' | 'ready' | 'published' | 'archived';
export type VideoStatus = 'pending' | 'generating' | 'ready' | 'failed';

export interface WorkshopSession {
  id: string;
  workshopId: string;
  participantId: string;
  startedAt: Date;
  completedAt?: Date;
  currentSegmentId: string;
  currentTimestamp: number;
  questionsAsked: SessionQuestion[];
  interactions: SessionInteraction[];
  progress: number; // 0-100
}

export interface SessionQuestion {
  id: string;
  timestamp: Date;
  question: string;
  answer: string;
  segmentId: string;
  segmentTimestamp: number;
  sourcesUsed: string[];
  responseTime: number; // ms
}

export interface SessionInteraction {
  id: string;
  timestamp: Date;
  interactionPointId: string;
  response?: string;
  choiceId?: string;
}
