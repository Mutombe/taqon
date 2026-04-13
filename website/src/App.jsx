import React from 'react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { useTheme } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ScrollProgress, BackToTop } from './components/ScrollElements';
import { PrivacyModal, CookieModal, CookieConsent } from './components/Modals';
import AuthModal from './features/auth/components/AuthModal';
import PageLoader from './components/PageLoader';
import useAuthStore from './stores/authStore';
import { setAuthFailureHandler } from './api/axios';
import { prefetchRoute } from './lib/routePrefetch';

// Home is eagerly loaded (landing page — must be instant)
import Home from './pages/Home';

// All other pages are lazy-loaded for smaller initial bundle.
// Previously About, Solutions, Shop, Projects, Contact, Packages, Careers, SolarSecrets
// were eagerly imported — that pulled ~3000 lines of static data + @phosphor-icons
// into the initial chunk even when user lands on Home.
const About = lazy(() => import('./pages/About'));
const Solutions = lazy(() => import('./pages/Solutions'));
const Shop = lazy(() => import('./pages/Shop'));
const Projects = lazy(() => import('./pages/Projects'));
const Contact = lazy(() => import('./pages/Contact'));
const Packages = lazy(() => import('./pages/Packages'));
const Careers = lazy(() => import('./pages/Careers'));
const SolarSecrets = lazy(() => import('./pages/SolarSecrets'));

