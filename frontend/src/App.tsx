import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AnalysisPage } from './pages/AnalysisPage'
import { HistoryPage } from './pages/HistoryPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { PricingPage } from './pages/PricingPage'
import { TrackIdGuidePage } from './pages/TrackIdGuidePage'
import { FaqPage } from './pages/FaqPage'
import { Navbar } from './components/Layout/Navbar'
import { Footer } from './components/Layout/Footer'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#090909] text-[#F4F1ED] font-sans selection:bg-[#E32636] selection:text-white">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/guide" element={<TrackIdGuidePage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/library" element={<HistoryPage />} />
            <Route path="/history" element={<Navigate to="/library" replace />} />
            <Route path="/analysis/:jobId" element={<AnalysisPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
