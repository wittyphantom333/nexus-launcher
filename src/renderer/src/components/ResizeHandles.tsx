import { useEffect, useRef } from 'react'

type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

const MIN_W = 800
const MIN_H = 534

const CURSORS: Record<Dir, string> = {
  n: 'n-resize', ne: 'ne-resize', e: 'e-resize', se: 'se-resize',
  s: 's-resize', sw: 'sw-resize', w: 'w-resize', nw: 'nw-resize',
}

const E = 8 // edge thickness px

const HANDLES: { dir: Dir; style: React.CSSProperties }[] = [
  { dir: 'n',  style: { top: 0, left: E * 2, right: E * 2, height: E } },
  { dir: 's',  style: { bottom: 0, left: E * 2, right: E * 2, height: E } },
  { dir: 'e',  style: { top: E * 2, bottom: E * 2, right: 0, width: E } },
  { dir: 'w',  style: { top: E * 2, bottom: E * 2, left: 0, width: E } },
  { dir: 'nw', style: { top: 0, left: 0, width: E * 3, height: E * 3 } },
  { dir: 'ne', style: { top: 0, right: 0, width: E * 3, height: E * 3 } },
  { dir: 'sw', style: { bottom: 0, left: 0, width: E * 3, height: E * 3 } },
  { dir: 'se', style: { bottom: 0, right: 0, width: E * 3, height: E * 3 } },
]

export default function ResizeHandles() {
  const drag = useRef<{
    dir: Dir
    startX: number; startY: number
    ox: number; oy: number; ow: number; oh: number
  } | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = drag.current
      if (!d) return
      const dx = e.screenX - d.startX
      const dy = e.screenY - d.startY
      let x = d.ox, y = d.oy, w = d.ow, h = d.oh

      if (d.dir.includes('e')) w = Math.max(MIN_W, w + dx)
      if (d.dir.includes('s')) h = Math.max(MIN_H, h + dy)
      if (d.dir.includes('w')) { const nw = Math.max(MIN_W, w - dx); x += w - nw; w = nw }
      if (d.dir.includes('n')) { const nh = Math.max(MIN_H, h - dy); y += h - nh; h = nh }

      window.electron.setBounds({ x, y, width: w, height: h })
    }

    const onUp = () => { drag.current = null }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const onDown = async (e: React.MouseEvent, dir: Dir) => {
    e.preventDefault()
    e.stopPropagation()
    const b = await window.electron.getBounds()
    drag.current = { dir, startX: e.screenX, startY: e.screenY, ox: b.x, oy: b.y, ow: b.width, oh: b.height }
  }

  return (
    <>
      {HANDLES.map(({ dir, style }) => (
        <div
          key={dir}
          onMouseDown={e => onDown(e, dir)}
          style={{
            position: 'fixed',
            zIndex: 9999,
            cursor: CURSORS[dir],
            background: 'transparent',
            ...style,
          }}
        />
      ))}
    </>
  )
}
