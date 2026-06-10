import { useEffect } from 'react'
import { clsx } from 'clsx'
import { useStore } from '../store'
import ContentSlider from '../components/ContentSlider'
import type { NewsItem } from '../types'
import newsCardBg from '../assets/news-card.png'

/**
 * GitHub raw URL for the news feed.
 * Edit news.json in the repo root to update news without a launcher release.
 */
const GITHUB_NEWS_URL =
  'https://raw.githubusercontent.com/wittyphantom333/nexus-launcher/main/news.json'

/**
 * Slide images shown inside the launcher content area.
 * Add URLs here (or absolute local paths) to populate the slider.
 * Leave empty for no slider.
 */
const SLIDES: string[] = [
  // 'https://example.com/screenshot1.jpg',
]

export default function HomePage() {
  const {
    news,
    setNews,
    patchProgress,
  } = useStore()

  // ── Fetch news via IPC (main-process axios — bypasses renderer file:// origin issues) ──
  useEffect(() => {
    window.electron.fetchNews(GITHUB_NEWS_URL)
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setNews(res.data as NewsItem[])
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="h-full w-full relative">

      {/* ── Background image slider (fills left content area) ── */}
      <ContentSlider slides={SLIDES} interval={7} />

      {/* NEWS card — news.png background + scrollable content overlay */}
      <div
        style={{
          position: 'absolute',
          right: '1vw',
          top: '3vh',
          width: '22vw',
          bottom: '20vh',
          zIndex: 30,
        }}
      >
        {/* Card background image */}
        <img
          src={newsCardBg}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full select-none pointer-events-none"
          style={{ objectFit: 'fill' }}
        />

        {/* Scrollable content overlay positioned below drawn NEWS header */}
        <div
          className="news-scroll absolute"
          style={{
            top: '11%',
            left: 0,
            right: 0,
            bottom: '3%',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingLeft: '1.5vw',
            paddingRight: '1vw',
            paddingTop: '1.5vh',
            paddingBottom: '1vh',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,200,176,0.4) transparent',
          }}
        >
          <div className="space-y-5">
          {news.length === 0 && (
            <p className="text-[#2a5a50] text-xs text-center pt-6 leading-relaxed">
              No news yet
            </p>
          )}
          {news.map(item => (
            <div
              key={item.id}
              className={clsx('cursor-pointer group', item.isPinned && 'border-l-2 border-[#00c8b0] pl-2')}
              onClick={() => item.url && window.electron.openExternal(item.url)}
            >
              {item.isPinned && (
                <span className="text-[#00a890] text-[9px] font-bold tracking-widest uppercase">
                  PINNED
                </span>
              )}
              <h3 className="text-[#b0d8c8] font-bold text-xs uppercase leading-snug group-hover:text-[#00e8ca] transition-colors">
                {item.title}
              </h3>
              {item.summary && (
                <p className="text-[#3a6858] text-xs mt-1 leading-relaxed whitespace-pre-line line-clamp-4">
                  {item.summary}
                </p>
              )}
              {item.url && (
                <span className="text-[#00b0a0] text-xs font-bold mt-0.5 inline-block">[MORE]</span>
              )}
              <p className="text-[#1e4438] text-[9px] mt-1">
                {new Date(item.date).toLocaleDateString()}
              </p>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* ── Patch progress bar ──────────────────────────────────────────── */}
      {patchProgress && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
          style={{ bottom: '20vh', width: '28vw' }}
        >
          <div
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${patchProgress.percent}%`,
                background: '#00c8b0',
                boxShadow: '0 0 6px #00c8b0',
              }}
            />
          </div>
          <span className="text-[#00c8b0] text-[10px] font-mono w-8 text-right shrink-0">
            {patchProgress.percent}%
          </span>
          <button
            onClick={() => window.electron.cancelPatch()}
            className="text-[10px] text-[#406050] hover:text-[#e05050] transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
