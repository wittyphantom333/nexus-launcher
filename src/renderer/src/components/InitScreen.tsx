import { RefreshCw } from 'lucide-react'

export default function InitScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-nexus-bg flex-col gap-4">
      <div className="w-16 h-16 rounded-2xl bg-nexus-primary/10 border border-nexus-primary/30 flex items-center justify-center animate-pulse-slow">
        <RefreshCw className="w-8 h-8 text-nexus-primary" />
      </div>
      <p className="font-display text-2xl font-bold tracking-widest text-nexus-primary uppercase">
        Nexus Launcher
      </p>
      <p className="text-nexus-text-muted text-sm">Loading…</p>
    </div>
  )
}
