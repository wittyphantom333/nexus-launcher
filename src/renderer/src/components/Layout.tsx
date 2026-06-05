import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Settings, Minus, X } from 'lucide-react'
import BackgroundLayer from './BackgroundLayer'
import UpdateBanner from './UpdateBanner'

const NAV_ITEMS = [
  { path: '/', label: 'THE GAME' },
  { path: '/servers', label: 'SERVERS' },
  { path: '/patch-notes', label: 'PATCH NOTES' },
]

function CornerBracket({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const posClass = {
    tl: 'top-1 left-1 border-t-2 border-l-2',
    tr: 'top-1 right-1 border-t-2 border-r-2',
    bl: 'bottom-1 left-1 border-b-2 border-l-2',
    br: 'bottom-1 right-1 border-b-2 border-r-2',
  }[pos]
  return <div className={clsx('absolute w-6 h-6 pointer-events-none z-30 border-[#7a5818]', posClass)} />
}

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div
      className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#050810]"
      style={{ border: '2px solid #3a2510', boxShadow: 'inset 0 0 0 1px rgba(120,85,20,0.45)' }}
    >
      {/* Background artwork */}
      <BackgroundLayer />

      {/* Corner ornaments */}
      <CornerBracket pos="tl" />
      <CornerBracket pos="tr" />
      <CornerBracket pos="bl" />
      <CornerBracket pos="br" />

      {/* Content stack */}
      <div className="relative z-10 flex flex-col h-full">

        {/* ── Title bar ── */}
        <div
          className="relative flex items-center h-11 shrink-0 px-3"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* Social icon placeholders */}
          <div
            className="flex items-center gap-1.5"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {['f', 't'].map(l => (
              <div
                key={l}
                className="w-5 h-5 flex items-center justify-center border border-[#3a2510] bg-[#0d0805] text-[10px] font-bold text-[#7a5818] rounded-sm select-none cursor-default"
              >
                {l}
              </div>
            ))}
          </div>

          {/* Logo — centered */}
          <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center pointer-events-none select-none">
            <span className="ws-logo-text text-2xl font-black tracking-[0.2em] uppercase">
              NEXUS LAUNCHER
            </span>
          </div>

          {/* Window controls */}
          <div
            className="ml-auto flex items-center gap-1.5"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={() => window.electron.minimize()}
              className="w-6 h-5 flex items-center justify-center border border-[#3a2510] bg-[#0d0805] text-[#7a8890] hover:text-white hover:bg-[#1a2a30] transition-colors rounded-sm"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => window.electron.close()}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-[#8b1a1a] border border-[#6b1010] text-white/70 hover:text-white hover:bg-[#cc2222] transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* ── Nav bar ── */}
        <nav
          className="relative flex items-stretch h-8 shrink-0 ws-hex-bg"
          style={{
            background: 'rgba(4,12,10,0.95)',
            borderTop: '1px solid rgba(0,180,160,0.15)',
            borderBottom: '1px solid rgba(0,180,160,0.22)',
          }}
        >
          {NAV_ITEMS.map(({ path, label }) => {
            const active = pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={clsx(
                  'relative px-6 text-[11px] font-semibold tracking-[0.12em] transition-all duration-150 flex items-center uppercase',
                  active ? 'text-[#00e8ca]' : 'text-[#708090] hover:text-[#b0cfd0]'
                )}
              >
                {label}
                {active && (
                  <span
                    className="absolute bottom-0 inset-x-0 h-[2px] bg-[#00e8ca]"
                    style={{ boxShadow: '0 0 6px #00e8ca, 0 0 12px rgba(0,232,202,0.4)' }}
                  />
                )}
              </button>
            )
          })}
          <div className="flex-1" />
          <button
            onClick={() => navigate('/settings')}
            className={clsx(
              'px-4 flex items-center transition-all duration-150',
              pathname === '/settings' ? 'text-[#00e8ca]' : 'text-[#708090] hover:text-[#b0cfd0]'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </nav>

        {/* Update banner */}
        <UpdateBanner />

        {/* Page content */}
        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}

