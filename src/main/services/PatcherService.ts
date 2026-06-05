import { EventEmitter } from 'events'
import { createHash } from 'crypto'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import axios from 'axios'
import type { CancelTokenSource } from 'axios'

export interface PatchManifest {
  version: string
  baseUrl: string
  files: ManifestFile[]
}

export interface ManifestFile {
  path: string
  hash: string
  size: number
  url?: string
}

export interface PatchProgress {
  phase: 'checking' | 'downloading' | 'complete' | 'error'
  currentFile: string
  filesChecked: number
  totalFiles: number
  bytesDownloaded: number
  totalBytes: number
  speed: number
  percent: number
  error?: string
}

export class PatcherService extends EventEmitter {
  private cancelSource: CancelTokenSource | null = null
  private running = false

  async check(manifestUrl: string, gamePath: string): Promise<{ needsPatch: boolean; count: number }> {
    try {
      const manifest = await this.fetchManifest(manifestUrl)
      let needsUpdate = 0
      for (const file of manifest.files) {
        const localPath = join(gamePath, file.path)
        if (!existsSync(localPath)) {
          needsUpdate++
          continue
        }
        const hash = await this.hashFile(localPath)
        if (hash !== file.hash) needsUpdate++
      }
      return { needsPatch: needsUpdate > 0, count: needsUpdate }
    } catch {
      return { needsPatch: false, count: 0 }
    }
  }

  async start(manifestUrl: string, gamePath: string): Promise<void> {
    if (this.running) return
    this.running = true
    this.cancelSource = axios.CancelToken.source()

    try {
      const manifest = await this.fetchManifest(manifestUrl)
      const filesToPatch: ManifestFile[] = []

      // Phase 1: check integrity
      for (let i = 0; i < manifest.files.length; i++) {
        const file = manifest.files[i]
        const localPath = join(gamePath, file.path)

        this.emit('progress', {
          phase: 'checking',
          currentFile: file.path,
          filesChecked: i + 1,
          totalFiles: manifest.files.length,
          bytesDownloaded: 0,
          totalBytes: 0,
          speed: 0,
          percent: Math.round(((i + 1) / manifest.files.length) * 30) // 0-30% for check
        } satisfies PatchProgress)

        if (!existsSync(localPath)) {
          filesToPatch.push(file)
          continue
        }
        const hash = await this.hashFile(localPath)
        if (hash !== file.hash) filesToPatch.push(file)
      }

      if (filesToPatch.length === 0) {
        this.emit('complete')
        this.running = false
        return
      }

      // Phase 2: download
      const totalBytes = filesToPatch.reduce((acc, f) => acc + f.size, 0)
      let downloadedBytes = 0
      let speedSampleBytes = 0
      let speedSampleTime = Date.now()
      let currentSpeed = 0

      for (let i = 0; i < filesToPatch.length; i++) {
        const file = filesToPatch[i]
        const fileUrl = file.url ?? `${manifest.baseUrl}/${file.path}`
        const localPath = join(gamePath, file.path)

        mkdirSync(dirname(localPath), { recursive: true })

        const response = await axios.get(fileUrl, {
          responseType: 'stream',
          cancelToken: this.cancelSource.token,
          timeout: 60000
        })

        await new Promise<void>((resolve, reject) => {
          const writer = createWriteStream(localPath)
          response.data.on('data', (chunk: Buffer) => {
            downloadedBytes += chunk.length
            speedSampleBytes += chunk.length

            const now = Date.now()
            const elapsed = now - speedSampleTime
            if (elapsed >= 500) {
              currentSpeed = (speedSampleBytes / elapsed) * 1000
              speedSampleBytes = 0
              speedSampleTime = now
            }

            const basePercent = 30
            const downloadPercent = totalBytes > 0 ? (downloadedBytes / totalBytes) * 70 : 0

            this.emit('progress', {
              phase: 'downloading',
              currentFile: file.path,
              filesChecked: filesToPatch.length,
              totalFiles: filesToPatch.length,
              bytesDownloaded: downloadedBytes,
              totalBytes,
              speed: Math.round(currentSpeed),
              percent: Math.round(basePercent + downloadPercent)
            } satisfies PatchProgress)
          })
          response.data.on('end', resolve)
          response.data.on('error', reject)
          writer.on('error', reject)
          response.data.pipe(writer)
        })
      }

      this.emit('complete')
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        const message = err instanceof Error ? err.message : 'Patch failed'
        this.emit('error', message)
      }
    } finally {
      this.running = false
      this.cancelSource = null
    }
  }

  cancel(): void {
    this.cancelSource?.cancel('Patch cancelled by user')
    this.running = false
  }

  private async fetchManifest(url: string): Promise<PatchManifest> {
    const res = await axios.get<PatchManifest>(url, { timeout: 10000 })
    return res.data
  }

  private async hashFile(filePath: string): Promise<string> {
    const buf = await readFile(filePath)
    return createHash('sha256').update(buf).digest('hex')
  }
}
