import { useEffect, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { useStore } from '../store'
import type { NewsItem, PatchProgress } from '../types'

/*
 * All positions are calibrated for the 1200x800 window where the
 * launcher-bg.png fills the screen exactly (1536x1024 -> 1200x800, scale 0.78125).
 *
 * Key zones in the window (px from top-left):
 *   Title drag region : 0  - 134
 *   Nav bar           : 134 - 168
 *   Content area      : 168 - 556  (inside image's white panel area)
 *   Bottom bar        : 556 - 704  (image's dark lower strip with PLAY button)
 *   Image outer margin: 704 - 800
 *
 *   News panel        : right-[72px], top-0 (in main), w-308px, h-387px
 *   PLAY button       : centered x, bottom-[135px] (in main)
 */

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

  useEffect(() => {
    if (!activeServer?.newsUrl) { setNews([]); return }
    setNewsLoading(true)
    window.electron.fetchNews(activeServer.newsUrl)
      .then(res => { if (res.success && Array.isArray(res.data)) setNews(res.data as NewsItem[]) })
      .finally(() => setNewsLoading(false))
  }, [activeServer?.id, activeServer?.newsUrl])

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
    launchState === 'checking'  ? 'CHECKING...'  :
    launchState === 'patching'  ? 'PATCHING...'  :
    launchState === 'launching' ? 'LAUNCHING...' :
    launchState === 'error'     ? 'RETRY'        : 'PLAY'

  const playGlow = launchState === 'error'
    ? '0 0 28px rgba(180,30,30,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
    : '0 0 28px rgba(30,160,60,0.7), inset 0 1px 0 rgba(255,255,255,0.15)'

  const playBg = launchState === 'error'
    ? 'linear-gradient(180deg,#922020 0%,#4a0e0e 100%)'
    : 'linear-gradient(180deg,#20a040 0%,#0d5020 100%)'

  return (
    <div className="h-full w-full relative">

      {/* NEWS panel overlay
          Sits on top of the teal-bordered NEWS box drawn in the image.
          right-[72px] = distance from window right edge to right chrome edge.
          top-0        = aligns with the content area top (main starts here).
          pt-[54px]    = skip the image's drawn NEWS header.
          w-[308px]    = width of the panel in the image at 0.78125 scale.
          h-[387px]    = height of content area (556 - 168 = 388px). */}
      <div
        className="absolute right-[72px] top-0 w-[308px] flex flex-col overflow-hidden"
        style={{ height: 387, background: 'rgba(2,12,10,0.5)' }}
      >
        <div className="flex-1 overflow-y-auto px-4 pt-[54px] pb-3 space-y-4">
          {newsLoading && (
            <div className="flex justify-center py-8">
              <div className="w-4 h-4 border-2 border-[#00c8b0]/20 border-t-[#00c8b0] rounded-full animate-spin" />
            </div>
          )}
          {!newsLoading && news.length === 0 && (
            <p className="text-[#2a5a50] text-xs text-center py-4 leading-relaxed">
              {activeServer?.newsUrl ? 'No news available' : 'Add a news URL\nin server settings'}
            </p>
          )}
          {news.map(item => (
            <div
              key={item.id}
              className="cursor-pointer group"
              onClick={() => item.url && window.electron.openExternal(item.url)}
            >
              <h3 className="text-[#b0d8c8] font-bold text-xs uppercase leading-snug group-hover:text-[#00e8ca] transition-colors">
                {item.title}
              </h3>
              {item.summary && (
                <p className="text-[#3a6858] text-xs mt-1 leading-relaxed line-clamp-3">{item.summary}</p>
              )}
              <span className="text-[#00b0a0] text-xs font-bold mt-0.5 inline-block">[MORE]</span>
            </div>
          ))}
        </div>
      </div>

      {/* PLAY button
          Centered horizontally. bottom-[135px] puts it over the green capsule
          drawn in the image (center at window y ≈ 641, main y ≈ 473). */}
      <button
        onClick={handleLaunch}
        disabled={buttonDisabled}
        className={clsx(
          'absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-2',
          'font-black text-[15px] tracking-[0.3em] text-white transition-all duration-150',
          buttonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-95'
        )}
        style={{
          bottom: 135,
          width: 276,
          height: 48,
          background: buttonDisabled ? 'rgba(15,40,20,0.7)' : playBg,
          borderRadius: 3,
          boxShadow: buttonDisabled ? 'none' : playGlow,
        }}
      >
        {(isLaunching || isPatching) && (
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {buttonLabel}
      </button>

      {/* Server status — bottom-left, inside the image's bottom bar */}
      <div className="absolute left-[90px] bottom-[58px] flex flex-col gap-1">
        {activeServer ? (
          <div className="flex items-center gap-2 text-xs">
            <div className={clsx(
              'w-1.5 h-1.5 rounded-full shrink-0',
              status?.online ? 'bg-[#20c060] shadow-[0_0_4px_#20c060]' : 'bg-[#c03030]'
            )} />
            <span className="text-[#90c8a8] font-semibold">{activeServer.name}</span>
            <span className="text-[#3a6050] font-mono text-[10px]">{activeServer.host}:{activeServer.port}</span>
            {status?.playerCount !== undefined && (
              <span className="text-[#3a6050] text-[10px]">{status.playerCount.toLocaleString()} online</span>
            )}
          </div>
        ) : (
          <p className="text-[#2a5040] text-xs">No server selected</p>
        )}
        {launchState === 'error' && launchError && (
          <p className="text-[#e05050] text-[10px] max-w-[300px]">{launchError}</p>
        )}
        {!settings.gamePath && (
          <p className="text-[#c89020] text-[10px]">Set game path in Settings</p>
        )}
      </div>

      {/* Patch progress bar — slim strip above PLAY button */}
      {patchProgress && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          style={{ bottom: 192, width: 340 }}
        >
          <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${patchProgress.percent}%`,
                background: '#00c8b0',
                boxShadow: '0 0 6px #00c8b0',
              }}
            />
          </div>
          <span className="text-[#00c8b0] text-[10px] font-mono w-8 text-right shrink-0">
            {patchProgress.percent}%
          </span>
          <button
            onClick={() => window.electron.cancelPatch()}
            className="text-[10px] text-[#406050] hover:text-[#e05050] transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
