import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Eye, Users, Award, ChevronDown, ArrowRight, MapPin, Shield, Lightbulb } from 'lucide-react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import JsonLd, { faqSchema } from '../components/JsonLd';
import { stats, faqs, companyInfo } from '../data/siteData';
import aboutImg from '../assets/about-taqon-electrico.jpg';
import teamImg from '../assets/2.jpg';

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

      {/* Hero */}
      {/* Vision: Warm, inviting hero with the team photo. The image should show the
          Taqon team in their orange uniforms — professional, approachable, skilled. */}
      <section className="relative min-h-[70vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0">
          <img src={aboutImg} alt="Taqon Electrico Team" className="w-full h-full object-cover opacity-30" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-taqon-dark via-taqon-dark/90 to-taqon-dark/70" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">About Us</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white leading-tight">
              Welcome to <span className="text-gradient">Taqon Electrico</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-2xl">
              For over 5 years, we've been a team of engineers specialising in solar and electrical 
              installations, serving dozens of clients across Zimbabwe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      {/* Vision: Clean, spacious layout with the company story. Large text, warm tones,
          professional photography of the team at work. */}
      <section className="py-20 lg:py-32 bg-taqon-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedSection variant="fadeLeft">
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Our Story</span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal">
                Engineering Excellence Since <span className="text-gradient">2019</span>
              </h2>
              <div className="mt-6 space-y-4 text-taqon-muted leading-relaxed">
                <p>
                  Our solar and electrical technicians have helped hundreds of people enjoy the benefits of 
                  reliable electricity by installing high-quality solar and electrical hardware.
                </p>
                <p>
                  We make use of high quality solar and electrical equipment as well as high standard operating 
                  procedures. Our installations always exceed our clients' expectations, ensuring that solar or 
                  electrical faults are rare.
                </p>
                <p>
                  Although we are based in Harare, we have clients all over Zimbabwe. We have done installations 
                  for NGOs like Clinton Health Access Initiative and Childline. We've served companies like City 
                  Plastics Harare, Thuli Service Station, Keepnet, and Maloloud Investments.
                </p>
                <p>
                  Our solar installation services are recommended by the Zimbabwe Energy Regulatory Authority (ZERA), 
                  and as a result new clients do not hesitate to trust us with their projects.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection variant="fadeRight">
              <div className="relative">
                <img src={teamImg} alt="Taqon team member at work" className="rounded-3xl w-full h-[500px] object-cover" loading="lazy" />
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                      <Shield size={24} className="text-taqon-orange" />
                    </div>
                    <div>
                      <p className="font-bold text-taqon-charcoal font-syne">ZERA Recommended</p>
                      <p className="text-xs text-taqon-muted">Official certification</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div className="text-center p-6">
                <div className="text-3xl lg:text-4xl font-bold font-syne text-gradient">{stat.value}</div>
                <p className="mt-2 text-white/50 text-sm">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      {/* Vision: Two elegant cards side by side — mission on one, vision on the other.
          Clean glass-morphic design with icon accents. */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold font-syne text-taqon-charcoal">
              Our <span className="text-gradient">Mission & Vision</span>
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedSection delay={0.1}>
              <div className="bg-gradient-to-br from-taqon-orange/5 to-taqon-amber/5 rounded-3xl p-10 border border-taqon-orange/10 h-full">
                <div className="w-16 h-16 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-6">
                  <Target size={28} className="text-taqon-orange" />
                </div>
                <h3 className="text-2xl font-bold font-syne text-taqon-charcoal mb-4">Our Mission</h3>
                <p className="text-taqon-muted leading-relaxed">
                  To provide our customers with dependable, safe, high quality, and cost-effective 
                  power solutions, and where permissible offer alternatives for green and renewable 
                  energy power solutions that transform lives and communities.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-gradient-to-br from-taqon-charcoal to-taqon-gray rounded-3xl p-10 h-full">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <Eye size={28} className="text-taqon-orange" />
                </div>
                <h3 className="text-2xl font-bold font-syne text-white mb-4">Our Vision</h3>
                <p className="text-white/60 leading-relaxed">
                  To be Zimbabwe's leading solar and electrical engineering company, driving the 
                  transition to clean energy and empowering every home, business, and institution 
                  with reliable, sustainable power solutions.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-taqon-cream relative">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal">
              What Drives <span className="text-gradient">Us</span>
            </h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Quality First', desc: 'Only premium equipment and rigorous standards in every installation.' },
              { icon: Users, title: 'Customer Focus', desc: 'Customer is King — your satisfaction drives everything we do.' },
              { icon: Lightbulb, title: 'Innovation', desc: 'Embracing the latest solar technology for optimal performance.' },
              { icon: Award, title: 'Excellence', desc: 'ZERA recommended with a track record of 500+ successful projects.' },
            ].map((value, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-7 border border-gray-100 hover:border-taqon-orange/20 hover:shadow-lg transition-all duration-500 text-center h-full">
                  <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-5">
                    <value.icon size={24} className="text-taqon-orange" />
                  </div>
                  <h4 className="font-bold font-syne text-taqon-charcoal">{value.title}</h4>
                  <p className="mt-2 text-sm text-taqon-muted">{value.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">FAQ</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <AnimatedSection key={i} delay={i * 0.05}>
                <div className="bg-taqon-cream rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-taqon-charcoal pr-4">{faq.question}</span>
                    <ChevronDown
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
                        <p className="px-5 pb-5 text-sm text-taqon-muted leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-white">Ready to work with us?</h2>
            <p className="mt-3 text-white/50 max-w-lg mx-auto">Let our team of experts handle your solar and electrical needs.</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold mt-8 hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
            >
              Get in Touch <ArrowRight size={18} />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
