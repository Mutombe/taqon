import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List, X, MagnifyingGlass, Bag, CaretDown, CaretRight, Phone, MapPin,
  User, SignOut, Package, Gear, SquaresFour, Sun, Moon,
  Wrench, Lightning, SolarPanel, Drop, HardDrives, Lamp,
  Calculator, BatteryFull, Gauge, LinkSimple, Toolbox, Lightbulb, ArrowRight, Star,
} from '@phosphor-icons/react';
import { companyInfo, services, packages, products, solarTips, faqs } from '../data/siteData';
import logoImg from '../assets/taqon-electrico-logo.jpg';
import NotificationBell from './NotificationBell';
import useAuthStore from '../stores/authStore';
import { useTheme } from '../contexts/ThemeContext';
import { prefetchRoute } from '../lib/routePrefetch';

// ─── Navigation Data ────────────────────────────────────────────────────────────

const navLinks = [
  { path: '/', label: 'Home' },
  {
    path: '/about', label: 'About', type: 'simple', children: [
      { path: '/about', label: 'Our Story' },
      { path: '/certifications', label: 'Certifications' },
      { path: '/careers', label: 'Careers' },
      { path: '/contact', label: 'Contact' },
    ],
  },
  {
    path: '/solutions', label: 'Solutions', type: 'mega', children: [
      { path: '/solutions/solar-system-maintenance', label: 'Solar System Maintenance', desc: 'Keep your system at peak performance', icon: Wrench },
      { path: '/solutions/electrical-maintenance', label: 'Electrical Maintenance', desc: 'Home & commercial electrical services', icon: Lightning },
      { path: '/solutions/solar-installations', label: 'Solar Installations', desc: 'Complete system design & installation', icon: SolarPanel },
      { path: '/solutions/borehole-pump-installations', label: 'Borehole Pump Installations', desc: 'Solar-powered water solutions', icon: Drop },
      { path: '/solutions/electrical-hardware', label: 'Electrical Hardware', desc: 'Premium equipment supply', icon: HardDrives },
      { path: '/solutions/lighting-solutions', label: 'Lighting Solutions', desc: 'Custom lighting design & install', icon: Lamp },
    ],
  },
  {
    path: '/packages', label: 'Packages', type: 'mega', children: [
      { tier: 'HOME STARTER', items: [
        { path: '/packages/economy', label: 'Economy (1kVA)' },
        { path: '/packages/quick-access', label: 'Quick Access (1.5kVA)' },
      ]},
      { tier: 'HOME PREMIUM', items: [
        { path: '/packages/luxury', label: 'Luxury (3kVA)', popular: true },
        { path: '/packages/luxury-beta', label: 'Luxury Beta (5kVA)' },
        { path: '/packages/deluxe', label: 'Deluxe (5kVA)' },
      ]},
      { tier: 'COMMERCIAL', items: [
        { path: '/packages/8kva-ultra-power', label: '8KVA Ultra Power' },
        { path: '/packages/10kva-premium-power', label: '10KVA Premium Power' },
        { path: '/packages/12kva-propower', label: '12KVA ProPower' },
        { path: '/packages/16kva-masterpower', label: '16KVA MasterPower' },
        { path: '/packages/20-24kva-ultramax', label: '20-24KVA UltraMax' },
      ]},
    ],
  },
  {
    path: '/shop', label: 'Shop', type: 'mega', children: [
      { path: '/shop?category=panels', label: 'Solar Panels', icon: SolarPanel },
      { path: '/shop?category=batteries', label: 'Batteries', icon: BatteryFull },
      { path: '/shop?category=inverters', label: 'Inverters', icon: Lightning },
      { path: '/shop?category=controllers', label: 'Controllers', icon: Gauge },
      { path: '/shop?category=cables', label: 'Solar Cables', icon: LinkSimple },
      { path: '/shop?category=accessories', label: 'Accessories', icon: Toolbox },
    ],
  },
  { path: '/projects', label: 'Projects' },
  { path: '/solar-secrets', label: 'Solar Secrets', icon: 'Lightbulb' },
];

// ─── Searchable Content ─────────────────────────────────────────────────────────

