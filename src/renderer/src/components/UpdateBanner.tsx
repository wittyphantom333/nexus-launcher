import { Download } from 'lucide-react'
import { useStore } from '../store'

export default function UpdateBanner() {
  const { updateState, updateInfo, setUpdateState } = useStore()

  if (updateState === 'idle') return null

  if (updateState === 'available') {
    return (
      <div className="relative z-20 bg-nexus-primary/10 border-b border-nexus-primary/20 px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-nexus-text-secondary">
          Launcher update <span className="text-nexus-primary font-semibold">v{updateInfo?.version}</span> available.
        </span>
        <button
          onClick={() => setUpdateState('downloading')}
          className="flex items-center gap-1.5 text-nexus-primary hover:text-nexus-accent transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>
    )
  }

  if (updateState === 'downloading') {
    const pct = updateInfo?.percent ?? 0
    return (
      <div className="relative z-20 bg-nexus-primary/10 border-b border-nexus-primary/20 px-4 py-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-nexus-text-secondary">Downloading update…</span>
          <span className="text-nexus-primary">{Math.round(pct)}%</span>
        </div>
        <div className="h-1 bg-nexus-border rounded-full overflow-hidden">
          <div
            className="h-full bg-nexus-primary rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  if (updateState === 'ready') {
    return (
      <div className="relative z-20 bg-nexus-success/10 border-b border-nexus-success/20 px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-nexus-text-secondary">Update downloaded. Restart to apply.</span>
        <button
          onClick={() => window.electron.installUpdate()}
          className="text-nexus-success hover:opacity-80 font-semibold transition-opacity"
        >
          Restart Now
        </button>
      </div>
    )
  }

  return null
}
