import React, { useState, useEffect } from 'react'
import { Disc3, CheckCircle2, AlertTriangle, Activity, Clock } from 'lucide-react'
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
  const isVerification = job.status === 'verification_required'

  return (
    <div className="p-4 sm:p-5 rounded-lg bg-[#141414] border border-[#292929] relative overflow-hidden shadow-console-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {isVerification ? (
            <div className="w-8 h-8 rounded bg-[#202020] border border-amber-500/40 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
          ) : !isComplete && !isFailed ? (
            <div className="w-8 h-8 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636]">
              <Disc3 className="w-4 h-4 animate-spin" />
            </div>
          ) : isComplete ? (
            <div className="w-8 h-8 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#22c55e]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}

          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#929292]">
              {job.status === 'downloading'
                ? 'Ingesting Audio Stream'
                : job.status === 'processing'
                ? 'Acoustic Signature Analysis'
                : job.status === 'queued'
                ? 'Rack Queue Standby'
                : job.status === 'verification_required'
                ? 'Human Verification Standby'
                : job.status === 'completed'
                ? 'Analysis Complete'
                : 'Processing Error'}
            </span>
            <p className="text-xs text-[#F4F1ED] font-mono mt-0.5">{job.stage_message}</p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-lg font-bold text-[#F4F1ED]">{job.progress}%</span>
          {!isComplete && !isFailed && !isVerification && (
            <div className="flex items-center gap-1 text-[10px] text-[#5c5c5c] mt-0.5">
              <Clock className="w-3 h-3 text-[#E32636]" />
              <span>Elapsed: {formatTimer(elapsed)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-1.5 rounded-full bg-[#090909] overflow-hidden border border-[#292929]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isFailed
              ? 'bg-[#E32636]'
              : isComplete
              ? 'bg-[#22c55e]'
              : 'bg-[#E32636]'
          }`}
          style={{ width: `${Math.max(4, job.progress)}%` }}
        />
      </div>

      {/* Bottom Status Metrics */}
      <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-[#929292] pt-1">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#E32636]" />
          <span>
            <strong className="text-[#F4F1ED]">{job.tracks_found}</strong> tracks isolated
          </span>
        </div>
        <span className="text-[#5c5c5c]">12s chunks &bull; Stride 50s &bull; Parallel Workers</span>
      </div>
    </div>
  )
}
