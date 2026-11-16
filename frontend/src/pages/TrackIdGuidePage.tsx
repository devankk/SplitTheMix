import React from 'react'
import { BookOpen, Disc, Sliders, Waves, Activity, AlertCircle, CheckCircle } from 'lucide-react'

export const TrackIdGuidePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="space-y-3 border-b border-[#292929] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#141414] border border-[#292929] text-[#E32636] text-[11px] font-mono tracking-wider uppercase">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Acoustic Engineering Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F1ED]">
          The DJ Track Identification Guide
        </h1>
        <p className="text-sm text-[#929292] leading-relaxed">
          Understanding acoustic fingerprinting, transition crossfades, harmonic key detection, and how SplitTheMix isolates songs in continuous DJ recordings.
        </p>
      </div>

      {/* Guide Content Sections */}
      <div className="space-y-10">
        {/* Section 1 */}
        <section className="space-y-4 rounded-lg bg-[#141414] border border-[#292929] p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636]">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono text-[#E32636] uppercase tracking-wider">Chapter 01</span>
              <h2 className="text-lg font-bold text-[#F4F1ED]">How Acoustic Fingerprinting Works</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#929292] leading-relaxed">
            Standard music recognition tools (like phone apps) work well in quiet environments for commercial radio tracks. In contrast, DJ sets are continuous audio streams with seamless 64-bar transitions, heavy low-end EQ cuts, filter sweeps, and pitch adjustments (tempo nudging).
          </p>
          <div className="p-4 rounded bg-[#090909] border border-[#292929] text-xs font-mono text-[#F4F1ED] space-y-2">
            <div className="text-[#E32636] font-semibold">// The Chunking Technique:</div>
            <p className="text-[#929292]">
              SplitTheMix extracts 12-second acoustic signature windows sampled every 50 seconds with overlapping stride boundaries. By skipping intro fade-ins and analyzing multiple parallel points, it captures pure drops and vocal hooks even when the DJ is actively crossfading.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-4 rounded-lg bg-[#141414] border border-[#292929] p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono text-[#E32636] uppercase tracking-wider">Chapter 02</span>
              <h2 className="text-lg font-bold text-[#F4F1ED]">Handling Transitions & Crossfades</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#929292] leading-relaxed">
            When two songs play simultaneously during a 90-second transition, recognition engines can occasionally return both songs at adjacent timestamps. SplitTheMix uses a multi-tier deduplication algorithm with fuzzy title normalization:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded bg-[#090909] border border-[#292929] space-y-1.5">
              <span className="font-mono text-[#22c55e] font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> 3-Minute Merge Window
              </span>
              <p className="text-[#929292]">Repeated detections of the same song within 180 seconds are automatically combined to preserve the true earliest start time.</p>
            </div>
            <div className="p-3.5 rounded bg-[#090909] border border-[#292929] space-y-1.5">
              <span className="font-mono text-[#f59e0b] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Dead Gap Analysis
              </span>
              <p className="text-[#929292]">Only unverified stretches exceeding 2.5 minutes are marked as &quot;Unknown Track&quot; so your tracklist stays clean and uncluttered.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4 rounded-lg bg-[#141414] border border-[#292929] p-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-mono text-[#E32636] uppercase tracking-wider">Chapter 03</span>
              <h2 className="text-lg font-bold text-[#F4F1ED]">Harmonic Key & BPM Precision</h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#929292] leading-relaxed">
            Unlike simple hash calculators, SplitTheMix resolves exact BPM and standard musical scales (e.g. 132 BPM, B♭ Minor) through verified musical databases and pure acoustic beat envelope autocorrelation.
          </p>
          <p className="text-xs text-[#929292] leading-relaxed">
            DJs can use these scale notations to understand the set's harmonic flow and Camelot wheel progression from the warm-up to peak-time energy.
          </p>
        </section>
      </div>
    </div>
  )
}
