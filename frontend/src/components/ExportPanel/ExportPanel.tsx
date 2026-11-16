import React, { useState } from 'react'
import { Copy, Download, Check, FileSpreadsheet, FileText } from 'lucide-react'
import type { Track } from '../../types'
import { formatTimestamp } from '../../utils/format'

interface ExportPanelProps {
  tracks: Track[]
  videoTitle: string | null
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ tracks, videoTitle }) => {
  const [copied, setCopied] = useState(false)

  const buildTracklistText = () => {
    const lines = [
      `DJ Mix Tracklist - ${videoTitle || 'Mix'}`,
      `Identified by MixTrace (https://github.com)`,
      '--------------------------------------------------',
      ...tracks.map(
        t => `${formatTimestamp(t.start_time)} - ${t.title} - ${t.artist || 'Unknown Artist'}`
      )
    ]
    return lines.join('\n')
  }

  const handleCopyAll = () => {
    navigator.clipboard.writeText(buildTracklistText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportTxt = () => {
    const element = document.createElement('a')
    const file = new Blob([buildTracklistText()], { type: 'text/plain;charset=utf-8' })
    element.href = URL.createObjectURL(file)
    element.download = `${(videoTitle || 'mix_tracklist').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleExportCsv = () => {
    const headers = ['#', 'Start Time', 'Timestamp (Sec)', 'Title', 'Artist', 'Confidence', 'Identified']
    const rows = tracks.map((t, i) => [
      i + 1,
      formatTimestamp(t.start_time),
      Math.floor(t.start_time),
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.artist || '').replace(/"/g, '""')}"`,
      `${t.confidence}%`,
      t.is_identified ? 'Yes' : 'No'
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    const element = document.createElement('a')
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    element.href = URL.createObjectURL(file)
    element.download = `${(videoTitle || 'mix_tracklist').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopyAll}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131a] hover:bg-[#1e1e2e] border border-[#1e1e2e] text-xs font-medium text-[#cbd5e1] hover:text-white transition-all shadow-sm"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5 text-[#a855f7]" />}
        <span>{copied ? 'Copied Full Set!' : 'Copy Tracklist'}</span>
      </button>

      <button
        onClick={handleExportTxt}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131a] hover:bg-[#1e1e2e] border border-[#1e1e2e] text-xs font-medium text-[#cbd5e1] hover:text-white transition-all shadow-sm"
      >
        <FileText className="w-3.5 h-3.5 text-blue-400" />
        <span>Export TXT</span>
      </button>

      <button
        onClick={handleExportCsv}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131a] hover:bg-[#1e1e2e] border border-[#1e1e2e] text-xs font-medium text-[#cbd5e1] hover:text-white transition-all shadow-sm"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-[#22c55e]" />
        <span>Export CSV</span>
      </button>
    </div>
  )
}
