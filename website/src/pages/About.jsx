import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Crosshair, Eye, Users, Trophy, CaretDown, ArrowRight, MapPin, Shield,
  Lightbulb, Phone, WhatsappLogo, HandWaving, Buildings, Handshake,
  SolarPanel, BatteryFull, Circuitry, Plug, Crown, Clock, Certificate, ArrowSquareOut,
} from '@phosphor-icons/react';
import AnimatedSection, { AnimatedCounter, StaggerContainer, StaggerItem } from '../components/AnimatedSection';
import ContentLink, { autoLink, confirmExternalNavigation } from '../components/ContentLink';
import SEO from '../components/SEO';
import JsonLd, { faqSchema } from '../components/JsonLd';
import { stats, faqs, companyInfo, brands } from '../data/siteData';
import aboutImg from '../assets/about-taqon-electrico.jpg';

// Notable clients data
const clients = [
  { name: 'Clinton Health Access Initiative', type: 'NGO', logo: '/Clinton_Health_Access_Initiative.webp', website: 'https://www.clintonhealthaccess.org' },
  { name: 'Childline Zimbabwe', type: 'NGO', logo: '/childline.png', website: 'https://www.childline.org.zw' },
  { name: 'City Plastics Harare', type: 'Manufacturing', logo: null, website: null },
  { name: 'Thuli Service Station', type: 'Commercial', logo: '/thuli.png', website: null },
  { name: 'Keepnet', type: 'Technology', logo: '/keepnet.png', website: null },
  { name: 'Maloloud Investments', type: 'Investment', logo: null, website: null },
];

// Product categories for the "Shop By Category" section
const shopCategories = [
  { name: 'Solar Panels', desc: 'Reliable Panels', warranty: 'Up to 25 Years Warranty', icon: SolarPanel, to: '/shop?category=panels' },
  { name: 'Batteries', desc: 'Durable Batteries', warranty: 'Up to 5 Years Warranty', icon: BatteryFull, to: '/shop?category=batteries' },
  { name: 'Inverters', desc: 'High Voltage Inverters', warranty: 'Up to 5 Years Warranty', icon: Circuitry, to: '/shop?category=inverters' },
  { name: 'Accessories', desc: 'Solar Accessories', warranty: 'Up to 2 Years Warranty', icon: Plug, to: '/shop?category=accessories' },
];

