/**
 * Segment List Component - Navigation between workshop segments
 */

interface Segment {
  id: string;
  title: string;
  duration: number;
  videoUrl?: string;
}

interface SegmentListProps {
  segments: Segment[];
  currentSegmentId?: string;
  onSegmentSelect: (segmentId: string) => void;
}

export function SegmentList({ segments, currentSegmentId, onSegmentSelect }: SegmentListProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-gray-700">
        <h3 className="font-semibold text-sm text-gray-400">Workshop Segments</h3>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-2 p-4 h-full">
          {segments.map((segment, index) => (
            <button
              key={segment.id}
              onClick={() => onSegmentSelect(segment.id)}
              className={`flex-shrink-0 w-48 h-full rounded-lg overflow-hidden transition-all ${
                segment.id === currentSegmentId
                  ? 'ring-2 ring-primary-500 bg-gray-700'
                  : 'bg-gray-750 hover:bg-gray-700'
              }`}
            >
              <div className="h-full flex flex-col p-3">
                {/* Thumbnail placeholder */}
                <div className="flex-1 bg-gray-800 rounded flex items-center justify-center mb-2">
                  {segment.videoUrl ? (
                    <span className="text-3xl">🎬</span>
                  ) : (
                    <span className="text-3xl opacity-50">⏳</span>
                  )}
                </div>

                {/* Segment info */}
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">
                      {index + 1}/{segments.length}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(segment.duration)}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium line-clamp-2">{segment.title}</h4>
                </div>

                {/* Current indicator */}
                {segment.id === currentSegmentId && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
