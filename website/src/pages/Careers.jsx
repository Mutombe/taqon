import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  MapPin,
  Clock,
  CaretDown,
  ArrowRight,
  Users,
  Heart,
  Lightning,
  WhatsappLogo,
  EnvelopeSimple,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import {
  careers,
  TAQON_PHONE_INTL,
  TAQON_EMAIL,
} from '../data/siteData';

// Sales Rep–specific WhatsApp + email copy. Pre-fills the message so a
// candidate can tap and send without retyping anything.
const APPLY_WA_MESSAGE =
  "Hi Taqon Electrico, I'd like to apply for the Sales Representative position. Please share next steps for sending my CV.";
const APPLY_WA_URL = `https://wa.me/${TAQON_PHONE_INTL}?text=${encodeURIComponent(APPLY_WA_MESSAGE)}`;
const APPLY_MAIL_SUBJECT = 'Application — Sales Representative Position';
const APPLY_MAIL_BODY =
  "Hi Taqon Electrico,\n\nI'd like to apply for the Sales Representative position. My CV is attached.\n\nName:\nPhone:\nLocation:\nRelevant experience:\n\nThank you,";
const APPLY_MAIL_URL = `mailto:${TAQON_EMAIL}?subject=${encodeURIComponent(APPLY_MAIL_SUBJECT)}&body=${encodeURIComponent(APPLY_MAIL_BODY)}`;

export default function Careers() {
  const [openJob, setOpenJob] = useState(careers[0]?.id ?? null);

  return (
    <>
      <SEO
        title="Careers — Sales Representative Position Open"
        description="Join Taqon Electrico's team. We're hiring a Sales Representative in Harare, Zimbabwe — connect with us via WhatsApp or email to apply."
        keywords="solar sales jobs Zimbabwe, sales rep Harare, careers Taqon Electrico, renewable energy careers"
        canonical="https://www.taqon.co.zw/careers"
      />

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-36 lg:pt-44 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Join Our Team</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Build Your <span className="text-gradient">Career</span>
              <br />With Us
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Be part of Zimbabwe's clean energy revolution. We're hiring a Sales Representative — apply directly via WhatsApp or email.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-16 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: 'Impact', desc: 'Make a real difference by powering homes and businesses with clean energy.' },
              { icon: Users, title: 'Growth', desc: 'Learn from experienced engineers and grow your career in renewable energy.' },
              { icon: Lightning, title: 'Innovation', desc: 'Work with cutting-edge solar technology from world-leading brands.' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="text-center p-8 rounded-3xl bg-taqon-cream dark:bg-taqon-dark border border-gray-100 dark:border-white/10">
                  <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon size={24} weight="duotone" className="text-taqon-orange" />
                  </div>
                  <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-taqon-muted dark:text-white/50">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-taqon-orange/10 text-taqon-orange text-xs font-semibold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-taqon-orange animate-pulse" />
              Now hiring
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Open <span className="text-gradient">Position</span>
            </h2>
            <p className="mt-3 text-sm text-taqon-muted dark:text-white/50">
              We have one vacancy. Tap below to apply via WhatsApp or email — no portal forms, just a direct line.
            </p>
          </AnimatedSection>

          <div className="space-y-4">
            {careers.map((job, i) => (
              <AnimatedSection key={job.id} delay={i * 0.1}>
                <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden hover:border-taqon-orange/30 transition-all shadow-sm hover:shadow-md">
                  <button
                    onClick={() => setOpenJob(openJob === job.id ? null : job.id)}
                    className="w-full p-6 flex items-center justify-between text-left"
                  >
                    <div className="min-w-0">
                      <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white text-lg">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-taqon-muted dark:text-white/50">
                        <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {job.type}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                      </div>
                    </div>
                    <CaretDown size={20} className={`text-taqon-orange transition-transform flex-shrink-0 ${openJob === job.id ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {openJob === job.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 border-t border-gray-100 dark:border-white/10 pt-4">
                          <p className="text-taqon-muted dark:text-white/60 text-sm leading-relaxed">{job.description}</p>
                          <h4 className="font-semibold text-taqon-charcoal dark:text-white mt-4 mb-2 text-sm">Requirements:</h4>
                          <div className="space-y-2">
                            {job.requirements.map((req, j) => (
                              <div key={j} className="flex items-start gap-2 text-sm text-taqon-muted dark:text-white/60">
                                <div className="w-1.5 h-1.5 rounded-full bg-taqon-orange mt-1.5 flex-shrink-0" />
                                {req}
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 grid sm:grid-cols-2 gap-3">
                            <a
                              href={APPLY_WA_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                            >
                              <WhatsappLogo size={18} weight="fill" />
                              Apply on WhatsApp
                            </a>
                            <a
                              href={APPLY_MAIL_URL}
                              className="inline-flex items-center justify-center gap-2 bg-taqon-orange hover:bg-taqon-orange/90 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md"
                            >
                              <EnvelopeSimple size={18} weight="fill" />
                              Email Your CV
                            </a>
                          </div>
                          <p className="mt-3 text-xs text-taqon-muted/70 dark:text-white/40 text-center">
                            Both buttons open with the position pre-filled. Just attach your CV.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="mt-12 text-center">
            <div className="bg-white dark:bg-taqon-charcoal rounded-2xl p-8 border border-gray-100 dark:border-white/10">
              <h3 className="font-bold font-syne text-taqon-charcoal dark:text-white">Don't see your role?</h3>
              <p className="text-sm text-taqon-muted mt-2">
                Send your CV to{' '}
                <a href={`mailto:${TAQON_EMAIL}`} className="text-taqon-orange font-medium">
                  {TAQON_EMAIL}
                </a>{' '}
                and we'll keep you in mind for future openings.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
