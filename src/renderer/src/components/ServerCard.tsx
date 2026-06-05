import { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { Wifi, WifiOff, Users, Clock } from 'lucide-react'
import { useStore } from '../store'
import type { ServerProfile, ServerStatus } from '../types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  server: ServerProfile
  active?: boolean
  onClick?: () => void
}

export default function ServerCard({ server, active, onClick }: Props) {
  const { serverStatuses, setServerStatus } = useStore()
  const status: ServerStatus | undefined = serverStatuses[server.id]
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const fetchStatus = async () => {
    const url = server.statusUrl || `${server.host}:${server.port}`
    try {
      const s = await window.electron.getServerStatus(url)
      setServerStatus(server.id, s)
    } catch {
      setServerStatus(server.id, { online: false, lastChecked: new Date().toISOString() })
    }
  }

  useEffect(() => {
    fetchStatus()
    intervalRef.current = setInterval(fetchStatus, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [server.id, server.host, server.port, server.statusUrl])

  return (
    <button
      onClick={onClick}
      className={clsx(
        'nexus-card p-4 text-left w-full transition-all duration-200 cursor-pointer',
        active && 'border-nexus-primary/50 shadow-nexus-md bg-nexus-card-hover'
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Logo/avatar */}
        <div className="w-10 h-10 rounded-xl bg-nexus-surface border border-nexus-border flex items-center justify-center shrink-0 overflow-hidden">
          {server.logoUrl ? (
            <img src={server.logoUrl} alt={server.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-bold text-nexus-primary text-base">
              {server.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name + address */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-nexus-text-primary text-sm truncate">{server.name}</p>
            {active && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-nexus-primary/20 text-nexus-primary rounded-md border border-nexus-primary/30">
                ACTIVE
              </span>
            )}
          </div>
          <p className="text-nexus-text-muted text-xs mt-0.5 truncate font-mono">
            {server.host}:{server.port}
          </p>
        </div>

        {/* Online status */}
        <div className="shrink-0 flex items-center gap-1.5">
          {status ? (
            status.online ? (
              <Wifi className="w-3.5 h-3.5 text-nexus-success" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-nexus-error/60" />
            )
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-nexus-border border-t-nexus-primary animate-spin" />
          )}
        </div>
      </div>

      {/* Stats row */}
      {status && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-nexus-border text-xs text-nexus-text-muted">
          {status.playerCount !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {status.playerCount.toLocaleString()} online
            </span>
          )}
          {status.latency !== undefined && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {status.latency}ms
            </span>
          )}
          <span className="ml-auto opacity-60">
            {formatDistanceToNow(new Date(status.lastChecked), { addSuffix: true })}
          </span>
        </div>
      )}
    </button>
  )
}
