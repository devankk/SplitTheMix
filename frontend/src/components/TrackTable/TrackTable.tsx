import React, { useState } from 'react'
import { Play, Edit3, Trash2, ExternalLink, Music, Copy, Check, Disc3 } from 'lucide-react'
import type { Track } from '../../types'
import { formatTimestamp } from '../../utils/format'

interface TrackTableProps {
  tracks: Track[]
  videoId: string | null
  currentTime?: number
  onEdit: (track: Track) => void
  onDelete: (trackId: string) => void
  onSeek?: (seconds: number) => void
}

const AlbumArt: React.FC<{ src?: string | null; title: string }> = ({ src, title }) => {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#111111] text-[#4a4a4a]">
        <Disc3 className="w-6 h-6 text-[#555] group-hover/art:text-[#E32636] transition-colors" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={title}
      className="w-full h-full object-cover group-hover/art:scale-105 transition-transform duration-300"
      onError={() => setError(true)}
    />
  )
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  currentTime,
  onEdit,
  onDelete,
  onSeek
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopyTimestamp = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `${formatTimestamp(track.start_time)} ${track.artist ? `${track.artist} - ` : ''}${track.title}`
    navigator.clipboard.writeText(text)
    setCopiedId(track.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const getSpotifyUrl = (track: Track) => {
    const links = track.platform_links
      ? typeof track.platform_links === 'string'
        ? JSON.parse(track.platform_links)
        : track.platform_links
      : null
    if (links?.spotify_search) return links.spotify_search
    const q = encodeURIComponent(`${track.artist || ''} ${track.title}`.trim())
    return `https://open.spotify.com/search/${q}`
  }

  const getYouTubeUrl = (track: Track) => {
    const links = track.platform_links
      ? typeof track.platform_links === 'string'
        ? JSON.parse(track.platform_links)
        : track.platform_links
      : null
    if (links?.youtube_music_search) return links.youtube_music_search
    const q = encodeURIComponent(`${track.artist || ''} ${track.title} official audio`.trim())
    return `https://www.youtube.com/results?search_query=${q}`
  }

  return (
    <div className="w-full space-y-2.5">
      {tracks.map((track, idx) => {
        const next = tracks[idx + 1]
        const endTime = track.end_time || (next ? next.start_time : null)

        const isCurrent =
          currentTime !== undefined &&
          currentTime >= track.start_time &&
          (next ? currentTime < next.start_time : true)

        const isUnknown = !track.is_identified || track.title.toLowerCase() === 'unknown track'
        const spotifyUrl = getSpotifyUrl(track)
        const youtubeUrl = getYouTubeUrl(track)

        return (
          <div
            key={track.id}
            onClick={() => onSeek && onSeek(track.start_time)}
            className={`group relative rounded-xl border transition-all duration-200 p-3 sm:p-4 cursor-pointer shadow-console-sm space-y-3 ${
              isCurrent
                ? 'bg-[#181818] border-[#E32636] shadow-console-glow ring-1 ring-[#E32636]'
                : isUnknown
                ? 'bg-[#101010] hover:bg-[#151515] border-[#242424] opacity-80'
                : 'bg-[#141414] hover:bg-[#181818] border-[#242424] hover:border-[#383838]'
            }`}
          >
            {/* ROW 1: Index, Cover Art, Song Title & Artist, and Timecode Seek */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Track Index or Active Red Dot */}
                <div className="w-7 text-center shrink-0">
                  {isCurrent ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E32636] inline-block shadow-[0_0_10px_#E32636] animate-pulse" />
                  ) : (
                    <span className="font-mono text-xs font-semibold text-[#6B7280] group-hover:text-[#D1D5DB] transition-colors">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Album Cover Art with Fallback */}
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#090909] border border-[#292929] overflow-hidden shrink-0 shadow-inner group/art">
                  <AlbumArt src={track.album_art} title={track.title} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-4 h-4 fill-[#E32636] text-[#E32636]" />
                  </div>
                </div>

                {/* Song Title & Artist: Full Width, High-Contrast */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 max-w-full min-w-0">
                    <h3 className="font-display font-bold text-sm sm:text-[15px] text-white tracking-tight truncate group-hover:text-[#F4F1ED] transition-colors">
                      {track.title}
                    </h3>
                    {track.release_year && (
                      <span className="font-mono text-[11px] text-[#9CA3AF] shrink-0">
                        ({track.release_year})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="font-sans font-medium text-[#D1D5DB] truncate">
                      {track.artist || 'Unknown Artist'}
                    </span>
                    {track.label && (
                      <>
                        <span className="text-[#4B5563] text-[10px]">•</span>
                        <span className="font-mono text-[11px] text-[#6B7280] truncate hidden sm:inline max-w-[200px]">
                          {track.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Seekable Timecode Button */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    if (onSeek) onSeek(track.start_time)
                  }}
                  className="font-mono text-xs sm:text-sm font-bold text-[#E32636] hover:text-[#f03a4b] hover:bg-[#202020] px-2.5 py-1 rounded-md border border-[#E32636]/30 flex items-center gap-1.5 tabular-nums transition-colors cursor-pointer"
                  title="Jump video playback to this timestamp"
                >
                  <Play className="w-3 h-3 fill-[#E32636] text-[#E32636]" />
                  <span>
                    {formatTimestamp(track.start_time)}
                    {endTime !== null && (
                      <span className="text-[#6B7280] font-normal"> – {formatTimestamp(endTime)}</span>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* ROW 2: Technical Specs (BPM, Key, Confidence) & Direct Streaming (Spotify, YouTube) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#202020]">
              {/* Left: BPM & Musical Key */}
              <div className="flex items-center gap-2 flex-wrap">
                {track.bpm ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#202020] border border-[#292929] text-xs font-mono">
                    <span className="font-bold text-white tabular-nums">{track.bpm} BPM</span>
                    {track.musical_key && (
                      <>
                        <span className="text-[#5c5c5c]">•</span>
                        <span className="text-[#D1D5DB] font-medium">{track.musical_key}</span>
                      </>
                    )}
                  </div>
                ) : null}

                {track.confidence ? (
                  <span className="px-2 py-0.5 rounded bg-[#102a1b] text-[#22c55e] text-[10px] font-mono border border-[#22c55e]/25">
                    {track.confidence}% Match
                  </span>
                ) : null}

                {isUnknown && (
                  <span className="px-2 py-0.5 rounded bg-[#2a1c10] text-[#f59e0b] text-[10px] font-mono border border-[#f59e0b]/25">
                    Unidentified ID
                  </span>
                )}
              </div>

              {/* Right: Direct Spotify & YouTube Streaming Buttons + Action Tools */}
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                {/* Spotify Pill */}
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open on Spotify"
                  className="px-2.5 py-1 rounded-md bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 hover:border-[#1DB954]/60 text-[#1DB954] text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm group/sp cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.307c-.218.358-.684.472-1.042.254-2.856-1.745-6.452-2.14-10.686-1.173-.41.094-.82-.163-.914-.572-.095-.41.163-.82.572-.914 4.636-1.06 8.608-.61 11.815 1.348.358.218.472.684.255 1.057zm1.468-3.262c-.274.446-.856.588-1.302.314-3.27-2.01-8.254-2.592-12.122-1.417-.5.152-1.03-.133-1.182-.633-.152-.5.133-1.03.633-1.182 4.418-1.34 9.91-.7 13.66 1.616.446.274.588.856.313 1.302zm.126-3.41c-3.92-2.327-10.38-2.542-14.12-1.406-.602.183-1.24-.162-1.423-.764-.183-.602.162-1.24.764-1.423 4.297-1.305 11.43-1.053 15.932 1.62.543.322.723 1.026.4 1.57-.323.542-1.027.722-1.57.4z" />
                  </svg>
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3 text-[#1DB954]/70 group-hover/sp:translate-x-0.5 transition-transform" />
                </a>

                {/* YouTube Pill */}
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open on YouTube"
                  className="px-2.5 py-1 rounded-md bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/30 hover:border-[#FF0000]/60 text-[#FF4E4E] text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm group/yt cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3 text-[#FF4E4E]/70 group-hover/yt:translate-x-0.5 transition-transform" />
                </a>

                {/* Quick Utility Icons */}
                <div className="flex items-center gap-0.5 pl-1 border-l border-[#292929]">
                  <button
                    onClick={e => handleCopyTimestamp(track, e)}
                    title="Copy Timecode & Name"
                    className="p-1.5 rounded-md hover:bg-[#202020] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedId === track.id ? (
                      <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onEdit(track)}
                    title="Edit Track Metadata"
                    className="p-1.5 rounded-md hover:bg-[#202020] text-[#9CA3AF] hover:text-[#F4F1ED] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDelete(track.id)}
                    title="Remove Entry"
                    className="p-1.5 rounded-md hover:bg-[#202020] text-[#9CA3AF] hover:text-[#E32636] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
