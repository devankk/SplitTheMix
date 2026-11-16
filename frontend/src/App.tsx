import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AnalysisPage } from './pages/AnalysisPage'
import { HistoryPage } from './pages/HistoryPage'
import { Navbar } from './components/Layout/Navbar'
import { Footer } from './components/Layout/Footer'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-[#f1f5f9] selection:bg-[#7c3aed] selection:text-white">
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/analysis/:jobId" element={<AnalysisPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
