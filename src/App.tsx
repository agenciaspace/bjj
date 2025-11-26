import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CheckInPage } from './pages/CheckInPage';
import { TimerPage } from './pages/TimerPage';
import { TrainingsPage } from './pages/TrainingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { BottomNav } from './components/BottomNav';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

import { useSupabaseSync } from './hooks/useSupabaseSync';

function AppContent() {
  useSupabaseSync();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/check-in" element={<CheckInPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/trainings" element={<TrainingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth" element={<AuthPage />} />
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
