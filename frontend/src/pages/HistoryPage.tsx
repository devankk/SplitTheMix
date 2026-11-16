import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHistory, deleteHistory } from '../api/client'
import { History, Trash2, ArrowRight, Music, Clock, Calendar, CheckCircle2, AlertTriangle, Disc } from 'lucide-react'
import { formatDate, formatDuration } from '../utils/format'

export const HistoryPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: getHistory
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
    }
  })

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm('Delete this analysed mix from your history?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Disc className="w-8 h-8 text-[#a855f7] animate-spin" />
        <p className="text-sm text-[#94a3b8]">Loading past mix analyses...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#1e1e2e] pb-4">
        <div className="flex items-center gap-2.5">
          <History className="w-6 h-6 text-[#a855f7]" />
          <div>
            <h1 className="text-xl font-bold text-white">Analysed Sets History</h1>
            <p className="text-xs text-[#64748b]">Access and export results from previously analysed recordings</p>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <span>Analyse New Set</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!history || history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-[#13131a] border border-[#1e1e2e]">
          <div className="w-14 h-14 rounded-2xl bg-[#1e1e2e] flex items-center justify-center text-[#64748b] mb-4">
            <Music className="w-7 h-7 text-[#a855f7]" />
          </div>
          <h3 className="text-base font-bold text-white">No mixes analysed yet</h3>
          <p className="text-xs text-[#64748b] max-w-sm mt-1 mb-6">
            Paste any YouTube DJ mix URL on the home page to fingerprint songs and tracklists.
          </p>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-[#7c3aed]/20"
          >
            Start First Analysis
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map(job => (
            <Link
              key={job.id}
              to={`/analysis/${job.id}`}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-[#13131a] hover:bg-[#171724] border border-[#1e1e2e] hover:border-[#7c3aed]/50 transition-all duration-200 shadow-sm"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-[#0a0a0f] border border-[#1e1e2e] shrink-0">
                  {job.thumbnail_url ? (
                    <img
                      src={job.thumbnail_url}
                      alt={job.video_title || 'Thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#64748b]">
                      <Music className="w-5 h-5 opacity-40" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#a855f7] transition-colors">
                    {job.video_title || 'DJ Mix Set'}
                  </h4>
                  <p className="text-xs text-[#94a3b8] truncate mt-1">
                    {job.channel_name || 'YouTube Creator'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1e1e2e] text-xs text-[#64748b]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(job.created_at)}</span>
                  </span>

                  <span className="font-semibold text-white">
                    {job.tracks_found} tracks
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
                      job.status === 'completed'
                        ? 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20'
                        : job.status === 'failed'
                        ? 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
                        : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                    }`}
                  >
                    {job.status}
                  </span>

                  <button
                    onClick={e => handleDelete(job.id, e)}
                    title="Remove from history"
                    className="p-1 rounded text-[#64748b] hover:text-rose-400 hover:bg-[#1e1e2e] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
