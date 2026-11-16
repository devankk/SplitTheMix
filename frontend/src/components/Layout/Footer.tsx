import React from 'react'
import { Disc3, Heart, Code2 } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1e1e2e] bg-[#0a0a0f] py-8 text-[#64748b] text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <Disc3 className="w-4 h-4 text-[#a855f7]" />
          <span className="font-medium text-[#94a3b8]">SplitTheMix &copy; {new Date().getFullYear()}</span>
          <span>&middot;</span>
          <span>Automated DJ Mix Tracklist Identification</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span>ACRCloud &amp; AudD Audio Recognition Engine</span>
          <span>&middot;</span>
          <span>FFmpeg High-Resolution Chunking</span>
        </div>
      </div>
    </footer>
  )
}