// Other lazy pages
const SavingsCalculator = lazy(() => import('./pages/SavingsCalculator'));
const QuoteWizard = lazy(() => import('./pages/QuoteWizard'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const Financing = lazy(() => import('./pages/Financing'));
const Certifications = lazy(() => import('./pages/Certifications'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Saves = lazy(() => import('./pages/Saves'));
const FamilyDetail = lazy(() => import('./pages/FamilyDetail'));
const EnergyHub = lazy(() => import('./pages/EnergyHub'));
const AreaLanding = lazy(() => import('./pages/AreaLanding'));
const SystemVisualizer = lazy(() => import('./pages/SystemVisualizer'));
const SolarAdvisor = lazy(() => import('./pages/SolarAdvisor'));
const SolutionDetail = lazy(() => import('./pages/SolutionDetail'));
const PackageDetail = lazy(() => import('./pages/PackageDetail'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));

// Auth pages (lazy loaded)
const GoogleCallbackHandler = lazy(() => import('./features/auth/components/GoogleCallbackHandler'));
const ResetPassword = lazy(() => import('./features/auth/pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./features/auth/pages/VerifyEmail'));

// Shop pages (lazy loaded)
const ProductDetail = lazy(() => import('./features/shop/ProductDetail'));
const CartPage = lazy(() => import('./features/shop/CartPage'));
const CheckoutPage = lazy(() => import('./features/shop/CheckoutPage'));
const OrderConfirmation = lazy(() => import('./features/shop/OrderConfirmation'));
const OrderHistory = lazy(() => import('./features/shop/OrderHistory'));
const OrderDetail = lazy(() => import('./features/shop/OrderDetail'));

// Payment pages (lazy loaded)
const PaymentStatus = lazy(() => import('./features/shop/PaymentStatus'));
const PaymentReturn = lazy(() => import('./features/shop/PaymentReturn'));

// Quotation & Invoice pages (lazy loaded)
const QuotationList = lazy(() => import('./features/quotations/QuotationList'));
const QuotationDetail = lazy(() => import('./features/quotations/QuotationDetail'));
const InvoiceList = lazy(() => import('./features/quotations/InvoiceList'));
const InvoiceDetail = lazy(() => import('./features/quotations/InvoiceDetail'));

// Solar Configurator (lazy loaded)
const SolarConfigurator = lazy(() => import('./features/solar/SolarConfigurator'));

// Technician Portal (lazy loaded)
const TechnicianDashboard = lazy(() => import('./features/technician/TechnicianDashboard'));
const TechnicianJobList = lazy(() => import('./features/technician/TechnicianJobList'));
const TechnicianJobDetail = lazy(() => import('./features/technician/TechnicianJobDetail'));
const TechnicianSchedule = lazy(() => import('./features/technician/TechnicianSchedule'));
const TechnicianProfile = lazy(() => import('./features/technician/TechnicianProfile'));

// Course Platform (lazy loaded)
const CourseCatalog = lazy(() => import('./features/courses/CourseCatalog'));
const CourseDetail = lazy(() => import('./features/courses/CourseDetail'));
const LessonViewer = lazy(() => import('./features/courses/LessonViewer'));
const MyCourses = lazy(() => import('./features/courses/MyCourses'));

// Support & FAQ (lazy loaded)
const FAQPage = lazy(() => import('./features/support/FAQPage'));
const TicketList = lazy(() => import('./features/support/TicketList'));
const TicketDetail = lazy(() => import('./features/support/TicketDetail'));
const CreateTicket = lazy(() => import('./features/support/CreateTicket'));

// Notifications (lazy loaded)
const NotificationCenter = lazy(() => import('./features/notifications/NotificationCenter'));
const NotificationPreferences = lazy(() => import('./features/notifications/NotificationPreferences'));

// Admin (lazy loaded)
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./features/admin/AdminUsers'));
const AdminOrders = lazy(() => import('./features/admin/AdminOrders'));
const AdminAnalytics = lazy(() => import('./features/admin/AdminAnalytics'));
const AdminProducts = lazy(() => import('./features/admin/AdminProducts'));
const AdminPackages = lazy(() => import('./features/admin/AdminPackages'));
const AdminQuotations = lazy(() => import('./features/admin/AdminQuotations'));
const AdminBlog = lazy(() => import('./features/admin/AdminBlog'));
const AdminBlogEditor = lazy(() => import('./features/admin/AdminBlogEditor'));
const AdminMedia = lazy(() => import('./features/admin/AdminMedia'));

// Customer Account Portal (lazy loaded)
const AccountPortal = lazy(() => import('./features/account/AccountPortal'));
const ProfileSettings = lazy(() => import('./features/account/ProfileSettings'));
const SecuritySettings = lazy(() => import('./features/account/SecuritySettings'));
const Wishlist = lazy(() => import('./features/account/Wishlist'));
const Addresses = lazy(() => import('./features/account/Addresses'));

// React Query client — tuned for instant perceived performance.
//
// staleTime: 10min — data is considered fresh for 10 minutes, so navigating
//   back to a page shows cached data instantly with no spinner or refetch.
// gcTime: 30min — unused cache entries live for 30 minutes before GC.
// refetchOnWindowFocus: false — prevents jarring refetches when user alt-tabs
//   back; background refetching still happens via staleTime expiry.
// retry: 1 — fail fast on network errors instead of 3 retries (saves ~6s on dead endpoints).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Redirect old auth routes to home + open modal
function AuthRedirect({ view }) {
  const { openAuthModal } = useAuthStore();
  useEffect(() => {
    openAuthModal(view);
  }, [view, openAuthModal]);
  return <Navigate to="/" replace />;
}

function AppContent() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const { theme } = useTheme();
  const { clearAuth, openAuthModal } = useAuthStore();
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  const isSolarAdvisor = pathname.startsWith('/solar-advisor');

  // Hide Tidio chatbot on Solar Advisor and admin pages
  useEffect(() => {
    const hideTidio = isAdminRoute || isSolarAdvisor;
    if (window.tidioChatApi) {
      hideTidio ? window.tidioChatApi.hide() : window.tidioChatApi.show();
    } else {
      document.addEventListener('tidioChat-ready', () => {
        if (hideTidio) window.tidioChatApi.hide();
      }, { once: true });
    }
  }, [isAdminRoute, isSolarAdvisor]);

  // Wire axios auth failure handler
  useEffect(() => {
    setAuthFailureHandler(() => {
      clearAuth();
      openAuthModal('login');
    });
    return () => setAuthFailureHandler(null);
  }, [clearAuth, openAuthModal]);

  // Predictive prefetching: when on a page, prefetch routes the user is likely
  // to navigate to next. Runs after idle to avoid competing with current page resources.
  useEffect(() => {
    const id = requestIdleCallback?.(() => {
      if (pathname === '/') {
        // From Home, users most commonly go to: packages, shop, projects, contact
        prefetchRoute('/packages');
        prefetchRoute('/shop');
        prefetchRoute('/projects');
        prefetchRoute('/contact');
      } else if (pathname === '/shop') {
        // Shop users often go to product detail (already lazy) or packages
        prefetchRoute('/packages');
      } else if (pathname === '/packages') {
        prefetchRoute('/shop');
        prefetchRoute('/contact');
      }
    }) ?? setTimeout(() => {
      // Fallback for browsers without requestIdleCallback
      if (pathname === '/') {
        prefetchRoute('/packages');
        prefetchRoute('/shop');
        prefetchRoute('/projects');
        prefetchRoute('/contact');
      }
    }, 2000);

    return () => {
      if (typeof cancelIdleCallback === 'function') cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [pathname]);

  return (
    <AnalyticsProvider>
      <ScrollToTop />
      {!isAdminRoute && <ScrollProgress />}
      {!isAdminRoute && <Navbar />}

      <main className={isAdminRoute ? undefined : 'min-h-screen'}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/solutions/:slug" element={<SolutionDetail />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/packages/:slug" element={<PackageDetail />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/solar-secrets" element={<SolarSecrets />} />
            {/* New routes */}
            <Route path="/calculator" element={<SavingsCalculator />} />
            <Route path="/quote" element={<Navigate to="/solar-advisor" replace />} />
            <Route path="/families/:slug" element={<FamilyDetail />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/saves" element={<Saves />} />
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/financing" element={<Financing />} />
            <Route path="/certifications" element={<Certifications />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/learn" element={<EnergyHub />} />
            <Route path="/solar-installation/:city" element={<AreaLanding />} />
            <Route path="/visualizer" element={<SystemVisualizer />} />
            <Route path="/solar-advisor" element={<SolarAdvisor />} />
            {/* Auth routes */}
            <Route path="/login" element={<AuthRedirect view="login" />} />
            <Route path="/register" element={<AuthRedirect view="register" />} />
            <Route path="/forgot-password" element={<AuthRedirect view="forgot-password" />} />
            <Route path="/auth/google/callback" element={<GoogleCallbackHandler />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            {/* Shop routes */}
            <Route path="/shop/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/account/orders" element={<OrderHistory />} />
            <Route path="/account/orders/:orderNumber" element={<OrderDetail />} />
            {/* Payment routes */}
            <Route path="/payment/status/:reference" element={<PaymentStatus />} />
            <Route path="/payment/return" element={<PaymentReturn />} />
            <Route path="/payment/:reference" element={<PaymentStatus />} />
            {/* Solar Configurator */}
            <Route path="/configurator" element={<SolarConfigurator />} />
            {/* Technician Portal routes */}
            <Route path="/technician" element={<TechnicianDashboard />} />
            <Route path="/technician/jobs" element={<TechnicianJobList />} />
            <Route path="/technician/jobs/:jobNumber" element={<TechnicianJobDetail />} />
            <Route path="/technician/schedule" element={<TechnicianSchedule />} />
            <Route path="/technician/profile" element={<TechnicianProfile />} />
            {/* Course Platform routes */}
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/my" element={<MyCourses />} />
            <Route path="/courses/learn/:enrollmentId" element={<LessonViewer />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            {/* Notification routes */}
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/notifications/preferences" element={<NotificationPreferences />} />
            {/* Support & FAQ routes */}
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/support/tickets" element={<TicketList />} />
            <Route path="/support/tickets/:ticketNumber" element={<TicketDetail />} />
            <Route path="/support/create" element={<CreateTicket />} />
            {/* Quotation & Invoice routes */}
            <Route path="/account/quotations" element={<QuotationList />} />
            <Route path="/account/quotations/:quotationNumber" element={<QuotationDetail />} />
            <Route path="/account/invoices" element={<InvoiceList />} />
            <Route path="/account/invoices/:invoiceNumber" element={<InvoiceDetail />} />
            {/* Customer Account Portal routes */}
            <Route path="/account" element={<AccountPortal />} />
            <Route path="/account/profile" element={<ProfileSettings />} />
            <Route path="/account/security" element={<SecuritySettings />} />
            <Route path="/account/wishlist" element={<Wishlist />} />
            <Route path="/account/addresses" element={<Addresses />} />
            {/* Admin routes — wrapped in AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="packages" element={<AdminPackages />} />
              <Route path="quotations" element={<AdminQuotations />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="blog/new" element={<AdminBlogEditor />} />
              <Route path="blog/:slug/edit" element={<AdminBlogEditor />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && (
        <Footer
          onOpenPrivacy={() => setPrivacyOpen(true)}
          onOpenCookies={() => setCookiesOpen(true)}
        />
      )}

      {!isAdminRoute && !isSolarAdvisor && <BackToTop />}
      <CookieConsent onOpenCookies={() => setCookiesOpen(true)} />
      <AuthModal />
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
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}