export default function About() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <SEO
        title="About Us"
        description="Learn about Taqon Electrico - Zimbabwe's trusted solar and electrical engineering team. 5+ years of expert solar installations and electrical services."
        keywords="about Taqon Electrico, solar company Zimbabwe, electrical engineers Harare, ZERA recommended"
        canonical="https://www.taqon.co.zw/about-us"
      />
      <JsonLd data={faqSchema(faqs)} />

      {/* ─── Hero: Welcome ─── */}
      <section className="relative min-h-[75vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img src={aboutImg} alt="Taqon Electrico Team" className="w-full h-full object-cover opacity-30" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-taqon-dark/60 via-taqon-dark/80 to-taqon-dark" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-taqon-orange/15 border border-taqon-orange/20 rounded-full px-4 py-2 mb-6">
                <HandWaving size={20} className="text-taqon-orange" weight="fill" />
                <span className="text-taqon-orange text-sm font-semibold">Hello! Welcome</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold font-syne text-white leading-tight">
                Welcome to{' '}
                <span className="text-gradient">Taqon Electrico</span>
              </h1>
              <p className="mt-4 text-xl text-white/70 font-medium">
                We are Solar and Electrical Installers. It's a pleasure to meet you.
              </p>
              <p className="mt-4 text-white/50 text-lg leading-relaxed max-w-xl">
                {autoLink('Thank you for taking the time to learn about us and our solar and electrical installation services. Here\'s what we are all about.')}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-taqon-orange text-white px-7 py-3.5 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
                >
                  Get in Touch <ArrowRight size={16} weight="bold" />
                </Link>
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 bg-white/10 text-white px-7 py-3.5 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/10"
                >
                  View Projects
                </Link>
              </div>
            </motion.div>

            {/* Floating stat cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-4">
                <Link to="/certifications">
                  <motion.div
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 hover:border-taqon-orange/30 transition-all cursor-pointer"
                  >
                    <ArrowSquareOut size={14} className="absolute top-3 right-3 text-white/20 group-hover:text-taqon-orange transition-colors" />
                    <img src="/zera.png" alt="ZERA" className="h-8 w-auto object-contain brightness-0 invert mb-3" />
                    <p className="font-bold text-white font-syne text-lg">ZERA</p>
                    <p className="text-xs text-white/50 mt-1">Recommended Company</p>
                  </motion.div>
                </Link>
                <Link to="/projects">
                  <motion.div
                    animate={{ y: [5, -5, 5] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    className="group relative bg-taqon-orange/20 backdrop-blur-md rounded-2xl p-6 border border-taqon-orange/30 hover:border-taqon-orange/50 transition-all cursor-pointer"
                  >
                    <ArrowSquareOut size={14} className="absolute top-3 right-3 text-white/20 group-hover:text-white transition-colors" />
                    <Trophy size={28} className="text-taqon-orange mb-3" weight="fill" />
                    <p className="font-bold text-white font-syne text-lg">500+</p>
                    <p className="text-xs text-white/50 mt-1">Projects Completed</p>
                  </motion.div>
                </Link>
                <Link to="/about-us">
                  <motion.div
                    animate={{ y: [3, -7, 3] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 hover:border-taqon-orange/30 transition-all cursor-pointer"
                  >
                    <ArrowSquareOut size={14} className="absolute top-3 right-3 text-white/20 group-hover:text-taqon-orange transition-colors" />
                    <Clock size={28} className="text-taqon-orange mb-3" />
                    <p className="font-bold text-white font-syne text-lg">5+ Years</p>
                    <p className="text-xs text-white/50 mt-1">Industry Experience</p>
                  </motion.div>
                </Link>
                <Link to="/solutions">
                  <motion.div
                    animate={{ y: [-3, 7, -3] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15 hover:border-taqon-orange/30 transition-all cursor-pointer"
                  >
                    <ArrowSquareOut size={14} className="absolute top-3 right-3 text-white/20 group-hover:text-taqon-orange transition-colors" />
                    <Certificate size={28} className="text-taqon-orange mb-3" />
                    <p className="font-bold text-white font-syne text-lg">Nationwide</p>
                    <p className="text-xs text-white/50 mt-1">Service Coverage</p>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Our Story ─── */}
      <section className="py-20 lg:py-28 bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/chisipiti-10kva-1.jpg" alt="" className="w-full h-full object-cover opacity-[0.04] dark:opacity-[0.08]" loading="lazy" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Main narrative — 3 cols */}
            <div className="lg:col-span-3">
              <AnimatedSection variant="fadeUp">
                <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Our Story</span>
                <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-[var(--text-primary)]">
                  Engineering Excellence Since <span className="text-gradient">2019</span>
                </h2>
              </AnimatedSection>

              <AnimatedSection variant="fadeUp" delay={0.1}>
                <div className="mt-8 space-y-5 text-[var(--text-secondary)] leading-relaxed text-[1.05rem]">
                  <p>
                    For the past 5+ years we have been a team of engineers doing{' '}
                    <ContentLink to="/solutions/solar-installations">solar</ContentLink> and{' '}
                    <ContentLink to="/solutions/electrical-maintenance">electrical</ContentLink>{' '}
                    installations, serving dozens of clients in homes, schools, companies, churches and industries.
                    Our Solar and Electrical technicians have helped many people enjoy the benefits of using
                    reliable electricity by installing high quality{' '}
                    <ContentLink to="/solutions/electrical-hardware">solar and electrical hardware</ContentLink>.
                  </p>

                  <p>
                    We make use of high quality solar and electrical equipment as well as high standard operating
                    procedures. Our installations always exceed our clients' expectations — solar or electrical
                    faults are rare. We source our{' '}
                    <ContentLink to="/shop?category=panels">solar panels</ContentLink> from tier-1 manufacturers
                    like Jinko Solar and JA Solar, our{' '}
                    <ContentLink to="/shop?category=batteries">batteries</ContentLink> from Pylontech and Dyness,
                    and our{' '}
                    <ContentLink to="/shop?category=inverters">inverters</ContentLink> from Kodak, Deye, and Sunsynk.
                  </p>

                  <p>
                    Although we are based in Harare, we have clients all over Zimbabwe. We have done installations
                    for NGOs like{' '}
                    <ContentLink href="https://www.clintonhealthaccess.org" external>
                      Clinton Health Access Initiative
                    </ContentLink>{' '}
                    and{' '}
                    <ContentLink href="https://www.childline.org.zw" external>
                      Childline
                    </ContentLink>.
                    We've served companies like <strong className="text-[var(--text-primary)] font-semibold">City Plastics Harare</strong>,{' '}
                    <strong className="text-[var(--text-primary)] font-semibold">Thuli Service Station</strong>,{' '}
                    <strong className="text-[var(--text-primary)] font-semibold">Keepnet</strong>, and{' '}
                    <strong className="text-[var(--text-primary)] font-semibold">Maloloud Investments</strong>.
                  </p>

                  <p>
                    Our{' '}
                    <ContentLink to="/solutions/solar-installations">solar installation services</ContentLink>{' '}
                    are recommended by the{' '}
                    <ContentLink href="https://www.zera.co.zw" external>
                      Zimbabwe Energy Regulatory Authority (ZERA)
                    </ContentLink>,
                    and as a result new clients do not hesitate to trust us with their projects. You can also see
                    some of our{' '}
                    <ContentLink to="/projects">Solar and Electrical Projects</ContentLink>.
                  </p>
                </div>
              </AnimatedSection>

              {/* CTA inline */}
              <AnimatedSection variant="fadeUp" delay={0.2}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
                  >
                    Solar Shop <ArrowRight size={14} weight="bold" />
                  </Link>
                  <Link
                    to="/projects"
                    className="inline-flex items-center gap-2 border border-[var(--card-border)] text-[var(--text-secondary)] px-6 py-3 rounded-full font-semibold text-sm hover:border-taqon-orange/30 hover:text-taqon-orange transition-all"
                  >
                    Previous Projects <ArrowRight size={14} />
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            {/* Sidebar — 2 cols: Notable Clients */}
            <div className="lg:col-span-2">
              <AnimatedSection variant="fadeRight" delay={0.2}>
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                      <Handshake size={20} className="text-taqon-orange" />
                    </div>
                    <h3 className="font-bold font-syne text-[var(--text-primary)]">Notable Clients</h3>
                  </div>

                  <div className="space-y-3">
                    {clients.map((client, i) => {
                      const handleClick = (e) => {
                        if (client.website) {
                          confirmExternalNavigation(client.website, e);
                        } else {
                          e.preventDefault();
                          toast.info(`Oops! ${client.name} has no notable website.`);
                        }
                      };
                      return (
                        <a
                          key={i}
                          href={client.website || '#'}
                          onClick={handleClick}
                          className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-transparent hover:border-taqon-orange/10 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            {client.logo ? (
                              <img src={client.logo} alt={client.name} className="w-7 h-7 object-contain rounded flex-shrink-0 dark:brightness-0 dark:invert dark:opacity-60" />
                            ) : (
                              <div className="w-7 h-7 rounded bg-gradient-to-br from-taqon-orange/20 to-taqon-amber/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-taqon-orange">{client.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-taqon-orange transition-colors">{client.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full">
                              {client.type}
                            </span>
                            <ArrowSquareOut size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-taqon-orange transition-all" />
                          </div>
                        </a>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-6 border-t border-[var(--card-border)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Certificate size={16} className="text-taqon-orange" />
                      <span>Trusted by NGOs, companies & institutions across Zimbabwe</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Brand Partners */}
              <AnimatedSection variant="fadeRight" delay={0.3}>
                <div className="mt-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8">
                  <h4 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-5">
                    Brand Partners
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { name: 'Jinko Solar', logo: '/jinko.png', href: 'https://www.jinkosolar.com' },
                      { name: 'Pylontech', logo: '/pylontech.png', href: 'https://www.pylontech.com.cn' },
                      { name: 'Dyness', logo: '/Dyness.png', href: 'https://www.dyness.com' },
                      { name: 'Sigenergy', logo: '/sigenergy.png', href: 'https://www.sigenergy.com' },
                      { name: 'Sunsynk', logo: '/sunsynk.png', href: 'https://www.sunsynk.com' },
                    ].map((brand) => (
                      <a
                        key={brand.name}
                        href={brand.href}
                        onClick={(e) => confirmExternalNavigation(brand.href, e)}
                        className="group relative flex items-center justify-center p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--card-border)] hover:border-taqon-orange/20 transition-all cursor-pointer"
                      >
                        <ArrowSquareOut size={10} className="absolute top-1.5 right-1.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-taqon-orange transition-all" />
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="h-8 w-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity dark:brightness-0 dark:invert dark:opacity-50 dark:group-hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4">
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const statLinks = {
                'Projects Completed': '/projects',
                'kWp PV Modules Installed': '/solutions/solar-installations',
                'kWh Battery Storage': '/shop?category=batteries',
                'Years Experience': '/about-us',
              };
              const linkTo = statLinks[stat.label] || '/';
              return (
                <StaggerItem key={i}>
                  <Link to={linkTo} className="block group">
                    <div className="relative text-center p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-taqon-orange/30 transition-all">
                      <ArrowSquareOut size={14} className="absolute top-3 right-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-taqon-orange transition-all" />
                      <div className="text-3xl lg:text-4xl font-bold font-syne text-taqon-orange">
                        <AnimatedCounter value={stat.value} />
                      </div>
                      <p className="mt-2 text-[var(--text-muted)] text-sm group-hover:text-taqon-orange/70 transition-colors">{stat.label}</p>
                    </div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Mission & Vision ─── */}
      <section className="py-20 lg:py-28 bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/kadoma-24kva-2.jpg" alt="" className="w-full h-full object-cover opacity-[0.04] dark:opacity-[0.08]" loading="lazy" />
        </div>
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16 relative">
            <h2 className="text-3xl lg:text-5xl font-bold font-syne text-[var(--text-primary)]">
              Our <span className="text-gradient">Mission & Vision</span>
            </h2>
          </AnimatedSection>

          <div className="relative grid md:grid-cols-2 gap-8">
            <AnimatedSection delay={0.1}>
              <div className="bg-gradient-to-br from-taqon-orange/5 to-taqon-amber/5 dark:from-taqon-orange/10 dark:to-transparent rounded-3xl p-10 border border-taqon-orange/10 h-full">
                <div className="w-16 h-16 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-6">
                  <Crosshair size={28} className="text-taqon-orange" />
                </div>
                <h3 className="text-2xl font-bold font-syne text-[var(--text-primary)] mb-4">Our Mission</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {autoLink('To provide our customers with dependable, safe, high quality, and cost-effective power solutions, and where permissible offer alternatives for green and renewable energy power solutions that transform lives and communities.')}
                </p>
                <div className="mt-6 space-y-2">
                  {['Dependable power solutions', 'Green & renewable energy', 'Transforming communities'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-taqon-orange" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-gradient-to-br from-taqon-charcoal to-taqon-dark rounded-3xl p-10 h-full">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Eye size={28} className="text-taqon-orange" />
                </div>
                <h3 className="text-2xl font-bold font-syne text-white mb-4">Our Vision</h3>
                <p className="text-white/60 leading-relaxed">
                  To be Zimbabwe's leading{' '}
                  <ContentLink to="/solutions/solar-installations" className="!text-taqon-orange/80 hover:!text-taqon-orange !decoration-taqon-orange/30">
                    solar
                  </ContentLink>{' '}
                  and{' '}
                  <ContentLink to="/solutions/electrical-maintenance" className="!text-taqon-orange/80 hover:!text-taqon-orange !decoration-taqon-orange/30">
                    electrical
                  </ContentLink>{' '}
                  engineering company, driving the transition to clean energy and empowering every
                  home, business, and institution with reliable, sustainable power solutions.
                </p>
                <div className="mt-6 space-y-2">
                  {["Zimbabwe's leading solar company", 'Clean energy transition', 'Empowering every home & business'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-taqon-orange" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Shop By Category ─── */}
      <section className="py-20 lg:py-28 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-14">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Products</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-[var(--text-primary)]">
              Shop By Category
            </h2>
            <p className="mt-3 text-[var(--text-muted)] max-w-lg mx-auto">
              Browse our range of quality{' '}
              <ContentLink to="/solutions/electrical-hardware">solar and electrical products</ContentLink>{' '}
              — all backed by manufacturer warranties.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {shopCategories.map((cat, i) => {
              const CatIcon = cat.icon;
              return (
                <AnimatedSection key={cat.name} variant="fadeUp" delay={i * 0.1}>
                  <Link
                    to={cat.to}
                    className="group block p-6 lg:p-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-taqon-orange/30 transition-all duration-300 hover:shadow-lg hover:shadow-taqon-orange/5 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-taqon-orange/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-taqon-orange/20 transition-colors">
                      <CatIcon size={28} className="text-taqon-orange" />
                    </div>
                    <h3 className="font-bold font-syne text-[var(--text-primary)] mb-1">{cat.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{cat.desc}</p>
                    <p className="text-xs text-taqon-orange/70 mt-1 font-medium">{cat.warranty}</p>
                    <div className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-taqon-orange opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse <ArrowRight size={14} />
                    </div>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-20 lg:py-28 bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/shawasha-hills-16kva-2.jpg" alt="" className="w-full h-full object-cover opacity-[0.04] dark:opacity-[0.08]" loading="lazy" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <Crown size={24} className="text-taqon-orange" weight="fill" />
              <span className="text-taqon-orange text-sm font-bold uppercase tracking-[0.15em]">Customer is King!</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-[var(--text-primary)]">
              What Drives <span className="text-gradient">Us</span>
            </h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Quality First', desc: 'Only premium equipment and rigorous standards in every installation.' },
              { icon: Users, title: 'Customer Focus', desc: 'Customer is King — your satisfaction drives everything we do.' },
              { icon: Lightbulb, title: 'Innovation', desc: 'Embracing the latest solar technology for optimal performance.' },
              { icon: Trophy, title: 'Excellence', desc: 'ZERA recommended with a track record of 500+ successful projects.' },
            ].map((value, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="bg-[var(--card-bg)] rounded-2xl p-7 border border-[var(--card-border)] hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 text-center h-full">
                  <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-5">
                    <value.icon size={24} className="text-taqon-orange" />
                  </div>
                  <h4 className="font-bold font-syne text-[var(--text-primary)]">{value.title}</h4>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{autoLink(value.desc)}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Solutions Overview ─── */}
      <section className="py-20 lg:py-28 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-14">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">What We Do</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-[var(--text-primary)]">
              Our <span className="text-gradient">Solutions</span>
            </h2>
            <p className="mt-3 text-[var(--text-muted)] max-w-2xl mx-auto">
              From{' '}
              <ContentLink to="/solutions/solar-installations">solar installations</ContentLink>{' '}
              and{' '}
              <ContentLink to="/solutions/electrical-maintenance">electrical maintenance</ContentLink>{' '}
              to{' '}
              <ContentLink to="/solutions/borehole-pump-installations">borehole pump installations</ContentLink>{' '}
              and{' '}
              <ContentLink to="/solutions/lighting-solutions">lighting solutions</ContentLink>{' '}
              — we cover every aspect of solar and electrical engineering.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Solar Installations', desc: 'All sizes — from basic lighting to whole-house and commercial systems.', to: '/solutions/solar-installations', icon: '☀️' },
              { title: 'Electrical Maintenance', desc: 'Wiring, circuit separations, power upgrades, and emergency fault repair.', to: '/solutions/electrical-maintenance', icon: '⚡' },
              { title: 'Solar Maintenance', desc: 'Panel cleaning, inverter calibration, battery testing, and technical reports.', to: '/solutions/solar-system-maintenance', icon: '🔧' },
              { title: 'Borehole Pumps', desc: 'Solar-powered borehole pump sizing, installation, and automation.', to: '/solutions/borehole-pump-installations', icon: '💧' },
              { title: 'Electrical Hardware', desc: 'Quality equipment from trusted brands with competitive pricing.', to: '/solutions/electrical-hardware', icon: '📦' },
              { title: 'Lighting Solutions', desc: 'Design, supply, and installation for residential, commercial, and events.', to: '/solutions/lighting-solutions', icon: '💡' },
            ].map((sol, i) => (
              <AnimatedSection key={sol.to} variant="fadeUp" delay={i * 0.08}>
                <Link
                  to={sol.to}
                  className="group flex gap-4 p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-taqon-orange/20 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-2xl flex-shrink-0 mt-0.5">{sol.icon}</span>
                  <div>
                    <h3 className="font-bold font-syne text-[var(--text-primary)] group-hover:text-taqon-orange transition-colors">
                      {sol.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">{autoLink(sol.desc)}</p>
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-taqon-orange opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 lg:py-28 bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">FAQ</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-[var(--text-primary)]">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <AnimatedSection key={i} delay={i * 0.05}>
                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-[var(--text-primary)] pr-4">{faq.question}</span>
                    <CaretDown
                      size={20}
                      className={`flex-shrink-0 text-taqon-orange transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm text-[var(--text-muted)] leading-relaxed">{autoLink(faq.answer)}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact CTA ─── */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/bulawayo-16kva-2.jpg" alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-taqon-dark/85" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection variant="fadeUp">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <Crown size={20} className="text-taqon-orange" weight="fill" />
                <span className="text-taqon-orange text-sm font-bold">Customer is King!</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold font-syne text-white">
                Ready to Work With Us?
              </h2>
              <p className="mt-4 text-white/50 text-lg leading-relaxed">
                Let our team of experts handle your{' '}
                <ContentLink to="/solutions/solar-installations" className="!text-taqon-orange/80 hover:!text-taqon-orange !decoration-taqon-orange/30">
                  solar
                </ContentLink>{' '}
                and{' '}
                <ContentLink to="/solutions/electrical-maintenance" className="!text-taqon-orange/80 hover:!text-taqon-orange !decoration-taqon-orange/30">
                  electrical
                </ContentLink>{' '}
                needs.
              </p>

              {/* Contact cards */}
              <div className="mt-10 grid sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <MapPin size={24} className="text-taqon-orange" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">Visit Us</p>
                    <p className="text-white/50 text-xs mt-1">{companyInfo.visitAddress}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <Phone size={24} className="text-taqon-orange" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">Call Us</p>
                    <p className="text-white/50 text-xs mt-1">{companyInfo.landline}</p>
                    <p className="text-white/50 text-xs">{companyInfo.phone[0]}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10">
                  <WhatsappLogo size={24} className="text-taqon-orange" />
                  <div>
                    <p className="text-white/80 text-sm font-medium">WhatsApp</p>
                    <p className="text-white/50 text-xs mt-1">{companyInfo.phone[1]}</p>
                    <p className="text-white/50 text-xs">{companyInfo.phone[0]}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-3.5 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25"
                >
                  Contact Us <ArrowRight size={16} weight="bold" />
                </Link>
                <a
                  href="https://wa.me/263772771036"
                  onClick={(e) => confirmExternalNavigation('https://wa.me/263772771036', e)}
                  className="inline-flex items-center gap-2 bg-white/10 text-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/10 cursor-pointer"
                >
                  <WhatsappLogo size={18} weight="fill" /> WhatsApp Us
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
