import { useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { Globe } from 'lucide-react'
import { useStore } from '../store'
import type { NewsItem, PatchProgress } from '../types'

// â”€â”€ WildStar-style action button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function WsActionButton({
  label,
  disabled,
  isLoading,
  launchState,
  onClick,
}: {
  label: string
  disabled: boolean
  isLoading: boolean
  launchState: string
  onClick: () => void
}) {
  const isReady = launchState === 'idle'
  const isError = launchState === 'error'

  const gradient = isReady
    ? 'linear-gradient(180deg, #1f8a28 0%, #0d5014 100%)'
    : isError
    ? 'linear-gradient(180deg, #8a1f1f 0%, #5a0d0d 100%)'
    : 'linear-gradient(180deg, #4a2888 0%, #1448a8 100%)'

  const glow = isReady
    ? 'rgba(26,138,32,0.55)'
    : isError
    ? 'rgba(138,26,26,0.45)'
    : 'rgba(74,40,136,0.55)'

  return (
    <div className="flex items-center">
      {/* Left bracket */}
      <div className="w-5 h-9 border-t-2 border-b-2 border-l-2 border-[#7a5818] bg-gradient-to-b from-[#2a1a0a] to-[#150d05] rounded-l-sm" />
      {/* Button body */}
      <button
        onClick={onClick}
        disabled={disabled}
        className="relative h-10 px-14 font-bold text-base tracking-[0.15em] uppercase text-white border-y-2 border-[#7a5818] transition-all duration-200 min-w-[200px]"
        style={{
          background: gradient,
          boxShadow: disabled ? 'none' : `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 22px ${glow}`,
          opacity: disabled ? 0.55 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {label}
      </button>
      {/* Right bracket */}
      <div className="w-5 h-9 border-t-2 border-b-2 border-r-2 border-[#7a5818] bg-gradient-to-b from-[#2a1a0a] to-[#150d05] rounded-r-sm" />
    </div>
  )
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function HomePage() {
  const {
    settings,
    activeServer,
    serverStatuses,
    launchState,
    launchError,
    setLaunchState,
    patchProgress,
    setPatchProgress,
  } = useStore()

  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)

  // Load news for active server
  useEffect(() => {
    if (!activeServer?.newsUrl) { setNews([]); return }
    setNewsLoading(true)
    window.electron
      .fetchNews(activeServer.newsUrl)
      .then(res => { if (res.success && Array.isArray(res.data)) setNews(res.data as NewsItem[]) })
      .finally(() => setNewsLoading(false))
  }, [activeServer?.id, activeServer?.newsUrl])

  // Patcher events
  useEffect(() => {
    const offProgress = window.electron.onPatchProgress((p: PatchProgress) => setPatchProgress(p))
    const offComplete = window.electron.onPatchComplete(() => { setPatchProgress(null); setLaunchState('idle') })
    const offError = window.electron.onPatchError(err => { setPatchProgress(null); setLaunchState('error', err.message) })
    return () => { offProgress(); offComplete(); offError() }
  }, [])

  const status = activeServer ? serverStatuses[activeServer.id] : undefined

  const handleLaunch = useCallback(async () => {
    if (!activeServer) return setLaunchState('error', 'No server selected')
    if (!settings.gamePath) return setLaunchState('error', 'Game path not configured')

    setLaunchState('checking')
    const validation = await window.electron.validateGamePath(settings.gamePath)
    if (!validation.valid) return setLaunchState('error', validation.error ?? 'Invalid game path')

    if (activeServer.patchManifestUrl) {
      const check = await window.electron.checkPatch(activeServer.patchManifestUrl, settings.gamePath)
      if (check.needsPatch) {
        setLaunchState('patching')
        await window.electron.startPatch(activeServer.patchManifestUrl, settings.gamePath)
        return
      }
    }

    setLaunchState('launching')
    const result = await window.electron.launchGame(
      settings.gamePath, activeServer.host, activeServer.port,
      settings.language, settings.architecture
    )

    if (result.success) {
      if (settings.launchAndClose) window.electron.close()
      else setLaunchState('idle')
      if (settings.discordRPC) window.electron.updateDiscord({ details: `Playing on ${activeServer.name}`, state: 'In-game' })
    } else {
      setLaunchState('error', result.error ?? 'Failed to launch')
    }
  }, [activeServer, settings])

  const isPatching = launchState === 'patching'
  const isLaunching = launchState === 'checking' || launchState === 'launching'
  const buttonDisabled = isPatching || isLaunching || !activeServer

  const buttonLabel =
    launchState === 'checking' ? 'Checking...'
    : launchState === 'patching' ? 'Patching...'
    : launchState === 'launching' ? 'Launching...'
    : launchState === 'error' ? 'Retry'
    : 'Play'

  const hexBg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='24'%3E%3Cpath d='M14 0 L27 7 L27 17 L14 24 L1 17 L1 7 Z' fill='none' stroke='rgba(0%2C180%2C160%2C0.07)' stroke-width='0.5'/%3E%3C/svg%3E\")"

  return (
    <div className="flex flex-col h-full">

      {/* â”€â”€ Main content: artwork bg + overlaid panels â”€â”€ */}
      <div className="flex-1 relative overflow-hidden">

        {/* Bottom-left server status overlay */}
        <div className="absolute bottom-3 left-4 z-20 flex flex-col gap-1.5">
          {!activeServer ? (
            <div className="text-[#4a7090] text-xs px-2.5 py-1 rounded bg-black/50 border border-white/8 select-none">
              No server selected â€” go to{' '}
              <span className="text-[#7090a0] font-semibold">SERVERS</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/55 border border-white/10 text-xs">
              <div className={clsx(
                'w-1.5 h-1.5 rounded-full shrink-0',
                status?.online ? 'bg-[#10b981]' : 'bg-[#ef4444]',
                status?.online && 'shadow-[0_0_5px_#10b981]'
              )} />
              <span className="text-white/85 font-semibold">{activeServer.name}</span>
              <span className="text-white/40 font-mono">{activeServer.host}:{activeServer.port}</span>
              {status?.playerCount !== undefined && (
                <span className="text-white/40">{status.playerCount.toLocaleString()} online</span>
              )}
            </div>
          )}
          {launchState === 'error' && launchError && (
            <div className="px-3 py-1.5 rounded bg-[#ef4444]/20 border border-[#ef4444]/30 text-xs text-[#ef4444] max-w-xs">
              {launchError}
            </div>
          )}
        </div>

        {/* â”€â”€ Right: news panel â”€â”€ */}
        <div
          className="absolute right-0 top-0 bottom-0 w-[272px] flex flex-col overflow-hidden"
          style={{
            background: 'rgba(3,12,11,0.82)',
            backdropFilter: 'blur(16px)',
            borderLeft: '2px solid rgba(0,200,180,0.45)',
            boxShadow: '-4px 0 24px rgba(0,180,160,0.12), inset 1px 0 0 rgba(0,232,202,0.08)',
            backgroundImage: hexBg,
          }}
        >
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#00e8ca] pointer-events-none z-10" style={{ boxShadow: '-1px -1px 5px rgba(0,232,202,0.35)' }} />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00e8ca] pointer-events-none z-10" style={{ boxShadow: '1px -1px 5px rgba(0,232,202,0.35)' }} />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#00e8ca] pointer-events-none z-10" style={{ boxShadow: '-1px 1px 5px rgba(0,232,202,0.35)' }} />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#00e8ca] pointer-events-none z-10" style={{ boxShadow: '1px 1px 5px rgba(0,232,202,0.35)' }} />

          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[rgba(0,180,160,0.18)] shrink-0">
            <div className="w-6 h-6 rounded-full bg-[#0d5050] border border-[#007a6a] flex items-center justify-center shrink-0">
              <Globe className="w-3.5 h-3.5 text-[#00c8b0]" />
            </div>
            <span className="text-[#c8901a] font-bold text-sm tracking-[0.22em] uppercase">NEWS</span>
          </div>

          {/* News feed */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {newsLoading && (
              <div className="flex justify-center py-8">
                <div className="w-4 h-4 border-2 border-[#00c8b0]/20 border-t-[#00c8b0] rounded-full animate-spin" />
              </div>
            )}
            {!newsLoading && news.length === 0 && (
              <p className="text-[#3a6060] text-xs text-center py-8">
                {activeServer?.newsUrl ? 'No news available' : 'Configure a news URL in server settings'}
              </p>
            )}
            {news.map(item => (
              <div
                key={item.id}
                className="cursor-pointer group"
                onClick={() => item.url && window.electron.openExternal(item.url)}
              >
                <h3 className="text-white font-bold text-xs uppercase leading-snug group-hover:text-[#00e8ca] transition-colors">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-[#5a8080] text-xs mt-1 leading-relaxed line-clamp-3">{item.summary}</p>
                )}
                <span className="text-[#00c8b0] text-xs font-bold mt-0.5 inline-block">[MORE]</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* â”€â”€ Progress strip â”€â”€ */}
      <div
        className="relative shrink-0 overflow-hidden transition-all duration-200"
        style={{
          height: patchProgress ? 28 : 3,
          background: 'rgba(3,10,8,0.80)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(0,100,90,0.3)',
        }}
      >
        <div
          className="absolute left-0 top-0 h-[3px] transition-all duration-300"
          style={{
            width: patchProgress ? `${patchProgress.percent}%` : '0%',
            background: '#00c8b0',
            boxShadow: '0 0 8px #00c8b0, 0 0 18px rgba(0,200,176,0.3)',
          }}
        />
        {patchProgress && (
          <div className="absolute inset-0 flex items-end px-3 pb-1 pt-[5px] gap-3">
            <span className="text-white text-[11px] font-bold">{patchProgress.percent}%</span>
            <span className="text-[#3a6060] text-[10px] font-mono truncate">{patchProgress.currentFile}</span>
            <button
              onClick={() => window.electron.cancelPatch()}
              className="ml-auto text-[10px] text-[#5a6060] hover:text-[#ef4444] transition-colors"
            >
              cancel
            </button>
          </div>
        )}
      </div>

      {/* â”€â”€ Action button footer â”€â”€ */}
      <div
        className="flex items-center justify-center h-14 shrink-0"
        style={{ background: 'rgba(3,8,6,0.85)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(0,180,160,0.35)' }}
      >
        {!settings.gamePath ? (
          <p className="text-[#c8901a] text-xs tracking-wide">
            Configure your game path in Settings âš™
          </p>
        ) : (
          <WsActionButton
            label={buttonLabel}
            disabled={buttonDisabled}
            isLoading={isLaunching || isPatching}
            launchState={launchState}
            onClick={handleLaunch}
          />
        )}
      </div>
    </div>
  )
}
