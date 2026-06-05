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

// Machined corner accent — four L-shaped hardware tabs
function CornerAccent({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    width: 18,
    height: 18,
    pointerEvents: 'none',
    zIndex: 40,
    ...(pos === 'tl' ? { top: 0, left: 0, borderTop: '3px solid #c8901a', borderLeft: '3px solid #c8901a', boxShadow: '-1px -1px 6px rgba(200,144,26,0.5)' } : {}),
    ...(pos === 'tr' ? { top: 0, right: 0, borderTop: '3px solid #c8901a', borderRight: '3px solid #c8901a', boxShadow: '1px -1px 6px rgba(200,144,26,0.5)' } : {}),
    ...(pos === 'bl' ? { bottom: 0, left: 0, borderBottom: '3px solid #c8901a', borderLeft: '3px solid #c8901a', boxShadow: '-1px 1px 6px rgba(200,144,26,0.5)' } : {}),
    ...(pos === 'br' ? { bottom: 0, right: 0, borderBottom: '3px solid #c8901a', borderRight: '3px solid #c8901a', boxShadow: '1px 1px 6px rgba(200,144,26,0.5)' } : {}),
  }
  return <div style={style} />
}

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    /* Outermost shell: thick machined-metal dark bezel */
    <div
      className="relative flex flex-col h-screen w-screen overflow-hidden"
      style={{
        background: '#06080c',
        // Three-layer border: outer gold highlight → dark gap → inner teal glow
        boxShadow: [
          'inset 0 0 0 1px rgba(200,144,26,0.65)',
          'inset 0 0 0 3px #0d0f14',
          'inset 0 0 0 4px rgba(0,160,140,0.30)',
          '0 0 0 1px rgba(200,144,26,0.25)',
        ].join(', '),
      }}
    >
      {/* Machined bezel edge — decorative gradient rails on all 4 sides */}
      <div className="absolute inset-0 pointer-events-none z-30" style={{
        background: [
          'linear-gradient(to bottom, rgba(180,130,20,0.18) 0px, transparent 6px)',
          'linear-gradient(to top, rgba(180,130,20,0.10) 0px, transparent 6px)',
          'linear-gradient(to right, rgba(180,130,20,0.14) 0px, transparent 6px)',
          'linear-gradient(to left, rgba(180,130,20,0.14) 0px, transparent 6px)',
        ].join(', '),
      }} />

      {/* Background artwork */}
      <BackgroundLayer />

      {/* Corner gold accents */}
      <CornerAccent pos="tl" />
      <CornerAccent pos="tr" />
      <CornerAccent pos="bl" />
      <CornerAccent pos="br" />

      {/* Content stack */}
      <div className="relative z-10 flex flex-col h-full">

        {/* ── Title bar: draggable, holds logo + window controls ── */}
        <div
          className="relative flex items-center shrink-0 px-3"
          style={{
            height: 52,
            WebkitAppRegion: 'drag',
            background: 'linear-gradient(180deg, rgba(6,8,14,0.88) 0%, rgba(3,5,9,0.82) 100%)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(200,144,26,0.30)',
          } as React.CSSProperties}
        >
          {/* Window controls — left */}
          <div
            className="flex items-center gap-2 z-10"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={() => window.electron.minimize()}
              className="w-7 h-6 flex items-center justify-center text-[#50687a] hover:text-white hover:bg-[#1a2a3a] transition-colors rounded"
              style={{ border: '1px solid rgba(80,104,122,0.4)' }}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => window.electron.close()}
              className="w-7 h-6 flex items-center justify-center text-[#8b3030] hover:text-white hover:bg-[#aa2020] transition-colors rounded"
              style={{ border: '1px solid rgba(139,48,48,0.5)' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Logo — full-width centered over the title bar */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-0.5">
            <span className="ws-logo-text text-[26px] font-black tracking-[0.28em] uppercase leading-none">
              NEXUS LAUNCHER
            </span>
            {/* Decorative rule beneath logo */}
            <div className="flex items-center gap-2 w-72">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(200,144,26,0.6))' }} />
              <div className="w-1.5 h-1.5 rotate-45 bg-[#c8901a] opacity-70" />
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(200,144,26,0.6))' }} />
            </div>
          </div>

          {/* Settings — right */}
          <div
            className="ml-auto z-10"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <button
              onClick={() => navigate('/settings')}
              className={clsx(
                'w-7 h-6 flex items-center justify-center rounded transition-colors',
                pathname === '/settings'
                  ? 'text-[#00e8ca] bg-[#00e8ca]/10'
                  : 'text-[#50687a] hover:text-[#c8c0a0] hover:bg-[#1a2030]'
              )}
              style={{ border: '1px solid rgba(80,104,122,0.4)' }}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Nav bar ── */}
        <nav
          className="relative flex items-stretch shrink-0 ws-hex-bg"
          style={{
            height: 36,
            background: 'rgba(3,8,7,0.88)',
            backdropFilter: 'blur(10px)',
            borderBottom: '2px solid rgba(0,180,160,0.35)',
            boxShadow: '0 2px 12px rgba(0,180,160,0.15)',
          }}
        >
          {/* Left edge accent line */}
          <div className="w-4 shrink-0 flex items-center justify-center">
            <div className="w-px h-3/4" style={{ background: 'rgba(0,180,160,0.2)' }} />
          </div>

          {NAV_ITEMS.map(({ path, label }, i) => {
            const active = pathname === path
            return (
              <div key={path} className="flex items-stretch">
                {/* Separator diamond */}
                {i > 0 && (
                  <div className="flex items-center px-0.5">
                    <div className="w-1 h-1 rotate-45 bg-[#1a4a42] opacity-80" />
                  </div>
                )}
                <button
                  onClick={() => navigate(path)}
                  className={clsx(
                    'relative px-7 text-[11px] font-bold tracking-[0.18em] transition-all duration-150 flex items-center uppercase',
                    active ? 'text-[#00e8ca]' : 'text-[#506878] hover:text-[#a0c8c0]'
                  )}
                >
                  {label}
                  {active && (
                    <>
                      <span
                        className="absolute bottom-0 inset-x-0 h-[2px]"
                        style={{ background: '#00e8ca', boxShadow: '0 0 8px #00e8ca, 0 0 16px rgba(0,232,202,0.5)' }}
                      />
                      <span
                        className="absolute bottom-[2px] inset-x-0 h-[6px]"
                        style={{ background: 'linear-gradient(to top, rgba(0,232,202,0.12), transparent)' }}
                      />
                    </>
                  )}
                </button>
              </div>
            )
          })}

          <div className="flex-1" />
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

