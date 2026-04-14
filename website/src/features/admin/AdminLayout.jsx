import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SquaresFour, ChartBar, Package, ShoppingCart, SolarPanel,
  Article, Image, Users, List, X, CaretRight, SignOut,
  Bell, MoonStars, Sun, FileText, Wallet,
} from '@phosphor-icons/react';
import useAuthStore from '../../stores/authStore';
import { useTheme } from '../../contexts/ThemeContext';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: SquaresFour },
      { to: '/admin/analytics', label: 'Analytics', icon: ChartBar },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/admin/packages', label: 'Packages', icon: SolarPanel },
      { to: '/admin/quotations', label: 'Quotations', icon: FileText },
      { to: '/admin/deposits', label: 'Deposits', icon: Wallet },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/blog', label: 'Blog Posts', icon: Article },
      { to: '/admin/media', label: 'Media', icon: Image },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/users', label: 'Users', icon: Users },
    ],
  },
];

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
        ${isActive
          ? 'bg-taqon-orange text-white shadow-lg shadow-taqon-orange/20'
          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
        }`}
    >
      <Icon
        weight={isActive ? 'fill' : 'regular'}
        size={18}
        className={isActive ? 'text-white' : 'group-hover:text-taqon-orange transition-colors'}
      />
      <span>{item.label}</span>
      {isActive && (
        <CaretRight size={12} weight="bold" className="ml-auto text-white/60" />
      )}
    </Link>
  );
}

function Sidebar({ open, onClose }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--card-border)]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <img src="/fav.png" alt="Taqon" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-syne font-bold text-[var(--text-primary)] text-base">Taqon</span>
            <span className="block text-xs text-[var(--text-muted)] leading-none">Admin Panel</span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  isActive={pathname === item.to || (item.to !== '/admin/dashboard' && pathname.startsWith(item.to))}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[var(--card-border)]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] mb-2">
          <div className="w-8 h-8 rounded-full bg-taqon-orange/20 flex items-center justify-center flex-shrink-0">
            <span className="text-taqon-orange text-xs font-bold uppercase">
              {user?.first_name?.[0] || user?.email?.[0] || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin'}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <SignOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-40 bg-[var(--bg-secondary)] border-r border-[var(--card-border)]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--card-border)]"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/analytics': 'Analytics',
  '/admin/products': 'Products',
  '/admin/orders': 'Orders',
  '/admin/packages': 'Packages',
  '/admin/quotations': 'Quotations',
  '/admin/deposits': 'Package Deposits',
  '/admin/blog': 'Blog Posts',
  '/admin/blog/new': 'New Blog Post',
  '/admin/media': 'Media Library',
  '/admin/users': 'Users',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const pageTitle = Object.entries(PAGE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(path + '/'))?.[1] || 'Admin';

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-[var(--bg-secondary)] border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors"
            >
              <List size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <Link to="/admin/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                Admin
              </Link>
              {pathname !== '/admin/dashboard' && (
                <>
                  <span className="text-[var(--text-muted)]">/</span>
                  <span className="text-[var(--text-primary)] font-medium">{pageTitle}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            >
              {theme === 'dark' ? <Sun size={18} /> : <MoonStars size={18} />}
            </button>
            <Link
              to="/notifications"
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            >
              <Bell size={18} />
            </Link>
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm transition-all"
            >
              View Site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
