import axios from 'axios'
import type { AnalysisJob, Track, TrackUpdate, TrackCreate } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 45000
})

export const analyzeUrl = async (url: string): Promise<AnalysisJob> => {
  const res = await api.post<AnalysisJob>('/analyze', { url })
  return res.data
}

export const getAnalysis = async (jobId: string): Promise<AnalysisJob> => {
  const res = await api.get<AnalysisJob>(`/analysis/${jobId}`)
  return res.data
}

export const getHistory = async (): Promise<AnalysisJob[]> => {
  const res = await api.get<AnalysisJob[]>('/history')
  return res.data
}

export const deleteHistory = async (jobId: string): Promise<void> => {
  await api.delete(`/history/${jobId}`)
}

export const updateTrack = async (trackId: string, data: TrackUpdate): Promise<Track> => {
  const res = await api.patch<Track>(`/tracks/${trackId}`, data)
  return res.data
}

export const createTrack = async (data: TrackCreate): Promise<Track> => {
  const res = await api.post<Track>('/tracks', data)
  return res.data
}

export const deleteTrack = async (trackId: string): Promise<void> => {
  await api.delete(`/tracks/${trackId}`)
}

export default api
