export interface PlatformLinks {
  spotify_search: string
  youtube_music_search: string
  apple_music_search: string
  soundcloud_search?: string
  mixcloud_search?: string
}

export interface Track {
  id: string
  job_id: string
  title: string
  artist: string
  start_time: number
  end_time: number | null
  duration: number | null
  confidence: number
  album_art?: string | null
  bpm?: number | null
  musical_key?: string | null
  release_year?: string | null
  label?: string | null
  platform_links: PlatformLinks | null
  is_identified: boolean
  edited_by_user: boolean
}

export type JobStatus = 'queued' | 'downloading' | 'processing' | 'completed' | 'failed'

export interface AnalysisJob {
  id: string
  url: string
  video_id: string | null
  video_title: string | null
  channel_name: string | null
  thumbnail_url: string | null
  video_duration: number | null
  duration?: number | null
  status: JobStatus
  progress: number
  stage_message: string
  tracks_found: number
  created_at: string
  completed_at: string | null
  error_message: string | null
  tracks: Track[]
}

export interface TrackUpdate {
  title?: string
  artist?: string
  start_time?: number
  bpm?: number | null
  musical_key?: string | null
  release_year?: string | null
  label?: string | null
  album_art?: string | null
}

export interface TrackCreate {
  job_id: string
  title: string
  artist: string
  start_time: number
  bpm?: number | null
  musical_key?: string | null
  release_year?: string | null
  label?: string | null
  album_art?: string | null
}
