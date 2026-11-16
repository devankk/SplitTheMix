import React, { useState } from 'react'
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import type { Track } from '../../types'

interface SearchFilterProps {
  tracks: Track[]
  onFilterChange: (filtered: Track[]) => void
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ tracks, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('ALL')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const artists = Array.from(
    new Set(tracks.map(t => t.artist).filter(a => a && a.trim() !== ''))
  ).sort()

  const applyFilters = (term: string, artist: string, order: 'asc' | 'desc') => {
    let result = [...tracks]

    if (term.trim()) {
      const q = term.toLowerCase()
      result = result.filter(
        t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      )
    }

    if (artist !== 'ALL') {
      result = result.filter(t => t.artist === artist)
    }

    result.sort((a, b) => (order === 'asc' ? a.start_time - b.start_time : b.start_time - a.start_time))

    onFilterChange(result)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchTerm(val)
    applyFilters(val, selectedArtist, sortOrder)
  }

  const handleArtistSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedArtist(val)
    applyFilters(searchTerm, val, sortOrder)
  }

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
    setSortOrder(newOrder)
    applyFilters(searchTerm, selectedArtist, newOrder)
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#13131a] border border-[#1e1e2e]">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by song title or artist..."
          className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder-[#64748b] focus:outline-none focus:border-[#7c3aed] transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <select
            value={selectedArtist}
            onChange={handleArtistSelect}
            className="text-xs sm:text-sm px-3 py-1.5 pr-8 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] text-[#cbd5e1] focus:outline-none focus:border-[#7c3aed] transition-colors appearance-none cursor-pointer"
          >
            <option value="ALL">All Artists ({tracks.length})</option>
            {artists.map(art => (
              <option key={art} value={art}>
                {art}
              </option>
            ))}
          </select>
          <SlidersHorizontal className="absolute right-2.5 w-3.5 h-3.5 text-[#64748b] pointer-events-none" />
        </div>

        <button
          onClick={toggleSort}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0a0f] hover:bg-[#1e1e2e] border border-[#1e1e2e] text-xs sm:text-sm text-[#cbd5e1] transition-colors"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#a855f7]" />
          <span>{sortOrder === 'asc' ? 'Early First' : 'Late First'}</span>
        </button>
      </div>
    </div>
  )
}
