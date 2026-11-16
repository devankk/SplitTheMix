import React, { useState, useRef } from 'react'
import type { Track } from '../../types'
import { formatTimestamp } from '../../utils/format'
import { Music, Play, Radio, Volume2 } from 'lucide-react'

interface AudioTimelineProps {
  tracks: Track[]
  totalDurationSec: number
  currentTimeSec?: number
  onSeek: (seconds: number) => void
}

export const AudioTimeline: React.FC<AudioTimelineProps> = ({
  tracks,
  totalDurationSec,
  currentTimeSec = 0,
  onSeek
}) => {
  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null)
  const [hoverPosition, setHoverPosition] = useState<number>(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const effectiveDuration = totalDurationSec > 0 
    ? totalDurationSec 
    : (tracks.length > 0 ? Math.max(...tracks.map(t => t.end_time || t.start_time + 180)) : 3600)

  // Find currently playing track
  const currentTrackIndex = tracks.findIndex((t, idx) => {
    const next = tracks[idx + 1]
    const end = t.end_time || (next ? next.start_time : effectiveDuration)
    return currentTimeSec >= t.start_time && currentTimeSec < end
  })
  const currentTrack = currentTrackIndex !== -1 ? tracks[currentTrackIndex] : null

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    const targetSeconds = Math.floor(percentage * effectiveDuration)
    onSeek(targetSeconds)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const posX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, posX / rect.width))
    const hoverTime = percentage * effectiveDuration
    setHoverPosition(posX)

    const found = tracks.find((t, idx) => {
      const next = tracks[idx + 1]
      const end = t.end_time || (next ? next.start_time : effectiveDuration)
      return hoverTime >= t.start_time && hoverTime < end
    })
    setHoveredTrack(found || null)
  }

  return (
    <div className="w-full rounded-xl bg-[#141414] border border-[#292929] p-4 space-y-3 shadow-console-sm">
      {/* 1. Dynamic Now-Playing Studio HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202020] pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636] shrink-0">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#E32636] font-semibold uppercase tracking-wider">
                Now Playing:
              </span>
              {currentTrack ? (
                <div className="flex items-baseline gap-2 truncate">
                  <span className="font-display font-bold text-xs sm:text-sm text-white truncate">
                    #{currentTrackIndex + 1} {currentTrack.title}
                  </span>
                  {currentTrack.artist && (
                    <span className="font-sans text-xs text-[#D1D5DB] truncate hidden sm:inline">
                      • {currentTrack.artist}
                    </span>
                  )}
                  {currentTrack.bpm && (
                    <span className="font-mono text-[11px] text-[#22c55e] shrink-0 hidden md:inline">
                      [{currentTrack.bpm} BPM{currentTrack.musical_key ? ` • ${currentTrack.musical_key}` : ''}]
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-mono text-xs text-[#9CA3AF]">
                  Set Standby • Scrub to Begin Playback
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Timecode Progress */}
        <div className="flex items-center gap-2 font-mono text-xs tabular-nums shrink-0 self-end sm:self-auto">
          <span className="text-[#E32636] font-bold">{formatTimestamp(currentTimeSec)}</span>
          <span className="text-[#5c5c5c]">/</span>
          <span className="text-[#9CA3AF]">{formatTimestamp(effectiveDuration)}</span>
        </div>
      </div>

      {/* 2. Interactive Timeline Bar with Real Song Names Displayed */}
      <div className="relative pt-6 pb-1">
        {/* Hover Tooltip displaying song preview */}
        {hoveredTrack && (
          <div
            className="absolute top-0 -translate-x-1/2 z-30 pointer-events-none px-3 py-1.5 rounded-lg bg-[#090909] border border-[#E32636] text-xs font-mono text-white shadow-console-md whitespace-nowrap"
            style={{ left: `${Math.max(80, Math.min(hoverPosition, 500))}px` }}
          >
            <div className="font-display font-bold text-[#F4F1ED]">
              {hoveredTrack.title}
            </div>
            <div className="text-[11px] text-[#9CA3AF] flex items-center gap-2">
              <span>{hoveredTrack.artist || 'Unknown Artist'}</span>
              {hoveredTrack.bpm && <span className="text-[#22c55e]">• {hoveredTrack.bpm} BPM</span>}
              <span className="text-[#E32636]">
                ({formatTimestamp(hoveredTrack.start_time)} - {hoveredTrack.end_time ? formatTimestamp(hoveredTrack.end_time) : 'End'})
              </span>
            </div>
          </div>
        )}

        {/* Main Segmented Bar with Song Names inside segments */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTrack(null)}
          className="relative h-14 w-full bg-[#090909] rounded-lg border border-[#292929] flex items-stretch overflow-hidden cursor-pointer group shadow-inner"
        >
          {tracks.map((track, idx) => {
            const nextTrack = tracks[idx + 1]
            const endTime = track.end_time || (nextTrack ? nextTrack.start_time : effectiveDuration)
            const duration = Math.max(10, endTime - track.start_time)
            const widthPct = (duration / effectiveDuration) * 100

            const isCurrent = currentTimeSec >= track.start_time && currentTimeSec < endTime
            const isUnknown = !track.is_identified || track.title.toLowerCase() === 'unknown track'

            return (
              <div
                key={track.id}
                style={{ width: `${widthPct}%` }}
                className={`h-full border-r border-[#090909] transition-all relative flex flex-col justify-center px-1.5 overflow-hidden select-none ${
                  isUnknown
                    ? 'bg-[#1e1e1e] hover:bg-[#282828] text-[#9CA3AF]'
                    : idx % 2 === 0
                    ? 'bg-[#161616] hover:bg-[#202020] text-[#D1D5DB]'
                    : 'bg-[#121212] hover:bg-[#1c1c1c] text-[#D1D5DB]'
                }`}
              >
                {/* Visible Song Title inside the Segment */}
                {widthPct > 2 && (
                  <div className="w-full truncate leading-tight">
                    <span className="font-mono text-[10px] font-bold mr-1 text-[#6B7280]">
                      #{idx + 1}
                    </span>
                    <span className="font-display text-[11px] font-semibold truncate text-[#F4F1ED]">
                      {isUnknown ? 'Unknown ID' : track.title}
                    </span>
                  </div>
                )}

                {/* Visible Artist & Timecode inside wider Segments */}
                {widthPct > 6 && (
                  <div className="text-[10px] font-mono truncate leading-none mt-0.5 text-[#6B7280]">
                    {formatTimestamp(track.start_time)}
                    {track.artist && !isUnknown && (
                      <span className="ml-1 hidden sm:inline">• {track.artist}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Current Playhead Scrubber */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] pointer-events-none z-20 transition-all duration-150"
            style={{ left: `${Math.min(100, (currentTimeSec / effectiveDuration) * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Timeline Legend */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[#6B7280] pt-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-white shadow-[0_0_6px_white]" />
            <span className="text-[#D1D5DB]">Playback Playhead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#161616] border border-[#292929]" />
            <span className="text-[#9CA3AF]">Identified Track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#1e1e1e] border border-[#292929]" />
            <span className="text-[#9CA3AF]">Unknown Gap</span>
          </div>
        </div>
        <span className="hidden sm:inline text-[#E32636]">Click any segment to jump video playback</span>
      </div>
    </div>
  )
}
