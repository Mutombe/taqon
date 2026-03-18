import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Trophy,
  CheckCircle,
  ArrowRight,
  Sun,
  BatteryFull,
  Cpu,
  Wrench,
  Users,
  Lightning,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import SEO from '../components/SEO';
import { autoLink } from '../components/ContentLink';
import AnimatedSection from '../components/AnimatedSection';

const certifications = [
  {
    icon: Shield,
    logo: '/zera.png',
    title: 'ZERA Recommended',
    issuer: 'Zimbabwe Energy Regulatory Authority',
    description:
      'Taqon Electrico is officially recommended by ZERA as a certified solar installation company in Zimbabwe. This certification ensures compliance with national energy regulations, quality standards, and consumer protection requirements.',
    highlights: ['Licensed solar installer', 'Regulatory compliance', 'Consumer protection assured'],
  },
  {
    icon: Trophy,
    logo: '/iso.png',
    title: 'ISO 9001:2015',
    issuer: 'International Organization for Standardization',
    description:
      'Our quality management system meets ISO 9001:2015 standards, ensuring consistent delivery of products and services that meet customer and regulatory requirements across all our operations.',
    highlights: ['Quality management system', 'Continuous improvement', 'Customer satisfaction focus'],
  },
  {
    icon: CheckCircle,
    logo: '/energy-logo.png',
    title: 'Electrical Contractors License',
    issuer: 'Ministry of Energy & Power Development',
    description:
      'Fully licensed to carry out electrical installation, maintenance, and repair work across all sectors including residential, commercial, and industrial projects in Zimbabwe.',
    highlights: ['All-sector clearance', 'Residential & commercial', 'Industrial grade certified'],
  },
  {
    icon: Shield,
    logo: '/nssa.png',
    title: 'Health & Safety Compliance',
    issuer: 'NSSA — National Social Security Authority',
    description:
      'We maintain full compliance with NSSA occupational health and safety standards, ensuring all installations are carried out safely with proper risk assessment, PPE, and safety protocols.',
    highlights: ['Workplace safety', 'Risk assessments', 'NSSA compliant'],
  },
];

const brandPartners = [
  {
    name: 'Jinko Solar',
    icon: Sun,
    logo: '/jinko.png',
    tier: 'Tier 1 Manufacturer',
    description:
      'World-leading solar panel manufacturer. Jinko Solar panels deliver industry-leading efficiency and durability, backed by 25-year performance warranties. We are an authorized Jinko dealer in Zimbabwe.',
  },
  {
    name: 'Pylontech',
    icon: BatteryFull,
    logo: '/pylontech.png',
    tier: 'Premium Battery Partner',
    description:
      'A global leader in lithium battery energy storage. Pylontech batteries offer 6,000+ cycle life, smart BMS technology, and stackable modular design for scalable home and commercial storage solutions.',
  },
  {
    name: 'Dyness',
    icon: BatteryFull,
    logo: '/Dyness.png',
    tier: 'Energy Storage Partner',
    description:
      'Innovative lithium-ion battery manufacturer specializing in residential and commercial energy storage. Dyness systems are known for reliability, sleek design, and seamless integration with solar inverters.',
  },
  {
    name: 'Kodak',
    icon: Cpu,
    logo: null,
    tier: 'Inverter Partner',
    description:
      'Kodak solar inverters combine proven technology with advanced MPPT charge controllers for maximum solar harvest. Their OG series delivers exceptional performance for off-grid and hybrid installations.',
  },
  {
    name: 'Sigenergy',
    icon: Sun,
    logo: '/sigenergy.png',
    tier: 'Smart Energy Partner',
    description:
      'Sigenergy delivers intelligent energy management solutions combining solar, storage, and EV charging into one seamless ecosystem. Their cutting-edge technology enables smart homes and businesses across Zimbabwe.',
  },
  {
    name: 'Sunsynk',
    icon: Cpu,
    logo: '/sunsynk.png',
    tier: 'Inverter Partner',
    description:
      'Sunsynk produces advanced hybrid inverters designed for residential and commercial use. Their systems offer seamless grid-tie and off-grid functionality with intelligent energy management and remote monitoring.',
  },
];

const teamQualifications = [
  {
    icon: Lightning,
    title: 'Electrical Engineering',
    description:
      'Our engineers hold qualifications from leading Zimbabwean institutions including the University of Zimbabwe and Harare Institute of Technology. Each technician is registered with the Zimbabwe Institution of Engineers (ZIE).',
    skills: ['System design & sizing', 'Electrical fault diagnosis', 'Load analysis', 'Power factor correction'],
  },
  {
    icon: Sun,
    title: 'Solar PV Specialization',
    description:
      'Our solar team has completed specialized training in photovoltaic system design, installation, and commissioning. We stay current with the latest solar technology through ongoing manufacturer training programs.',
    skills: ['PV system design', 'MPPT optimization', 'String sizing', 'Performance monitoring'],
  },
  {
    icon: Wrench,
    title: 'Installation & Maintenance',
    description:
      'Hands-on expertise built through 500+ successful installations across residential, commercial, and institutional projects. Our technicians are trained in safe working-at-height procedures and electrical safety.',
    skills: ['Rooftop mounting', 'BatteryFull commissioning', 'Preventive maintenance', 'Rapid fault response'],
  },
  {
    icon: Users,
    title: 'Project Management',
    description:
      'From initial site assessment to final handover, our project managers ensure every installation is delivered on time, within budget, and to the highest standards. We handle all logistics, permitting, and coordination.',
    skills: ['Site assessment', 'Timeline management', 'Client communication', 'Quality assurance'],
  },
];

