import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, CheckCircle, Lightning, Drop, Television, Phone, EnvelopeSimple,
  House, Snowflake, FireSimple, Article, ShieldCheck, SpinnerGap, CaretDown, Plus,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { inquiriesApi } from '../api/inquiries';
import { solarConfigApi } from '../api/solarConfig';
import LocationPicker from '../components/LocationPicker';
import { calculateDeliveryFee } from '../data/zimbabweAreas';
import { saveLocation, getSavedLocation } from '../data/locationSession';
import SEO from '../components/SEO';
import {
  TAQON_PHONE, TAQON_EMAIL, TAQON_ADDRESS, TAQON_WHATSAPP_URL,
} from '../data/siteData';

/**
 * Public-facing single-page inquiry form. Designed to be fast and
 * scannable — common appliance picks as checkboxes, a free-form notes
 * field, and a single submit. Sharable as a direct link
 * (taqon.co.zw/get-recommendation) for staff to send to older
 * customers who'd otherwise re-explain themselves on every channel.
 */
const COMMON_APPLIANCES = [
  { key: 'lights', label: 'Lights', icon: Lightning, hint: 'LED throughout' },
  { key: 'tv', label: 'TV', icon: Television, hint: 'One or more sets' },
  { key: 'fridge', label: 'Fridge', icon: Snowflake, hint: 'Including freezer' },
  { key: 'microwave', label: 'Microwave', icon: FireSimple, hint: 'Daily use' },
  { key: 'wifi_phones', label: 'WiFi & phones', icon: Phone, hint: 'Always-on' },
  { key: 'computer', label: 'Computer', icon: Article, hint: 'Desktop / laptop' },
  { key: 'washing_machine', label: 'Washing machine', icon: Drop, hint: 'Weekly use' },
  { key: 'iron', label: 'Iron', icon: FireSimple, hint: 'Occasional' },
  { key: 'air_con', label: 'Air conditioning', icon: Snowflake, hint: 'Bedroom / lounge' },
  { key: 'borehole', label: 'Borehole pump', icon: Drop, hint: 'Outdoor pump' },
  { key: 'geyser', label: 'Electric geyser', icon: FireSimple, hint: 'Hot water' },
  { key: 'security', label: 'Security & gate', icon: ShieldCheck, hint: 'Alarm / motors' },
];

