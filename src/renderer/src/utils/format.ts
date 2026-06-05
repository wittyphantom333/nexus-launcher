export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}

export function formatLatency(ms: number): string {
  return `${ms} ms`
}

export function truncateAddress(host: string, port: number, maxLen = 30): string {
  const full = `${host}:${port}`
  return full.length > maxLen ? `${full.slice(0, maxLen - 3)}…` : full
}
