import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Settings, Minus, X } from 'lucide-react'
import BackgroundLayer from './BackgroundLayer'
import UpdateBanner from './UpdateBanner'

// Labels match what is drawn in the launcher background image
const NAV_ITEMS = [
  { path: '/', label: 'THE GAME' },
  { path: '/servers', label: 'COMMUNITY' },
  { path: '/patch-notes', label: 'PATCH NOTES' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div className="h-screen w-screen overflow-hidden relative" style={{ background: '#06090a' }}>

      {/* Layer 0: full-window background image */}
      <BackgroundLayer />

      {/* Layer 1: functional overlays - transparent by default */}
      <div className="absolute inset-0 z-10 flex flex-col">

        {/*
         * Title drag zone (134px) - covers the WILDSTAR logo strip drawn in the image.
         * Completely transparent so the image logo shows through. This is the drag handle.
         */}
        <div
          className="shrink-0"
          style={{ height: 134, WebkitAppRegion: 'drag' } as React.CSSProperties}
        />

        {/*
         * Nav bar (34px) - overlaid on the image's teal nav strip.
         * Semi-opaque dark bg to mask the image's static text so only ours shows.
         */}
        <nav
          className="shrink-0 relative flex items-center"
          style={{
            height: 34,
            background: 'rgba(3,10,9,0.75)',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* Window controls - left side, over the image's blue/red dots */}
          <div className="flex items-center gap-1.5 pl-[74px]">
            <button
              onClick={() => window.electron.minimize()}
              className="group w-3.5 h-3.5 rounded-full transition-all"
              style={{ background: 'rgba(42,90,138,0.9)', border: '1px solid rgba(74,128,170,0.7)' }}
              title="Minimize"
            >
              <Minus className="w-2 h-2 text-[#80b0d0] opacity-0 group-hover:opacity-100 mx-auto" />
            </button>
            <button
              onClick={() => window.electron.close()}
              className="group w-3.5 h-3.5 rounded-full transition-all"
              style={{ background: 'rgba(130,22,22,0.9)', border: '1px solid rgba(170,48,48,0.7)' }}
              title="Close"
            >
              <X className="w-2 h-2 text-[#e0a0a0] opacity-0 group-hover:opacity-100 mx-auto" />
            </button>
          </div>

          {/* Nav items - centered across the nav strip */}
          <div className="flex-1 flex items-stretch justify-center h-full">
            {NAV_ITEMS.map(({ path, label }) => {
              const active = pathname === path
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={clsx(
                    'relative px-8 text-[11px] font-bold tracking-[0.2em] uppercase h-full transition-all duration-150',
                    active ? 'text-[#40ead0]' : 'text-[#3a6070] hover:text-[#80c0b8]'
                  )}
                  style={{ background: active ? 'rgba(0,160,130,0.2)' : 'transparent' }}
                >
                  {label}
                  {active && (
                    <span
                      className="absolute bottom-0 inset-x-0 h-[2px]"
                      style={{ background: '#00e8ca', boxShadow: '0 0 8px #00e8ca, 0 0 14px rgba(0,232,202,0.4)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Settings icon - right side, over the image's right control dot */}
          <div className="pr-[74px]">
            <button
              onClick={() => navigate('/settings')}
              className={clsx(
                'w-6 h-6 flex items-center justify-center rounded transition-colors',
                pathname === '/settings' ? 'text-[#40ead0]' : 'text-[#3a6070] hover:text-[#80c0b8]'
              )}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>

        <UpdateBanner />

        {/* Page content - fills the rest of the window */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}
