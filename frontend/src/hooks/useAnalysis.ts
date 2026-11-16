import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/client'
import type { TrackUpdate, TrackCreate } from '../types'

const TERMINAL_STATUSES = ['completed', 'failed']

export function useAnalysis(jobId: string | undefined) {
  return useQuery({
    queryKey: ['analysis', jobId],
    queryFn: () => api.getAnalysis(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || TERMINAL_STATUSES.includes(data.status)) return false
      return 2000
    },
  })
}

export function useUpdateTrack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrackUpdate }) => api.updateTrack(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analysis'] })
    },
  })
}

export function useCreateTrack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TrackCreate) => api.createTrack(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analysis'] })
    },
  })
}

export function useDeleteTrack() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteTrack(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analysis'] })
    },
  })
}
