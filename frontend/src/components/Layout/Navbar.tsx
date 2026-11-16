import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Disc3, History, Menu, X, Radio, BookOpen, Layers, HelpCircle, Compass } from 'lucide-react'

interface NavbarProps {
  isDark?: boolean
  toggleTheme?: () => void
}

export const Navbar: React.FC<NavbarProps> = () => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Discover', path: '/discover' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Track ID Guide', path: '/guide' },
    { label: 'FAQ', path: '/faq' },
    { label: 'My Library', path: '/library' },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && (location.pathname.startsWith(path) || (path === '/library' && location.pathname === '/history'))) return true
    return false
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090909]/95 backdrop-blur-md border-b border-[#292929]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-[#141414] border border-[#292929] flex items-center justify-center group-hover:border-[#E32636] transition-colors duration-180">
            <span className="w-2 h-2 rounded-full bg-[#E32636] shadow-[0_0_8px_#E32636]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#F4F1ED] font-mono group-hover:text-white transition-colors">
              SPLITTHEMIX
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#929292] uppercase">
              Studio Console
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#141414] text-[#E32636] border border-[#292929]'
                    : 'text-[#929292] hover:text-[#F4F1ED] hover:bg-[#141414]/50'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Action / Mobile Toggle */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#E32636] hover:bg-[#f03a4b] text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors shadow-console-sm"
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Analyse Mix</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded bg-[#141414] border border-[#292929] text-[#929292] hover:text-[#F4F1ED] transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#292929] bg-[#141414] px-4 py-3 space-y-1 animate-in fade-in duration-150">
          {navItems.map(item => {
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded text-xs font-mono transition-colors ${
                  active
                    ? 'bg-[#202020] text-[#E32636] font-semibold border border-[#292929]'
                    : 'text-[#929292] hover:text-[#F4F1ED]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
