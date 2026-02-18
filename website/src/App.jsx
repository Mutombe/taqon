import React from 'react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ScrollProgress, BackToTop } from './components/ScrollElements';
import { PrivacyModal, CookieModal, CookieConsent } from './components/Modals';
import PageLoader from './components/PageLoader';
import ChatWidget from './components/ChatWidget';

// Existing pages (eagerly loaded)
import Home from './pages/Home';
import About from './pages/About';
import Solutions from './pages/Solutions';
import Shop from './pages/Shop';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Packages from './pages/Packages';
import Careers from './pages/Careers';
import SolarSecrets from './pages/SolarSecrets';

// New pages (lazy loaded)
const SavingsCalculator = lazy(() => import('./pages/SavingsCalculator'));
const QuoteWizard = lazy(() => import('./pages/QuoteWizard'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const Financing = lazy(() => import('./pages/Financing'));
const Certifications = lazy(() => import('./pages/Certifications'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const EnergyHub = lazy(() => import('./pages/EnergyHub'));
const AreaLanding = lazy(() => import('./pages/AreaLanding'));
const SystemVisualizer = lazy(() => import('./pages/SystemVisualizer'));

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppContent() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <AnalyticsProvider>
      <ScrollToTop />
      <ScrollProgress />
      <Navbar />

      <main className="min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/solar-secrets" element={<SolarSecrets />} />
            {/* New routes */}
            <Route path="/calculator" element={<SavingsCalculator />} />
            <Route path="/quote" element={<QuoteWizard />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/financing" element={<Financing />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/learn" element={<EnergyHub />} />
            <Route path="/solar-installation/:city" element={<AreaLanding />} />
            <Route path="/visualizer" element={<SystemVisualizer />} />
          </Routes>
        </Suspense>
      </main>

      <Footer
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onOpenCookies={() => setCookiesOpen(true)}
      />

      <ChatWidget />
      <BackToTop />
      <CookieConsent onOpenCookies={() => setCookiesOpen(true)} />
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <CookieModal isOpen={cookiesOpen} onClose={() => setCookiesOpen(false)} />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === 'dark' ? '#1A1A1A' : '#FFFFFF',
            color: theme === 'dark' ? 'white' : '#1A1A1A',
            border: `1px solid ${theme === 'dark' ? 'rgba(242, 101, 34, 0.2)' : 'rgba(0,0,0,0.1)'}`,
          },
        }}
      />
    </AnalyticsProvider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
