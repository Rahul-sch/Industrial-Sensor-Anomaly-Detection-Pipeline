'use client';

interface ProgressRingProps {
  progress?: number;          // 0-100
  value?: number;             // Alias for progress (0-100)
  size?: number;              // Diameter in pixels
  strokeWidth?: number;       // Ring thickness
  color?: string;             // Ring color (CSS variable or hex)
  bgColor?: string;           // Background ring color
  showPercentage?: boolean;   // Show percentage in center
  children?: React.ReactNode; // Custom center content
  className?: string;
}

export function ProgressRing({
  progress,
  value,
  size = 80,
  strokeWidth = 8,
  color = 'var(--accent-green)',
  bgColor = 'var(--background-tertiary)',
  showPercentage = true,
  children,
  className = '',
}: ProgressRingProps) {
  // Support both 'progress' and 'value' props
  const progressValue = progress ?? value ?? 0;
  // Clamp progress to 0-100
  const clampedProgress = Math.max(0, Math.min(100, progressValue));

  // Calculate SVG dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        className="progress-ring"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="progress-ring-circle"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          showPercentage && (
            <span
              className="font-semibold"
              style={{
                fontSize: size * 0.25,
                color: 'var(--foreground)',
              }}
            >
              {Math.round(clampedProgress)}%
            </span>
          )
        )}
      </div>
    </div>
  );
}

// Preset variations
export function MasteryRing({ progress, size = 60 }: { progress: number; size?: number }) {
  const color = progress >= 80
    ? 'var(--accent-green)'
    : progress >= 50
      ? 'var(--accent-yellow)'
      : 'var(--accent-red)';

  return <ProgressRing progress={progress} size={size} color={color} />;
}

export function QuizScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const passed = score >= 70;
  return (
    <ProgressRing
      progress={score}
      size={size}
      color={passed ? 'var(--accent-green)' : 'var(--accent-red)'}
    >
      <div className="flex flex-col items-center">
        <span
          className="font-bold"
          style={{
            fontSize: size * 0.25,
            color: passed ? 'var(--accent-green)' : 'var(--accent-red)',
          }}
        >
          {Math.round(score)}%
        </span>
        <span
          className="text-[var(--foreground-muted)]"
          style={{ fontSize: size * 0.12 }}
        >
          {passed ? 'PASSED' : 'FAILED'}
        </span>
      </div>
    </ProgressRing>
  );
}

export function TimeProgressRing({
  current,
  total,
  size = 60,
}: {
  current: number;
  total: number;
  size?: number;
}) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  const minutes = Math.floor(current / 60);
  const seconds = current % 60;

  return (
    <ProgressRing
      progress={progress}
      size={size}
      color="var(--accent-cyan)"
      showPercentage={false}
    >
      <span
        className="font-mono font-semibold text-[var(--foreground)]"
        style={{ fontSize: size * 0.2 }}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </ProgressRing>
  );
}

export default ProgressRing;
