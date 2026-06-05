import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Minus, X, Settings } from 'lucide-react'
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

      {/* Window controls — over the image's blue/red dots */}
      <div
        className="absolute z-30 flex items-center gap-1.5"
        style={{ top: '12.5vh', left: '8.5vw', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.electron.minimize()}
          className="group w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          title="Minimize"
        >
          <Minus className="w-2.5 h-2.5 text-[#80b0d0] opacity-30 group-hover:opacity-100" />
        </button>
        <button
          onClick={() => window.electron.close()}
          className="group w-3.5 h-3.5 rounded-full flex items-center justify-center transition-opacity"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          title="Close"
        >
          <X className="w-2.5 h-2.5 text-[#e07070] opacity-30 group-hover:opacity-100" />
        </button>
      </div>

      {/* Right close dot */}
      <button
        onClick={() => window.electron.close()}
        className="group absolute z-30 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ top: '12.5vh', right: '3vw', background: 'transparent', border: 'none', cursor: 'pointer', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title="Close"
      >
        <X className="w-2.5 h-2.5 text-[#e07070] opacity-30 group-hover:opacity-100" />
      </button>

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

        {/* Settings gear */}
        <button
          onClick={() => navigate('/settings')}
          className={clsx(
            'h-full flex items-center justify-center transition-colors',
            pathname === '/settings' ? 'text-[#40ead0]' : 'text-[#5a9a8a] hover:text-[#70c0b0]'
          )}
          style={{ width: '4vw', background: 'transparent', border: 'none', cursor: 'pointer', marginRight: '2vw', opacity: 0.5 }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
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

