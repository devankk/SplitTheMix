import React from 'react'
import { Plus, Music } from 'lucide-react'
import type { Track } from '../../types'
import { TrackCard } from '../TrackCard/TrackCard'

interface TrackListProps {
  tracks: Track[]
  videoId: string | null
  jobId: string
  onEdit: (track: Track) => void
  onDelete: (trackId: string) => void
  onAddManual: () => void
  onSeek?: (seconds: number) => void
  currentTime?: number
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  videoId,
  jobId,
  onEdit,
  onDelete,
  onAddManual,
  onSeek,
  currentTime
}) => {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#13131a] border border-[#1e1e2e]">
        <div className="w-12 h-12 rounded-full bg-[#1e1e2e] flex items-center justify-center text-[#64748b] mb-3">
          <Music className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-white">No tracks match your query</h4>
        <p className="text-xs text-[#64748b] max-w-xs mt-1">
          Try clearing your search filters, or manually register a track below.
        </p>
        <button
          onClick={onAddManual}
          className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed]/20 text-[#a855f7] border border-[#7c3aed]/30 hover:bg-[#7c3aed]/30 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Track Manually</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold text-[#64748b] px-4 py-1">
        <span>Detected Timeline ({tracks.length} entries)</span>
        <button
          onClick={onAddManual}
          className="flex items-center gap-1 text-[#a855f7] hover:underline cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Custom Timestamp</span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tracks.map((track, idx) => {
          const next = tracks[idx + 1]
          const isOverlapping = next && Math.abs(next.start_time - track.start_time) < 10
          
          // Check if this track is currently playing in the embedded player
          const isActive =
            currentTime !== undefined &&
            currentTime >= track.start_time &&
            (next ? currentTime < next.start_time : true)

          return (
            <TrackCard
              key={track.id}
              track={track}
              index={idx}
              videoId={videoId}
              onEdit={onEdit}
              onDelete={onDelete}
              onSeek={onSeek}
              isOverlapping={isOverlapping}
              isActive={isActive}
            />
          )
        })}
      </div>
    </div>
  )
}
