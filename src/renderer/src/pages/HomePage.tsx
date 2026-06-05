import { useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { Play, AlertCircle, Wifi, WifiOff, Users, Clock, Newspaper, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import PatchProgressBar from '../components/PatchProgressBar'
import type { NewsItem, PatchProgress } from '../types'
import { formatDistanceToNow } from 'date-fns'

export default function HomePage() {
  const {
    settings,
    activeServer,
    serverStatuses,
    launchState,
    setLaunchState,
    patchProgress,
    setPatchProgress
  } = useStore()

  const [news, setNews] = useState<NewsItem[]>([])
  const [newsLoading, setNewsLoading] = useState(false)

  // ─── Load news for active server ────────────────────────────────────────
  useEffect(() => {
    if (!activeServer?.newsUrl) {
      setNews([])
      return
    }
    setNewsLoading(true)
    window.electron
      .fetchNews(activeServer.newsUrl)
      .then(res => {
        if (res.success && Array.isArray(res.data)) setNews(res.data as NewsItem[])
      })
      .finally(() => setNewsLoading(false))
  }, [activeServer?.id, activeServer?.newsUrl])

  // ─── Listen for patcher events ──────────────────────────────────────────
  useEffect(() => {
    const offProgress = window.electron.onPatchProgress((p: PatchProgress) => setPatchProgress(p))
    const offComplete = window.electron.onPatchComplete(() => {
      setPatchProgress(null)
      setLaunchState('idle')
    })
    const offError = window.electron.onPatchError(err => {
      setPatchProgress(null)
      setLaunchState('error', err.message)
    })
    return () => {
      offProgress()
      offComplete()
      offError()
    }
  }, [])

  const status = activeServer ? serverStatuses[activeServer.id] : undefined

  // ─── Launch flow ────────────────────────────────────────────────────────
  const handleLaunch = useCallback(async () => {
    if (!activeServer) return setLaunchState('error', 'No server selected')
    if (!settings.gamePath) return setLaunchState('error', 'Game path not configured')

    setLaunchState('checking')

    // Validate path
    const validation = await window.electron.validateGamePath(settings.gamePath)
    if (!validation.valid) {
      return setLaunchState('error', validation.error ?? 'Invalid game path')
    }

    // Check patch if manifest available
    if (activeServer.patchManifestUrl) {
      const check = await window.electron.checkPatch(activeServer.patchManifestUrl, settings.gamePath)
      if (check.needsPatch) {
        setLaunchState('patching')
        await window.electron.startPatch(activeServer.patchManifestUrl, settings.gamePath)
        // patching state resolves via events above
        return
      }
    }

    // Launch!
    setLaunchState('launching')
    const result = await window.electron.launchGame(
      settings.gamePath,
      activeServer.host,
      activeServer.port,
      settings.language,
      settings.architecture
    )

    if (result.success) {
      if (settings.launchAndClose) window.electron.close()
      else setLaunchState('idle')
      // Update Discord RPC
      if (settings.discordRPC) {
        window.electron.updateDiscord({
          details: `Playing on ${activeServer.name}`,
          state: 'In-game'
        })
      }
    } else {
      setLaunchState('error', result.error ?? 'Failed to launch')
    }
  }, [activeServer, settings])

  const isPatching = launchState === 'patching'
  const isLaunching = launchState === 'checking' || launchState === 'launching'
  const buttonDisabled = isPatching || isLaunching || !activeServer

  const buttonLabel =
    launchState === 'checking' ? 'Checking…'
    : launchState === 'patching' ? 'Patching…'
    : launchState === 'launching' ? 'Launching…'
    : launchState === 'error' ? 'Retry'
    : 'Play'

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── Left panel: server info + launch ─── */}
      <div className="flex flex-col w-80 shrink-0 border-r border-nexus-border p-4 gap-4 overflow-y-auto">
        {/* Active server banner */}
        {activeServer ? (
          <div className="nexus-card p-4 clip-hex-top">
            {/* Server banner image */}
            {activeServer.bannerUrl && (
              <div className="rounded-xl overflow-hidden mb-3 h-24 bg-nexus-surface">
                <img src={activeServer.bannerUrl} alt="" className="w-full h-full object-cover opacity-80" />
              </div>
            )}

            {/* Logo + Name */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-nexus-surface border border-nexus-border overflow-hidden flex items-center justify-center">
                {activeServer.logoUrl ? (
                  <img src={activeServer.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-bold text-nexus-primary text-base">
                    {activeServer.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-nexus-text-primary text-sm">{activeServer.name}</p>
                <p className="font-mono text-nexus-text-muted text-xs">{activeServer.host}:{activeServer.port}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-xs">
              {status ? (
                status.online ? (
                  <span className="flex items-center gap-1.5 text-nexus-success">
                    <Wifi className="w-3 h-3" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-nexus-error/70">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                )
              ) : (
                <span className="text-nexus-text-muted">Checking…</span>
              )}
              {status?.playerCount !== undefined && (
                <span className="flex items-center gap-1 text-nexus-text-muted ml-2">
                  <Users className="w-3 h-3" /> {status.playerCount.toLocaleString()}
                </span>
              )}
              {status?.latency !== undefined && (
                <span className="flex items-center gap-1 text-nexus-text-muted">
                  <Clock className="w-3 h-3" /> {status.latency}ms
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="nexus-card p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[120px]">
            <p className="text-nexus-text-muted text-sm">No server selected</p>
            <p className="text-nexus-text-muted text-xs">Go to Servers to add one</p>
          </div>
        )}

        {/* Error */}
        {launchState === 'error' && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-nexus-error/10 border border-nexus-error/20 text-xs text-nexus-error">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{useStore.getState().launchError}</span>
          </div>
        )}

        {/* Patch progress */}
        {patchProgress && (
          <PatchProgressBar
            progress={patchProgress}
            onCancel={() => window.electron.cancelPatch()}
          />
        )}

        {/* Launch button */}
        <button
          onClick={handleLaunch}
          disabled={buttonDisabled}
          className={clsx(
            'btn-primary flex items-center justify-center gap-2 w-full text-base font-display font-bold tracking-wider uppercase py-3',
            buttonDisabled && 'opacity-50 cursor-not-allowed hover:shadow-none hover:scale-100'
          )}
        >
          {isLaunching || isPatching ? (
            <div className="w-4 h-4 border-2 border-nexus-bg/50 border-t-nexus-bg rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {buttonLabel}
        </button>

        {/* Game path warning */}
        {!settings.gamePath && (
          <p className="text-nexus-warning text-xs text-center">
            Configure your game path in Settings
          </p>
        )}
      </div>

      {/* ─── Right panel: news feed ─── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-nexus-border shrink-0">
          <Newspaper className="w-4 h-4 text-nexus-primary" />
          <h2 className="font-display font-semibold text-nexus-text-primary text-sm tracking-wide uppercase">
            {activeServer ? `${activeServer.name} – News` : 'News'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {newsLoading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-nexus-border border-t-nexus-primary rounded-full animate-spin" />
            </div>
          )}

          {!newsLoading && news.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <Newspaper className="w-8 h-8 text-nexus-text-muted opacity-30" />
              <p className="text-nexus-text-muted text-sm">
                {activeServer?.newsUrl ? 'No news available' : 'No news URL configured for this server'}
              </p>
            </div>
          )}

          {news.map(item => (
            <article
              key={item.id}
              className="nexus-card p-4 cursor-pointer"
              onClick={() => item.url && window.electron.openExternal(item.url)}
            >
              {item.imageUrl && (
                <div className="rounded-xl overflow-hidden mb-3 h-32 bg-nexus-surface">
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover opacity-90" />
                </div>
              )}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  {item.isPinned && (
                    <span className="inline-block text-[10px] font-semibold text-nexus-gold bg-nexus-gold/10 border border-nexus-gold/20 rounded px-1.5 py-0.5 mb-1">
                      PINNED
                    </span>
                  )}
                  <h3 className="font-semibold text-nexus-text-primary text-sm leading-snug">{item.title}</h3>
                  <p className="text-nexus-text-muted text-xs mt-1 leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-nexus-text-muted">
                    {item.author && <span>{item.author}</span>}
                    <span className="opacity-50">·</span>
                    <span>{formatDistanceToNow(new Date(item.date), { addSuffix: true })}</span>
                    {item.tags?.map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-nexus-primary/10 text-nexus-primary rounded text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                {item.url && (
                  <ChevronRight className="w-4 h-4 text-nexus-text-muted shrink-0 mt-0.5" />
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
