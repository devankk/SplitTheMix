import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Disc3, Search, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Clock, Layers, Zap } from 'lucide-react'
import { analyzeUrl } from '../api/client'
import { validateMediaUrl } from '../utils/format'

export const HomePage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const sampleUrls = [
    { title: 'Cercle: Boris Brejcha Grand Palais', url: 'https://www.youtube.com/watch?v=vqz8c4CF3OA' },
    { title: 'Boiler Room: Fred again.. London', url: 'https://www.youtube.com/watch?v=c0-hvjV2A5Y' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Please paste a valid YouTube, SoundCloud, or Mixcloud link.')
      return
    }

    const { valid } = validateMediaUrl(url)
    if (!valid) {
      setError('Invalid link. Please paste a supported YouTube, SoundCloud, or Mixcloud mix URL.')
      return
    }

    try {
      setIsLoading(true)
      const job = await analyzeUrl(url.trim())
      navigate(`/analysis/${job.id}`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to submit URL for analysis.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7c3aed]/10 border border-[#7c3aed]/30 text-[#a855f7] text-xs font-semibold mb-2 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Audio Recognition Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Discover Every Track Inside <br />
          <span className="gradient-text">Any DJ Mix</span>
        </h1>

        <p className="text-sm sm:text-base text-[#94a3b8] max-w-xl mx-auto leading-relaxed">
          Paste any YouTube, SoundCloud, or Mixcloud DJ set, festival live recording, or continuous music compilation.
          Our chunk-based acoustic engine fingerprints each transition and recovers the exact chronological tracklist.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="w-full max-w-2xl mt-8">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-[#13131a] border border-[#1e1e2e] shadow-2xl focus-within:border-[#7c3aed]/60 transition-all">
            <div className="relative flex-1 w-full flex items-center pl-3">
              <Search className="w-5 h-5 text-[#64748b] shrink-0" />
              <input
                type="text"
                value={url}
                onChange={e => {
                  setUrl(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Paste YouTube, SoundCloud, or Mixcloud mix URL..."
                className="w-full px-3 py-3 bg-transparent text-sm text-white placeholder-[#64748b] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] hover:opacity-95 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Disc3 className="w-4 h-4 animate-spin" />
                  <span>Analysing...</span>
                </>
              ) : (
                <>
                  <span>Analyse Mix</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="flex items-center gap-2 p-3 mt-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-[#64748b]">
          <span>Try popular example:</span>
          {sampleUrls.map(sample => (
            <button
              key={sample.url}
              onClick={() => {
                setUrl(sample.url)
                setError(null)
              }}
              className="px-2.5 py-1 rounded-lg bg-[#13131a] hover:bg-[#1e1e2e] border border-[#1e1e2e] text-[#94a3b8] hover:text-white transition-colors"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mt-16 w-full">
        <div className="p-5 rounded-2xl bg-[#13131a]/60 border border-[#1e1e2e] text-left">
          <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/10 text-[#a855f7] flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm">Full Duration Scan</h3>
          <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
            Analyses the full 1 to 3+ hour recording chunk-by-chunk without cutting off after introductory minutes.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#13131a]/60 border border-[#1e1e2e] text-left">
          <div className="w-9 h-9 rounded-xl bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm">Transition Handling</h3>
          <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
            Identifies overlapping crossfades, mashups, and beatmatched tracks with boundary overlap safety.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#13131a]/60 border border-[#1e1e2e] text-left">
          <div className="w-9 h-9 rounded-xl bg-[#22c55e]/10 text-[#22c55e] flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm">Interactive Timestamps</h3>
          <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
            Jump straight into the YouTube mix at the precise second a track drops with 1-click seeking.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#13131a]/60 border border-[#1e1e2e] text-left">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm">Zero Hallucinations</h3>
          <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
            Prioritizes acoustic confirmation. Unidentified gaps are transparently marked as Unknown.
          </p>
        </div>
      </div>
    </div>
  )
}
