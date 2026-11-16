import React, { useState, useEffect } from 'react'
import { X, Save, Clock, Music, Sliders, Calendar, Tag, AlertCircle } from 'lucide-react'
import type { Track } from '../../types'
import { formatTimestamp, parseTimestamp } from '../../utils/format'

interface EditTrackModalProps {
  track: Track | null
  jobId: string
  isOpen: boolean
  isAddMode?: boolean
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
}

const MUSICAL_KEYS = [
  'C Major', 'A Minor', 'G Major', 'E Minor', 'D Major', 'B Minor',
  'A Major', 'F# Minor', 'E Major', 'C# Minor', 'B Major', 'G# Minor',
  'F Major', 'D Minor', 'Bb Major', 'G Minor', 'Eb Major', 'C Minor',
  'Ab Major', 'F Minor', 'Db Major', 'Bb Minor'
]

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  track,
  jobId,
  isOpen,
  isAddMode = false,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [timeStr, setTimeStr] = useState('00:00')
  const [bpm, setBpm] = useState<string>('')
  const [musicalKey, setMusicalKey] = useState<string>('')
  const [releaseYear, setReleaseYear] = useState<string>('')
  const [label, setLabel] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (track) {
      setTitle(track.title || '')
      setArtist(track.artist || '')
      setTimeStr(formatTimestamp(track.start_time))
      setBpm(track.bpm ? String(track.bpm) : '')
      setMusicalKey(track.musical_key || '')
      setReleaseYear(track.release_year || '')
      setLabel(track.label || '')
    } else {
      setTitle('')
      setArtist('')
      setTimeStr('00:00')
      setBpm('')
      setMusicalKey('')
      setReleaseYear('')
      setLabel('')
    }
    setError(null)
  }, [track, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Track title is required.')
      return
    }

    const seconds = parseTimestamp(timeStr)
    if (seconds < 0) {
      setError('Invalid timestamp format. Use MM:SS or HH:MM:SS.')
      return
    }

    try {
      setIsSaving(true)
      await onSave({
        id: track?.id,
        jobId,
        title: title.trim(),
        artist: artist.trim(),
        startTime: seconds,
        bpm: bpm ? parseInt(bpm, 10) : undefined,
        musical_key: musicalKey || undefined,
        release_year: releaseYear.trim() || undefined,
        label: label.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to save track changes.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-lg bg-[#141414] border border-[#292929] shadow-console-md overflow-hidden text-xs font-mono">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#292929] bg-[#090909]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E32636]" />
            <h3 className="text-sm font-bold text-[#F4F1ED]">
              {isAddMode ? 'Add Manual Timecode Entry' : 'Edit Track Metadata'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#202020] text-[#929292] hover:text-[#F4F1ED] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded bg-[#090909] border border-[#E32636]/40 text-[#E32636] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-[#929292] uppercase">Song Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Dark Horse"
              className="w-full px-3 py-2 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] focus:outline-none focus:border-[#E32636] transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#929292] uppercase">Original Artist</label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="e.g. Katy Perry"
              className="w-full px-3 py-2 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] focus:outline-none focus:border-[#E32636] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-[#929292] uppercase">Timecode (MM:SS)</label>
              <input
                type="text"
                value={timeStr}
                onChange={e => setTimeStr(e.target.value)}
                placeholder="04:10"
                className="w-full px-3 py-2 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] tabular-nums focus:outline-none focus:border-[#E32636] transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#929292] uppercase">Tempo (BPM)</label>
              <input
                type="number"
                value={bpm}
                onChange={e => setBpm(e.target.value)}
                placeholder="132"
                min="60"
                max="220"
                className="w-full px-3 py-2 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] tabular-nums focus:outline-none focus:border-[#E32636] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-[#929292] uppercase">Musical Key / Scale</label>
              <select
                value={musicalKey}
                onChange={e => setMusicalKey(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] focus:outline-none focus:border-[#E32636] transition-colors cursor-pointer"
              >
                <option value="">Unknown Scale</option>
                {MUSICAL_KEYS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-[#929292] uppercase">Release Year</label>
              <input
                type="text"
                value={releaseYear}
                onChange={e => setReleaseYear(e.target.value)}
                placeholder="2023"
                className="w-full px-3 py-2 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] tabular-nums focus:outline-none focus:border-[#E32636] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-[#929292] uppercase">Record Label / Album</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Capitol Records"
              className="w-full px-3 py-2 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] focus:outline-none focus:border-[#E32636] transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#202020] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#202020] hover:bg-[#292929] text-[#929292] hover:text-[#F4F1ED] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded bg-[#E32636] hover:bg-[#f03a4b] text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save to Console'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
