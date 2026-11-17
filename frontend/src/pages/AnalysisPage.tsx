import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Share2,
  Check,
  AlertCircle,
  RefreshCw,
  Layers,
  MonitorPlay,
  Plus,
  ExternalLink,
  Activity,
  Clock,
  Music,
  HelpCircle,
  Maximize2,
  Minimize2,
  Volume2,
  FileAudio,
  Play,
  Pause
} from 'lucide-react'
import { useAnalysis, useUpdateTrack, useCreateTrack, useDeleteTrack, useVerifyJob } from '../hooks/useAnalysis'
import { ProgressTracker } from '../components/ProgressTracker/ProgressTracker'
import { VerificationModal } from '../components/VerificationModal/VerificationModal'
import { SearchFilter } from '../components/SearchFilter/SearchFilter'
import { ExportPanel } from '../components/ExportPanel/ExportPanel'
import { EditTrackModal } from '../components/EditTrackModal/EditTrackModal'
import { AudioTimeline } from '../components/AudioTimeline/AudioTimeline'
import { TrackTable } from '../components/TrackTable/TrackTable'
import { formatDuration, formatTimestamp } from '../utils/format'
import type { Track } from '../types'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: any
  }
}

export const AnalysisPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const { data: job, isLoading, error } = useAnalysis(jobId)

  const updateTrackMutation = useUpdateTrack()
  const createTrackMutation = useCreateTrack()
  const deleteTrackMutation = useDeleteTrack()
  const verifyJobMutation = useVerifyJob()

  const [activeEditingTrack, setActiveEditingTrack] = useState<Track | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [filteredTracks, setFilteredTracks] = useState<Track[] | null>(null)
  const [shared, setShared] = useState(false)

  // In-page synchronized YouTube & Local Audio player state
  const [currentSeekTime, setCurrentSeekTime] = useState<number>(0)
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState<boolean>(true)
  const [isCompactPlayer, setIsCompactPlayer] = useState<boolean>(false)
  const playerRef = useRef<any>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const [isLocalAudioPlaying, setIsLocalAudioPlaying] = useState<boolean>(false)
  const isLocalFile = Boolean(job?.video_id?.startsWith('local_') || job?.url?.startsWith('file://'))

  // Load the YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      const isYouTube = job?.video_id && !job.video_id.startsWith('local_') && !job.video_id.startsWith('sc_') && !job.video_id.startsWith('mc_')
      if (isYouTube && window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-embedded-player', {
          videoId: job.video_id,
          playerVars: {
            autoplay: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => setIsPlayerReady(true)
          }
        })
      }
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy()
      }
    }
  }, [job?.video_id])

  // Real-time playback polling: smoothly advances currentSeekTime as video plays
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const t = playerRef.current.getCurrentTime()
          if (typeof t === 'number' && !isNaN(t)) {
            setCurrentSeekTime(Math.floor(t))
          }
        } catch {
          // ignore cross-origin access errors
        }
      }
    }, 500)
    return () => clearInterval(timer)
  }, [])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  // Smooth in-place seeking for both Local Audio and YouTube — locks scroll position so page never jumps!
  const handleSeek = (seconds: number) => {
    setCurrentSeekTime(seconds)

    if (isLocalFile && localAudioRef.current) {
      localAudioRef.current.currentTime = seconds
      localAudioRef.current.play().then(() => setIsLocalAudioPlaying(true)).catch(() => {})
      return
    }

    setShowEmbeddedPlayer(true)
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true)
      playerRef.current.playVideo()
    } else {
      const iframe = document.getElementById('youtube-embedded-player') as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
          '*'
        )
      }
    }
  }

  const toggleLocalAudioPlay = () => {
    if (!localAudioRef.current) return
    if (isLocalAudioPlaying) {
      localAudioRef.current.pause()
      setIsLocalAudioPlaying(false)
    } else {
      localAudioRef.current.play().then(() => setIsLocalAudioPlaying(true)).catch(() => {})
    }
  }

  const handleSaveTrack = async (data: {
    id?: string
    jobId: string
    title: string
    artist: string
    startTime: number
    bpm?: number
    musical_key?: string
    release_year?: string
    label?: string
  }) => {
    if (data.id) {
      await updateTrackMutation.mutateAsync({
        id: data.id,
        data: {
          title: data.title,
          artist: data.artist,
          start_time: data.startTime,
          bpm: data.bpm,
          musical_key: data.musical_key,
          release_year: data.release_year,
          label: data.label,
        }
      })
    } else {
      await createTrackMutation.mutateAsync({
        job_id: data.jobId,
        title: data.title,
        artist: data.artist,
        start_time: data.startTime,
        bpm: data.bpm,
        musical_key: data.musical_key,
        release_year: data.release_year,
        label: data.label,
      })
    }
  }

  const handleDeleteTrack = async (trackId: string) => {
    if (window.confirm('Delete this track entry from the tracklist?')) {
      await deleteTrackMutation.mutateAsync(trackId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#141414] border border-[#292929] flex items-center justify-center text-[#E32636]">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <p className="text-xs font-mono text-[#9CA3AF]">Connecting to Studio Console engine...</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-[#141414] border border-[#E32636]/40 flex items-center justify-center text-[#E32636] mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold font-display text-white">Analysis Job Not Found</h2>
          <p className="text-xs text-[#9CA3AF]">
            The requested mix analysis job could not be retrieved. Please verify the URL or start a new analysis.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#E32636] text-white text-xs font-mono uppercase tracking-wider font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Console</span>
        </Link>
      </div>
    )
  }

  const displayTracks = filteredTracks ?? job.tracks
  const identifiedTracks = job.tracks.filter(t => t.is_identified && t.title.toLowerCase() !== 'unknown track')
  const unknownTracks = job.tracks.filter(t => !t.is_identified || t.title.toLowerCase() === 'unknown track')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Workspace Bar */}
      <div className="flex items-center justify-between border-b border-[#292929] pb-3.5">
        <Link
          to="/library"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#9CA3AF] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Library</span>
        </Link>

        <div className="flex items-center gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#141414] hover:bg-[#202020] border border-[#292929] text-xs font-mono text-[#D1D5DB] hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Original Source</span>
            </a>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#141414] hover:bg-[#202020] border border-[#292929] text-xs font-mono text-white transition-colors cursor-pointer"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Share2 className="w-3.5 h-3.5 text-[#E32636]" />}
            <span>{shared ? 'Link Copied' : 'Share Set'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Console Layout: Split into Pinned Monitor/Timeline Column + Scrollable Tracklist Deck */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: PINNED SYNCHRONIZED MONITOR + TIMELINE RACK */}
        {/* ALWAYS VISIBLE WHILE SCROLLING TRACKS! */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[480px] xl:w-[520px] lg:sticky lg:top-20 self-start space-y-4 shrink-0 z-30 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto pr-0.5">
          {/* Synchronized Embedded Video Monitor / Local File Deck */}
          {job.video_id && !job.video_id.startsWith('local_') ? (
            <div className="rounded-xl bg-[#141414] border border-[#292929] overflow-hidden shadow-console-md">
              {/* Monitor Control Bar */}
              <div className="p-3 bg-[#090909] border-b border-[#292929] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E32636] shadow-[0_0_8px_#E32636] animate-pulse" />
                  <span className="font-display font-bold text-white">SYNCHRONIZED MONITOR</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                  <button
                    onClick={() => setIsCompactPlayer(!isCompactPlayer)}
                    className="hover:text-white transition-colors flex items-center gap-1"
                    title={isCompactPlayer ? 'Expand Video' : 'Compact Video'}
                  >
                    {isCompactPlayer ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    <span>{isCompactPlayer ? 'Expand' : 'Compact'}</span>
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setShowEmbeddedPlayer(!showEmbeddedPlayer)}
                    className="text-[#E32636] hover:underline"
                  >
                    {showEmbeddedPlayer ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Video Frame */}
              {showEmbeddedPlayer && (
                <div className={`relative w-full bg-black transition-all duration-200 ${isCompactPlayer ? 'h-44 sm:h-52' : 'aspect-video'}`}>
                  <div id="youtube-embedded-player" className="w-full h-full" />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-[#141414] border border-[#292929] overflow-hidden shadow-console-md">
              <audio
                ref={localAudioRef}
                src={`${(import.meta as any).env?.VITE_API_BASE_URL || '/api'}/media/${job.id}`}
                onTimeUpdate={(e) => {
                  setCurrentSeekTime(Math.floor(e.currentTarget.currentTime))
                }}
                onPlay={() => setIsLocalAudioPlaying(true)}
                onPause={() => setIsLocalAudioPlaying(false)}
                onEnded={() => setIsLocalAudioPlaying(false)}
              />

              {/* Deck Header */}
              <div className="p-3 bg-[#090909] border-b border-[#292929] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isLocalAudioPlaying ? 'bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-[#E32636]'}`} />
                  <span className="font-display font-bold text-white tracking-wider uppercase">LOCAL MIX MONITOR</span>
                </div>
                <span className="text-[10px] text-[#9CA3AF] font-mono uppercase bg-[#202020] px-2 py-0.5 rounded border border-[#292929]">
                  {isLocalAudioPlaying ? 'Playing' : 'Ready'}
                </span>
              </div>

              {/* Deck Player Body */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleLocalAudioPlay}
                    className="w-12 h-12 rounded-lg bg-[#E32636] hover:bg-[#f03a4b] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-[0_0_15px_rgba(227,38,54,0.3)] cursor-pointer"
                    title={isLocalAudioPlaying ? "Pause" : "Play"}
                  >
                    {isLocalAudioPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display font-bold text-white truncate leading-tight">
                      {job.video_title || 'Local Audio Set'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#D1D5DB]">
                      <span className="text-[#E32636] font-semibold">{formatTimestamp(currentSeekTime)}</span>
                      <span className="text-[#6B7280]">/</span>
                      <span className="text-[#9CA3AF]">{formatDuration(job.video_duration || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Scrubber Seek Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={job.video_duration || 100}
                    value={currentSeekTime}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      handleSeek(val)
                    }}
                    className="w-full h-1.5 bg-[#202020] rounded-lg appearance-none cursor-pointer accent-[#E32636]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#6B7280]">
                    <span>0:00</span>
                    <span>Click any track below to jump</span>
                    <span>{formatDuration(job.video_duration || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Acoustic Timeline — Pinned & Synchronized with Video */}
          <AudioTimeline
            tracks={job.tracks}
            totalDurationSec={job.video_duration || job.duration || 0}
            currentTimeSec={currentSeekTime}
            onSeek={handleSeek}
          />

          {/* Compact Mix Meta & Export Actions in Left Rack */}
          <div className="rounded-xl bg-[#141414] border border-[#292929] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-[#090909] border border-[#292929] overflow-hidden shrink-0">
                {job.thumbnail_url ? (
                  <img src={job.thumbnail_url} alt="Set Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#5c5c5c]">
                    <Music className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-bold text-sm text-white truncate">
                  {job.video_title || 'DJ Mix Set'}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF]">
                  <span>{identifiedTracks.length} tracks</span>
                  <span>•</span>
                  <span>{formatDuration(job.video_duration || job.duration || 0)}</span>
                </div>
              </div>
            </div>

            {/* Direct Export Buttons */}
            <ExportPanel tracks={job.tracks} job={job} />
          </div>

          {/* Dedicated Unknown Segments Box */}
          {unknownTracks.length > 0 && (
            <div className="rounded-xl bg-[#141414] border border-[#292929] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#f59e0b] flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Unknown Segments ({unknownTracks.length})
                </span>
                <span className="text-[10px] text-[#6B7280]">Dubplates / VIP IDs</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {unknownTracks.map(ut => (
                  <button
                    key={ut.id}
                    onClick={() => handleSeek(ut.start_time)}
                    className="px-2 py-1 rounded bg-[#090909] hover:bg-[#202020] border border-[#292929] hover:border-[#f59e0b] text-[11px] font-mono text-[#D1D5DB] hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{formatTimestamp(ut.start_time)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: SCROLLABLE RECOVERED TRACKLIST DECK */}
        {/* ========================================================= */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Real Processing Tracker (Visible during analysis) */}
          {job.status !== 'completed' && (
            <ProgressTracker job={job} />
          )}

          {/* Tracklist Controls Header & Filter Strip */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E32636] shadow-[0_0_8px_#E32636]" />
                  <h2 className="text-lg font-bold font-display text-white tracking-tight">
                    Recovered Tracklist
                  </h2>
                  <span className="font-mono text-xs text-[#E32636] font-semibold">
                    ({displayTracks.length} tracks)
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#9CA3AF] mt-0.5">
                  Click any timecode to sync playback • Direct Spotify & YouTube links on each track
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveEditingTrack(null)
                  setIsAddMode(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#202020] hover:bg-[#292929] border border-[#292929] hover:border-[#8D1422] text-[#F4F1ED] text-xs font-mono font-medium transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-[#E32636]" />
                <span>Add Custom Timestamp</span>
              </button>
            </div>

            <SearchFilter tracks={job.tracks} onFilterChange={setFilteredTracks} />
          </div>

          {/* High-Precision Track Strips with ZERO Horizontal Scrolling & Direct Spotify/YouTube */}
          <TrackTable
            tracks={displayTracks}
            videoId={job.video_id}
            currentTime={currentSeekTime}
            onEdit={track => {
              setActiveEditingTrack(track)
              setIsAddMode(false)
            }}
            onDelete={handleDeleteTrack}
            onSeek={handleSeek}
          />
        </div>
      </div>

      {/* Verification Challenge Modal */}
      {job && job.status === 'verification_required' && (
        <VerificationModal
          job={job}
          onVerify={() => verifyJobMutation.mutate(job.id)}
          isVerifying={verifyJobMutation.isPending}
        />
      )}

      {/* Edit Track Modal */}
      <EditTrackModal
        track={activeEditingTrack}
        jobId={job.id}
        isOpen={Boolean(activeEditingTrack) || isAddMode}
        isAddMode={isAddMode}
        onClose={() => {
          setActiveEditingTrack(null)
          setIsAddMode(false)
        }}
        onSave={handleSaveTrack}
      />
    </div>
  )
}
