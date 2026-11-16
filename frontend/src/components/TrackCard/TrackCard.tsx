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
  Cloud,
  Disc,
  Play,
  ExternalLink
} from 'lucide-react'
import type { Track } from '../../types'
import { confidenceClass, confidenceLabel, formatTimestampRange } from '../../utils/format'

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

  const handleExternalOpen = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoId) {
      const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(track.start_time)}s`
      window.open(url, 'SplitTheMix_YouTube_Player')
    }
  }

  const isUnknown = !track.is_identified || track.title.toLowerCase().includes('unknown track')

  return (
    <div className="relative group">
      {isOverlapping && (
        <div className="flex items-center gap-2 my-1 px-3 text-[11px] font-medium text-[#ec4899] bg-[#ec4899]/10 rounded-md py-0.5 border border-[#ec4899]/20 w-fit">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Transition / Crossfade Region</span>
        </div>
      )}

      <div
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isActive
            ? 'bg-[#1e1b2e] border-[#a855f7] shadow-lg shadow-[#7c3aed]/20 ring-1 ring-[#a855f7]'
            : isUnknown
            ? 'bg-[#13131a]/50 border-[#1e1e2e]/50 opacity-80'
            : 'bg-[#15151e] hover:bg-[#191924] border-[#1e1e2e] hover:border-[#7c3aed]/40 shadow-sm'
        }`}
      >
        {/* Left & Middle Block: Album Art + Time/BPM/Key + Song Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* 1. Album Art with Track Number Badge */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#0c0c12] border border-[#1e1e2e] shrink-0 shadow-md">
            {track.album_art && !imgError ? (
              <img
                src={track.album_art}
                alt={track.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1829] to-[#0d0c15] text-[#64748b]">
                <Disc className="w-7 h-7 opacity-40 text-[#a855f7]" />
              </div>
            )}
            {/* Number Badge pinned on top-left of artwork */}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/85 text-[10px] sm:text-[11px] font-extrabold font-mono text-white backdrop-blur-sm border border-white/10 shadow">
              {index + 1}
            </div>
          </div>

          {/* 2. Middle Section: Timestamp Range + BPM + Key */}
          <div className="w-24 sm:w-32 shrink-0 flex flex-col justify-center space-y-0.5">
            <button
              onClick={handleSeek}
              title="Click to seek to this timestamp"
              className="group/time inline-flex items-center gap-1 font-mono font-bold text-xs sm:text-sm text-[#f97316] hover:text-[#fb923c] transition-colors text-left"
            >
              <Play className="w-3 h-3 fill-current opacity-80 group-hover/time:scale-110 transition-transform" />
              <span>{formatTimestampRange(track.start_time, track.end_time)}</span>
            </button>

            {track.bpm ? (
              <div className="text-[11px] sm:text-xs font-mono font-semibold text-[#cbd5e1] tracking-tight">
                {track.bpm} BPM
              </div>
            ) : null}

            {track.musical_key ? (
              <div className="text-[11px] sm:text-xs font-medium text-[#94a3b8] tracking-tight">
                {track.musical_key}
              </div>
            ) : null}
          </div>

          {/* 3. Right Section: Song Title, Artist + Year, Label */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={`font-bold text-sm sm:text-base leading-snug truncate ${
                  isUnknown ? 'italic text-[#94a3b8]' : 'text-white'
                }`}
                title={track.title}
              >
                {track.title}
              </h4>
              {track.edited_by_user && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium shrink-0">
                  Edited
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#94a3b8] truncate mt-0.5">
              {track.artist ? (
                <>
                  <span className="text-[#cbd5e1] font-medium">{track.artist}</span>
                  {track.release_year && (
                    <span className="text-[#64748b]"> &middot; {track.release_year}</span>
                  )}
                </>
              ) : (
                <span className="text-[#64748b]">Artist Unconfirmed</span>
              )}
            </p>

            {track.label && (
              <p className="text-[11px] text-[#64748b] truncate mt-0.5 font-medium">
                {track.label}
              </p>
            )}
          </div>
        </div>

        {/* Far Right Action Tray: Badges, Platform Search Links, and Edit/Delete */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-[#1e1e2e]/60 shrink-0">
          {/* Confidence Badge */}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${confidenceClass(
              track.confidence,
              track.is_identified
            )}`}
          >
            {track.confidence > 0 ? `${track.confidence}%` : '—'} {confidenceLabel(track.confidence, track.is_identified)}
          </span>

          {/* Streaming & Search Platforms */}
          {track.platform_links && track.is_identified && (
            <div className="flex items-center gap-1">
              {track.platform_links.spotify_search && (
                <a
                  href={track.platform_links.spotify_search}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Search on Spotify"
                  className="p-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/25 transition-colors"
                >
                  <Music2 className="w-3.5 h-3.5" />
                </a>
              )}
              {track.platform_links.youtube_music_search && (
                <a
                  href={track.platform_links.youtube_music_search}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Search on YouTube Music"
                  className="p-1.5 rounded-lg bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/25 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5" />
                </a>
              )}
              {track.platform_links.soundcloud_search && (
                <a
                  href={track.platform_links.soundcloud_search}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Search on SoundCloud"
                  className="p-1.5 rounded-lg bg-[#ff5500]/10 text-[#ff5500] hover:bg-[#ff5500]/25 transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5" />
                </a>
              )}
              {track.platform_links.mixcloud_search && (
                <a
                  href={track.platform_links.mixcloud_search}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Search on Mixcloud"
                  className="p-1.5 rounded-lg bg-[#5000ff]/10 text-[#a855f7] hover:bg-[#5000ff]/25 transition-colors"
                >
                  <Disc className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* External YouTube Tab Launcher */}
          {videoId && (
            <button
              onClick={handleExternalOpen}
              title="Open at this exact timestamp in external YouTube player"
              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#1e1e2e] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit / Delete / Report Actions */}
          <div className="flex items-center gap-1 border-l border-[#1e1e2e] pl-2">
            <button
              onClick={() => onEdit(track)}
              title="Edit track info"
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e1e2e] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(track.id)}
              title="Delete track"
              className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-[#1e1e2e] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowReport(!showReport)}
              title="Flag or report incorrect track"
              className={`p-1.5 rounded-lg transition-colors ${
                reported ? 'text-green-400 bg-green-500/10' : 'text-[#64748b] hover:text-white hover:bg-[#1e1e2e]'
              }`}
            >
              {reported ? <Check className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Flag / Report dropdown */}
      {showReport && (
        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-[#13131a] border border-[#1e1e2e] p-2.5 z-30 shadow-xl space-y-1.5">
          <p className="text-[11px] font-semibold text-[#94a3b8] px-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            Report Issue
          </p>
          <button
            onClick={() => handleReport('wrong_song')}
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#1e1e2e] transition-colors"
          >
            Wrong song / title
          </button>
          <button
            onClick={() => handleReport('wrong_timestamp')}
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#1e1e2e] transition-colors"
          >
            Wrong timestamp boundary
          </button>
          <button
            onClick={() => handleReport('wrong_bpm_key')}
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#cbd5e1] hover:bg-[#1e1e2e] transition-colors"
          >
            Wrong BPM / Musical Key
          </button>
        </div>
      )}
    </div>
  )
}