export default function Inquiry() {
  const [searchParams] = useSearchParams();
  const refSource = searchParams.get('source') || 'public_form';

  const savedLocation = getSavedLocation();
  // Prefill the message when the visitor arrives from a solar-geyser package.
  const geyserPrefill = (() => {
    if (!refSource.startsWith('solar-geyser')) return '';
    const slug = refSource.replace(/^solar-geyser-?/, '');
    const name = slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
    return name
      ? `I'd like a quote for the ${name} solar geyser package.`
      : "I'd like a quote for a solar geyser package.";
  })();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    area: savedLocation?.area || '',
    distanceKm: savedLocation?.distanceKm ?? null,
    monthly_grid_bill: '',
    appliances: [],
    message: geyserPrefill,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  // Full appliance catalogue from the API — used to render the
  // "See more" overflow underneath the 12 hardcoded fast picks.
  const [allAppliances, setAllAppliances] = useState([]);
  const [showAllAppliances, setShowAllAppliances] = useState(false);

  useEffect(() => {
    let cancelled = false;
    solarConfigApi.getAppliances()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setAllAppliances(list);
      })
      .catch(() => { /* silent — the 12 fast picks still work without API */ });
    return () => { cancelled = true; };
  }, []);

  // Filter the API catalogue to the items NOT already in the fast-pick
  // grid (matched case-insensitively on name), grouped by category for
  // a scannable expand. Memoised so toggling doesn't recompute.
  const overflowGroups = useMemo(() => {
    const fastNames = new Set(COMMON_APPLIANCES.map((c) => c.label.toLowerCase()));
    const filtered = allAppliances.filter((a) => !fastNames.has((a.name || '').toLowerCase()));
    const groups = {};
    for (const a of filtered) {
      const cat = a.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    }
    // Stable category order (most-used rooms first)
    const order = ['kitchen', 'lounge', 'bedroom', 'bathroom', 'laundry', 'office', 'outdoor', 'security', 'garage', 'other'];
    return order.filter((k) => groups[k]?.length).map((k) => [k, groups[k]]);
  }, [allAppliances]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  // Toggle an appliance in the form selection. Accepts either a
  // fast-pick key (string) or an API appliance object (with a slug + name).
  const toggleAppliance = (input) => {
    const isApi = typeof input === 'object';
    const key = isApi ? `api:${input.slug || input.id}` : input;
    const name = isApi
      ? input.name
      : (COMMON_APPLIANCES.find((c) => c.key === input)?.label || input);

    setForm((f) => {
      const has = f.appliances.find((a) => a.key === key);
      if (has) {
        return { ...f, appliances: f.appliances.filter((a) => a.key !== key) };
      }
      return { ...f, appliances: [...f.appliances, { key, name, quantity: 1 }] };
    });
  };

  const isAppliancePicked = (input) => {
    const key = typeof input === 'object' ? `api:${input.slug || input.id}` : input;
    return !!form.appliances.find((a) => a.key === key);
  };

  const handleLocationChange = (sel) => {
    if (!sel) {
      set('area', '');
      set('distanceKm', null);
      return;
    }
    set('area', sel.isPickup ? 'Free pickup from HQ' : sel.name);
    set('distanceKm', sel.distance);
    saveLocation({
      area: sel.isPickup ? 'Free pickup from HQ' : sel.name,
      distanceKm: sel.distance,
    });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please tell us your name.';
    if (!form.email.trim()) e.email = 'We need an email to send your quote.';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'That email looks off.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Each selection already carries the friendly name (set when the
      // user toggled it on), so the admin dashboard reads the human
      // label directly. Quantity defaults to 1 — operators can refine
      // when triaging.
      const applianceLabels = form.appliances.map((a) => ({
        name: a.name || a.key,
        quantity: a.quantity,
      }));

      await inquiriesApi.submit({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        area: form.area.trim(),
        distance_km: form.distanceKm ?? null,
        monthly_grid_bill: form.monthly_grid_bill || null,
        appliances: applianceLabels,
        message: form.message.trim(),
        source: refSource,
      });
      setSubmitted(true);
      toast.success("We've got your inquiry — we'll be in touch shortly.");
    } catch (err) {
      toast.error(
        err.response?.data?.detail
          || 'Something went wrong submitting your inquiry. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <SEO
          title="Thanks — we'll be in touch"
          description="Your Taqon Electrico inquiry has been received."
        />
        <section className="min-h-[80vh] bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center px-4 pt-36 lg:pt-44 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl w-full text-center bg-white dark:bg-taqon-charcoal rounded-3xl border border-gray-100 dark:border-white/10 p-10 lg:p-14 shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={30} weight="duotone" className="text-taqon-orange" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-taqon-orange">Inquiry received</p>
            <h1 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
              Thanks {form.name.split(' ')[0]} — we've got it.
            </h1>
            <p className="mt-4 text-taqon-muted dark:text-white/55 leading-relaxed">
              A real person from our engineering team will read your details and reach back to{' '}
              <strong className="text-taqon-charcoal dark:text-white">{form.email}</strong> within one
              business day, with a sized recommendation and a quote.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={TAQON_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1da851] text-white font-semibold text-sm transition-all"
              >
                Chat on WhatsApp
              </a>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/15 text-taqon-charcoal dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                Back to home
              </Link>
            </div>
          </motion.div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Get a Quote — Taqon Electrico"
        description="Tell us about your home or business and we'll size a solar system around your real loads. Fast, no obligation."
        canonical="https://www.taqon.co.zw/get-recommendation"
        image="/downloads/taqon-robot.jpeg"
      />

      {/* Hero */}
      <section className="relative bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-36 pb-12 lg:pt-44 lg:pb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.2em]">Free recommendation</span>
            <h1 className="mt-3 text-3xl lg:text-5xl font-bold font-syne text-white leading-tight">
              Tell us about your <span className="text-gradient">home or business</span>
            </h1>
            <p className="mt-4 text-white/65 text-base lg:text-lg max-w-2xl leading-relaxed">
              Two minutes. Real engineer reads it. We'll size a system around your actual loads and
              email a quote back — no obligation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-taqon-cream dark:bg-taqon-dark py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-taqon-charcoal rounded-3xl border border-gray-100 dark:border-white/10 p-6 lg:p-10 shadow-sm space-y-7"
          >
            {/* Identity row */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Your name *" error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Tendai Moyo"
                  className={inputClass(errors.name)}
                  autoComplete="name"
                />
              </Field>
              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+263 77 ..."
                  className={inputClass()}
                  autoComplete="tel"
                />
              </Field>
            </div>

            <Field label="Email *" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                className={inputClass(errors.email)}
                autoComplete="email"
              />
            </Field>

            <Field label="Where will the system go?" hint="Pick your area for distance-aware delivery pricing.">
              <LocationPicker
                value={form.area === 'Free pickup from HQ' ? 'pickup' : form.area}
                onChange={handleLocationChange}
                placeholder="Search your area or town"
              />
            </Field>

            <Field
              label="What needs to keep running?"
              hint="Tap everything you'd want powered through an outage. We'll size around it."
            >
              {/* Fast-pick grid — the 12 most common loads with icons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_APPLIANCES.map((a) => {
                  const isOn = isAppliancePicked(a.key);
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => toggleAppliance(a.key)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        isOn
                          ? 'border-taqon-orange bg-taqon-orange/5 ring-1 ring-taqon-orange/20'
                          : 'border-gray-200 dark:border-white/10 hover:border-taqon-orange/30 bg-gray-50 dark:bg-white/5'
                      }`}
                    >
                      <Icon
                        size={18}
                        weight={isOn ? 'fill' : 'duotone'}
                        className={isOn ? 'text-taqon-orange' : 'text-taqon-muted'}
                      />
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold leading-tight ${isOn ? 'text-taqon-charcoal dark:text-white' : 'text-taqon-charcoal/85 dark:text-white/80'}`}>
                          {a.label}
                        </p>
                        <p className="text-[10px] text-taqon-muted dark:text-white/40 mt-0.5 truncate">{a.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* See-more affordance + overflow appliances grouped by room */}
              {overflowGroups.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowAllAppliances((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-taqon-orange hover:text-taqon-orange/80 transition-colors"
                  >
                    {showAllAppliances
                      ? 'Show fewer appliances'
                      : `See ${overflowGroups.reduce((n, [, list]) => n + list.length, 0)} more appliances`}
                    <CaretDown
                      size={12}
                      weight="bold"
                      className={`transition-transform ${showAllAppliances ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {showAllAppliances && (
                      <motion.div
                        key="overflow"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-4">
                          {overflowGroups.map(([category, items]) => (
                            <div key={category}>
                              <p className="text-[10px] uppercase tracking-widest font-bold text-taqon-muted dark:text-white/45 mb-2">
                                {category}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {items.map((a) => {
                                  const isOn = isAppliancePicked(a);
                                  return (
                                    <button
                                      key={a.id || a.slug}
                                      type="button"
                                      onClick={() => toggleAppliance(a)}
                                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                                        isOn
                                          ? 'border-taqon-orange bg-taqon-orange/10 text-taqon-orange'
                                          : 'border-gray-200 dark:border-white/10 text-taqon-charcoal/80 dark:text-white/70 hover:border-taqon-orange/40 hover:text-taqon-orange'
                                      }`}
                                    >
                                      {!isOn && <Plus size={10} weight="bold" />}
                                      {a.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </Field>

            <Field label="Approximate monthly grid bill (optional)" hint="Helps us size the right system. USD per month.">
              <input
                type="number"
                min="0"
                value={form.monthly_grid_bill}
                onChange={(e) => set('monthly_grid_bill', e.target.value)}
                placeholder="e.g. 80"
                className={inputClass()}
              />
            </Field>

            <Field label="Anything else? (optional)" hint="Solar already? Standby genset? Borehole depth? Tell us anything that matters.">
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                placeholder="We'd like back-up for at least 8 hours nightly. Lots of cooking, two AC units."
                className={`${inputClass()} resize-y min-h-[112px]`}
              />
            </Field>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-gray-100 dark:border-white/10 pt-6">
              <p className="text-xs text-taqon-muted dark:text-white/45">
                We don't share your details. Reach back is by email or WhatsApp only.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-lg hover:shadow-taqon-orange/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <SpinnerGap size={16} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send my inquiry
                    <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Trust strip — direct contact alternatives */}
          <div className="mt-8 grid sm:grid-cols-3 gap-3 text-center">
            <ContactPill icon={Phone} label="Call us" detail={TAQON_PHONE} href={`tel:${TAQON_PHONE}`} />
            <ContactPill icon={EnvelopeSimple} label="Email" detail={TAQON_EMAIL} href={`mailto:${TAQON_EMAIL}`} />
            <ContactPill icon={House} label="Visit" detail={TAQON_ADDRESS} href="https://goo.gl/maps/gEBWUQoo4cgKEym2A" external />
          </div>
        </div>
      </section>
    </>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-taqon-charcoal dark:text-white mb-1.5">{label}</label>
      {hint && !error && (
        <p className="text-xs text-taqon-muted dark:text-white/45 mb-2">{hint}</p>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function inputClass(error) {
  return `w-full px-4 py-3 rounded-xl text-sm bg-gray-50 dark:bg-white/5 border ${
    error
      ? 'border-red-400/60 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-500/20'
      : 'border-gray-200 dark:border-white/15 focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/15'
  } text-taqon-charcoal dark:text-white placeholder:text-gray-400 outline-none transition-all`;
}

function ContactPill({ icon: Icon, label, detail, href, external = false }) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-4 hover:border-taqon-orange/30 transition-all group"
    >
      <div className="flex items-center justify-center gap-2">
        <Icon size={16} weight="duotone" className="text-taqon-orange" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-taqon-muted dark:text-white/45">{label}</span>
      </div>
      <p className="mt-1.5 text-xs font-semibold text-taqon-charcoal dark:text-white/85 group-hover:text-taqon-orange transition-colors break-words">
        {detail}
      </p>
    </a>
  );
}
