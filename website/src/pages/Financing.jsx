import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  ArrowRight,
  Check,
  Star,
  CaretDown,
  DeviceMobile,
  Wallet,
  Buildings,
  Money,
  Shield,
  Clock,
  Percent,
  Question,
} from '@phosphor-icons/react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import FinancingCalculator from '../components/FinancingCalculator';
import { FINANCING_PLANS, PAYMENT_METHODS } from '../data/calculatorData';

const paymentIcons = { Smartphone: DeviceMobile, Wallet, Building: Buildings, Banknote: Money };

const FINANCING_FAQS = [
  {
    question: 'How do I apply for a payment plan?',
    answer: 'Simply contact us or complete our online quote form. After a site assessment, we will present you with available financing options based on your system size and budget. Approval is typically within 48 hours.',
  },
  {
    question: 'Is a deposit required?',
    answer: 'Yes, a minimum deposit of 30% is required for all payment plans. The remaining balance is then spread over your chosen plan period. The deposit secures your equipment and installation date.',
  },
  {
    question: 'What happens if I miss a payment?',
    answer: 'We understand that circumstances can change. If you anticipate difficulty making a payment, contact us in advance and we can discuss options. Late payments may incur a small administrative fee.',
  },
  {
    question: 'Can I pay off my balance early?',
    answer: 'Absolutely! Early repayment is encouraged and there are no penalties for paying off your balance ahead of schedule. You will only pay interest on the outstanding period.',
  },
  {
    question: 'Are the payment plans available for all system sizes?',
    answer: 'Payment plans are available for systems valued at $1,000 and above. For very large commercial installations, we can arrange custom financing terms. Contact us to discuss your specific needs.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept EcoCash, InnBucks, bank transfer (FBC, CBZ, Stanbic, NMB), and cash payments. Monthly payments can be set up via your preferred method for maximum convenience.',
  },
];

