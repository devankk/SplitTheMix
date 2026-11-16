import React from 'react'
import { Link } from 'react-router-dom'
import { Disc3, Radio, Github } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#090909] border-t border-[#292929] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#E32636]" />
              <span className="font-mono text-sm font-bold text-[#F4F1ED]">SPLITTHEMIX</span>
            </div>
            <p className="text-xs text-[#929292] leading-relaxed">
              Studio-grade DJ mix tracklist identification engine. Acoustic chunk fingerprinting and harmonic key detection.
            </p>
            <div className="text-[11px] font-mono text-[#5c5c5c]">
              ENGINE BUILD &bull; v2.4 STUDIO CONSOLE
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Navigation</span>
            <ul className="space-y-1.5 text-xs font-mono text-[#929292]">
              <li>
                <Link to="/" className="hover:text-[#F4F1ED] transition-colors">Console Home</Link>
              </li>
              <li>
                <Link to="/discover" className="hover:text-[#F4F1ED] transition-colors">Curated Sets Vault</Link>
              </li>
              <li>
                <Link to="/library" className="hover:text-[#F4F1ED] transition-colors">My Library</Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#F4F1ED] transition-colors">Studio Pricing</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Resources</span>
            <ul className="space-y-1.5 text-xs font-mono text-[#929292]">
              <li>
                <Link to="/guide" className="hover:text-[#F4F1ED] transition-colors">Track ID Guide</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#F4F1ED] transition-colors">FAQ & Support</Link>
              </li>
              <li>
                <a
                  href="https://github.com/devankk/SplitTheMix"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#F4F1ED] transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3 h-3 text-[#E32636]" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Specifications */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#929292]">Acoustic Specs</span>
            <div className="p-3 rounded bg-[#141414] border border-[#292929] space-y-1 text-[11px] font-mono text-[#929292]">
              <div className="flex justify-between">
                <span>Sampling Window:</span>
                <span className="text-[#F4F1ED]">12s / 50s Stride</span>
              </div>
              <div className="flex justify-between">
                <span>Harmonic Key:</span>
                <span className="text-[#F4F1ED]">Chroma STFT</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo Detection:</span>
                <span className="text-[#F4F1ED]">Autocorrelation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#1f1f1f] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5c5c5c] font-mono">
          <span>&copy; {new Date().getFullYear()} SplitTheMix. Built for DJs and Electronic Music Fans.</span>
          <span>Non-destructive fingerprinting &bull; Zero audio tampering</span>
        </div>
      </div>
    </footer>
  )
}
