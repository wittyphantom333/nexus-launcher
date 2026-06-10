import { useEffect, useCallback } from 'react'
import { clsx } from 'clsx'
import { useStore } from '../store'
import type { PatchProgress } from '../types'

/**
 * Global PLAY button — rendered in Layout so it works on every page.
 * Overlay positioned over the drawn capsule on the launcher frame.
 */
export default function PlayButton() {
  const {
    settings,
    activeServer,
    launchState,
    launchError,
    setLaunchState,
    setPatchProgress,
  } = useStore()

  // Patcher event subscriptions (live across all pages)
  useEffect(() => {
    const offProgress = window.electron.onPatchProgress((p: PatchProgress) => setPatchProgress(p))
    const offComplete = window.electron.onPatchComplete(() => { setPatchProgress(null); setLaunchState('idle') })
    const offError = window.electron.onPatchError(err => { setPatchProgress(null); setLaunchState('error', err.message) })
    return () => { offProgress(); offComplete(); offError() }
  }, [])

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
    if (!validation.valid) {
      setLaunchState('error', validation.error ?? 'Invalid game path')
      setTimeout(() => setLaunchState('idle'), 3000)
      return
    }

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
      else if (settings.minimizeOnLaunch) { window.electron.minimize(); setLaunchState('idle') }
      else setLaunchState('idle')
      if (settings.discordRPC) window.electron.updateDiscord({ details: `Playing on ${activeServer.name}`, state: 'In-game' })
    } else {
      setLaunchState('error', result.error ?? 'Failed to launch')
    }
  }, [activeServer, settings])

  const isPatching = launchState === 'patching'
  const isLaunching = launchState === 'checking' || launchState === 'launching'
  const isError = launchState === 'error'
  const buttonDisabled = isPatching || isLaunching

  const buttonLabel =
    launchState === 'checking'  ? 'CHECKING...'  :
    launchState === 'patching'  ? 'PATCHING...'  :
    launchState === 'launching' ? 'LAUNCHING...' :
    isError                     ? 'RETRY'        : 'PLAY'

  return (
    <button
      onClick={handleLaunch}
      disabled={buttonDisabled}
      title={buttonLabel}
      className={clsx(
        'absolute left-1/2 -translate-x-1/2 transition-all duration-150',
        buttonDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:brightness-125 active:scale-95'
      )}
      style={{
        bottom: '12.5vh',
        width: '15vw',
        height: '4.5vh',
        background: 'transparent',
        border: 'none',
        position: 'absolute',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Error text floats above the PLAY button */}
      {isError && launchError && (
        <span
          className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[#ff8060] font-bold text-[10px] tracking-widest"
          style={{ bottom: '100%', marginBottom: '4px' }}
        >
          {launchError}
        </span>
      )}
      {(isLaunching || isPatching) ? (
        <span
          className="flex items-center justify-center gap-2 text-white"
          style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '0.95rem', letterSpacing: '0.2em' }}
        >
          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          {buttonLabel}
        </span>
      ) : isError ? (
        <span
          className="flex items-center justify-center text-[#ff6060]"
          style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '1rem', letterSpacing: '0.25em' }}
        >
          {buttonLabel}
        </span>
      ) : (
        <span
          className="flex items-center justify-center text-white"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            fontSize: '1.1rem',
            letterSpacing: '0.3em',
            textShadow: '0 0 12px rgba(0,232,202,0.9), 0 2px 4px rgba(0,0,0,0.95)',
          }}
        >
          {buttonLabel}
        </span>
      )}
    </button>
  )
}
