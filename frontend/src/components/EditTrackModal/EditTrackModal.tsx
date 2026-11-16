import React, { useState, useEffect } from 'react'
import { X, Save, Trash2, HelpCircle } from 'lucide-react'
import type { Track } from '../../types'
import { formatTimestamp, parseTimestamp } from '../../utils/format'

interface EditTrackModalProps {
  track: Track | null
  jobId: string
  onClose: () => void
  onSave: (data: {
    id?: string
    jobId: string
    title: string
    artist: string
    startTime: number
    bpm?: number
    musical_key?: string
    release_year?: string
    label?: string
  }) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  track,
  jobId,
  onClose,
  onSave,
  onDelete
}) => {
  const [title, setTitle] = useState(track ? track.title : '')
  const [artist, setArtist] = useState(track ? track.artist : '')
  const [timeStr, setTimeStr] = useState(track ? formatTimestamp(track.start_time) : '00:00')
  const [bpm, setBpm] = useState(track?.bpm ? String(track.bpm) : '')
  const [musicalKey, setMusicalKey] = useState(track?.musical_key || '')
  const [releaseYear, setReleaseYear] = useState(track?.release_year || '')
  const [label, setLabel] = useState(track?.label || '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Please provide a track title.')
      return
    }

    let seconds = 0
    try {
      seconds = parseTimestamp(timeStr)
    } catch (err: any) {
      setError(err.message || 'Invalid timestamp format (use MM:SS or HH:MM:SS)')
      return
    }

    try {
      setIsSubmitting(true)
      await onSave({
        id: track ? track.id : undefined,
        jobId,
        title: title.trim(),
        artist: artist.trim(),
        startTime: seconds,
        bpm: bpm.trim() ? parseInt(bpm, 10) : undefined,
        musical_key: musicalKey.trim() || undefined,
        release_year: releaseYear.trim() || undefined,
        label: label.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save track changes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkUnknown = () => {
    setTitle('Unknown Track')
    setArtist('')
    setBpm('')
    setMusicalKey('')
    setReleaseYear('')
    setLabel('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#13131a] border border-[#1e1e2e] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e2e]">
          <h3 className="font-semibold text-white text-base">
            {track ? 'Edit Track Details' : 'Add Manual Track Entry'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748b] hover:text-white hover:bg-[#1e1e2e] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
              Track Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Strobe"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
              Artist Name
            </label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="e.g. deadmau5"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-1.5 flex items-center justify-between">
              <span>Start Timestamp (MM:SS or HH:MM:SS) *</span>
              <button
                type="button"
                onClick={handleMarkUnknown}
                className="text-[11px] text-[#a855f7] hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                Mark as Unknown
              </button>
            </label>
            <input
              type="text"
              required
              value={timeStr}
              onChange={e => setTimeStr(e.target.value)}
              placeholder="04:32"
              className="w-full px-3.5 py-2 text-sm font-mono rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          {/* Row: BPM and Musical Key */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                BPM (Tempo)
              </label>
              <input
                type="number"
                value={bpm}
                onChange={e => setBpm(e.target.value)}
                placeholder="e.g. 128"
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                Musical Scale / Key
              </label>
              <input
                type="text"
                value={musicalKey}
                onChange={e => setMusicalKey(e.target.value)}
                placeholder="e.g. G Minor, 8A"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
              />
            </div>
          </div>

          {/* Row: Release Year and Record Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                Release Year
              </label>
              <input
                type="text"
                value={releaseYear}
                onChange={e => setReleaseYear(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
                Record Label / Album
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Mau5trap, Club Mix"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 mt-2 border-t border-[#1e1e2e]">
            {track && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Delete "${track.title}" from tracklist?`)) {
                    await onDelete(track.id)
                    onClose()
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Track</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-[#1e1e2e] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-white text-xs font-semibold shadow-md shadow-[#7c3aed]/20 hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