const searchableContent = [
  ...services.map(s => ({ title: s.title, description: s.shortDesc, path: `/solutions#${s.slug}`, type: 'Service' })),
  ...products.map(p => ({ title: p.name, description: `$${p.price} - ${p.brand}`, path: '/shop', type: 'Product' })),
  ...packages.map(p => ({ title: `${p.name} Package`, description: p.description, path: '/packages', type: 'Package' })),
  ...solarTips.map(t => ({ title: t.title, description: t.excerpt, path: '/solar-secrets', type: 'Article' })),
  ...faqs.map(f => ({ title: f.question, description: f.answer.substring(0, 100), path: '/about#faq', type: 'FAQ' })),
  { title: 'About Taqon Electrico', description: 'Learn about our team, mission and values', path: '/about', type: 'Page' },
  { title: 'Contact Us', description: 'Get in touch for a free consultation', path: '/contact', type: 'Page' },
  { title: 'Our Projects Gallery', description: 'View our completed solar installations', path: '/projects', type: 'Page' },
  { title: 'Career Opportunities', description: 'Join the Taqon Electrico team', path: '/careers', type: 'Page' },
];

// ─── Mega Menu Panels ───────────────────────────────────────────────────────────

function SolutionsMegaMenu({ onClose }) {
  const solLink = navLinks.find(l => l.label === 'Solutions');
  return (
    <div className="flex gap-0">
      {/* Left column: SERVICES */}
      <div className="flex-1 pr-8 border-r border-gray-100 dark:border-white/10">
        <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40 mb-4">Services</p>
        <div className="space-y-1">
          {solLink.children.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.15 }}
              >
                <Link
                  to={item.path}
                  onClick={onClose}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-taqon-orange/5 dark:hover:bg-white/5 transition-all group"
                >
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-taqon-orange/10 group-hover:bg-taqon-orange/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon size={18} weight="duotone" className="text-taqon-orange" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-taqon-charcoal dark:text-white/90 group-hover:text-taqon-orange transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right column: TOOLS + Quick Links */}
      <div className="w-56 pl-8 flex flex-col">
        <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40 mb-4">Tools</p>
        <Link
          to="/calculator"
          onClick={onClose}
          className="flex items-start gap-3 p-3 rounded-xl bg-taqon-orange/5 dark:bg-white/5 hover:bg-taqon-orange/10 dark:hover:bg-white/10 transition-all group mb-6"
        >
          <div className="mt-0.5 w-9 h-9 rounded-lg bg-taqon-orange/15 group-hover:bg-taqon-orange/25 flex items-center justify-center flex-shrink-0 transition-colors">
            <Calculator size={18} weight="duotone" className="text-taqon-orange" />
          </div>
          <div>
            <p className="text-sm font-semibold text-taqon-orange">Solar Calculator</p>
            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">Estimate your system size</p>
          </div>
        </Link>

        <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40 mb-3">Quick Links</p>
        <div className="space-y-1">
          {[
            { to: '/solutions', label: 'View all solutions' },
            { to: '/quote', label: 'Get a free quote' },
            { to: '/contact', label: 'Talk to an engineer' },
          ].map((ql, i) => (
            <Link
              key={ql.to}
              to={ql.to}
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60 hover:text-taqon-orange dark:hover:text-taqon-orange transition-colors py-1.5"
            >
              <ArrowRight size={14} className="text-taqon-orange/60" />
              {ql.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function PackagesMegaMenu({ onClose }) {
  const pkgLink = navLinks.find(l => l.label === 'Packages');
  return (
    <div>
      <div className="grid grid-cols-3 gap-6">
        {pkgLink.children.map((tierGroup, gi) => (
          <div key={tierGroup.tier}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40 mb-3">
              {tierGroup.tier}
            </p>
            <div className="space-y-0.5">
              {tierGroup.items.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (gi * 3 + i) * 0.03, duration: 0.15 }}
                >
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`block px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-taqon-orange/5 dark:hover:bg-white/5 ${
                      item.popular
                        ? 'bg-taqon-orange/5 dark:bg-taqon-orange/10 border border-taqon-orange/20'
                        : ''
                    }`}
                  >
                    <span className="font-medium text-taqon-charcoal dark:text-white/90 hover:text-taqon-orange transition-colors">
                      {item.label}
                    </span>
                    {item.popular && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-taqon-orange bg-taqon-orange/10 px-1.5 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10">
        <Link
          to="/packages"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-semibold text-taqon-orange hover:text-taqon-orange/80 transition-colors"
        >
          Compare All Packages <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

function ShopMegaMenu({ onClose }) {
  const shopLink = navLinks.find(l => l.label === 'Shop');
  return (
    <div className="flex gap-0">
      {/* Left column: SHOP BY CATEGORY */}
      <div className="flex-1 pr-8 border-r border-gray-100 dark:border-white/10">
        <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40 mb-4">Shop by Category</p>
        <div className="grid grid-cols-2 gap-1">
          {shopLink.children.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.15 }}
              >
                <Link
                  to={item.path}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-taqon-orange/5 dark:hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-taqon-orange/10 group-hover:bg-taqon-orange/20 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Icon size={16} weight="duotone" className="text-taqon-orange" />
                  </div>
                  <span className="text-sm font-medium text-taqon-charcoal dark:text-white/90 group-hover:text-taqon-orange transition-colors">
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <Link
            to="/packages"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-white/50 hover:text-taqon-orange transition-colors"
          >
            Compare Packages
          </Link>
          <Link
            to="/shop"
            onClick={onClose}
            className="text-sm text-gray-500 dark:text-white/50 hover:text-taqon-orange transition-colors"
          >
            View All Products
          </Link>
        </div>
      </div>

      {/* Right column: FEATURED */}
      <div className="w-60 pl-8">
        <p className="text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-white/40 mb-4">Featured</p>
        <Link
          to="/packages"
          onClick={onClose}
          className="block rounded-xl bg-gradient-to-br from-taqon-orange/10 to-taqon-orange/5 dark:from-taqon-orange/15 dark:to-taqon-orange/5 p-5 hover:from-taqon-orange/15 hover:to-taqon-orange/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-taqon-orange/20 flex items-center justify-center mb-3">
            <SolarPanel size={22} weight="duotone" className="text-taqon-orange" />
          </div>
          <p className="text-base font-bold text-taqon-charcoal dark:text-white">Full Home Solar Packages</p>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-1">Starting from $1,200</p>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-taqon-orange mt-3 group-hover:gap-2 transition-all">
            Shop Now <ArrowRight size={14} />
          </span>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Navbar Component ──────────────────────────────────────────────────────

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const enterTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);

  const { isAuthenticated, user, logout, openAuthModal } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  // ── Scroll tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Close everything on route change ────────────────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setActiveDropdown(null);
    setUserMenuOpen(false);
    setMobileAccordion(null);
  }, [location]);

  // ── Close user menu on outside click ────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Focus search on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // ── Hover timing helpers (80ms enter, 150ms leave) ────────────────────────
  const handleDropdownEnter = useCallback((path) => {
    clearTimeout(leaveTimerRef.current);
    enterTimerRef.current = setTimeout(() => {
      setActiveDropdown(path);
    }, 80);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    clearTimeout(enterTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  }, []);

  const closeDropdown = useCallback(() => {
    clearTimeout(enterTimerRef.current);
    clearTimeout(leaveTimerRef.current);
    setActiveDropdown(null);
  }, []);

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    setSearchResults(
      searchableContent.filter(item =>
        item.title.toLowerCase().includes(lower) || item.description.toLowerCase().includes(lower)
      ).slice(0, 8)
    );
  };

  const goToResult = (path) => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // ── Mobile accordion toggle ───────────────────────────────────────────────
  const toggleMobileAccordion = (label) => {
    setMobileAccordion(prev => prev === label ? null : label);
  };

  // ── Nav link text color helper ─────────────────────────────────────────────
  // Detect if the section behind the navbar is dark by checking the element at the nav position
  const [hasDarkHero, setHasDarkHero] = useState(true);
  useEffect(() => {
    const check = () => {
      // Sample the element behind the navbar center
      const el = document.elementFromPoint(window.innerWidth / 2, 80);
      if (!el) return;
      const bg = getComputedStyle(el).backgroundColor;
      const match = bg.match(/\d+/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        // Dark if luminance is low (< 128)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        setHasDarkHero(lum < 128);
      }
    };
    // Check after a short delay for page render
    const timer = setTimeout(check, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const navTextClass = (path) => {
    if (isActive(path)) return 'text-taqon-orange';
    if (isScrolled) return 'text-taqon-charcoal dark:text-white/80 hover:text-taqon-orange';
    if (hasDarkHero) return 'text-white/90 hover:text-white';
    return 'text-taqon-charcoal dark:text-white/80 hover:text-taqon-orange';
  };

  // ── Right action button style helper ───────────────────────────────────────
  const actionBtnClass = isScrolled
    ? 'hover:bg-gray-100 dark:hover:bg-white/10 text-taqon-charcoal dark:text-white'
    : hasDarkHero
      ? 'hover:bg-white/10 text-white'
      : 'hover:bg-gray-100 dark:hover:bg-white/10 text-taqon-charcoal dark:text-white';

  // ── Panel animation ────────────────────────────────────────────────────────
  const panelMotion = {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
  };

  return (
    <>
      {/* ── Top Info Bar ───────────────────────────────────────────────────── */}
      <div className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="bg-taqon-dark/90 backdrop-blur-sm text-white/70 text-xs py-1.5">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <a href={`tel:${companyInfo.phone[0]}`} className="flex items-center gap-1 hover:text-taqon-orange transition-colors">
                <Phone size={10} /> {companyInfo.phone[0]}
              </a>
              <span className="hidden sm:flex items-center gap-1">
                <MapPin size={10} /> {companyInfo.address}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">Mon-Fri: {companyInfo.hours.weekday}</span>
              <a href={`mailto:${companyInfo.email}`} className="hover:text-taqon-orange transition-colors">{companyInfo.email}</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Navbar ────────────────────────────────────────────────────── */}
      <motion.nav
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'top-0 bg-white/90 dark:bg-taqon-dark/90 backdrop-blur-xl shadow-lg shadow-black/5'
            : 'top-8 bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="relative z-10 flex-shrink-0">
              <img
                src={logoImg}
                alt="Taqon Electrico"
                className="h-10 lg:h-12 w-auto object-contain"
              />
            </Link>

            {/* ── Desktop Nav Links ──────────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const hasMega = link.type === 'mega';
                const hasSimple = link.type === 'simple';
                const hasChildren = hasMega || hasSimple;
                const isSolarSecrets = link.icon === 'Lightbulb';

                return (
                  <div
                    key={link.path + link.label}
                    className="relative"
                    onMouseEnter={() => hasChildren ? handleDropdownEnter(link.label) : undefined}
                    onMouseLeave={() => hasChildren ? handleDropdownLeave() : undefined}
                  >
                    <Link
                      to={link.path}
                      onMouseEnter={() => prefetchRoute(link.path)}
                      className={`px-2.5 py-2 rounded-lg transition-all duration-300 flex items-center gap-1.5 text-[13px] font-semibold ${navTextClass(link.path)}`}
                    >
                      {isSolarSecrets && (
                        <Lightbulb
                          size={16}
                          weight="fill"
                          className="text-yellow-400"
                          style={{ filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }}
                        />
                      )}
                      {link.label}
                      {hasChildren && (
                        <CaretDown
                          size={13}
                          weight="bold"
                          className={`transition-transform duration-200 ${activeDropdown === link.label ? 'rotate-180' : ''}`}
                        />
                      )}
                    </Link>

                    {/* ── Simple Dropdown (About Us) ──────────────────────── */}
                    <AnimatePresence>
                      {hasSimple && activeDropdown === link.label && (
                        <motion.div
                          {...panelMotion}
                          className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-taqon-charcoal rounded-xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-white/10 overflow-hidden py-1"
                        >
                          {link.children.map((child, i) => (
                            <motion.div
                              key={child.path + child.label}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03, duration: 0.15 }}
                            >
                              <Link
                                to={child.path}
                                onClick={closeDropdown}
                                className="block px-4 py-3 text-sm text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 hover:text-taqon-orange transition-all border-b border-gray-50 dark:border-white/5 last:border-0"
                              >
                                {child.label}
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Mega menus rendered at nav level below */}
                  </div>
                );
              })}
            </div>

            {/* ── Right Actions ───────────────────────────────────────────── */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-2.5 rounded-full transition-all duration-300 ${actionBtnClass}`}
              >
                <MagnifyingGlass size={18} />
              </button>

              {/* Shop bag */}
              <Link
                to="/shop"
                className={`p-2.5 rounded-full transition-all duration-300 ${actionBtnClass}`}
              >
                <Bag size={18} />
              </Link>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-full transition-all duration-300 ${actionBtnClass}`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notification bell */}
              <NotificationBell />

              {/* Auth: Sign In or User Menu */}
              {isAuthenticated ? (
                <div className="relative hidden lg:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 ${actionBtnClass}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-taqon-orange flex items-center justify-center text-white text-xs font-bold">
                      {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        {...panelMotion}
                        className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-taqon-charcoal rounded-xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-white/10 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                          <p className="text-sm font-semibold text-taqon-charcoal dark:text-white truncate">
                            {user?.first_name} {user?.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-white/40 truncate">{user?.email}</p>
                        </div>
                        <Link
                          to="/account"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 hover:text-taqon-orange transition-all"
                        >
                          <Gear size={16} /> My Account
                        </Link>
                        <Link
                          to="/account/orders"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 hover:text-taqon-orange transition-all"
                        >
                          <Package size={16} /> Orders
                        </Link>
                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                          <Link
                            to="/admin/dashboard"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 hover:text-taqon-orange transition-all"
                          >
                            <SquaresFour size={16} /> Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border-t border-gray-100 dark:border-white/10"
                        >
                          <SignOut size={16} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className={`hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isScrolled
                      ? 'text-taqon-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <User size={16} /> Sign In
                </button>
              )}

              {/* Get a Quote CTA */}
              <Link
                to="/solar-advisor"
                className="hidden lg:inline-flex items-center gap-2 bg-taqon-orange text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25 active:scale-95"
              >
                Get a Quote
              </Link>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden p-2.5 rounded-full transition-all ${actionBtnClass}`}
              >
                {mobileOpen ? <X size={22} /> : <List size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mega Menu Panels (rendered at nav level for correct positioning) ── */}
        <AnimatePresence>
          {activeDropdown && navLinks.some(l => l.type === 'mega' && l.label === activeDropdown) && (
            <motion.div
              {...panelMotion}
              className="absolute left-0 right-0 top-full hidden lg:flex justify-center"
              style={{ zIndex: 100 }}
              onMouseEnter={() => handleDropdownEnter(activeDropdown)}
              onMouseLeave={handleDropdownLeave}
            >
              <div
                className={`${activeDropdown === 'Packages' ? 'max-w-3xl' : 'max-w-4xl'} w-full mx-4 bg-white dark:bg-taqon-charcoal rounded-2xl shadow-2xl shadow-black/8 border border-gray-100 dark:border-white/10 p-8`}
              >
                {activeDropdown === 'Solutions' && <SolutionsMegaMenu onClose={closeDropdown} />}
                {activeDropdown === 'Packages' && <PackagesMegaMenu onClose={closeDropdown} />}
                {activeDropdown === 'Shop' && <ShopMegaMenu onClose={closeDropdown} />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Search Overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-taqon-dark/80 backdrop-blur-xl flex items-start justify-center pt-[15vh]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <MagnifyingGlass size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products, services, pages..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-white dark:bg-taqon-charcoal dark:text-white rounded-2xl pl-14 pr-5 py-5 text-lg outline-none shadow-2xl"
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-white dark:bg-taqon-charcoal rounded-2xl shadow-2xl overflow-hidden max-h-[50vh] overflow-y-auto"
                >
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => goToResult(result.path)}
                      className="w-full text-left px-5 py-4 hover:bg-taqon-orange/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-taqon-orange bg-taqon-orange/10 px-2 py-0.5 rounded-full">
                          {result.type}
                        </span>
                        <span className="font-semibold text-taqon-charcoal dark:text-white text-sm">{result.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/40 mt-1 line-clamp-2">{result.description}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div className="mt-3 bg-white dark:bg-taqon-charcoal rounded-2xl shadow-2xl p-8 text-center">
                  <p className="text-gray-500 dark:text-white/50">No results found for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Menu ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[55] bg-taqon-dark lg:hidden"
          >
            <div className="flex flex-col h-full pt-24 px-6 pb-8 overflow-y-auto">
              <div className="space-y-1">
                {navLinks.map((link, i) => {
                  const hasChildren = link.type === 'mega' || link.type === 'simple';
                  const isSolarSecrets = link.icon === 'Lightbulb';
                  const isAccordionOpen = mobileAccordion === link.label;

                  return (
                    <motion.div
                      key={link.path + link.label}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {/* Parent link row */}
                      <div className="flex items-center">
                        <Link
                          to={link.path}
                          className={`flex-1 flex items-center gap-2 px-4 py-3.5 text-lg font-medium rounded-xl transition-all ${
                            isActive(link.path)
                              ? 'text-taqon-orange bg-taqon-orange/10'
                              : 'text-white/80 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {isSolarSecrets && (
                            <Lightbulb
                              size={20}
                              weight="fill"
                              className="text-yellow-400"
                              style={{ filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }}
                            />
                          )}
                          {link.label}
                        </Link>
                        {hasChildren && (
                          <button
                            onClick={() => toggleMobileAccordion(link.label)}
                            className="p-3 text-white/60 hover:text-white transition-colors"
                            aria-label={`Toggle ${link.label} submenu`}
                          >
                            <CaretDown
                              size={18}
                              weight="bold"
                              className={`transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Accordion children */}
                      <AnimatePresence>
                        {hasChildren && isAccordionOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 border-l-2 border-taqon-orange/20 pl-4 py-1">
                              {/* Simple dropdown children */}
                              {link.type === 'simple' && link.children.map((child) => (
                                <Link
                                  key={child.path + child.label}
                                  to={child.path}
                                  className="block py-3 text-sm text-white/60 hover:text-taqon-orange transition-colors"
                                >
                                  {child.label}
                                </Link>
                              ))}

                              {/* Solutions children */}
                              {link.label === 'Solutions' && link.children.map((child) => {
                                const Icon = child.icon;
                                return (
                                  <Link
                                    key={child.path}
                                    to={child.path}
                                    className="flex items-center gap-3 py-3 text-sm text-white/60 hover:text-taqon-orange transition-colors"
                                  >
                                    <Icon size={16} weight="duotone" className="text-taqon-orange/60" />
                                    {child.label}
                                  </Link>
                                );
                              })}

                              {/* Packages children — grouped by tier */}
                              {link.label === 'Packages' && link.children.map((tierGroup) => (
                                <div key={tierGroup.tier} className="mb-3 last:mb-0">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-white/30 mt-2 mb-1">
                                    {tierGroup.tier}
                                  </p>
                                  {tierGroup.items.map((item) => (
                                    <Link
                                      key={item.path}
                                      to={item.path}
                                      className="flex items-center gap-2 py-3 text-sm text-white/60 hover:text-taqon-orange transition-colors"
                                    >
                                      {item.label}
                                      {item.popular && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-taqon-orange bg-taqon-orange/15 px-1.5 py-0.5 rounded-full">
                                          Popular
                                        </span>
                                      )}
                                    </Link>
                                  ))}
                                </div>
                              ))}

                              {/* Shop children */}
                              {link.label === 'Shop' && link.children.map((child) => {
                                const Icon = child.icon;
                                return (
                                  <Link
                                    key={child.path}
                                    to={child.path}
                                    className="flex items-center gap-3 py-3 text-sm text-white/60 hover:text-taqon-orange transition-colors"
                                  >
                                    <Icon size={16} weight="duotone" className="text-taqon-orange/60" />
                                    {child.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mobile bottom section */}
              <div className="mt-auto pt-8 border-t border-white/10 space-y-3">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2 text-white/70">
                      <div className="w-9 h-9 rounded-full bg-taqon-orange flex items-center justify-center text-white font-bold">
                        {user?.first_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs text-white/40">{user?.email}</p>
                      </div>
                    </div>
                    <Link to="/account" className="block px-4 py-2 text-sm text-white/70 hover:text-taqon-orange">My Account</Link>
                    <Link to="/account/orders" className="block px-4 py-2 text-sm text-white/70 hover:text-taqon-orange">Orders</Link>
                    {(user?.role === 'admin' || user?.role === 'superadmin') && (
                      <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-taqon-orange hover:text-taqon-orange/80 font-medium">Admin Dashboard</Link>
                    )}
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300">Sign Out</button>
                  </>
                ) : (
                  <button
                    onClick={() => { setMobileOpen(false); openAuthModal('login'); }}
                    className="block w-full text-center bg-white/10 text-white py-3.5 rounded-2xl font-semibold hover:bg-white/15 transition-all"
                  >
                    Sign In
                  </button>
                )}
                <Link
                  to="/solar-advisor"
                  className="block w-full text-center bg-taqon-orange text-white py-4 rounded-2xl font-semibold text-lg hover:bg-taqon-orange/90 transition-all"
                >
                  Get a Free Quote
                </Link>
                <div className="mt-2 flex items-center justify-center gap-2 text-white/50 text-sm">
                  <Phone size={14} />
                  <a href={`tel:${companyInfo.phone[0]}`}>{companyInfo.phone[0]}</a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
