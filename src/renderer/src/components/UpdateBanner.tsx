import { Download, X, AlertTriangle, RotateCw } from 'lucide-react'
import { useStore } from '../store'

/**
 * Update modal — overlays the launcher with a centered card.
 * Shown when an update is available, downloading, ready, or failed.
 */
export default function UpdateBanner() {
  const { updateState, updateInfo, setUpdateState } = useStore()

  if (updateState === 'idle') return null

  const dismiss = () => setUpdateState('idle')

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 50, background: 'rgba(0,0,0,0.55)' }}
    >
      <div
        className="relative rounded-lg shadow-2xl"
        style={{
          background: '#0a1614',
          border: '1px solid rgba(0,160,140,0.4)',
          minWidth: 380,
          maxWidth: 460,
          padding: '24px 28px',
        }}
      >
        {/* Close button (only when not actively downloading or required) */}
        {updateState !== 'downloading' && (
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-[#5a9a8a] hover:text-[#80c0b8] transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {updateState === 'available' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-[#00e8ca]" />
              <h2 className="text-[#40ead0] font-bold text-base tracking-wide">
                Update Available
              </h2>
            </div>
            <p className="text-[#90c8a8] text-sm leading-relaxed">
              Nexus Launcher{' '}
              <span className="text-[#00e8ca] font-semibold">
                v{updateInfo?.version}
              </span>{' '}
              is ready to download.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={dismiss}
                className="px-4 py-2 text-xs font-semibold text-[#5a9a8a] hover:text-[#80c0b8] transition-colors"
              >
                Later
              </button>
              <button
                onClick={() => {
                  setUpdateState('downloading', { version: updateInfo?.version ?? '', percent: 0 })
                  window.electron.downloadUpdate()
                }}
                className="px-4 py-2 text-xs font-bold rounded transition-colors"
                style={{ background: '#00c8b0', color: '#0a1614' }}
              >
                Download Now
              </button>
            </div>
          </div>
        )}

        {updateState === 'downloading' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-[#00e8ca] animate-pulse" />
              <h2 className="text-[#40ead0] font-bold text-base tracking-wide">
                Downloading Update
              </h2>
            </div>
            <p className="text-[#90c8a8] text-sm">
              {Math.round(updateInfo?.percent ?? 0)}% complete
            </p>
            <div className="h-2 bg-[#1a2a28] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${updateInfo?.percent ?? 0}%`,
                  background: '#00c8b0',
                  boxShadow: '0 0 8px #00c8b0',
                }}
              />
            </div>
          </div>
        )}

        {updateState === 'ready' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-[#00e8ca]" />
              <h2 className="text-[#40ead0] font-bold text-base tracking-wide">
                Update Ready
              </h2>
            </div>
            <p className="text-[#90c8a8] text-sm leading-relaxed">
              The update has been downloaded. Restart the launcher to apply it.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={dismiss}
                className="px-4 py-2 text-xs font-semibold text-[#5a9a8a] hover:text-[#80c0b8] transition-colors"
              >
                Later
              </button>
              <button
                onClick={() => window.electron.installUpdate()}
                className="px-4 py-2 text-xs font-bold rounded transition-colors"
                style={{ background: '#00c8b0', color: '#0a1614' }}
              >
                Restart & Install
              </button>
            </div>
          </div>
        )}

        {updateState === 'error' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ff8060]" />
              <h2 className="text-[#ff8060] font-bold text-base tracking-wide">
                Update Failed
              </h2>
            </div>
            <p className="text-[#a08080] text-xs leading-relaxed break-words">
              {updateInfo?.error ?? 'Unknown error occurred while updating.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={dismiss}
                className="px-4 py-2 text-xs font-bold rounded transition-colors"
                style={{ background: '#1a2a28', color: '#90c8a8' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
