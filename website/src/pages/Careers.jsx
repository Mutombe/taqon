import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, CaretDown, ArrowRight, Users, Heart, Lightning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { careers } from '../data/siteData';

export default function Careers() {
  const [openJob, setOpenJob] = useState(null);

  const handleApply = (jobTitle) => {
    toast.success(`Application interest noted for ${jobTitle}! Please email your CV to info@taqon.co.zw`);
  };

  return (
    <>
      <SEO
        title="Careers"
        description="Join Taqon Electrico's team of expert solar engineers and electrical technicians. View open positions and start your career in renewable energy."
        keywords="solar jobs Zimbabwe, electrical engineer jobs Harare, careers Taqon Electrico, renewable energy careers"
        canonical="https://www.taqon.co.zw/careers"
      />

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Join Our Team</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Build Your <span className="text-gradient">Career</span>
              <br />With Us
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Be part of Zimbabwe's clean energy revolution. We're looking for passionate, skilled professionals.
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
                    <item.icon size={24} className="text-taqon-orange" />
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
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Open <span className="text-gradient">Positions</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-4">
            {careers.map((job, i) => (
              <AnimatedSection key={job.id} delay={i * 0.1}>
                <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden hover:border-taqon-orange/20 transition-all">
                  <button
                    onClick={() => setOpenJob(openJob === job.id ? null : job.id)}
                    className="w-full p-6 flex items-center justify-between text-left"
                  >
                    <div>
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
                          <button
                            onClick={() => handleApply(job.title)}
                            className="mt-6 inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all"
                          >
                            Apply Now <ArrowRight size={14} />
                          </button>
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
              <p className="text-sm text-taqon-muted mt-2">Send your CV to <a href="mailto:info@taqon.co.zw" className="text-taqon-orange font-medium">info@taqon.co.zw</a> and we'll keep you in mind for future openings.</p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
