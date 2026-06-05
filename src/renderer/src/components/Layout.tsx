import { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Home,
  Server,
  FileText,
  Settings,
  ChevronLeft,
  Minus,
  Square,
  X,
  RefreshCw
} from 'lucide-react'
import { useStore } from '../store'
import BackgroundLayer from './BackgroundLayer'
import UpdateBanner from './UpdateBanner'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/servers', label: 'Servers', icon: Server },
  { path: '/patch-notes', label: 'Patch Notes', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings }
]

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { sidebarExpanded, toggleSidebar } = useStore()

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-nexus-bg">
      {/* Background */}
      <BackgroundLayer />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none z-0" />

      {/* Titlebar (drag region + window controls) */}
      <div
        className="relative z-20 flex items-center justify-between px-4 h-10 shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 select-none" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <div className="w-6 h-6 rounded-md bg-nexus-primary/20 border border-nexus-primary/40 flex items-center justify-center">
            <RefreshCw className="w-3.5 h-3.5 text-nexus-primary" />
          </div>
          <span className="font-display font-bold text-base tracking-wider text-nexus-primary uppercase">
            Nexus Launcher
          </span>
        </div>

        {/* Window controls */}
        <div
          className="flex items-center gap-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={() => window.electron.minimize()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-nexus-text-muted hover:text-nexus-text-secondary hover:bg-white/5 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.electron.maximize()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-nexus-text-muted hover:text-nexus-text-secondary hover:bg-white/5 transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => window.electron.close()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-nexus-text-muted hover:text-nexus-error hover:bg-nexus-error/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Update banner */}
      <UpdateBanner />

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={clsx(
            'relative flex flex-col shrink-0 bg-nexus-surface/80 backdrop-blur-md border-r border-nexus-border transition-all duration-300',
            sidebarExpanded ? 'w-52' : 'w-14'
          )}
        >
          {/* Nav links */}
          <nav className="flex flex-col gap-1 p-2 flex-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const active = pathname === path
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full',
                    active
                      ? 'bg-nexus-primary/15 text-nexus-primary border border-nexus-primary/30 shadow-nexus-sm'
                      : 'text-nexus-text-secondary hover:text-nexus-text-primary hover:bg-white/5'
                  )}
                  title={!sidebarExpanded ? label : undefined}
                >
                  <Icon className={clsx('shrink-0', active ? 'w-4 h-4' : 'w-4 h-4')} />
                  {sidebarExpanded && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
                  )}
                  {active && !sidebarExpanded && (
                    <span className="absolute left-0 w-0.5 h-5 bg-nexus-primary rounded-r-full" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Expand/collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="m-2 p-2 rounded-xl text-nexus-text-muted hover:text-nexus-text-secondary hover:bg-white/5 transition-colors flex items-center justify-center"
          >
            <ChevronLeft
              className={clsx(
                'w-4 h-4 transition-transform duration-300',
                !sidebarExpanded && 'rotate-180'
              )}
            />
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
