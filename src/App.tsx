import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { PlayerProvider } from './context/PlayerContext.js';

import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { ToastNotifications } from './components/common/ToastNotifications.js';
import { ProtectedRoute } from './components/common/ProtectedRoute.js';
import { AdminRoute } from './components/admin/AdminRoute.js';
import { LoadingSpinner } from './components/common/LoadingSpinner.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { queryClient } from './services/api.js';
import { lazyWithRetry } from './components/common/LazyWithRetry.js';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const DramaPage = lazy(() => import('./pages/DramaPage').then(m => ({ default: m.DramaPage })));
const WatchPage = lazyWithRetry(() => import('./pages/WatchPage').then(m => ({ default: m.WatchPage })), { maxRetries: 3, retryDelay: 1000 });
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));

const PageSkeleton = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <LoadingSpinner label="Loading..." />
  </div>
);

const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>
    <ErrorBoundary>{children}</ErrorBoundary>
  </Suspense>
);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              <PlayerProvider>
                <ErrorBoundary>
                  <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-gray-950">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      {/* Public Routes - No Suspense needed for instant load */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />

                      {/* Protected User Routes */}
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><Home /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/drama/:id"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><DramaPage /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/watch/:dramaId/:episodeId"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><WatchPage /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/search"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><SearchPage /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/watchlist"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><ProfilePage defaultTab="watchlist" /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/history"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><ProfilePage defaultTab="history" /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><ProfilePage /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <ProtectedRoute>
                            <LazyWrapper><ProfilePage defaultTab="settings" /></LazyWrapper>
                          </ProtectedRoute>
                        }
                      />

                      {/* Protected Admin Routes */}
                      <Route
                        path="/admin"
                        element={
                          <AdminRoute>
                            <LazyWrapper><AdminPage /></LazyWrapper>
                          </AdminRoute>
                        }
                      />
                      <Route
                        path="/admin/episodes"
                        element={
                          <AdminRoute>
                            <LazyWrapper><AdminPage initialTab="episodes" /></LazyWrapper>
                          </AdminRoute>
                        }
                      />

                      {/* Fallback */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <Footer />
                  <ToastNotifications />
                  </div>
                </ErrorBoundary>
              </PlayerProvider>
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;