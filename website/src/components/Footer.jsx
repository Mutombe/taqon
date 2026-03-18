import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, EnvelopeSimple, Clock, ArrowUpRight, FacebookLogo, InstagramLogo, XLogo, LinkedinLogo } from '@phosphor-icons/react';
import { companyInfo } from '../data/siteData';
import { confirmExternalNavigation } from './ContentLink';
import logoImg from '../assets/taqon-electrico-logo.jpg';

const footerLinks = {
  services: [
    { label: 'Solar Installations', path: '/solutions#solar-installations' },
    { label: 'Electrical Maintenance', path: '/solutions#electrical-maintenance' },
    { label: 'Borehole Pumps', path: '/solutions#borehole-installations' },
    { label: 'Lighting Solutions', path: '/solutions#lighting-solutions' },
    { label: 'Solar Maintenance', path: '/solutions#solar-maintenance' },
  ],
  products: [
    { label: 'Solar Panels', path: '/shop?category=panels' },
    { label: 'Batteries', path: '/shop?category=batteries' },
    { label: 'Inverters', path: '/shop?category=inverters' },
    { label: 'Solar Packages', path: '/packages' },
    { label: 'Accessories', path: '/shop' },
  ],
  quickLinks: [
    { label: 'About Us', path: '/about' },
    { label: 'Our Projects', path: '/projects' },
    { label: 'Blog', path: '/blog' },
    { label: 'Certifications', path: '/certifications' },
    { label: 'Contact Us', path: '/contact' },
  ],
  serviceAreas: [
    { label: 'Harare', path: '/solar-installation/harare' },
    { label: 'Bulawayo', path: '/solar-installation/bulawayo' },
    { label: 'Chitungwiza', path: '/solar-installation/chitungwiza' },
    { label: 'Mutare', path: '/solar-installation/mutare' },
    { label: 'Gweru', path: '/solar-installation/gweru' },
    { label: 'Marondera', path: '/solar-installation/marondera' },
  ],
};

const socialIcons = [
  { icon: FacebookLogo, href: companyInfo.social.facebook },
  { icon: InstagramLogo, href: companyInfo.social.instagram },
  { icon: XLogo, href: companyInfo.social.twitter },
  { icon: LinkedinLogo, href: companyInfo.social.linkedin },
];

export default function Footer({ onOpenPrivacy, onOpenCookies }) {
  return (
    <footer className="relative bg-taqon-dark text-white overflow-hidden">
      {/* Decorative mesh */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-taqon-orange/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-taqon-amber/10 rounded-full blur-[100px]" />
      </div>

      {/* CTA Section */}
      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl lg:text-5xl font-bold font-syne"
              >
                Ready to go <span className="text-gradient">solar?</span>
              </motion.h2>
              <p className="mt-3 text-white/60 text-lg max-w-md">
                Let's power your future with clean, reliable energy. Get a free consultation today.
              </p>
            </div>
            <Link
              to="/contact"
              className="group flex items-center gap-3 bg-taqon-orange text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/20 active:scale-95"
            >
              Get Started
              <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="relative max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <img src={logoImg} alt="Taqon Electrico" className="h-12 w-auto mb-6" />
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-6">
              Zimbabwe's trusted solar and electrical engineering company. Delivering reliable power solutions 
              to homes, businesses, and institutions since 2019.
            </p>

            <div className="space-y-3">
              <a href={companyInfo.mapLink} onClick={(e) => confirmExternalNavigation(companyInfo.mapLink, e)} className="flex items-start gap-3 text-white/60 hover:text-taqon-orange transition-colors text-sm cursor-pointer">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                {companyInfo.address}
              </a>
              <a href={`tel:${companyInfo.phone[0]}`} className="flex items-center gap-3 text-white/60 hover:text-taqon-orange transition-colors text-sm">
                <Phone size={16} className="flex-shrink-0" />
                {companyInfo.phone[0]}
              </a>
              <a href={`mailto:${companyInfo.email}`} className="flex items-center gap-3 text-white/60 hover:text-taqon-orange transition-colors text-sm">
                <EnvelopeSimple size={16} className="flex-shrink-0" />
                {companyInfo.email}
              </a>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <Clock size={16} className="flex-shrink-0" />
                Mon-Fri: {companyInfo.hours.weekday}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {socialIcons.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  onClick={(e) => confirmExternalNavigation(social.href, e)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-taqon-orange hover:border-taqon-orange transition-all cursor-pointer"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-syne font-bold text-sm uppercase tracking-wider mb-5 text-taqon-orange">What We Offer</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/50 hover:text-white transition-colors text-sm">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-bold text-sm uppercase tracking-wider mb-5 text-taqon-orange">Our Products</h4>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/50 hover:text-white transition-colors text-sm">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-syne font-bold text-sm uppercase tracking-wider mb-5 text-taqon-orange">Quick Links</h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/50 hover:text-white transition-colors text-sm">{link.label}</Link>
                </li>
              ))}
            </ul>

            <h4 className="font-syne font-bold text-sm uppercase tracking-wider mb-4 mt-8 text-taqon-orange">Service Areas</h4>
            <ul className="space-y-3">
              {footerLinks.serviceAreas.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/50 hover:text-white transition-colors text-sm">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Taqon Electrico. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-white/30 text-xs">
            <button onClick={onOpenPrivacy} className="hover:text-white transition-colors">Privacy Policy</button>
            <span>•</span>
            <button onClick={onOpenCookies} className="hover:text-white transition-colors">Cookie Policy</button>
            <span>•</span>
            <Link to="/contact" className="hover:text-white transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <p className="text-white/20 text-xs">
            Built by{' '}
            <a
              href="https://bitstudio.co.zw"
              onClick={(e) => confirmExternalNavigation('https://bitstudio.co.zw', e)}
              className="text-white/30 hover:text-taqon-orange transition-colors cursor-pointer"
            >
              Bit Studio
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
