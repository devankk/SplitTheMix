import React, { useState } from 'react'
import { Download, Copy, Check, FileSpreadsheet, FileText, Code2 } from 'lucide-react'
import type { Track, AnalysisJob } from '../../types'
import { formatTimestamp } from '../../utils/format'

interface ExportPanelProps {
  tracks: Track[]
  job: AnalysisJob
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ tracks, job }) => {
  const [copied, setCopied] = useState(false)

  const identifiedTracks = tracks.filter(t => t.is_identified && t.title.toLowerCase() !== 'unknown track')

  // Generate plain text YouTube tracklist
  const generateText = () => {
    const header = `SplitTheMix — Tracklist\nMix: ${job.video_title || 'DJ Mix Set'}\nTotal Tracks: ${identifiedTracks.length}\nDate: ${new Date(job.created_at).toLocaleDateString()}\n\n`
    const body = identifiedTracks
      .map(
        t => `${formatTimestamp(t.start_time)} ${t.artist ? `${t.artist} - ` : ''}${t.title}${t.bpm ? ` [${t.bpm} BPM${t.musical_key ? `, ${t.musical_key}` : ''}]` : ''}`
      )
      .join('\n')
    return header + body
  }

  // Generate CSV format
  const generateCSV = () => {
    const headers = 'Number,Start Time,End Time,Duration,Title,Artist,BPM,Key,Release Year,Label,Confidence\n'
    const rows = tracks
      .map((t, idx) => {
        const next = tracks[idx + 1]
        const end = t.end_time || (next ? next.start_time : '')
        const dur = end !== '' ? Math.max(0, Number(end) - t.start_time) : (t.duration || '')
        const clean = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`
        return [
          idx + 1,
          formatTimestamp(t.start_time),
          end !== '' ? formatTimestamp(Number(end)) : '',
          dur !== '' ? formatTimestamp(Number(dur)) : '',
          clean(t.title),
          clean(t.artist),
          t.bpm || '',
          clean(t.musical_key || ''),
          clean(t.release_year || ''),
          clean(t.label || ''),
          `${t.confidence}%`
        ].join(',')
      })
      .join('\n')
    return headers + rows
  }

  // Generate JSON format
  const generateJSON = () => {
    return JSON.stringify(
      {
        mix_title: job.video_title,
        job_id: job.id,
        analyzed_at: job.created_at,
        tracks_total: tracks.length,
        tracks_identified: identifiedTracks.length,
        tracks: tracks.map((t, i) => ({
          track_number: i + 1,
          title: t.title,
          artist: t.artist,
          start_time_seconds: t.start_time,
          start_timecode: formatTimestamp(t.start_time),
          end_time_seconds: t.end_time,
          end_timecode: t.end_time ? formatTimestamp(t.end_time) : null,
          bpm: t.bpm,
          musical_key: t.musical_key,
          release_year: t.release_year,
          label: t.label,
          confidence_score: t.confidence,
          is_identified: t.is_identified
        }))
      },
      null,
      2
    )
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sanitizedTitle = (job.video_title || 'mix_tracklist')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 40)

  return (
    <div className="rounded-lg bg-[#141414] border border-[#292929] p-4 space-y-3 shadow-console-sm">
      <div className="flex items-center justify-between border-b border-[#202020] pb-2">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-[#E32636]" />
          <span className="text-xs font-mono font-semibold text-[#F4F1ED]">EXPORT CONSOLE</span>
        </div>
        <span className="text-[10px] font-mono text-[#5c5c5c]">
          {identifiedTracks.length} verified songs ready
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* Copy Plain Text */}
        <button
          onClick={handleCopyText}
          className="p-2 rounded bg-[#090909] hover:bg-[#202020] border border-[#292929] text-[#F4F1ED] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Copy className="w-3.5 h-3.5 text-[#E32636]" />}
          <span>{copied ? 'Copied' : 'Copy TXT'}</span>
        </button>

        {/* Download TXT */}
        <button
          onClick={() => downloadFile(generateText(), `${sanitizedTitle}.txt`, 'text/plain')}
          className="p-2 rounded bg-[#090909] hover:bg-[#202020] border border-[#292929] text-[#F4F1ED] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-[#E32636]" />
          <span>Save .TXT</span>
        </button>

        {/* Download CSV */}
        <button
          onClick={() => downloadFile(generateCSV(), `${sanitizedTitle}.csv`, 'text/csv')}
          className="p-2 rounded bg-[#090909] hover:bg-[#202020] border border-[#292929] text-[#F4F1ED] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#E32636]" />
          <span>Save .CSV</span>
        </button>

        {/* Download JSON */}
        <button
          onClick={() => downloadFile(generateJSON(), `${sanitizedTitle}.json`, 'application/json')}
          className="p-2 rounded bg-[#090909] hover:bg-[#202020] border border-[#292929] text-[#F4F1ED] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5 text-[#E32636]" />
          <span>Save .JSON</span>
        </button>
      </div>
    </div>
  )
}
