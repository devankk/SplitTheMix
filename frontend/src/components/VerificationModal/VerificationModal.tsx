import React from 'react'
import { ShieldAlert, ExternalLink, RefreshCw, Upload, CheckCircle2 } from 'lucide-react'
import type { AnalysisJob } from '../../types'

interface VerificationModalProps {
  job: AnalysisJob
  onVerify: () => void
  isVerifying: boolean
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  job,
  onVerify,
  isVerifying
}) => {
  const challengeUrl = job.verification_url || job.url

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl bg-[#141414] border border-[#E32636]/40 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#E32636]/10 border border-[#E32636]/30 flex items-center justify-center text-[#E32636] shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#E32636] font-semibold">
              Security Verification Required
            </span>
            <h3 className="text-base font-bold text-white font-display">
              YouTube Anti-Bot Challenge
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              YouTube has requested a human browser check to access this mix stream. Complete it once in your browser to proceed without restrictions.
            </p>
          </div>
        </div>

        {/* Verification Steps Box */}
        <div className="p-3.5 rounded-lg bg-[#0C0C0C] border border-[#262626] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-[#D1D5DB]">
            <span className="text-[11px] text-[#9CA3AF]">Step 1: Open Challenge</span>
            <a
              href={challengeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#E32636] hover:underline"
            >
              <span>Open in YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="text-[11px] text-[#6B7280]">
            Confirm playback or sign in if prompted in the opened YouTube tab.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onVerify}
            disabled={isVerifying}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#E32636] hover:bg-[#c91e2c] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg shadow-[#E32636]/20"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Resuming Download…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Verified — Resume Analysis</span>
              </>
            )}
          </button>

          <a
            href="/"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F1F1F] hover:bg-[#292929] text-[#9CA3AF] hover:text-white text-xs font-mono transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Or Drag & Drop Converted MP3 Directly</span>
          </a>
        </div>
      </div>
    </div>
  )
}
