import React from 'react'
import { Link } from 'react-router-dom'
import { Disc3, History, Moon, Sun, Sparkles } from 'lucide-react'

interface NavbarProps {
  isDark: boolean
  toggleTheme: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ isDark, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0a0a0f]/80 border-b border-[#1e1e2e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#ec4899] p-0.5 shadow-lg shadow-[#7c3aed]/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[10px] flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-[#a855f7] group-hover:rotate-180 transition-transform duration-700" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              SplitTheMix
            </span>
            <span className="text-[10px] text-[#64748b] tracking-wider font-medium">DJ SET IDENTIFIER</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/history"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-[#13131a] border border-transparent hover:border-[#1e1e2e] transition-all"
          >
            <History className="w-4 h-4 text-[#a855f7]" />
            <span>History</span>
          </Link>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-[#94a3b8] hover:text-white hover:bg-[#13131a] border border-[#1e1e2e] transition-all"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  )
}
