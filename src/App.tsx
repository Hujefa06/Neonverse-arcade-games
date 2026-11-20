import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ParticleBackground } from './components/ParticleBackground';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { PerfOverlay } from './components/PerfOverlay';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { GamePage } from './pages/GamePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="relative min-h-screen bg-[#07080F] text-slate-100 flex flex-col selection:bg-neon-cyan selection:text-black">
        {/* Subtle Ambient Particle Background */}
        <ParticleBackground />

        {/* Global Navigation Header */}
        <Header />

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryName" element={<CategoryPage />} />
            <Route path="/play/:id" element={<GamePage />} />
            <Route path="/game/:id" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Modals & Overlays */}
        <SearchModal />
        <AuthModal />
        <SettingsModal />
        <PerfOverlay />

        {/* Platform Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
