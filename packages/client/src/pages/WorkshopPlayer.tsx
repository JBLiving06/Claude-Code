/**
 * Workshop Player Page - Main workshop experience with video and Q&A
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkshopStore } from '../store/workshop';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { VideoPlayer } from '../components/VideoPlayer';
import { QAPanel } from '../components/QAPanel';
import { SegmentList } from '../components/SegmentList';
import { ProgressBar } from '../components/ProgressBar';

export function WorkshopPlayer() {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const {
    workshop,
    session,
    currentSegment,
    isQAPanelOpen,
    setWorkshop,
    setSession,
    setCurrentSegment,
    toggleQAPanel,
    reset,
  } = useWorkshopStore();

  const { getWorkshop, startSession } = useApi();
  const { askQuestion, updateProgress } = useWebSocket(sessionIdRef.current);

  // Load workshop and start session
  useEffect(() => {
    async function initialize() {
      if (!workshopId) {
        setError('Workshop ID is required');
        return;
      }

      try {
        // Load workshop details
        const workshopData = await getWorkshop(workshopId);
        setWorkshop(workshopData as never);

        // Start a new session
        const sessionData = await startSession(workshopId);
        sessionIdRef.current = sessionData.sessionId;
        setSession(sessionData as never);

        // Set initial segment
        if (workshopData.segments.length > 0) {
          setCurrentSegment(workshopData.segments[0] as never);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    initialize();

    return () => {
      reset();
    };
  }, [workshopId, getWorkshop, startSession, setWorkshop, setSession, setCurrentSegment, reset]);

  const handleSegmentChange = (segmentId: string) => {
    const segment = workshop?.segments.find(s => s.id === segmentId);
    if (segment) {
      setCurrentSegment(segment as never);
    }
  };

  const handleTimeUpdate = (time: number) => {
    if (currentSegment && sessionIdRef.current) {
      updateProgress(currentSegment.id, time);
    }
  };

  const handleAskQuestion = async (question: string) => {
    askQuestion(question);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading workshop...</p>
        </div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Unable to Load Workshop</h2>
          <p className="text-gray-400 mb-4">{error || 'Workshop not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Workshops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Back to workshops"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-semibold">{workshop.title}</h1>
              {currentSegment && (
                <p className="text-sm text-gray-400">{currentSegment.title}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ProgressBar progress={session?.progress || 0} />
            <button
              onClick={toggleQAPanel}
              className={`p-2 rounded-lg transition-colors ${
                isQAPanelOpen ? 'bg-primary-600 text-white' : 'hover:bg-gray-700'
              }`}
              title="Ask a question"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Video and segments */}
        <div className={`flex-1 flex flex-col transition-all ${isQAPanelOpen ? 'mr-96' : ''}`}>
          {/* Video player */}
          <div className="flex-1 bg-black">
            {currentSegment && (
              <VideoPlayer
                videoUrl={currentSegment.videoUrl}
                transcript={currentSegment.script}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  // Auto-advance to next segment
                  const currentIndex = workshop.segments.findIndex(s => s.id === currentSegment.id);
                  if (currentIndex < workshop.segments.length - 1) {
                    setCurrentSegment(workshop.segments[currentIndex + 1] as never);
                  }
                }}
              />
            )}
          </div>

          {/* Segment list */}
          <div className="h-48 bg-gray-800 border-t border-gray-700 overflow-hidden">
            <SegmentList
              segments={workshop.segments}
              currentSegmentId={currentSegment?.id}
              onSegmentSelect={handleSegmentChange}
            />
          </div>
        </div>

        {/* Q&A Panel */}
        {isQAPanelOpen && (
          <div className="fixed right-0 top-16 bottom-0 w-96 bg-gray-800 border-l border-gray-700">
            <QAPanel onAskQuestion={handleAskQuestion} onClose={toggleQAPanel} />
          </div>
        )}
      </div>
    </div>
  );
}
