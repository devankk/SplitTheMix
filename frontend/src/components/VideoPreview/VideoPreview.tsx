import React from 'react'
import { Clock, User, Youtube, Layers } from 'lucide-react'
import type { AnalysisJob } from '../../types'
import { formatDuration } from '../../utils/format'

interface VideoPreviewProps {
  job: AnalysisJob
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ job }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-[#13131a] border border-[#1e1e2e]">
      <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-[#0a0a0f] border border-[#1e1e2e] shrink-0 group">
        {job.thumbnail_url ? (
          <img
            src={job.thumbnail_url}
            alt={job.video_title || 'DJ Mix Thumbnail'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#64748b]">
            <Youtube className="w-8 h-8 opacity-40" />
          </div>
        )}
        {job.video_duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/80 text-white backdrop-blur-sm">
            {formatDuration(job.video_duration)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 text-center sm:text-left">
        <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug">
          {job.video_title || 'Processing YouTube Music Set...'}
        </h2>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-[#94a3b8]">
          {job.channel_name && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#a855f7]" />
              <span className="truncate max-w-[200px]">{job.channel_name}</span>
            </div>
          )}

          {job.video_duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#64748b]" />
              <span>{formatDuration(job.video_duration)} Duration</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#ec4899]" />
            <span className="font-semibold text-white">{job.tracks_found}</span> Tracks Found
          </div>
        </div>

        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] text-[#a855f7] hover:underline mt-2.5 font-medium"
          >
            {job.url.includes('soundcloud.com') ? (
              <span>Open set on SoundCloud ↗</span>
            ) : job.url.includes('mixcloud.com') ? (
              <span>Open set on Mixcloud ↗</span>
            ) : (
              <>
                <Youtube className="w-3.5 h-3.5" />
                <span>Open original mix on YouTube ↗</span>
              </>
            )}
          </a>
        ) : job.video_id ? (
          <a
            href={`https://www.youtube.com/watch?v=${job.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#a855f7] hover:underline mt-2.5"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>Open original mix on YouTube</span>
          </a>
        ) : null}
      </div>
    </div>
  )
}
