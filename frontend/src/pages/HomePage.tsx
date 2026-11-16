import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Disc3, Search, AlertCircle, ArrowRight, Layers, Sliders, CheckCircle, Clock, Music, ArrowUpRight, Shield, Radio, Volume2 } from 'lucide-react'
import { analyzeUrl } from '../api/client'
import { validateMediaUrl } from '../utils/format'

export const HomePage: React.FC = () => {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Support pre-filled URL passed from Discover page or presets
  useEffect(() => {
    if (location.state && (location.state as any).prefillUrl) {
      setUrl((location.state as any).prefillUrl)
    }
  }, [location.state])

  const samplePresets = [
    { title: 'Cercle: Boris Brejcha', url: 'https://www.youtube.com/watch?v=vqz8c4CF3OA' },
    { title: 'Boiler Room: Fred again..', url: 'https://www.youtube.com/watch?v=c0-hvjV2A5Y' },
    { title: 'Printworks: Tale of Us', url: 'https://www.youtube.com/watch?v=Ifu6TZnytlU' }
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
    <div className="flex flex-col items-center w-full min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-4 sm:px-6 pt-16 pb-12 flex flex-col items-center text-center space-y-6">
        {/* Studio Console Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#141414] border border-[#292929] text-[#E32636] text-xs font-mono tracking-wider uppercase shadow-console-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E32636] animate-pulse" />
          <span>Your DJ mix analysis studio</span>
        </div>

        {/* Primary Headline */}
        <div className="space-y-3 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white leading-tight">
            One mix. Every track.
          </h1>
          <p className="text-base sm:text-lg font-sans text-[#D1D5DB] max-w-2xl mx-auto leading-relaxed">
            Discover every song hidden inside your favourite DJ sets. Automatically identified, timestamped and organised with <strong className="text-white font-semibold">precision acoustic fingerprinting</strong>.
          </p>
        </div>

        {/* Primary Mix Input Console */}
        <div className="w-full max-w-2xl mt-4">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-lg bg-[#141414] border border-[#292929] focus-within:border-[#E32636] transition-colors duration-180 shadow-console-md">
              <div className="relative flex-1 w-full flex items-center pl-3">
                <Search className="w-4 h-4 text-[#929292] shrink-0" />
                <input
                  type="text"
                  value={url}
                  onChange={e => {
                    setUrl(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Paste YouTube, SoundCloud, or Mixcloud mix URL..."
                  className="w-full px-3 py-2.5 bg-transparent text-sm text-[#F4F1ED] placeholder-[#5c5c5c] font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded bg-[#E32636] hover:bg-[#f03a4b] text-white font-mono font-semibold text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Disc3 className="w-4 h-4 animate-spin" />
                    <span>Processing Set...</span>
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
            <div className="flex items-center gap-2 p-3 mt-3 rounded bg-[#141414] border border-[#E32636]/40 text-[#E32636] text-xs font-mono text-left animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-mono text-[#929292]">
            <span className="text-[#5c5c5c]">Quick load presets:</span>
            {samplePresets.map(preset => (
              <button
                key={preset.url}
                onClick={() => {
                  setUrl(preset.url)
                  setError(null)
                }}
                className="px-2.5 py-1 rounded bg-[#141414] hover:bg-[#202020] border border-[#292929] hover:border-[#8D1422] text-[#929292] hover:text-[#F4F1ED] transition-colors cursor-pointer"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Waveform Graphic */}
        <div className="w-full max-w-3xl pt-8 pb-4">
          <div className="w-full p-4 rounded-lg bg-[#141414] border border-[#292929] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#5c5c5c]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E32636]" />
                <span className="text-[#929292]">ACOUSTIC RACK MONITOR</span>
              </div>
              <span>CHROMA SPECTRUM &bull; 44.1 kHz</span>
            </div>
            {/* Simulated Audio Spectrum Waveform Bars */}
            <div className="flex items-end justify-between h-14 gap-1 px-1 overflow-hidden">
              {[
                20, 35, 60, 45, 80, 55, 90, 75, 40, 65, 85, 100, 70, 95, 60, 40,
                75, 90, 80, 50, 65, 85, 40, 70, 95, 60, 80, 100, 55, 75, 90, 65,
                40, 85, 60, 75, 95, 50, 70, 90, 60, 80, 100, 75, 55, 40, 65, 85,
                50, 70, 95, 80, 60, 40, 75, 90, 65, 50, 85, 100, 70, 55, 40, 60
              ].map((height, i) => (
                <div
                  key={i}
                  style={{ height: `${height}%` }}
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    i >= 20 && i <= 36
                      ? 'bg-[#E32636]'
                      : i % 4 === 0
                      ? 'bg-[#292929]'
                      : 'bg-[#202020]'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#5c5c5c] pt-1">
              <span>00:00:00</span>
              <span className="text-[#E32636]">ACTIVE TRANSITION REGION</span>
              <span>01:45:00</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Clear Steps) */}
      <section className="w-full max-w-5xl px-4 sm:px-6 py-12 border-t border-[#1f1f1f]">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-mono text-[#E32636] uppercase tracking-wider">Operational Sequence</span>
          <h2 className="text-2xl font-bold text-[#F4F1ED]">How SplitTheMix Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg bg-[#141414] border border-[#292929] p-6 space-y-3">
            <span className="font-mono text-xs font-bold text-[#E32636]">01 — INGESTION</span>
            <h3 className="text-base font-semibold text-[#F4F1ED]">Paste your mix</h3>
            <p className="text-xs text-[#929292] leading-relaxed">
              Submit any YouTube live set, SoundCloud show, or Mixcloud session. The engine retrieves metadata and audio streams non-destructively.
            </p>
          </div>

          <div className="rounded-lg bg-[#141414] border border-[#292929] p-6 space-y-3">
            <span className="font-mono text-xs font-bold text-[#E32636]">02 — ACOUSTICS</span>
            <h3 className="text-base font-semibold text-[#F4F1ED]">Analyse the audio</h3>
            <p className="text-xs text-[#929292] leading-relaxed">
              The mix is split into overlapping 12-second acoustic signature windows. Parallel fingerprint recognition scans each transition point.
            </p>
          </div>

          <div className="rounded-lg bg-[#141414] border border-[#292929] p-6 space-y-3">
            <span className="font-mono text-xs font-bold text-[#E32636]">03 — RESOLUTION</span>
            <h3 className="text-base font-semibold text-[#F4F1ED]">Discover the tracks</h3>
            <p className="text-xs text-[#929292] leading-relaxed">
              Deduplicated chronological tracklist with precise timestamps, exact BPM, musical key, official artwork, and streaming links.
            </p>
          </div>
        </div>
      </section>

      {/* Key Implemented Capabilities */}
      <section className="w-full max-w-5xl px-4 sm:px-6 py-12 border-t border-[#1f1f1f]">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-mono text-[#E32636] uppercase tracking-wider">Engine Capabilities</span>
          <h2 className="text-2xl font-bold text-[#F4F1ED]">Built for Audio Precision</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 rounded-lg bg-[#141414] border border-[#292929] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F4F1ED]">
              <Clock className="w-4 h-4 text-[#E32636]" />
              <span className="font-semibold">Full-Length Sets</span>
            </div>
            <p className="text-xs text-[#929292] leading-relaxed">
              Process mixes from 20 minutes to 3+ hours without audio compression or quality loss.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#141414] border border-[#292929] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F4F1ED]">
              <Sliders className="w-4 h-4 text-[#E32636]" />
              <span className="font-semibold">BPM & Musical Key</span>
            </div>
            <p className="text-xs text-[#929292] leading-relaxed">
              True tempo autocorrelation and chroma STFT key detection for clean harmonic mixing.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#141414] border border-[#292929] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F4F1ED]">
              <Shield className="w-4 h-4 text-[#E32636]" />
              <span className="font-semibold">Original Artist Resolution</span>
            </div>
            <p className="text-xs text-[#929292] leading-relaxed">
              Automatically strips bootleggers and 3rd-party DJ names to recover true original creators.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#141414] border border-[#292929] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F4F1ED]">
              <Radio className="w-4 h-4 text-[#E32636]" />
              <span className="font-semibold">Unknown Track Handling</span>
            </div>
            <p className="text-xs text-[#929292] leading-relaxed">
              Unidentified VIP edits and dubplates are isolated with start/end timecodes for manual entry.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#141414] border border-[#292929] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F4F1ED]">
              <Layers className="w-4 h-4 text-[#E32636]" />
              <span className="font-semibold">Multi-Format Export</span>
            </div>
            <p className="text-xs text-[#929292] leading-relaxed">
              Export tracklists directly as Plain Text, CSV spreadsheets, or JSON for DJ software.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-[#141414] border border-[#292929] space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-[#F4F1ED]">
              <Volume2 className="w-4 h-4 text-[#E32636]" />
              <span className="font-semibold">Zero-Jump Playback</span>
            </div>
            <p className="text-xs text-[#929292] leading-relaxed">
              Click any timestamp to seek video playback in-place without page jumping or losing scroll.
            </p>
          </div>
        </div>
      </section>

      {/* Example Tracklist Demonstration Console */}
      <section className="w-full max-w-5xl px-4 sm:px-6 py-12 border-t border-[#1f1f1f]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-mono text-[#E32636] uppercase tracking-wider">Live Preview</span>
            <h2 className="text-xl font-bold text-[#F4F1ED]">Studio Console Tracklist Output</h2>
          </div>
          <Link
            to="/discover"
            className="text-xs font-mono text-[#E32636] hover:underline flex items-center gap-1"
          >
            <span>Explore Curated Vault</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Console Demo Table */}
        <div className="w-full rounded-lg bg-[#141414] border border-[#292929] overflow-hidden shadow-console-sm">
          <div className="p-3 bg-[#090909] border-b border-[#292929] flex items-center justify-between text-xs font-mono text-[#929292]">
            <span>EXAMPLE: FRED AGAIN.. LIVE AT BOILER ROOM LONDON</span>
            <span className="text-[#E32636]">100% ACOUSTIC RECOVERY</span>
          </div>
          <div className="divide-y divide-[#202020] text-xs font-mono">
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181818] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[#6B7280] w-6">#01</span>
                <div>
                  <span className="font-display font-bold text-sm text-white">Kammy (like i do)</span>
                  <span className="font-sans text-xs text-[#D1D5DB] ml-2">&bull; Fred again..</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[#E32636] font-bold">02:34 &ndash; 05:58</span>
                <span className="px-2 py-0.5 rounded bg-[#202020] border border-[#292929] text-white">132 BPM &bull; G Minor</span>
                <span className="px-2 py-0.5 rounded bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 text-[11px]">Spotify</span>
                <span className="px-2 py-0.5 rounded bg-[#FF0000]/10 text-[#FF4E4E] border border-[#FF0000]/30 text-[11px]">YouTube</span>
              </div>
            </div>
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181818] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[#6B7280] w-6">#02</span>
                <div>
                  <span className="font-display font-bold text-sm text-white">Danielle (smile on my face)</span>
                  <span className="font-sans text-xs text-[#D1D5DB] ml-2">&bull; Fred again..</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[#E32636] font-bold">07:20 &ndash; 08:00</span>
                <span className="px-2 py-0.5 rounded bg-[#202020] border border-[#292929] text-white">130 BPM &bull; F Major</span>
                <span className="px-2 py-0.5 rounded bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 text-[11px]">Spotify</span>
                <span className="px-2 py-0.5 rounded bg-[#FF0000]/10 text-[#FF4E4E] border border-[#FF0000]/30 text-[11px]">YouTube</span>
              </div>
            </div>
            <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181818] transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-[#6B7280] w-6">#03</span>
                <div>
                  <span className="font-display font-bold text-sm text-white">Tanya (maybe life)</span>
                  <span className="font-sans text-xs text-[#D1D5DB] ml-2">&bull; Fred again..</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[#E32636] font-bold">10:01 &ndash; 11:20</span>
                <span className="px-2 py-0.5 rounded bg-[#202020] border border-[#292929] text-white">128 BPM &bull; F Major</span>
                <span className="px-2 py-0.5 rounded bg-[#1DB954]/10 text-[#1DB954] border border-[#1DB954]/30 text-[11px]">Spotify</span>
                <span className="px-2 py-0.5 rounded bg-[#FF0000]/10 text-[#FF4E4E] border border-[#FF0000]/30 text-[11px]">YouTube</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
