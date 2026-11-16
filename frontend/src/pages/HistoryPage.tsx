import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHistory, deleteHistory } from '../api/client'
import { Disc3, Trash2, ArrowRight, Music, Clock, Calendar, CheckCircle2, AlertTriangle, Search, SlidersHorizontal, Layers, Play } from 'lucide-react'
import { formatDate, formatDuration } from '../utils/format'

export const HistoryPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'processing' | 'failed'>('ALL')

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
    if (window.confirm('Remove this analysed set from your studio library?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredHistory = (history || []).filter(item => {
    const matchesSearch = !searchTerm.trim() || 
      (item.video_title && item.video_title.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Disc3 className="w-8 h-8 text-[#E32636] animate-spin" />
        <p className="text-xs font-mono text-[#929292]">Loading Studio Console library...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#141414] border border-[#292929] text-[#E32636] text-[11px] font-mono tracking-wider uppercase">
            <Layers className="w-3.5 h-3.5" />
            <span>Studio Mix Archive</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F1ED]">My Library</h1>
          <p className="text-xs text-[#929292]">
            Access and manage previously analysed DJ sets, verified tracklists, and export logs.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-[#E32636] hover:bg-[#f03a4b] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <span>Analyse New Mix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      {history && history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#141414] border border-[#292929]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search library by set title..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] placeholder-[#5c5c5c] focus:outline-none focus:border-[#E32636] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs font-mono px-3 py-1.5 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] focus:outline-none focus:border-[#E32636] transition-colors cursor-pointer"
            >
              <option value="ALL">All Statuses ({history.length})</option>
              <option value="completed">Completed Only</option>
              <option value="processing">In Progress</option>
              <option value="failed">Errors</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!history || history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 text-center rounded-lg bg-[#141414] border border-[#292929] space-y-4">
          <div className="w-12 h-12 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636]">
            <Music className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#F4F1ED]">No mix analyses in library</h3>
            <p className="text-xs text-[#929292] max-w-sm">
              Paste any DJ set, festival stream, or live session URL into the console to isolate tracklists.
            </p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 rounded bg-[#E32636] hover:bg-[#f03a4b] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-sm"
          >
            Start First Analysis
          </Link>
        </div>
      ) : (
        /* Grid of Saved Library Mixes */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHistory.map(job => (
            <Link
              key={job.id}
              to={`/analysis/${job.id}`}
              className="group relative flex flex-col justify-between p-4 rounded-lg bg-[#141414] hover:bg-[#181818] border border-[#292929] hover:border-[#8D1422] transition-all duration-150 shadow-console-sm"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="relative w-28 h-18 rounded bg-[#090909] border border-[#292929] overflow-hidden shrink-0">
                  {job.thumbnail_url ? (
                    <img
                      src={job.thumbnail_url}
                      alt={job.video_title || 'Thumbnail'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5c5c5c]">
                      <Music className="w-5 h-5 opacity-40" />
                    </div>
                  )}
                  {/* Status Badge Overlaid */}
                  <div className="absolute top-1 left-1">
                    {job.status === 'completed' ? (
                      <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block shadow-sm" />
                    ) : job.status === 'failed' ? (
                      <span className="w-2 h-2 rounded-full bg-[#E32636] inline-block shadow-sm" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block animate-pulse shadow-sm" />
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="text-sm font-semibold text-[#F4F1ED] line-clamp-2 leading-snug group-hover:text-white transition-colors">
                    {job.video_title || 'DJ Mix Set'}
                  </h4>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-[#929292]">
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3 text-[#E32636]" />
                      <strong className="text-[#F4F1ED]">{job.tracks_found}</strong> tracks
                    </span>

                    {(job.video_duration || job.duration) && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#5c5c5c]" />
                        <span>{formatDuration(job.video_duration || job.duration || 0)}</span>
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-[#5c5c5c]">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(job.created_at)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="mt-4 pt-3 border-t border-[#202020] flex items-center justify-between text-xs font-mono">
                <span className="text-[#E32636] group-hover:underline flex items-center gap-1">
                  <span>Open Console Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>

                <button
                  onClick={e => handleDelete(job.id, e)}
                  title="Delete from Library"
                  className="p-1.5 rounded hover:bg-[#202020] text-[#5c5c5c] hover:text-[#E32636] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
