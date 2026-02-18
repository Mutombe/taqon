import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, MessageSquare, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import JsonLd, { localBusinessSchema } from '../components/JsonLd';
import { companyInfo } from '../data/siteData';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
      setForm({ name: '', email: '', phone: '', service: '', message: '' });
      setSending(false);
    }, 1500);
  };

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Taqon Electrico for free solar consultations, quotes, and expert electrical services in Harare, Zimbabwe."
        keywords="contact Taqon Electrico, solar quote Harare, electrician Zimbabwe, solar consultation"
        canonical="https://www.taqon.co.zw/contact"
      />

      <JsonLd data={localBusinessSchema()} />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Get in Touch</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              Contact <span className="text-gradient">Us</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Ready to go solar? Get a free consultation and quote from our expert team.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 lg:py-24 bg-taqon-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <AnimatedSection>
                <h2 className="text-2xl font-bold font-syne text-taqon-charcoal mb-6">Let's Talk</h2>

                <div className="space-y-5">
                  <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-taqon-orange group-hover:text-white transition-all">
                      <MapPin size={20} className="text-taqon-orange group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-taqon-charcoal">Visit Us</p>
                      <p className="text-sm text-taqon-muted mt-0.5">{companyInfo.visitAddress}</p>
                    </div>
                  </a>

                  <a href={`tel:${companyInfo.phone[0]}`} className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-taqon-orange transition-all">
                      <Phone size={20} className="text-taqon-orange group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-taqon-charcoal">Call Us</p>
                      <p className="text-sm text-taqon-muted mt-0.5">{companyInfo.phone[0]}</p>
                      <p className="text-sm text-taqon-muted">{companyInfo.phone[1]}</p>
                    </div>
                  </a>

                  <a href={`mailto:${companyInfo.email}`} className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-taqon-orange transition-all">
                      <Mail size={20} className="text-taqon-orange group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-taqon-charcoal">Email Us</p>
                      <p className="text-sm text-taqon-muted mt-0.5">{companyInfo.email}</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={20} className="text-taqon-orange" />
                    </div>
                    <div>
                      <p className="font-semibold text-taqon-charcoal">Business Hours</p>
                      <p className="text-sm text-taqon-muted mt-0.5">Mon-Fri: {companyInfo.hours.weekday}</p>
                      <p className="text-sm text-taqon-muted">Sat: {companyInfo.hours.saturday}</p>
                      <p className="text-sm text-taqon-muted">Sun & Holidays: Closed</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href="https://wa.me/263772771036?text=Hi Taqon Electrico, I'd like to enquire about your services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 rounded-2xl font-semibold hover:bg-green-600 transition-all"
                >
                  <MessageSquare size={18} />
                  Chat on WhatsApp
                </a>

                {/* Map */}
                <div className="mt-8 rounded-2xl overflow-hidden border border-gray-200 h-[250px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3798.5!2d31.05!3d-17.82!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDQ5JzEyLjAiUyAzMcKwMDMnMDAuMCJF!5e0!3m2!1sen!2szw!4v1"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Taqon Electrico Location"
                  />
                </div>
              </AnimatedSection>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <AnimatedSection variant="fadeRight">
                <div className="bg-white rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-sm">
                  <h2 className="text-2xl font-bold font-syne text-taqon-charcoal mb-2">Send Us a Message</h2>
                  <p className="text-taqon-muted text-sm mb-8">Fill in the form and our team will respond within 24 hours.</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-taqon-cream border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal mb-1.5">Email *</label>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-taqon-cream border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal mb-1.5">Phone Number</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full bg-taqon-cream border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all"
                          placeholder="+263 7XX XXX XXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal mb-1.5">Service Needed</label>
                        <select
                          value={form.service}
                          onChange={(e) => setForm({ ...form, service: e.target.value })}
                          className="w-full bg-taqon-cream border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all"
                        >
                          <option value="">Select a service</option>
                          <option value="solar-installation">Solar Installation</option>
                          <option value="electrical-maintenance">Electrical Maintenance</option>
                          <option value="borehole-pump">Borehole Pump</option>
                          <option value="lighting">Lighting Solutions</option>
                          <option value="solar-maintenance">Solar Maintenance</option>
                          <option value="equipment">Equipment Purchase</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-taqon-charcoal mb-1.5">Message *</label>
                      <textarea
                        required
                        rows="5"
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full bg-taqon-cream border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all resize-none"
                        placeholder="Tell us about your project or enquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full flex items-center justify-center gap-2 bg-taqon-orange text-white py-4 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-taqon-orange/25"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
