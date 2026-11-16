import React from 'react'
import { Link } from 'react-router-dom'
import { Check, Zap, Layers, Server, Shield } from 'lucide-react'

export const PricingPage: React.FC = () => {
  const tiers = [
    {
      name: 'Hobbyist Console',
      price: '$0',
      period: 'forever free',
      desc: 'Ideal for music fans, track collectors, and occasional DJ mix analysis.',
      popular: false,
      features: [
        'Analyse YouTube, SoundCloud, and Mixcloud sets',
        'Overlapping chunk fingerprinting',
        'Automatic BPM and Musical Key detection',
        'Direct streaming links (Spotify, Apple Music, YT)',
        'In-place video synchronized playback',
        'TXT and CSV tracklist export',
        'Local analysis history'
      ],
      cta: 'Start Free Analysis',
      link: '/'
    },
    {
      name: 'Pro DJ',
      price: '$14',
      period: 'per month',
      desc: 'Engineered for active DJs, playlist curators, and residency performers.',
      popular: true,
      features: [
        'All Hobbyist Console capabilities',
        'Dedicated priority cloud fingerprinting queue',
        'Unlimited set duration (up to 4-hour live recordings)',
        'Enhanced transition & crossfade window analysis',
        'JSON and Rekordbox / Traktor NML tracklist format',
        'Full cloud library sync across workstations',
        'Priority support from audio engineers'
      ],
      cta: 'Activate Pro Studio',
      link: '/'
    },
    {
      name: 'Studio & Label',
      price: '$49',
      period: 'per month',
      desc: 'For music labels, festival organizers, rights managers, and radio stations.',
      popular: false,
      features: [
        'All Pro DJ studio features',
        'REST API access for automated set ingestion',
        'Bulk batch mix analysis (up to 20 sets at once)',
        'Custom audio stem & cue sheet generation',
        'Dedicated ACRCloud & Shazam pipeline quotas',
        'Team access and shared studio libraries',
        '99.9% uptime SLA and enterprise billing'
      ],
      cta: 'Contact Studio Sales',
      link: '/'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#141414] border border-[#292929] text-[#E32636] text-[11px] font-mono tracking-wider uppercase">
          <Layers className="w-3.5 h-3.5" />
          <span>Transparent Studio Plans</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F1ED]">
          Studio-Grade Precision for Every DJ
        </h1>
        <p className="text-sm text-[#929292] leading-relaxed">
          No hidden fees or artificial restrictions. Choose the plan that fits your mixing and track-hunting workflow.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map(tier => (
          <div
            key={tier.name}
            className={`relative flex flex-col justify-between rounded-lg p-6 bg-[#141414] border transition-all duration-180 shadow-console-sm ${
              tier.popular
                ? 'border-[#E32636] shadow-console-glow'
                : 'border-[#292929] hover:border-[#8D1422]'
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#E32636] text-white text-[10px] font-mono uppercase tracking-wider font-semibold shadow-sm">
                Most Popular
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#F4F1ED]">{tier.name}</h3>
                <p className="text-xs text-[#929292] leading-relaxed min-h-[36px]">{tier.desc}</p>
              </div>

              <div className="flex items-baseline gap-1.5 border-b border-[#292929] pb-5">
                <span className="text-3xl sm:text-4xl font-mono font-bold text-[#F4F1ED]">{tier.price}</span>
                <span className="text-xs text-[#929292] font-mono">/ {tier.period}</span>
              </div>

              {/* Features list */}
              <ul className="space-y-2.5 text-xs text-[#F4F1ED]">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                    <span className="text-[#929292] leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-[#292929]">
              <Link
                to={tier.link}
                className={`w-full py-2.5 rounded font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 ${
                  tier.popular
                    ? 'bg-[#E32636] hover:bg-[#f03a4b] text-white shadow-md'
                    : 'bg-[#202020] hover:bg-[#292929] text-[#F4F1ED] border border-[#292929]'
                }`}
              >
                <span>{tier.cta}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Studio Infrastructure Note */}
      <div className="rounded-lg bg-[#141414] border border-[#292929] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-[#202020] border border-[#292929] flex items-center justify-center text-[#E32636] shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-[#F4F1ED]">Need Custom Enterprise Quotas or API Integration?</h4>
            <p className="text-xs text-[#929292]">We support dedicated on-premise audio indexing engines for high-volume radio and festival archives.</p>
          </div>
        </div>
        <Link
          to="/"
          className="px-4 py-2 rounded bg-[#202020] hover:bg-[#292929] border border-[#292929] text-xs font-mono text-[#F4F1ED] whitespace-nowrap transition-colors"
        >
          Inquire Studio API
        </Link>
      </div>
    </div>
  )
}
