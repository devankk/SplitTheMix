import React, { useState } from 'react'
import { Play, Copy, Check, ExternalLink } from 'lucide-react'
import { formatTimestamp } from '../../utils/format'

interface TimestampButtonProps {
  seconds: number
  videoId: string | null
  onSeek?: (seconds: number) => void
}

export const TimestampButton: React.FC<TimestampButtonProps> = ({ seconds, videoId, onSeek }) => {
  const [copied, setCopied] = useState(false)
  const timeFormatted = formatTimestamp(seconds)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSeek) {
      // Seek purely in the on-page embedded player — NEVER open any external tabs!
      onSeek(seconds)
    } else if (videoId) {
      const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`
      window.open(url, 'SplitTheMix_YouTube_Player')
    } else {
      handleCopy(e)
    }
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(timeFormatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoId) {
      const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`
      window.open(url, 'SplitTheMix_YouTube_Player')
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={handleClick}
        title={`Play at ${timeFormatted} in player`}
        className="group/btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#7c3aed]/15 hover:bg-[#7c3aed]/30 border border-[#7c3aed]/30 hover:border-[#a855f7]/50 text-[#a855f7] hover:text-white transition-all font-mono text-xs font-semibold shadow-sm"
      >
        <Play className="w-3 h-3 fill-current group-hover/btn:scale-110 transition-transform" />
        <span>{timeFormatted}</span>
      </button>

      <button
        onClick={handleCopy}
        title="Copy timestamp"
        className="p-1 rounded text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#1e1e2e] transition-colors"
      >
        {copied ? <Check className="w-3 h-3 text-[#22c55e]" /> : <Copy className="w-3 h-3" />}
      </button>

      {videoId && (
        <button
          onClick={handleExternalClick}
          title="Open in YouTube tab"
          className="p-1 rounded text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#1e1e2e] transition-colors"
        >
          <ExternalLink className="w-3 h-3 opacity-60 hover:opacity-100" />
        </button>
      )}
    </div>
  )
}
