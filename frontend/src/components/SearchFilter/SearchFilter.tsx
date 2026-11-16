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
        t => t.title.toLowerCase().includes(q) || (t.artist && t.artist.toLowerCase().includes(q))
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#141414] border border-[#292929]">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Filter by track title or artist..."
          className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] placeholder-[#5c5c5c] focus:outline-none focus:border-[#E32636] transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <select
            value={selectedArtist}
            onChange={handleArtistSelect}
            className="text-xs font-mono px-3 py-1.5 pr-8 rounded bg-[#090909] border border-[#292929] text-[#F4F1ED] focus:outline-none focus:border-[#E32636] transition-colors appearance-none cursor-pointer"
          >
            <option value="ALL">All Artists ({tracks.length})</option>
            {artists.map(art => (
              <option key={art} value={art}>
                {art}
              </option>
            ))}
          </select>
          <SlidersHorizontal className="absolute right-2.5 w-3.5 h-3.5 text-[#5c5c5c] pointer-events-none" />
        </div>

        <button
          onClick={toggleSort}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#090909] hover:bg-[#202020] border border-[#292929] text-xs font-mono text-[#F4F1ED] transition-colors cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-[#E32636]" />
          <span>{sortOrder === 'asc' ? '00:00 ↑' : 'Latest ↓'}</span>
        </button>
      </div>
    </div>
  )
}
