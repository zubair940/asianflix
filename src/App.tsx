import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { PlayerProvider } from './context/PlayerContext.js';

import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { ToastNotifications } from './components/common/ToastNotifications.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';
import { AdminRoute } from './components/admin/AdminRoute.js';

import { Home } from './pages/Home.js';
import { DramaPage } from './pages/DramaPage.js';
import { WatchPage } from './pages/WatchPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AdminPage } from './pages/AdminPage.js';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <PlayerProvider>
              <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col selection:bg-[#00c2ff] selection:text-black font-sans">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Mandatory Login Protected User Routes */}
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/drama/:id"
                      element={
                        <ProtectedRoute>
                          <DramaPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/watch/:dramaId/:episodeId"
                      element={
                        <ProtectedRoute>
                          <WatchPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <ProtectedRoute>
                          <SearchPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/watchlist"
                      element={
                        <ProtectedRoute>
                          <ProfilePage defaultTab="watchlist" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute>
                          <ProfilePage defaultTab="history" />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminPage />
                        </AdminRoute>
                      }
                    />
                    <Route
                      path="/admin/episodes"
                      element={
                        <AdminRoute>
                          <AdminPage initialTab="episodes" />
                        </AdminRoute>
                      }
                    />

                    {/* Fallback redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
                <ToastNotifications />
              </div>
            </PlayerProvider>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
