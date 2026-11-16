import React, { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface FaqItem {
  q: string
  a: string
}

export const FaqPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const faqs: FaqItem[] = [
    {
      q: 'Which DJ mix URLs and platforms are supported?',
      a: 'SplitTheMix supports YouTube video links (full sets, live streams, premieres, and shorts), SoundCloud DJ recordings, and Mixcloud shows. You can paste standard URLs directly into the console.'
    },
    {
      q: 'Why are some songs marked as "Unknown Track"?',
      a: 'Electronic music sets frequently feature unreleased tracks, exclusive dubplates, live bootlegs, or white labels that do not exist yet in public commercial fingerprint catalogs (such as Apple Music, Spotify, or ACRCloud). SplitTheMix marks these stretches cleanly with their exact start and end timestamps so you can easily identify them manually or check the video section.'
    },
    {
      q: 'How long does a 2-hour DJ mix take to analyse?',
      a: 'Because SplitTheMix uses parallel asynchronous worker threads, a typical 1 to 2-hour DJ set is fully fingerprinted, merged, and resolved in approximately 45 to 90 seconds depending on network speed.'
    },
    {
      q: 'How does SplitTheMix handle original artists vs. DJ remixers?',
      a: 'Our canonical resolver automatically strips 3rd-party bootleg tags, DJ rip channels, and unauthorized mashup names to recover the true original songwriter and release (e.g. Dark Horse by Katy Perry, Trap Queen by Fetty Wap, Yeah! by Usher). All streaming links target the original official recordings.'
    },
    {
      q: 'Can I manually edit track titles, BPM, or add custom timestamps?',
      a: 'Yes. Every track in your results table has an Edit button allowing you to modify title, artist, BPM, musical key, and release year. You can also add custom timestamps anywhere along the mix duration.'
    },
    {
      q: 'How do I export my tracklist?',
      a: 'Click the Export button on any completed analysis to download your set as a formatted Plain Text (TXT) file with YouTube-ready timestamps, a structured Comma-Separated Values (CSV) spreadsheet, or raw JSON for DJ software.'
    }
  ]

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3 border-b border-[#292929] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#141414] border border-[#292929] text-[#E32636] text-[11px] font-mono tracking-wider uppercase">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Support & Frequently Asked Questions</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F1ED]">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-[#929292] leading-relaxed">
          Common questions about acoustic audio fingerprinting, mix analysis speed, and tracklist accuracy.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx
          return (
            <div
              key={idx}
              className="rounded-lg bg-[#141414] border border-[#292929] overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-[#F4F1ED] hover:text-white transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#E32636] shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#929292] shrink-0 ml-4" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-[#929292] leading-relaxed border-t border-[#202020]">
                  <p className="pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
