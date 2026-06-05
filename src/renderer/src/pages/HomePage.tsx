import { useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { useStore } from '../store'
import ContentSlider from '../components/ContentSlider'
import type { NewsItem, PatchProgress } from '../types'

/**
 * GitHub raw URL for the news feed.
 * Edit news.json in the repo root to update news without a launcher release.
 */
const GITHUB_NEWS_URL =
  'https://raw.githubusercontent.com/wittyphantom333/nexus-launcher/main/news.json'

/**
 * Slide images shown inside the launcher content area.
 * Add URLs here (or absolute local paths) to populate the slider.
 * Leave empty for no slider.
 */
const SLIDES: string[] = [
  // 'https://example.com/screenshot1.jpg',
]

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
    news,
    setNews,
  } = useStore()

  // ── Fetch news directly in the renderer ──────
  useEffect(() => {
    const url = `${GITHUB_NEWS_URL}?_=${Date.now()}`
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: unknown) => {
        if (Array.isArray(data)) setNews(data as NewsItem[])
      })
      .catch(() => {
        // Fallback to IPC path if renderer fetch fails
        window.electron.fetchNews(GITHUB_NEWS_URL)
          .then(res => { if (res.success && Array.isArray(res.data)) setNews(res.data as NewsItem[]) })
          .catch(() => {})
      })
  }, [])

  // ── Patcher events ───────────────────────────────────────────────────────
  useEffect(() => {
    const offProgress = window.electron.onPatchProgress((p: PatchProgress) => setPatchProgress(p))
    const offComplete = window.electron.onPatchComplete(() => { setPatchProgress(null); setLaunchState('idle') })
    const offError = window.electron.onPatchError(err => { setPatchProgress(null); setLaunchState('error', err.message) })
    return () => { offProgress(); offComplete(); offError() }
  }, [])

  const status = activeServer ? serverStatuses[activeServer.id] : undefined

  // ── Launch flow ──────────────────────────────────────────────────────────
  const handleLaunch = useCallback(async () => {
    if (!activeServer) {
      setLaunchState('error', 'No server selected')
      setTimeout(() => setLaunchState('idle'), 3000)
      return
    }
    if (!settings.gamePath) {
      setLaunchState('error', 'Game path not set in Settings')
      setTimeout(() => setLaunchState('idle'), 3000)
      return
    }

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

  const isPatching  = launchState === 'patching'
  const isLaunching = launchState === 'checking' || launchState === 'launching'
  const isError     = launchState === 'error'
  const buttonDisabled = isPatching || isLaunching

  const buttonLabel =
    launchState === 'checking'  ? 'CHECKING...'  :
    launchState === 'patching'  ? 'PATCHING...'  :
    launchState === 'launching' ? 'LAUNCHING...' :
    isError                     ? 'RETRY'        : 'PLAY'

  return (
    <div className="h-full w-full relative">

      {/* ── Background image slider (fills left content area) ── */}
      <ContentSlider slides={SLIDES} interval={7} />

      {/* NEWS panel — simple overflow-y:auto; frame PNG at z:20 naturally
          covers any items that scroll up into the drawn header zone */}
      <div
        style={{
          position: 'absolute',
          right: '1vw',
          top: 0,
          width: '28vw',
          bottom: '14vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: '11.5vh',
          paddingLeft: '2.5vw',
          paddingRight: '0.5vw',
          paddingBottom: '1vh',
        }}
      >
        <div className="space-y-5">
          {news.length === 0 && (
            <p className="text-[#2a5a50] text-xs text-center pt-6 leading-relaxed">
              No news yet
            </p>
          )}
          {news.map(item => (
            <div
              key={item.id}
              className={clsx('cursor-pointer group', item.isPinned && 'border-l-2 border-[#00c8b0] pl-2')}
              onClick={() => item.url && window.electron.openExternal(item.url)}
            >
              {item.isPinned && (
                <span className="text-[#00a890] text-[9px] font-bold tracking-widest uppercase">
                  PINNED
                </span>
              )}
              <h3 className="text-[#b0d8c8] font-bold text-xs uppercase leading-snug group-hover:text-[#00e8ca] transition-colors">
                {item.title}
              </h3>
              {item.summary && (
                <p className="text-[#3a6858] text-xs mt-1 leading-relaxed whitespace-pre-line line-clamp-4">
                  {item.summary}
                </p>
              )}
              {item.url && (
                <span className="text-[#00b0a0] text-xs font-bold mt-0.5 inline-block">[MORE]</span>
              )}
              <p className="text-[#1e4438] text-[9px] mt-1">
                {new Date(item.date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Patch progress bar ──────────────────────────────────────────── */}
      {patchProgress && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          style={{ bottom: '20vh', width: '28vw' }}
        >
          <div
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
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

      {/* ── PLAY button — invisible click target over image's drawn PLAY capsule ── */}
      <button
        onClick={handleLaunch}
        disabled={buttonDisabled}
        title={buttonLabel}
        className={clsx(
          'absolute left-1/2 -translate-x-1/2 transition-all duration-150',
          buttonDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:brightness-125 active:scale-95'
        )}
        style={{
          bottom: '12.7vh',
          width: '16.93vw',
          height: '5.47vh',
          background: 'transparent',
          border: 'none',
          zIndex: 30,
          position: 'absolute',
        }}
      >
        {/* Error text floats above the PLAY button so it's above the frame PNG */}
        {isError && launchError && (
          <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[#ff8060] font-bold text-[10px] tracking-widest"
            style={{ bottom: '100%', marginBottom: '4px' }}>
            {launchError}
          </span>
        )}
        {/* Show spinner + state text only when busy */}
        {(isLaunching || isPatching) && (
          <span className="flex items-center justify-center gap-2 text-white font-black text-sm tracking-widest">
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            {buttonLabel}
          </span>
        )}
        {isError && (
          <span className="flex items-center justify-center text-[#ff6060] font-black text-xs tracking-widest">
            {buttonLabel}
          </span>
        )}
      </button>

      {/* ── Server status — z:30 to render above the frame PNG ── */}
      <div className="absolute flex flex-col gap-0.5" style={{ left: 0, bottom: '8.5vh', zIndex: 30 }}>
        {activeServer && (
          <div className="flex items-center gap-2 text-xs">
            <div className={clsx(
              'w-1.5 h-1.5 rounded-full shrink-0',
              status?.online ? 'bg-[#20c060] shadow-[0_0_4px_#20c060]' : 'bg-[#c03030]'
            )} />
            <span className="text-[#90c8a8] font-semibold">{activeServer.name}</span>
            <span className="text-[#3a6050] font-mono text-[10px]">
              {activeServer.host}:{activeServer.port}
            </span>
            {status?.playerCount !== undefined && (
              <span className="text-[#2a5040] text-[10px]">
                {status.playerCount.toLocaleString()} online
              </span>
            )}
          </div>
        )}
        {isError && launchError && (
          <p className="text-[#e05050] text-[10px] max-w-[320px]">{launchError}</p>
        )}
        {!settings.gamePath && (
          <p className="text-[#c89020] text-[10px]">Set game path in Settings ⚙</p>
        )}
      </div>
    </div>
  )
}
