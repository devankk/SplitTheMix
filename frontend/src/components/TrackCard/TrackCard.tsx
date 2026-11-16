import React, { useState } from 'react'
import { Music2, Radio, Edit3, Trash2, Flag, Check, AlertCircle, RefreshCw, Cloud, Disc } from 'lucide-react'
import type { Track } from '../../types'
import { TimestampButton } from '../TimestampButton/TimestampButton'
import { confidenceClass, confidenceLabel } from '../../utils/format'

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

  const isUnknown = !track.is_identified || track.title.toLowerCase().includes('unknown track')

  return (
    <div className="relative group">
      {isOverlapping && (
        <div className="flex items-center gap-2 my-1 px-4 text-[11px] font-medium text-[#ec4899] bg-[#ec4899]/10 rounded-md py-0.5 border border-[#ec4899]/20 w-fit">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Transition / Crossfade Region</span>
        </div>
      )}

      <div
        className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isActive
            ? 'bg-[#1e1b2e] border-[#a855f7] shadow-lg shadow-[#7c3aed]/20 ring-1 ring-[#a855f7]'
            : isUnknown
            ? 'bg-[#13131a]/50 border-[#1e1e2e]/50 opacity-80'
            : 'bg-[#13131a] hover:bg-[#171722] border-[#1e1e2e] hover:border-[#7c3aed]/40 shadow-sm'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="w-6 text-center text-xs font-mono font-semibold text-[#64748b]">
            #{index + 1}
          </div>

          <TimestampButton seconds={track.start_time} videoId={videoId} onSeek={onSeek} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`font-semibold text-sm sm:text-base truncate ${
                  isUnknown ? 'italic text-[#94a3b8]' : 'text-white'
                }`}
              >
                {track.title}
              </h4>
              {track.edited_by_user && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Edited
                </span>
              )}
            </div>

            <p className="text-xs text-[#94a3b8] truncate mt-0.5">
              {track.artist ? track.artist : <span className="text-[#64748b]">Artist Unconfirmed</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center pl-9 sm:pl-0">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${confidenceClass(
              track.confidence,
              track.is_identified
            )}`}
          >
            {track.confidence > 0 ? `${track.confidence}%` : '—'} {confidenceLabel(track.confidence, track.is_identified)}
          </span>

          {track.platform_links && track.is_identified && (
            <div className="flex items-center gap-1">
              {track.platform_links.spotify_search && (
                <a
                  href={track.platform_links.spotify_search}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Search on Spotify"
                  className="p-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 transition-colors"
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
                  className="p-1.5 rounded-lg bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
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
                  className="p-1.5 rounded-lg bg-[#ff5500]/10 text-[#ff5500] hover:bg-[#ff5500]/20 transition-colors"
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
                  className="p-1.5 rounded-lg bg-[#5000ff]/10 text-[#a855f7] hover:bg-[#5000ff]/20 transition-colors"
                >
                  <Disc className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

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
              onClick={() => setShowReport(prev => !prev)}
              title="Report inaccuracy"
              className="p-1.5 rounded-lg text-[#64748b] hover:text-amber-400 hover:bg-[#1e1e2e] transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showReport && (
        <div className="absolute right-0 top-full mt-2 z-30 w-64 p-3 rounded-xl bg-[#1a1a24] border border-[#2a2a38] shadow-2xl animate-in fade-in zoom-in-95">
          {reported ? (
            <div className="flex items-center gap-2 text-xs text-[#22c55e] py-1">
              <Check className="w-4 h-4" />
              <span>Thank you! Feedback recorded.</span>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                What is incorrect?
              </p>
              <div className="flex flex-col gap-1.5">
                {['Wrong track identification', 'Incorrect artist name', 'Timestamp offset is wrong', 'Duplicate track entry'].map(reason => (
                  <button
                    key={reason}
                    onClick={() => handleReport(reason)}
                    className="text-left text-[11px] px-2.5 py-1.5 rounded bg-[#13131a] hover:bg-[#7c3aed]/20 text-[#cbd5e1] hover:text-white transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
