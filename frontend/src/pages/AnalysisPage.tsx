import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Share2, Check, AlertCircle, RefreshCw, Layers, MonitorPlay } from 'lucide-react'
import { useAnalysis, useUpdateTrack, useCreateTrack, useDeleteTrack } from '../hooks/useAnalysis'
import { VideoPreview } from '../components/VideoPreview/VideoPreview'
import { ProgressTracker } from '../components/ProgressTracker/ProgressTracker'
import { TrackList } from '../components/TrackList/TrackList'
import { SearchFilter } from '../components/SearchFilter/SearchFilter'
import { ExportPanel } from '../components/ExportPanel/ExportPanel'
import { EditTrackModal } from '../components/EditTrackModal/EditTrackModal'
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

  const [activeEditingTrack, setActiveEditingTrack] = useState<Track | null>(null)
  const [isAddMode, setIsAddMode] = useState(false)
  const [filteredTracks, setFilteredTracks] = useState<Track[] | null>(null)
  const [shared, setShared] = useState(false)

  // In-page synchronized YouTube player state
  const [currentSeekTime, setCurrentSeekTime] = useState<number>(0)
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState<boolean>(true)
  const playerRef = useRef<any>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)

  // Load the YouTube IFrame API script once
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      if (job?.video_id && window.YT && window.YT.Player) {
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  // Smooth in-place seeking — keeps the user's scroll position locked!
  const handleSeek = (seconds: number) => {
    setCurrentSeekTime(seconds)
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
    // We intentionally DO NOT call scrollIntoView here so your scroll position never jumps!
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
    await deleteTrackMutation.mutateAsync(trackId)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-[#a855f7] animate-spin" />
        <p className="text-sm text-[#94a3b8]">Loading analysis details...</p>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto my-16 p-6 rounded-2xl bg-[#13131a] border border-[#1e1e2e] text-center">
        <AlertCircle className="w-10 h-10 text-[#ef4444] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Analysis Job Not Found</h3>
        <p className="text-xs text-[#64748b] mt-1 mb-6">
          Could not retrieve data for this mix ID. It may have expired or was removed.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-[#1e1e2e] hover:bg-[#2a2a38] text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    )
  }

  const displayedTracks = filteredTracks ?? job.tracks

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#94a3b8] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Analysis</span>
        </Link>

        <div className="flex items-center gap-2">
          {job.video_id && (
            <button
              onClick={() => setShowEmbeddedPlayer(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131a] hover:bg-[#1e1e2e] border border-[#1e1e2e] text-xs font-medium text-[#cbd5e1] hover:text-white transition-all"
            >
              <MonitorPlay className="w-3.5 h-3.5 text-[#a855f7]" />
              <span>{showEmbeddedPlayer ? 'Hide Player' : 'Show Player'}</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#13131a] hover:bg-[#1e1e2e] border border-[#1e1e2e] text-xs font-medium text-[#cbd5e1] hover:text-white transition-all"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-[#22c55e]" /> : <Share2 className="w-3.5 h-3.5 text-[#a855f7]" />}
            <span>{shared ? 'Link Copied!' : 'Share Results'}</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Body: Sticky Side-by-Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Desktop 5 cols): STICKY PLAYER & VIDEO OVERVIEW */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4 z-20">
          {job.video_id && !job.video_id.startsWith('sc_') && !job.video_id.startsWith('mc_') && showEmbeddedPlayer ? (
            <div
              id="player-container"
              className="rounded-2xl overflow-hidden bg-black border border-[#1e1e2e] shadow-2xl aspect-video w-full"
            >
              <iframe
                id="youtube-embedded-player"
                src={`https://www.youtube.com/embed/${job.video_id}?enablejsapi=1&autoplay=0&origin=${window.location.origin}`}
                title={job.video_title || 'Mix Player'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <VideoPreview job={job} />
          )}

          {/* Compact summary under player */}
          <div className="p-3.5 rounded-xl bg-[#13131a] border border-[#1e1e2e] text-xs text-[#94a3b8] flex items-center justify-between">
            <span className="truncate max-w-[220px] font-semibold text-white">
              {job.video_title || 'Mix'}
            </span>
            <span className="font-mono text-[#a855f7]">
              {job.tracks.length} Tracks Identified
            </span>
          </div>

          <ProgressTracker job={job} />
        </div>

        {/* Right Column (Desktop 7 cols): INDEPENDENTLY SCROLLABLE TRACKLIST */}
        <div className="lg:col-span-7 space-y-4">
          {job.tracks.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#1e1e2e] pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#a855f7]" />
                  <h3 className="text-base font-bold text-white">Identified Tracklist</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1e2e] text-[#94a3b8] font-mono">
                    {job.tracks.length}
                  </span>
                </div>

                <ExportPanel tracks={job.tracks} videoTitle={job.video_title} />
              </div>

              <SearchFilter tracks={job.tracks} onFilterChange={setFilteredTracks} />

              <TrackList
                tracks={displayedTracks}
                videoId={job.video_id}
                jobId={job.id}
                onEdit={t => {
                  setActiveEditingTrack(t)
                  setIsAddMode(false)
                }}
                onDelete={handleDeleteTrack}
                onAddManual={() => {
                  setActiveEditingTrack(null)
                  setIsAddMode(true)
                }}
                onSeek={handleSeek}
                currentTime={currentSeekTime}
              />
            </div>
          )}
        </div>
      </div>

      {/* Manual Edit or Add Modal */}
      {(activeEditingTrack || isAddMode) && (
        <EditTrackModal
          track={activeEditingTrack}
          jobId={job.id}
          onClose={() => {
            setActiveEditingTrack(null)
            setIsAddMode(false)
          }}
          onSave={handleSaveTrack}
          onDelete={activeEditingTrack ? handleDeleteTrack : undefined}
        />
      )}
    </div>
  )
}
