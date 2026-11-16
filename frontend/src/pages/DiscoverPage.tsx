import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Disc3, Clock, User, ArrowUpRight, Radio } from 'lucide-react'

interface CuratedSet {
  id: string
  title: string
  dj: string
  venue: string
  duration: string
  genre: string
  thumbnail: string
  url: string
  trackCount: number
}

export const DiscoverPage: React.FC = () => {
  const navigate = useNavigate()

  const curatedSets: CuratedSet[] = [
    {
      id: 'cercle-boris',
      title: 'Grand Palais Live Concert',
      dj: 'Boris Brejcha',
      venue: 'Cercle, Paris',
      duration: '1h 35m',
      genre: 'High-Tech Minimal',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
      url: 'https://www.youtube.com/watch?v=vqz8c4CF3OA',
      trackCount: 19
    },
    {
      id: 'boiler-fred',
      title: 'Boiler Room London Set',
      dj: 'Fred again..',
      venue: 'Boiler Room, London',
      duration: '1h 11m',
      genre: 'UK Garage / House',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      url: 'https://www.youtube.com/watch?v=c0-hvjV2A5Y',
      trackCount: 28
    },
    {
      id: 'printworks-tale',
      title: 'Afterlife Printworks Closing',
      dj: 'Tale of Us',
      venue: 'Printworks, London',
      duration: '2h 04m',
      genre: 'Melodic Techno',
      thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
      url: 'https://www.youtube.com/watch?v=Ifu6TZnytlU',
      trackCount: 24
    },
    {
      id: 'defected-croatia',
      title: 'Defected Croatia Main Stage',
      dj: 'Sam Divine',
      venue: 'The Garden Tisno',
      duration: '1h 45m',
      genre: 'Deep & Vocal House',
      thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
      url: 'https://www.youtube.com/watch?v=KgYAtqhdGsk',
      trackCount: 22
    }
  ]

  const handleSelectSet = (set: CuratedSet) => {
    // Navigate to homepage with pre-filled mix url
    navigate('/', { state: { prefillUrl: set.url, title: set.title } })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Page Header */}
      <div className="space-y-3 border-b border-[#292929] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#141414] border border-[#292929] text-[#E32636] text-[11px] font-mono tracking-wider uppercase">
          <Radio className="w-3.5 h-3.5" />
          <span>Curated DJ Mix Vault</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F1ED]">
          Discover Iconic Mixes & Tracklists
        </h1>
        <p className="text-sm text-[#929292] max-w-2xl leading-relaxed">
          Explore benchmark live sets, festival recordings, and club sessions. Load any set directly into the Studio Console to inspect its complete acoustic tracklist.
        </p>
      </div>

      {/* Grid of Curated Sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {curatedSets.map(set => (
          <div
            key={set.id}
            onClick={() => handleSelectSet(set)}
            className="group relative flex flex-col justify-between rounded-lg bg-[#141414] border border-[#292929] hover:border-[#E32636] p-4 transition-all duration-180 cursor-pointer shadow-console-sm hover:shadow-console-md"
          >
            <div className="space-y-4">
              {/* Media Thumbnail Container */}
              <div className="relative aspect-video w-full rounded overflow-hidden bg-[#202020] border border-[#292929]">
                <img
                  src={set.thumbnail}
                  alt={set.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#090909]/90 border border-[#292929] text-[11px] font-mono text-[#F4F1ED]">
                  {set.genre}
                </div>
                <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#090909]/90 border border-[#292929] text-[11px] font-mono text-[#929292]">
                  <Clock className="w-3 h-3 text-[#E32636]" />
                  <span>{set.duration}</span>
                </div>
                {/* Play Button Indicator */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-180">
                  <div className="w-12 h-12 rounded-full bg-[#E32636] text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </div>
              </div>

              {/* Mix Meta */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#E32636] uppercase tracking-wider">{set.venue}</span>
                  <span className="text-xs font-mono text-[#929292]">{set.trackCount} Tracks Identified</span>
                </div>
                <h3 className="text-base font-semibold text-[#F4F1ED] group-hover:text-white transition-colors">
                  {set.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-[#929292]">
                  <User className="w-3.5 h-3.5 text-[#5c5c5c]" />
                  <span>{set.dj}</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Strip */}
            <div className="mt-4 pt-3 border-t border-[#292929] flex items-center justify-between text-xs font-medium text-[#929292] group-hover:text-[#F4F1ED] transition-colors">
              <span className="font-mono text-[11px]">Load into Studio Console</span>
              <ArrowUpRight className="w-4 h-4 text-[#E32636] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
