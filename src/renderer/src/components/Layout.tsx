import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import BackgroundLayer from './BackgroundLayer'
import UpdateBanner from './UpdateBanner'
import ResizeHandles from './ResizeHandles'
import launcherBg from '../assets/launcher-bg.png'

/*
 * Pixel map — new launcher.png (1536x1024) scaled to 1200x800 window:
 *   Logo/drag zone   : y 0    -> 11.23vh
 *   Nav strip        : y 11.23vh, height 4.69vh
 *   Content area     : y 15.92vh -> bottom
 *   Left ctrl dots   : x ~8.5vw,  y ~13.38vh
 *   Right close dot  : x ~97vw,   y ~13.38vh
 *   Nav items spread : x ~18vw -> ~88vw
 */

const NAV_ITEMS = [
  { path: '/', label: 'THE GAME' },
  { path: '/servers', label: 'COMMUNITY' },
  { path: '/patch-notes', label: 'PATCH NOTES' },
  { path: '/settings', label: 'OPTIONS' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: 'transparent' }}>

      {/* Resize handles - 8 invisible edge/corner zones */}
      <ResizeHandles />

      {/* Layer 0: the frame image */}
      <BackgroundLayer />

      {/* Layer 1: functional overlays */}

      {/* Drag zone — covers the NEXUS logo only, stops above control dots */}
      <div
        className="absolute inset-x-0 top-0 z-20"
        style={{ height: '11vh', WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Window controls — positioned independently to align with drawn dots */}
      {/* Window controls — invisible circular hit targets directly over the drawn dots */}
      <button
        onClick={() => window.electron.minimize()}
        className="absolute z-30 rounded-full transition-colors"
        style={{
          top: '13vh', right: '9vw',
          width: 22, height: 22,
          background: 'transparent', border: 'none', cursor: 'pointer',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(60,180,255,0.25)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        title="Minimize"
      />
      <button
        onClick={() => window.electron.close()}
        className="absolute z-30 rounded-full transition-colors"
        style={{
          top: '13.5vh', right: '7vw',
          width: 22, height: 22,
          background: 'transparent', border: 'none', cursor: 'pointer',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,80,80,0.25)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        title="Close"
      />

      {/* Nav items — rendered over the empty nav strip */}
      <nav
        className="absolute inset-x-0 z-30 flex items-stretch"
        style={{ top: '13.5vh', height: '5vh', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* left spacer — clears the window control dots */}
        <div style={{ width: '18vw', flexShrink: 0 }} />

        {NAV_ITEMS.map(({ path, label }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={clsx(
                'relative flex-1 h-full text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-150',
                active ? 'text-[#40ead0]' : 'text-[#5a9a8a] hover:text-[#70c0b0]'
              )}
              style={{ background: 'transparent', border: 'none', maxWidth: '18vw', cursor: 'pointer' }}
            >
              {label}
              {active && (
                <span
                  className="absolute bottom-[3px] inset-x-[15%] h-[2px]"
                  style={{ background: '#00e8ca', boxShadow: '0 0 8px #00e8ca, 0 0 14px rgba(0,232,202,0.5)' }}
                />
              )}
            </button>
          )
        })}

        <div style={{ flex: 1 }} />
      </nav>

      <UpdateBanner />

      {/* Page content — z:25 (above frame PNG at z:20) so children can render normally.
          Inset to frame interior so it can't cover the drawn chrome. */}
      <div
        className="absolute bottom-0"
        style={{ top: '18vh', left: '6.5vw', right: '6.5vw', zIndex: 25 }}
      >
        {children}
      </div>

      {/* Frame PNG — z:20, above content. Transparent interior reveals content;
          opaque chrome naturally covers anything that drifts outside the window */}
      <img
        src={launcherBg}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full select-none pointer-events-none"
        style={{ objectFit: 'fill', zIndex: 20 }}
      />
    </div>
  )
}

