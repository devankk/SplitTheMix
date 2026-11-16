export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function formatTimestampRange(start: number, end: number | null | undefined): string {
  const s = formatTimestamp(start)
  if (end === null || end === undefined || end <= start) {
    return s
  }
  return `${s}-${formatTimestamp(end)}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(':').map(Number)
  if (parts.some(isNaN)) {
    throw new Error('Invalid timestamp characters')
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  throw new Error('Timestamp must be in MM:SS or HH:MM:SS format')
}

export function confidenceClass(confidence: number, is_identified: boolean): string {
  if (!is_identified) return 'text-[#64748b] bg-[#64748b]/10 border-[#64748b]/20'
  if (confidence >= 85) return 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20'
  if (confidence >= 60) return 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20'
  return 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
}

export function confidenceLabel(confidence: number, is_identified: boolean): string {
  if (!is_identified) return 'Unknown'
  if (confidence >= 85) return 'High Conf'
  if (confidence >= 60) return 'Med Conf'
  return 'Low Conf'
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

export function validateYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/.test(url.trim())
}

export function validateMediaUrl(url: string): { valid: boolean; platform: 'youtube' | 'soundcloud' | 'mixcloud' | 'unsupported' } {
  const clean = url.trim()
  if (validateYouTubeUrl(clean)) {
    return { valid: true, platform: 'youtube' }
  }
  if (/soundcloud\.com\/[\w-]+\/[\w-]+/.test(clean)) {
    return { valid: true, platform: 'soundcloud' }
  }
  if (/mixcloud\.com\/[\w-]+\/[\w-]+/.test(clean)) {
    return { valid: true, platform: 'mixcloud' }
  }
  return { valid: false, platform: 'unsupported' }
}
