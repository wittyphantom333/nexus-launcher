import { useState } from 'react'
import { Plus, Trash2, Globe, Star } from 'lucide-react'
import { useStore } from '../store'
import ServerCard from '../components/ServerCard'
import AddServerModal from '../components/AddServerModal'

export default function ServersPage() {
  const { settings, activeServer, setActiveServer, removeServer } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleRemove = async (id: string) => {
    await removeServer(id)
    setConfirmDelete(null)
  }

  return (
    <div
      className="flex flex-col overflow-hidden p-5"
      style={{ background: '#0a1614', height: 'calc(100% - 17vh)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="font-display font-bold text-xl text-nexus-text-primary tracking-wide">Servers</h1>
          <p className="text-nexus-text-muted text-xs mt-0.5">
            {settings.servers.length} server{settings.servers.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus className="w-4 h-4" />
          Add Server
        </button>
      </div>

      {/* Server list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {settings.servers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Globe className="w-10 h-10 text-nexus-text-muted opacity-20" />
            <p className="text-nexus-text-muted text-sm">No servers added yet</p>
            <button onClick={() => setShowAdd(true)} className="btn-ghost text-xs">
              + Add your first server
            </button>
          </div>
        )}

        {settings.servers.map(server => (
          <div key={server.id} className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0">
              <ServerCard
                server={server}
                active={activeServer?.id === server.id}
                onClick={() => setActiveServer(server.id)}
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveServer(server.id)}
                title="Set as active server"
                className={
                  activeServer?.id === server.id
                    ? 'w-8 h-8 flex items-center justify-center rounded-xl bg-nexus-primary/20 text-nexus-primary border border-nexus-primary/30'
                    : 'w-8 h-8 flex items-center justify-center rounded-xl text-nexus-text-muted hover:text-nexus-primary hover:bg-nexus-primary/10 border border-nexus-border transition-colors'
                }
              >
                <Star className="w-3.5 h-3.5" />
              </button>

              {server.website && (
                <button
                  onClick={() => window.electron.openExternal(server.website!)}
                  title="Open website"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-nexus-text-muted hover:text-nexus-accent hover:bg-nexus-accent/10 border border-nexus-border transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                </button>
              )}

              {server.isCustom && (
                <button
                  onClick={() => setConfirmDelete(server.id)}
                  title="Remove server"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-nexus-text-muted hover:text-nexus-error hover:bg-nexus-error/10 border border-nexus-border transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showAdd && <AddServerModal onClose={() => setShowAdd(false)} />}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 nexus-card p-5 max-w-sm w-full mx-4">
            <h3 className="font-display font-bold text-nexus-text-primary mb-2">Remove Server?</h3>
            <p className="text-nexus-text-muted text-sm mb-4">
              This server will be removed from your list. You can add it again later.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Cancel</button>
              <button onClick={() => handleRemove(confirmDelete)} className="btn-danger">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
