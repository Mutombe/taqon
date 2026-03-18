import React from 'react';
import { useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  Buildings,
  GraduationCap,
  Tractor,
  ArrowRight,
  ArrowLeft,
  Check,
  CaretRight,
  Lightbulb,
  Television,
  Wind,
  Drop,
  Flame,
  Monitor,
  Shield,
  TShirt,
  ThermometerCold,
  WashingMachine,
  Lightning,
  User,
  EnvelopeSimple,
  Phone,
  ChatsTeardrop,
  PaperPlaneTilt,
  Sparkle,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import { confirmExternalNavigation } from '../components/ContentLink';
import SEO from '../components/SEO';
import { PROPERTY_TYPES, ROOF_TYPES, BUDGET_RANGES, COMMON_APPLIANCES } from '../data/calculatorData';
import { calculateSolarSystem, formatCurrency } from '../utils/solarCalculator';
import { quotationsApi } from '../api/quotations';
import { toast } from 'sonner';

const WHATSAPP_NUMBER = '263772771036';

const STEPS = [
  { title: 'Property Type', subtitle: 'What type of property?' },
  { title: 'Roof Details', subtitle: 'Your roof configuration' },
  { title: 'Energy Usage', subtitle: 'Current electricity usage' },
  { title: 'Budget Range', subtitle: 'Your investment range' },
  { title: 'Contact Details', subtitle: 'How to reach you' },
];

const propertyIcons = { residential: House, commercial: Buildings, institutional: GraduationCap, farm: Tractor };
const roofIllustrations = {
  pitched: 'M 10 50 L 50 10 L 90 50 L 90 80 L 10 80 Z',
  flat: 'M 10 30 L 90 30 L 90 80 L 10 80 Z',
  ground: 'M 10 80 L 30 40 L 90 40 L 70 80 Z',
};

const applianceIcons = {
  Lightbulb, ThermometerCold, Tv: Television, WashingMachine, Microwave: Flame, Flame, Wind, Droplets: Drop, Monitor, Shirt: TShirt, Shield,
};

const initialState = {
  propertyType: '',
  roofType: '',
  monthlyBill: 80,
  appliances: [],
  budgetRange: '',
  name: '',
  email: '',
  phone: '',
  message: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_APPLIANCE': {
      const exists = state.appliances.includes(action.value);
      return {
        ...state,
        appliances: exists
          ? state.appliances.filter((a) => a !== action.value)
          : [...state.appliances, action.value],
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

export default function QuoteWizard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canProceed = () => {
    switch (step) {
      case 0: return !!state.propertyType;
      case 1: return !!state.roofType;
      case 2: return state.monthlyBill > 0;
      case 3: return !!state.budgetRange;
      case 4: return state.name.trim() && state.email.trim() && state.phone.trim();
      default: return true;
    }
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setSubmitting(true);
    try {
      await quotationsApi.submitRequest({
        name: state.name.trim(),
        email: state.email.trim(),
        phone: state.phone.trim(),
        message: state.message.trim(),
        property_type: state.propertyType,
        roof_type: state.roofType,
        monthly_bill: state.monthlyBill,
        appliances: state.appliances,
        budget_range: state.budgetRange,
        recommended_system_kw: result.systemSizeKw,
        recommended_panels: result.panelCount,
        estimated_cost_min: result.costMin,
        estimated_cost_max: result.costMax,
      });
      setSubmitted(true);
      toast.success('Quote request submitted!');
    } catch (error) {
      // Even if backend fails, still show result (frontend-calculated)
      console.warn('Backend submission failed, showing local result:', error);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate recommended system for results
  const result = calculateSolarSystem(state.monthlyBill);
  const budget = BUDGET_RANGES.find((b) => b.id === state.budgetRange);

  // Build WhatsApp message
  const whatsappMessage = encodeURIComponent(
    `Hi Taqon Electrico, I just completed your online quote form.\n\n` +
    `Property: ${state.propertyType}\n` +
    `Roof: ${state.roofType}\n` +
    `Monthly Bill: $${state.monthlyBill}\n` +
    `Budget: ${budget?.label || 'Not specified'}\n` +
    `Name: ${state.name}\n` +
    `Email: ${state.email}\n` +
    `Phone: ${state.phone}\n` +
    (state.message ? `Message: ${state.message}\n` : '') +
    `\nRecommended system: ${result.systemSizeKw}kW (${result.panelCount} panels)`
  );

  if (submitted) {
    return (
      <>
        <SEO title="Quote Result" />
        <section className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center py-32">
          <div className="max-w-2xl mx-auto px-4 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-taqon-charcoal rounded-3xl p-8 lg:p-10 border border-gray-100 dark:border-white/10 shadow-sm text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <Sparkle size={36} className="text-green-600 dark:text-green-400" />
              </div>

              <h2 className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">
                Your Recommended System
              </h2>
              <p className="text-taqon-muted dark:text-white/50 mb-8">
                Based on your inputs, here is our recommended solar solution for you.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl p-5">
                  <p className="text-xs text-taqon-muted dark:text-white/50 uppercase tracking-wider">System Size</p>
                  <p className="text-2xl font-bold font-syne text-gradient mt-1">{result.systemSizeKw} kW</p>
                </div>
                <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl p-5">
                  <p className="text-xs text-taqon-muted dark:text-white/50 uppercase tracking-wider">Panels</p>
                  <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mt-1">{result.panelCount}</p>
                </div>
                <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl p-5">
                  <p className="text-xs text-taqon-muted dark:text-white/50 uppercase tracking-wider">Est. Cost</p>
                  <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mt-1">
                    {formatCurrency(result.costMin)}-{formatCurrency(result.costMax)}
                  </p>
                </div>
                <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl p-5">
                  <p className="text-xs text-taqon-muted dark:text-white/50 uppercase tracking-wider">Monthly Savings</p>
                  <p className="text-2xl font-bold font-syne text-green-600 dark:text-green-400 mt-1">${result.monthlySavings}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`}
                  onClick={(e) => confirmExternalNavigation(`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`, e)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-4 rounded-xl font-semibold hover:bg-green-600 transition-all cursor-pointer"
                >
                  <ChatsTeardrop size={18} />
                  Chat on WhatsApp
                </a>
                <Link
                  to="/financing"
                  className="flex-1 flex items-center justify-center gap-2 bg-taqon-orange text-white py-4 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
                >
                  View Financing <ArrowRight size={16} />
                </Link>
              </div>

              <button
                onClick={() => { setSubmitted(false); setStep(0); dispatch({ type: 'RESET' }); }}
                className="mt-4 text-sm text-taqon-muted hover:text-taqon-orange transition-colors"
              >
                Start over
              </button>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Get a Free Quote"
        description="Get a personalised solar quote in minutes. Our step-by-step wizard helps us understand your needs and recommend the perfect solar system for your property."
        keywords="solar quote Zimbabwe, free solar consultation, solar system quote Harare, get solar quote"
        canonical="https://www.taqon.co.zw/quote"
      />

      {/* Hero */}
      <section className="relative min-h-[45vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Free Quote</span>
            <h1 className="mt-3 text-4xl lg:text-5xl font-bold font-syne text-white">
              Get Your <span className="text-gradient">Solar Quote</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Answer a few quick questions and we will recommend the ideal solar system for you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Wizard */}
      <section className="py-12 lg:py-20 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-3xl mx-auto px-4">
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < step
                        ? 'bg-taqon-orange text-white'
                        : i === step
                        ? 'bg-taqon-orange text-white ring-4 ring-taqon-orange/20'
                        : 'bg-gray-200 dark:bg-white/10 text-taqon-muted dark:text-white/30'
                    }`}
                  >
                    {i < step ? <Check size={14} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`hidden sm:block w-12 lg:w-20 h-0.5 mx-1 ${
                      i < step ? 'bg-taqon-orange' : 'bg-gray-200 dark:bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">
                Step {step + 1}: {STEPS[step].title}
              </p>
              <p className="text-xs text-taqon-muted dark:text-white/50">{STEPS[step].subtitle}</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white dark:bg-taqon-charcoal rounded-3xl p-8 lg:p-10 border border-gray-100 dark:border-white/10 shadow-sm min-h-[400px] relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Step 0: Property Type */}
                {step === 0 && (
                  <div>
                    <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">
                      What type of property is this for?
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {PROPERTY_TYPES.map((pt) => {
                        const Icon = propertyIcons[pt.id] || House;
                        const selected = state.propertyType === pt.id;
                        return (
                          <button
                            key={pt.id}
                            onClick={() => dispatch({ type: 'SET_FIELD', field: 'propertyType', value: pt.id })}
                            className={`p-6 rounded-2xl border-2 text-left transition-all ${
                              selected
                                ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-taqon-orange/30'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                              selected ? 'bg-taqon-orange text-white' : 'bg-gray-100 dark:bg-white/10 text-taqon-muted'
                            }`}>
                              <Icon size={22} />
                            </div>
                            <p className={`font-bold font-syne ${selected ? 'text-taqon-orange' : 'text-taqon-charcoal dark:text-white'}`}>
                              {pt.label}
                            </p>
                            <p className="text-xs text-taqon-muted dark:text-white/50 mt-1">{pt.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 1: Roof Details */}
                {step === 1 && (
                  <div>
                    <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">
                      What is your roof type?
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {ROOF_TYPES.map((rt) => {
                        const selected = state.roofType === rt.id;
                        return (
                          <button
                            key={rt.id}
                            onClick={() => dispatch({ type: 'SET_FIELD', field: 'roofType', value: rt.id })}
                            className={`p-6 rounded-2xl border-2 text-center transition-all ${
                              selected
                                ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-taqon-orange/30'
                            }`}
                          >
                            <svg viewBox="0 0 100 90" className="w-16 h-16 mx-auto mb-3">
                              <path
                                d={roofIllustrations[rt.id]}
                                fill={selected ? 'rgba(242,101,34,0.15)' : 'rgba(107,114,128,0.1)'}
                                stroke={selected ? '#F26522' : '#6B7280'}
                                strokeWidth="2"
                              />
                              {/* Sun */}
                              <circle cx="80" cy="15" r="8" fill="#F59E0B" opacity="0.6" />
                              {/* Panel lines */}
                              <line x1="30" y1={rt.id === 'flat' ? '35' : rt.id === 'ground' ? '50' : '30'} x2="70" y2={rt.id === 'flat' ? '35' : rt.id === 'ground' ? '50' : '30'} stroke={selected ? '#F26522' : '#9CA3AF'} strokeWidth="2" />
                            </svg>
                            <p className={`font-bold font-syne text-sm ${selected ? 'text-taqon-orange' : 'text-taqon-charcoal dark:text-white'}`}>
                              {rt.label}
                            </p>
                            <p className="text-xs text-taqon-muted dark:text-white/50 mt-1">{rt.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Energy Usage */}
                {step === 2 && (
                  <div>
                    <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">
                      Tell us about your energy usage
                    </h3>

                    {/* Bill slider */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-taqon-charcoal dark:text-white/80">
                          Monthly ZESA Bill
                        </label>
                        <span className="text-2xl font-bold font-syne text-taqon-orange">${state.monthlyBill}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="5"
                        value={state.monthlyBill}
                        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'monthlyBill', value: Number(e.target.value) })}
                        className="w-full accent-taqon-orange"
                      />
                      <div className="flex justify-between text-xs text-taqon-muted mt-1">
                        <span>$10</span>
                        <span>$500</span>
                      </div>
                    </div>

                    {/* Appliances */}
                    <div>
                      <label className="text-sm font-medium text-taqon-charcoal dark:text-white/80 block mb-3">
                        Which appliances do you use? (optional)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {COMMON_APPLIANCES.map((ap) => {
                          const selected = state.appliances.includes(ap.name);
                          const Icon = applianceIcons[ap.icon] || Lightning;
                          return (
                            <button
                              key={ap.name}
                              onClick={() => dispatch({ type: 'TOGGLE_APPLIANCE', value: ap.name })}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-xs transition-all ${
                                selected
                                  ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10 text-taqon-orange'
                                  : 'border-gray-200 dark:border-white/10 text-taqon-muted dark:text-white/50 hover:border-taqon-orange/30'
                              }`}
                            >
                              <Icon size={14} className="flex-shrink-0" />
                              <span className="truncate">{ap.name}</span>
                              {selected && <Check size={12} className="ml-auto flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Budget */}
                {step === 3 && (
                  <div>
                    <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">
                      What is your budget range?
                    </h3>
                    <div className="space-y-3">
                      {BUDGET_RANGES.map((br) => {
                        const selected = state.budgetRange === br.id;
                        return (
                          <button
                            key={br.id}
                            onClick={() => dispatch({ type: 'SET_FIELD', field: 'budgetRange', value: br.id })}
                            className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                              selected
                                ? 'border-taqon-orange bg-taqon-orange/5 dark:bg-taqon-orange/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-taqon-orange/30'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selected ? 'border-taqon-orange' : 'border-gray-300 dark:border-white/20'
                            }`}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full bg-taqon-orange" />}
                            </div>
                            <div className="flex-1">
                              <p className={`font-bold font-syne ${selected ? 'text-taqon-orange' : 'text-taqon-charcoal dark:text-white'}`}>
                                {br.label}
                              </p>
                            </div>
                            <CaretRight size={16} className={selected ? 'text-taqon-orange' : 'text-taqon-muted'} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Contact Details */}
                {step === 4 && (
                  <div>
                    <h3 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-6">
                      Your contact details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal dark:text-white/80 mb-1.5">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-taqon-muted" />
                          <input
                            type="text"
                            required
                            value={state.name}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                            className="w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all text-taqon-charcoal dark:text-white"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal dark:text-white/80 mb-1.5">
                          Email *
                        </label>
                        <div className="relative">
                          <EnvelopeSimple size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-taqon-muted" />
                          <input
                            type="email"
                            required
                            value={state.email}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                            className="w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all text-taqon-charcoal dark:text-white"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal dark:text-white/80 mb-1.5">
                          Phone *
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-taqon-muted" />
                          <input
                            type="tel"
                            required
                            value={state.phone}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
                            className="w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all text-taqon-charcoal dark:text-white"
                            placeholder="+263 7XX XXX XXX"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-taqon-charcoal dark:text-white/80 mb-1.5">
                          Additional Message (optional)
                        </label>
                        <textarea
                          rows="3"
                          value={state.message}
                          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'message', value: e.target.value })}
                          className="w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-taqon-orange focus:ring-2 focus:ring-taqon-orange/10 transition-all resize-none text-taqon-charcoal dark:text-white"
                          placeholder="Any specific requirements or questions..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
              <button
                onClick={goPrev}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-taqon-muted hover:text-taqon-charcoal dark:hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-taqon-orange/25"
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className="flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-taqon-orange/25"
                >
                  <PaperPlaneTilt size={16} /> {submitting ? 'Submitting...' : 'Get My Quote'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
