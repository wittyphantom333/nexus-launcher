import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store'
import { formatDistanceToNow } from 'date-fns'
import type { PatchNote } from '../types'

export default function PatchNotesPage() {
  const activeServer = useStore(s => s.activeServer)
  const [notes, setNotes] = useState<PatchNote[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    // If the active server has a GitHub-style releases URL or custom notes URL we can fetch
    const url = activeServer?.newsUrl
    if (!url) { setNotes([]); return }

    setLoading(true)
    window.electron
      .fetchNews(url)
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          // Expect items shaped as PatchNote or NewsItem
          setNotes(res.data as PatchNote[])
        }
      })
      .finally(() => setLoading(false))
  }, [activeServer?.id, activeServer?.newsUrl])

  const toggleExpand = (version: string) => {
    setExpanded(prev => (prev === version ? null : version))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-nexus-border shrink-0">
        <FileText className="w-4 h-4 text-nexus-primary" />
        <h1 className="font-display font-bold text-sm text-nexus-text-primary tracking-wide uppercase">
          Patch Notes
        </h1>
        {activeServer && (
          <span className="text-nexus-text-muted text-xs ml-1">— {activeServer.name}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-nexus-border border-t-nexus-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
            <FileText className="w-8 h-8 text-nexus-text-muted opacity-20" />
            <p className="text-nexus-text-muted text-sm">
              {activeServer?.newsUrl ? 'No patch notes available' : 'No news URL configured'}
            </p>
          </div>
        )}

        {notes.map(note => {
          const isExpanded = expanded === note.version
          return (
            <div key={note.version} className="nexus-card overflow-hidden">
              {/* Version header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(note.version)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-nexus-primary text-base">
                    v{note.version}
                  </span>
                  {note.title && (
                    <span className="text-nexus-text-secondary text-sm">{note.title}</span>
                  )}
                  <span className="text-nexus-text-muted text-xs">
                    {formatDistanceToNow(new Date(note.date), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {note.url && (
                    <button
                      onClick={e => { e.stopPropagation(); window.electron.openExternal(note.url!) }}
                      className="p-1 rounded-lg text-nexus-text-muted hover:text-nexus-primary transition-colors"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-nexus-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-nexus-text-muted" />
                  )}
                </div>
              </button>

              {/* Markdown content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-nexus-border">
                  <div className="prose prose-sm prose-invert max-w-none text-nexus-text-secondary
                    prose-headings:text-nexus-text-primary prose-headings:font-display
                    prose-a:text-nexus-primary prose-a:no-underline hover:prose-a:underline
                    prose-code:text-nexus-accent prose-code:bg-nexus-surface prose-code:px-1 prose-code:rounded
                    prose-strong:text-nexus-text-primary
                    prose-li:text-nexus-text-secondary
                    prose-ul:pl-4 prose-ol:pl-4">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
