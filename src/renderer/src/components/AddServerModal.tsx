import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { X, Plus, Globe } from 'lucide-react'
import { useStore } from '../store'
import type { ServerProfile } from '../types'

interface Props {
  onClose: () => void
}

export default function AddServerModal({ onClose }: Props) {
  const { addServer } = useStore()
  const [form, setForm] = useState({
    name: '',
    host: '',
    port: '24000',
    description: '',
    website: '',
    newsUrl: '',
    patchManifestUrl: '',
    statusUrl: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError('Server name is required')
    if (!form.host.trim()) return setError('Server host is required')
    const port = parseInt(form.port, 10)
    if (isNaN(port) || port < 1 || port > 65535) return setError('Invalid port number')

    setSaving(true)
    setError('')

    const server: ServerProfile = {
      id: uuidv4(),
      name: form.name.trim(),
      host: form.host.trim(),
      port,
      description: form.description.trim(),
      website: form.website.trim() || undefined,
      newsUrl: form.newsUrl.trim() || undefined,
      patchManifestUrl: form.patchManifestUrl.trim() || undefined,
      statusUrl: form.statusUrl.trim() || undefined,
      isCustom: true,
      addedAt: new Date().toISOString()
    }

    await addServer(server)
    setSaving(false)
    onClose()
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; required?: boolean; type?: string }[] = [
    { key: 'name', label: 'Server Name', placeholder: 'My WildStar Server', required: true },
    { key: 'host', label: 'Host / IP', placeholder: 'play.myserver.com or 192.168.1.1', required: true },
    { key: 'port', label: 'Auth Port', placeholder: '24000', required: true },
    { key: 'description', label: 'Description', placeholder: 'Optional short description' },
    { key: 'website', label: 'Website URL', placeholder: 'https://myserver.com' },
    { key: 'newsUrl', label: 'News JSON URL', placeholder: 'https://api.myserver.com/news' },
    { key: 'statusUrl', label: 'Status API URL', placeholder: 'https://api.myserver.com/status' },
    { key: 'patchManifestUrl', label: 'Patch Manifest URL', placeholder: 'https://cdn.myserver.com/manifest.json' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 nexus-card w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-nexus-primary" />
            <h2 className="font-display font-bold text-lg text-nexus-text-primary">Add Server</h2>
          </div>
          <button onClick={onClose} className="text-nexus-text-muted hover:text-nexus-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-nexus-text-secondary mb-1">
                {f.label}
                {f.required && <span className="text-nexus-error ml-0.5">*</span>}
              </label>
              <input
                className="nexus-input"
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-nexus-error text-xs mt-3">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-nexus-border">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {saving ? 'Adding…' : 'Add Server'}
          </button>
        </div>
      </div>
    </div>
  )
}
