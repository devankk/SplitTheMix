import React, { useState, useEffect } from 'react'
import { Loader2, Music4, CheckCircle2, AlertTriangle, Disc } from 'lucide-react'
import type { AnalysisJob } from '../../types'

interface ProgressTrackerProps {
  job: AnalysisJob
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ job }) => {
  const [elapsed, setElapsed] = useState<number>(0)

  useEffect(() => {
    if (job.status === 'completed' || job.status === 'failed') return

    const start = new Date(job.created_at).getTime()
    const updateElapsed = () => {
      const now = Date.now()
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)))
    }
    updateElapsed()
    const timer = setInterval(updateElapsed, 1000)
    return () => clearInterval(timer)
  }, [job.created_at, job.status])

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}m ${String(s).padStart(2, '0')}s`
  }

  const isComplete = job.status === 'completed'
  const isFailed = job.status === 'failed'

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#13131a] border border-[#1e1e2e] relative overflow-hidden shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {!isComplete && !isFailed ? (
            <Disc className="w-5 h-5 text-[#a855f7] animate-spin" />
          ) : isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
          )}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
              {job.status === 'downloading'
                ? 'Downloading Set'
                : job.status === 'processing'
                ? 'Deep Fingerprint Scanning'
                : job.status === 'queued'
                ? 'Queue Processing'
                : job.status === 'completed'
                ? 'Identification Finished'
                : 'Process Error'}
            </span>
            <p className="text-xs text-[#cbd5e1] font-medium mt-0.5">{job.stage_message}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold font-mono text-white">{job.progress}%</span>
          {!isComplete && !isFailed && (
            <p className="text-[10px] text-[#64748b]">Elapsed: {formatTimer(elapsed)}</p>
          )}
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-[#0a0a0f] overflow-hidden p-0.5 border border-[#1e1e2e]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isFailed
              ? 'bg-[#ef4444]'
              : 'bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#ec4899]'
          }`}
          style={{ width: `${Math.max(5, job.progress)}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748b]">
        <div className="flex items-center gap-1.5">
          <Music4 className="w-3.5 h-3.5 text-[#a855f7]" />
          <span>
            <strong className="text-white">{job.tracks_found}</strong> tracks isolated
          </span>
        </div>
        <span>Overlapping 30s chunking analysis &bull; Non-destructive detection</span>
      </div>
    </div>
  )
}
