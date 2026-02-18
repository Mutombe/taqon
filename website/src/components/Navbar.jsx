import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, ShoppingBag, ChevronDown, Phone, MapPin } from 'lucide-react';
import { companyInfo, services, packages, products, solarTips, faqs } from '../data/siteData';
import logoImg from '../assets/taqon-electrico-logo.jpg';
import LanguageSwitcher from './LanguageSwitcher';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About Us', children: [
    { path: '/about', label: 'Our Story' },
    { path: '/certifications', label: 'Certifications' },
    { path: '/careers', label: 'Careers' },
  ]},
  {
    path: '/solutions',
    label: 'Our Solutions',
    children: [
      { path: '/solutions#solar-installations', label: 'Solar Installations' },
      { path: '/solutions#electrical-maintenance', label: 'Electrical Maintenance' },
      { path: '/solutions#borehole-installations', label: 'Borehole Pumps' },
      { path: '/solutions#lighting-solutions', label: 'Lighting Solutions' },
      { path: '/solutions#solar-maintenance', label: 'Solar Maintenance' },
      { path: '/calculator', label: 'Solar Calculator' },
    ],
  },
  { path: '/packages', label: 'Packages' },
  { path: '/shop', label: 'Shop' },
  { path: '/projects', label: 'Projects' },
  { path: '/blog', label: 'Resources', children: [
    { path: '/blog', label: 'Blog' },
    { path: '/learn', label: 'Learn' },
  ]},
  { path: '/contact', label: 'Contact Us' },
];

// Comprehensive searchable content
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

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setActiveDropdown(null);
  }, [location]);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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

  return (
    <>
      {/* Top info bar */}
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

      {/* Main navbar */}
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

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div
                  key={link.path}
                  className="relative"
                  onMouseEnter={() => link.children && setActiveDropdown(link.path)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={link.path}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1 ${
                      isActive(link.path)
                        ? 'text-taqon-orange'
                        : isScrolled
                        ? 'text-taqon-charcoal dark:text-white/80 hover:text-taqon-orange hover:bg-taqon-orange/5'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                    {link.children && <ChevronDown size={14} className={`transition-transform ${activeDropdown === link.path ? 'rotate-180' : ''}`} />}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {link.children && activeDropdown === link.path && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-taqon-charcoal rounded-xl shadow-2xl shadow-black/10 border border-gray-100 dark:border-white/10 overflow-hidden"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className="block px-4 py-3 text-sm text-taqon-charcoal dark:text-white/70 hover:bg-taqon-orange/5 hover:text-taqon-orange transition-all border-b border-gray-50 dark:border-white/5 last:border-0"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-2.5 rounded-full transition-all duration-300 ${
                  isScrolled
                    ? 'hover:bg-gray-100 dark:hover:bg-white/10 text-taqon-charcoal dark:text-white'
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <Search size={18} />
              </button>

              <Link
                to="/shop"
                className={`p-2.5 rounded-full transition-all duration-300 ${
                  isScrolled
                    ? 'hover:bg-gray-100 dark:hover:bg-white/10 text-taqon-charcoal dark:text-white'
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <ShoppingBag size={18} />
              </Link>

              <LanguageSwitcher className={
                isScrolled
                  ? 'hover:bg-gray-100 dark:hover:bg-white/10 text-taqon-charcoal dark:text-white'
                  : 'hover:bg-white/10 text-white'
              } />

              <Link
                to="/quote"
                className="hidden lg:inline-flex items-center gap-2 bg-taqon-orange text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25 active:scale-95"
              >
                Get a Quote
              </Link>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`lg:hidden p-2.5 rounded-full transition-all ${
                  isScrolled
                    ? 'text-taqon-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Search Overlay */}
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
                <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-taqon-muted" />
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 text-taqon-muted"
                >
                  <X size={18} />
                </button>
              </div>

              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[50vh] overflow-y-auto"
                >
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => goToResult(result.path)}
                      className="w-full text-left px-5 py-4 hover:bg-taqon-orange/5 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-taqon-orange bg-taqon-orange/10 px-2 py-0.5 rounded-full">
                          {result.type}
                        </span>
                        <span className="font-semibold text-taqon-charcoal text-sm">{result.title}</span>
                      </div>
                      <p className="text-xs text-taqon-muted mt-1 line-clamp-2">{result.description}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div className="mt-3 bg-white rounded-2xl shadow-2xl p-8 text-center">
                  <p className="text-taqon-muted">No results found for "{searchQuery}"</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
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
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      className={`block px-4 py-3.5 text-lg font-medium rounded-xl transition-all ${
                        isActive(link.path)
                          ? 'text-taqon-orange bg-taqon-orange/10'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                    {link.children && (
                      <div className="ml-4 mt-1 space-y-1">
                        {link.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className="block px-4 py-2 text-sm text-white/50 hover:text-taqon-orange transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-8 border-t border-white/10">
                <Link
                  to="/quote"
                  className="block w-full text-center bg-taqon-orange text-white py-4 rounded-2xl font-semibold text-lg hover:bg-taqon-orange/90 transition-all"
                >
                  Get a Free Quote
                </Link>
                <div className="mt-4 flex items-center justify-center gap-2 text-white/50 text-sm">
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
