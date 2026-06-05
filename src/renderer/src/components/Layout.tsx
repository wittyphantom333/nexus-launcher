import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Minus, X, Settings } from 'lucide-react'
import BackgroundLayer from './BackgroundLayer'
import UpdateBanner from './UpdateBanner'

/*
 * Pixel map for 1200x800 window (image fills exactly via object-fit:fill):
 *   y 0   - 134  : logo / title drag region
 *   y 134 - 168  : nav bar strip
 *   y 168 - 800  : content area (pages render here)
 *
 * Nav items in the image span roughly x 220-960.
 * Window controls: left dots ~x 185, y 152 | gear ~x 977, y 152
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

      {/* The full-window launcher image */}
      <BackgroundLayer />

      {/* ── Functional overlays – all transparent unless noted ── */}

      {/* Drag region: covers the WILDSTAR logo strip */}
      <div
        className="absolute inset-x-0 top-0 z-20"
        style={{ height: '16.75vh', WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Window controls – absolutely over the image's control dots */}
      <div
        className="absolute z-30 flex items-center gap-1.5"
        style={{ top: '17.875vh', left: '15.42vw', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.electron.minimize()}
          className="group w-[14px] h-[14px] rounded-full flex items-center justify-center"
          style={{ background: 'rgba(40,85,130,0)', border: 'none' }}
          title="Minimize"
        >
          <Minus className="w-2.5 h-2.5 text-[#70a0c0] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={() => window.electron.close()}
          className="group w-[14px] h-[14px] rounded-full flex items-center justify-center"
          style={{ background: 'rgba(120,20,20,0)', border: 'none' }}
          title="Close"
        >
          <X className="w-2.5 h-2.5 text-[#e07070] opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Nav click targets – transparent, sit exactly over the image's drawn nav text.
          Active tab gets a teal underline glow that looks native to the image. */}
      <div
        className="absolute inset-x-0 z-30 flex items-stretch"
        style={{ top: '16.75vh', height: '4.25vh', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* left spacer to align with image nav start */}
        <div style={{ width: '18.33vw' }} />

        {NAV_ITEMS.map(({ path, label }) => {
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={label}
              className="relative flex-1 h-full cursor-pointer"
              style={{ background: 'transparent', border: 'none', maxWidth: '20vw' }}
            >
            </button>
          )
        })}

        {/* right spacer */}
        <div className="flex-1" />

        {/* Settings gear – over the image's right control icon */}
        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          className={clsx(
            'w-10 h-full flex items-center justify-center transition-colors',
            pathname === '/settings' ? 'text-[#40ead0]' : 'text-transparent hover:text-[#40ead0]'
          )}
          style={{ marginRight: 72 }}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      <UpdateBanner />

      {/* Page content */}
      <div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{ top: '21vh' }}
      >
        {children}
      </div>
    </div>
  )
}
