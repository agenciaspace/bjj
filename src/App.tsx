import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CheckInPage } from './pages/CheckInPage';
import { TimerPage } from './pages/TimerPage';
import { TrainingsPage } from './pages/TrainingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import AcademyPage from './pages/AcademyPage';
import { AuthPage } from './pages/AuthPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { BottomNav } from './components/BottomNav';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminGuard } from './components/AdminGuard';

import { useSupabaseSync } from './hooks/useSupabaseSync';

function AppContent() {
  useSupabaseSync();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/check-in" element={
            <ProtectedRoute>
              <CheckInPage />
            </ProtectedRoute>
          } />
          <Route path="/timer" element={
            <ProtectedRoute>
              <TimerPage />
            </ProtectedRoute>
          } />
          <Route path="/trainings" element={
            <ProtectedRoute>
              <TrainingsPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminGuard>
                <AdminPage />
              </AdminGuard>
            </ProtectedRoute>
          } />
          <Route path="/academy/:id" element={
            <ProtectedRoute>
              <AcademyPage />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </AnimatePresence>
      {!isAuthPage && <BottomNav />}
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