export default function Financing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <SEO
        title="Financing & Payment Plans"
        description="Affordable solar payment plans from Taqon Electrico. 0% interest for 6 months, flexible 12 and 24-month options. EcoCash, InnBucks, bank transfer accepted."
        keywords="solar financing Zimbabwe, solar payment plan, affordable solar, solar installment, EcoCash solar payment"
        canonical="https://www.taqon.co.zw/financing"
      />

      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-center bg-taqon-dark overflow-hidden">
        <div className="absolute inset-0 dark-mesh" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-32 pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Financing</span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white leading-tight">
              Affordable Solar <span className="text-gradient">Payment Plans</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-2xl">
              Going solar should not break the bank. Choose a flexible payment plan that works for you and
              start saving on electricity from day one.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-14">
            <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">Choose Your Plan</span>
            <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Flexible <span className="text-gradient">Payment Options</span>
            </h2>
            <p className="mt-3 text-taqon-muted dark:text-white/50 max-w-lg mx-auto">
              All plans require a 30% deposit. The balance is spread over your chosen period.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {FINANCING_PLANS.map((plan, i) => {
              const isPopular = plan.months === 12;
              return (
                <AnimatedSection key={plan.id} delay={i * 0.1}>
                  <div
                    className={`relative rounded-3xl p-8 border-2 h-full flex flex-col ${
                      isPopular
                        ? 'border-taqon-orange bg-white dark:bg-taqon-charcoal ring-2 ring-taqon-orange/20 shadow-xl shadow-taqon-orange/10'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-taqon-charcoal'
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1 ${
                          isPopular
                            ? 'bg-taqon-orange text-white'
                            : 'bg-taqon-charcoal dark:bg-white text-white dark:text-taqon-charcoal'
                        }`}
                      >
                        <Star size={10} /> {plan.badge}
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                        isPopular ? 'bg-taqon-orange text-white' : 'bg-taqon-orange/10 text-taqon-orange'
                      }`}>
                        {plan.months === 6 && <Shield size={24} />}
                        {plan.months === 12 && <CreditCard size={24} />}
                        {plan.months === 24 && <Clock size={24} />}
                      </div>
                      <h3 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">{plan.label}</h3>
                      <p className="text-sm text-taqon-muted dark:text-white/50 mt-1">{plan.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="text-5xl font-bold font-syne text-gradient">{plan.interestRate * 100}%</div>
                      <p className="text-sm text-taqon-muted dark:text-white/50 mt-1">total interest</p>
                    </div>

                    <div className="space-y-3 flex-1">
                      {[
                        `${plan.months} monthly payments`,
                        plan.interestRate === 0 ? 'Zero interest charges' : `${plan.interestRate * 100}% interest on balance`,
                        '30% minimum deposit',
                        'All payment methods accepted',
                        'No early repayment penalty',
                      ].map((feature, j) => (
                        <div key={j} className="flex items-center gap-2.5">
                          <Check size={16} className="text-taqon-orange flex-shrink-0" />
                          <span className="text-sm text-taqon-muted dark:text-white/60">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to="/quote"
                      className={`mt-8 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                        isPopular
                          ? 'bg-taqon-orange text-white hover:bg-taqon-orange/90 shadow-lg shadow-taqon-orange/25'
                          : 'bg-taqon-charcoal dark:bg-white/10 text-white hover:bg-taqon-charcoal/90 dark:hover:bg-white/20'
                      }`}
                    >
                      Choose This Plan <ArrowRight size={14} />
                    </Link>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Accepted <span className="text-gradient">Payment Methods</span>
            </h2>
            <p className="mt-2 text-taqon-muted dark:text-white/50">Pay the way that works best for you</p>
          </AnimatedSection>

          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {PAYMENT_METHODS.map((method, i) => {
              const Icon = paymentIcons[method.icon] || CreditCard;
              return (
                <AnimatedSection key={method.name} delay={i * 0.1}>
                  <div className="flex items-center gap-3 bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 hover:border-taqon-orange/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
                      <Icon size={20} className="text-taqon-orange" />
                    </div>
                    <span className="font-semibold text-taqon-charcoal dark:text-white">{method.name}</span>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 lg:py-24 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <AnimatedSection>
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
                Payment Calculator
              </span>
              <h2 className="mt-3 text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
                Estimate Your <span className="text-gradient">Monthly Payments</span>
              </h2>
              <p className="mt-4 text-taqon-muted dark:text-white/50 leading-relaxed">
                Use our payment calculator to get an instant estimate of your monthly instalments.
                Simply enter your system cost, choose a plan, and see the breakdown.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Percent, text: 'Interest rates as low as 0% for 6-month plans' },
                  { icon: Shield, text: 'No hidden fees or surprise charges' },
                  { icon: Clock, text: 'Start saving on electricity immediately while you pay' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                      <item.icon size={18} className="text-taqon-orange" />
                    </div>
                    <p className="text-taqon-charcoal dark:text-white/80">{item.text}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <FinancingCalculator />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-white dark:bg-taqon-charcoal">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Question size={18} className="text-taqon-orange" />
              <span className="text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">FAQ</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Financing <span className="text-gradient">Questions</span>
            </h2>
          </AnimatedSection>

          <div className="space-y-3">
            {FINANCING_FAQS.map((faq, i) => (
              <AnimatedSection key={i} delay={i * 0.05}>
                <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-taqon-charcoal dark:text-white pr-4">{faq.question}</span>
                    <CaretDown
                      size={20}
                      className={`flex-shrink-0 text-taqon-orange transition-transform duration-300 ${
                        openFaq === i ? 'rotate-180' : ''
                      }`}
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
                        <p className="px-5 pb-5 text-sm text-taqon-muted dark:text-white/60 leading-relaxed">
                          {faq.answer}
                        </p>
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
      <section className="py-16 bg-taqon-cream dark:bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-4xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Ready to Go Solar?
            </h2>
            <p className="mt-3 text-gray-500 dark:text-white/50 max-w-lg mx-auto">
              Start with a free consultation and find the perfect payment plan for your solar investment.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link
                to="/quote"
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-8 py-4 rounded-full font-semibold hover:bg-taqon-orange/90 transition-all hover:shadow-xl hover:shadow-taqon-orange/25"
              >
                Get a Free Quote <ArrowRight size={18} />
              </Link>
              <Link
                to="/calculator"
                className="inline-flex items-center gap-2 border border-gray-300 dark:border-white/20 text-taqon-charcoal dark:text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                Try Savings Calculator
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
