import { useEffect, useState } from 'react'
import { GitCommit, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const GITHUB_COMMITS_URL =
  'https://api.github.com/repos/wittyphantom333/nexus-launcher/commits?per_page=50'

interface Commit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
}

export default function PatchNotesPage() {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(GITHUB_COMMITS_URL)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Commit[]) => setCommits(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ background: '#0a1614', height: 'calc(100% - 13vh)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-nexus-border shrink-0">
        <GitCommit className="w-4 h-4 text-nexus-primary" />
        <h1 className="font-display font-bold text-sm text-nexus-text-primary tracking-wide uppercase">
          Patch Notes
        </h1>
        <span className="text-nexus-text-muted text-xs ml-1">— Recent commits</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-nexus-border border-t-nexus-primary rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
            <p className="text-[#e05050] text-sm">Failed to load commits</p>
            <p className="text-nexus-text-muted text-xs">{error}</p>
          </div>
        )}

        {!loading && !error && commits.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
            <GitCommit className="w-8 h-8 text-nexus-text-muted opacity-20" />
            <p className="text-nexus-text-muted text-sm">No commits found</p>
          </div>
        )}

        <ul className="space-y-1">
          {commits.map(c => {
            const lines = c.commit.message.split('\n')
            const title = lines[0]
            return (
              <li
                key={c.sha}
                className="flex items-start gap-3 px-3 py-2 rounded hover:bg-white/5 transition-colors group cursor-pointer"
                onClick={() => window.electron.openExternal(c.html_url)}
              >
                <code className="text-[#5a9a8a] text-[10px] font-mono shrink-0 mt-0.5 w-14">
                  {c.sha.substring(0, 7)}
                </code>
                <div className="flex-1 min-w-0">
                  <p className="text-nexus-text-primary text-xs leading-snug truncate">
                    {title}
                  </p>
                  <p className="text-nexus-text-muted text-[10px] mt-0.5">
                    {c.commit.author.name} ·{' '}
                    {formatDistanceToNow(new Date(c.commit.author.date), { addSuffix: true })}
                  </p>
                </div>
                <ExternalLink className="w-3 h-3 text-nexus-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
