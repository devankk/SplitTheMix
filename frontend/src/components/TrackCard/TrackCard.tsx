import React, { useState } from 'react'
import {
  Music2,
  Radio,
  Edit3,
  Trash2,
  Flag,
  Check,
  AlertCircle,
  RefreshCw,
  Play,
  ExternalLink
} from 'lucide-react'
import type { Track } from '../../types'
import { formatTimestampRange } from '../../utils/format'

interface TrackCardProps {
  track: Track
  index: number
  videoId: string | null
  onEdit: (track: Track) => void
  onDelete: (trackId: string) => void
  onSeek?: (seconds: number) => void
  isOverlapping?: boolean
  isActive?: boolean
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  index,
  videoId,
  onEdit,
  onDelete,
  onSeek,
  isOverlapping,
  isActive
}) => {
  const [showReport, setShowReport] = useState(false)
  const [reported, setReported] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleReport = (reason: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('track_reports') || '[]')
      existing.push({ trackId: track.id, title: track.title, reason, date: new Date().toISOString() })
      localStorage.setItem('track_reports', JSON.stringify(existing))
    } catch {
      // safe fallback
    }
    setReported(true)
    setTimeout(() => {
      setShowReport(false)
      setReported(false)
    }, 2000)
  }

  const handleSeek = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onSeek) {
      onSeek(track.start_time)
    } else if (videoId) {
      const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(track.start_time)}s`
      window.open(url, 'SplitTheMix_YouTube_Player')
    }
  }

  const isUnknown = !track.is_identified || track.title.toLowerCase().includes('unknown track')

  return (
    <div className="relative group">
      {isOverlapping && (
        <div className="flex items-center gap-1.5 my-1 px-2.5 text-[10px] font-mono text-[#f59e0b] bg-[#141414] rounded border border-[#f59e0b]/30 w-fit">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Transition / Crossfade Region</span>
        </div>
      )}

      <div
        className={`p-3.5 rounded-lg border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono ${
          isActive
            ? 'bg-[#181818] border-[#E32636] shadow-console-glow ring-1 ring-[#E32636]'
            : isUnknown
            ? 'bg-[#101010] border-[#292929] opacity-75'
            : 'bg-[#141414] hover:bg-[#181818] border-[#292929] hover:border-[#8D1422] shadow-console-sm'
        }`}
      >
        {/* Left & Middle Block: Album Art + Time/BPM/Key + Song Info */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* 1. Album Art with Track Number Badge */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded bg-[#090909] border border-[#292929] shrink-0 overflow-hidden">
            {track.album_art && !imgError ? (
              <img
                src={track.album_art}
                alt={track.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#5c5c5c]">
                <Music2 className="w-6 h-6" />
              </div>
            )}

            {/* Track Number Badge */}
            <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-[#090909]/90 border border-[#292929] text-[9px] font-mono text-[#F4F1ED]">
              #{index + 1}
            </div>
          </div>

          {/* 2. Middle Block: Timestamp Range & BPM & Key */}
          <div className="flex flex-col shrink-0 min-w-[95px] sm:min-w-[110px]">
            <button
              onClick={handleSeek}
              className="text-left font-mono font-bold text-xs sm:text-sm text-[#E32636] hover:underline flex items-center gap-1 group/btn tabular-nums"
            >
              <Play className="w-3 h-3 fill-[#E32636] text-[#E32636] shrink-0" />
              <span>{formatTimestampRange(track.start_time, track.end_time)}</span>
            </button>

            {track.bpm && (
              <span className="text-[11px] text-[#F4F1ED] font-mono font-medium mt-0.5 tabular-nums">
                {track.bpm} BPM
              </span>
            )}

            {track.musical_key && (
              <span className="text-[10px] text-[#929292] font-mono">
                {track.musical_key}
              </span>
            )}
          </div>

          {/* 3. Song Title, Artist, Release Year & Label */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <h4
              onClick={handleSeek}
              className="font-semibold text-xs sm:text-sm text-[#F4F1ED] truncate cursor-pointer hover:text-white transition-colors"
            >
              {track.title}
            </h4>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#929292]">
              <span className="truncate">{track.artist || 'Unknown Artist'}</span>
              {track.release_year && (
                <span className="text-[#5c5c5c] text-[11px]">&bull; {track.release_year}</span>
              )}
            </div>

            {track.label && (
              <div className="text-[10px] text-[#5c5c5c] truncate">
                {track.label}
              </div>
            )}
          </div>
        </div>

        {/* Right Action Block */}
        <div className="flex items-center justify-end gap-2 border-t md:border-t-0 border-[#202020] pt-2 md:pt-0">
          <span className="px-2 py-0.5 rounded bg-[#202020] text-[#929292] text-[10px] border border-[#292929]">
            {track.confidence}% Match
          </span>

          <button
            onClick={() => onEdit(track)}
            className="p-1.5 rounded hover:bg-[#202020] text-[#929292] hover:text-[#F4F1ED] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(track.id)}
            className="p-1.5 rounded hover:bg-[#202020] text-[#929292] hover:text-[#E32636] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
