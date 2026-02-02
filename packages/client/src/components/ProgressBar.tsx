/**
 * Progress Bar Component - Visual progress indicator
 */

interface ProgressBarProps {
  progress: number; // 0-100
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
    </div>
  );
}
