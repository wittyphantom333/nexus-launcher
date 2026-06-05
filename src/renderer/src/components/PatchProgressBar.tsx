import { clsx } from 'clsx'
import { formatBytes, formatSpeed } from '../utils/format'
import type { PatchProgress } from '../types'

interface Props {
  progress: PatchProgress
  onCancel?: () => void
}

export default function PatchProgressBar({ progress, onCancel }: Props) {
  const isChecking = progress.phase === 'checking'

  return (
    <div className="nexus-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-nexus-text-secondary font-medium">
          {isChecking ? 'Verifying files…' : 'Downloading patch…'}
        </span>
        <span className="text-nexus-primary font-mono text-xs">{progress.percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-nexus-surface rounded-full overflow-hidden">
        <div
          className={clsx(
            'absolute left-0 top-0 h-full rounded-full transition-all duration-300',
            isChecking ? 'bg-nexus-secondary' : 'bg-nexus-primary'
          )}
          style={{ width: `${progress.percent}%` }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite'
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-nexus-text-muted font-mono">
        <span className="truncate max-w-[60%] opacity-75">{progress.currentFile}</span>
        <div className="flex items-center gap-3 shrink-0">
          {!isChecking && progress.totalBytes > 0 && (
            <>
              <span>{formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}</span>
              {progress.speed > 0 && <span>{formatSpeed(progress.speed)}</span>}
            </>
          )}
          {isChecking && (
            <span>
              {progress.filesChecked} / {progress.totalFiles}
            </span>
          )}
        </div>
      </div>

      {/* Cancel */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full py-1.5 rounded-xl text-xs text-nexus-text-muted hover:text-nexus-error hover:bg-nexus-error/5 border border-nexus-border hover:border-nexus-error/30 transition-all duration-200"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