export default function Certifications() {
  return (
    <>
      <SEO
        title="Certifications & Partners"
        description="Taqon Electrico's certifications, brand partnerships, and team qualifications. ZERA recommended solar installer with Jinko, Pylontech, Dyness, Kodak, JA Solar, and Deye partnerships."
        keywords="ZERA certified solar Zimbabwe, Jinko Solar dealer Zimbabwe, Pylontech Zimbabwe, solar certifications Harare, ISO certified electrical company"
        canonical="https://www.taqon.co.zw/certifications"
      />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-taqon-orange/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-taqon-gold/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Trust & Credentials
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white leading-tight">
              Certifications & <span className="text-gradient">Partners</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-2xl">
              {autoLink('Backed by industry certifications and partnerships with the world\'s leading solar brands, we deliver installations you can trust for decades.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Our Credentials
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Industry <span className="text-gradient">Certifications</span>
            </h2>
            <p className="mt-4 text-taqon-muted dark:text-white/50 max-w-2xl mx-auto">
              {autoLink('Every certification represents our commitment to quality, safety, and regulatory compliance in the solar and electrical engineering industry.')}
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {certifications.map((cert, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="bg-taqon-cream dark:bg-taqon-dark rounded-3xl p-8 border border-gray-100 dark:border-white/5 hover:border-taqon-orange/20 dark:hover:border-taqon-orange/20 transition-all duration-500 h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-white/10 p-2">
                      {cert.logo ? (
                        <img src={cert.logo} alt={cert.title} className="w-full h-full object-contain" />
                      ) : (
                        <cert.icon size={28} className="text-taqon-orange" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                        {cert.title}
                      </h3>
                      <p className="text-taqon-orange text-sm font-medium mt-0.5">{cert.issuer}</p>
                    </div>
                  </div>

                  <p className="mt-5 text-taqon-muted dark:text-white/50 text-sm leading-relaxed">
                    {autoLink(cert.description)}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {cert.highlights.map((highlight, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-taqon-charcoal dark:text-white/70 bg-white dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/10"
                      >
                        <CheckCircle size={12} className="text-taqon-orange" />
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Partners Section */}
      <section className="py-20 lg:py-28 bg-taqon-cream dark:bg-taqon-dark relative">
        <div className="absolute inset-0 mesh-gradient opacity-40 dark:opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Our Partners
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Trusted <span className="text-gradient">Brand Partners</span>
            </h2>
            <p className="mt-4 text-taqon-muted dark:text-white/50 max-w-2xl mx-auto">
              {autoLink('We partner exclusively with globally recognized, Tier 1 solar equipment manufacturers to ensure every installation delivers long-term performance and reliability.')}
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandPartners.map((brand, i) => (
              <AnimatedSection key={i} delay={i * 0.08}>
                <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-7 border border-gray-100 dark:border-white/5 hover:border-taqon-orange/20 dark:hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 h-full group">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-white/10 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-white/15 transition-colors border border-gray-100 dark:border-white/10 p-2 flex-shrink-0">
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                      ) : (
                        <brand.icon size={24} className="text-taqon-orange" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white text-lg">
                        {brand.name}
                      </h3>
                      <p className="text-xs text-taqon-orange font-medium">{brand.tier}</p>
                    </div>
                  </div>

                  <p className="text-sm text-taqon-muted dark:text-white/50 leading-relaxed">
                    {autoLink(brand.description)}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Team Qualifications Section */}
      <section className="py-20 lg:py-28 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              Our Expertise
            </span>
            <h2 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Team <span className="text-gradient">Qualifications</span>
            </h2>
            <p className="mt-4 text-taqon-muted dark:text-white/50 max-w-2xl mx-auto">
              {autoLink('Our team combines formal engineering qualifications with extensive hands-on experience across every aspect of solar and electrical installation.')}
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 gap-6">
            {teamQualifications.map((qual, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="bg-gradient-to-br from-taqon-cream to-white dark:from-taqon-dark dark:to-taqon-charcoal rounded-3xl p-8 border border-gray-100 dark:border-white/5 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-5">
                    <qual.icon size={24} className="text-taqon-orange" />
                  </div>

                  <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-3">
                    {qual.title}
                  </h3>

                  <p className="text-sm text-taqon-muted dark:text-white/50 leading-relaxed mb-5">
                    {autoLink(qual.description)}
                  </p>

                  <div className="space-y-2">
                    {qual.skills.map((skill, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-taqon-orange flex-shrink-0" />
                        <span className="text-taqon-charcoal dark:text-white/70">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-taqon-cream dark:bg-taqon-dark relative overflow-hidden">
        <div className="absolute inset-0 dark:dark-mesh" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-taqon-orange/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full px-4 py-1.5 mb-6">
              <Shield size={14} className="text-taqon-orange" />
              <span className="text-gray-500 dark:text-white/60 text-xs font-semibold uppercase tracking-wider">
                Certified & Trusted
              </span>
            </div>

            <h2 className="text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Ready to Go <span className="text-gradient">Solar?</span>
            </h2>
            <p className="mt-4 text-gray-500 dark:text-white/50 max-w-xl mx-auto">
              {autoLink('Work with a ZERA-certified team backed by the world\'s leading solar brands. Get a free consultation and custom system design today.')}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Get Free Consultation <ArrowRight size={18} />
              </Link>
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              >
                View Packages <ArrowSquareOut size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
