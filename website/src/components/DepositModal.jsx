import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  CreditCard,
  Bank,
  DeviceMobile,
  SpinnerGap,
  CheckCircle,
  WarningCircle,
  CaretDown,
  CaretUp,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { paymentsApi } from '../api/payments';
import useAuthStore from '../stores/authStore';
import {
  DEPOSIT_TERMS_SECTIONS,
  DEPOSIT_TERMS_VERSION,
  DEPOSIT_TERMS_LAST_UPDATED,
} from '../data/depositTerms';

const DEPOSIT_PERCENT = 20;

const PAYMENT_METHODS = [
  { key: 'ecocash', label: 'EcoCash', icon: DeviceMobile, desc: 'STK prompt to your phone', requiresPhone: true },
  { key: 'onemoney', label: 'OneMoney', icon: DeviceMobile, desc: 'STK prompt to your phone', requiresPhone: true },
  { key: 'innbucks', label: 'InnBucks', icon: DeviceMobile, desc: 'Pay from InnBucks wallet', requiresPhone: true },
  { key: 'card', label: 'Card Payment', icon: CreditCard, desc: 'Visa or Mastercard via Paynow' },
  { key: 'zimswitch', label: 'ZimSwitch', icon: CreditCard, desc: 'Local card via Paynow' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: Bank, desc: 'Direct transfer via Paynow' },
];

const toneClasses = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

/**
 * Two-step modal: read T&C → submit payment.
 *
 * Props:
 *   pkg: { slug, name, inverter_kva, battery_kwh, ... }
 *   tierLabel?: string (e.g. 'Good Fit', 'Budget')
 *   packageTotal: number (quoted total for this package at distance)
 *   distanceKm: number
 *   onClose(): void
 */
export default function DepositModal({ pkg, tierLabel, packageTotal, distanceKm, onClose }) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  const [step, setStep] = useState(1); // 1 = T&C, 2 = payment
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [expandedSection, setExpandedSection] = useState(0); // first section open by default

  const [form, setForm] = useState(() => {
    const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
    return {
      customer_name: name || '',
      customer_email: user?.email || '',
      customer_phone: user?.phone || '',
      customer_address: '',
      method: '',
      phone: user?.phone || '',
    };
  });
  const [submitting, setSubmitting] = useState(false);

  const depositAmount = useMemo(() => {
    const total = parseFloat(packageTotal || 0);
    return total > 0 ? (total * DEPOSIT_PERCENT / 100) : 0;
  }, [packageTotal]);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.key === form.method);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!isAuthenticated) {
      toast.error('Please sign in to pay a deposit.');
      openAuthModal?.('login');
      return;
    }

    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions.');
      setStep(1);
      return;
    }

    if (!form.customer_name.trim() || !form.customer_email.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    if (!form.method) {
      toast.error('Please select a payment method.');
      return;
    }

    if (selectedMethod?.requiresPhone && !form.phone.trim()) {
      toast.error('Phone number is required for mobile money.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await paymentsApi.initiateDeposit({
        package_slug: pkg.slug,
        tier_label: tierLabel || pkg.tier || '',
        distance_km: distanceKm || 10,
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_address: form.customer_address.trim(),
        method: form.method,
        phone: selectedMethod?.requiresPhone ? form.phone.trim() : '',
        terms_accepted: true,
      });

      const payment = data.payment;
      const deposit = data.deposit;

      // Web redirect (card, zimswitch, bank_transfer) — forward to Paynow
      if (payment?.gateway_redirect_url) {
        toast.success('Redirecting to Paynow...');
        window.location.href = payment.gateway_redirect_url;
        return;
      }

      // Mobile money — customer gets STK push on their phone
      toast.success('Check your phone to authorise the payment.');
      window.location.href = `/account/deposits/${deposit.id}`;
    } catch (err) {
      const msg =
        err.response?.data?.error
        || err.response?.data?.detail
        || Object.values(err.response?.data || {})[0]
        || 'Could not start deposit payment. Please try again.';
      toast.error(typeof msg === 'string' ? msg : 'Payment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-taqon-charcoal rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} className="text-taqon-orange shrink-0" weight="fill" />
              <span className="text-[11px] font-semibold text-taqon-orange uppercase tracking-wider">
                Reservation Deposit
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-syne text-taqon-charcoal dark:text-white truncate">
              {pkg.family_name || pkg.name}
            </h3>
            <p className="text-xs text-taqon-muted dark:text-white/50 mt-0.5">
              {tierLabel ? `${tierLabel} tier · ` : ''}Pay {DEPOSIT_PERCENT}% to secure your installation
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-taqon-charcoal dark:hover:text-white transition-colors shrink-0"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Amount summary */}
        <div className="px-5 sm:px-6 py-4 bg-taqon-orange/5 border-b border-taqon-orange/10 shrink-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-taqon-muted dark:text-white/50 uppercase tracking-wider">
                Deposit amount ({DEPOSIT_PERCENT}% of USD {Number(packageTotal || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-syne text-taqon-charcoal dark:text-white mt-0.5">
                USD {depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right text-[11px] text-taqon-muted dark:text-white/50">
              <p>Step {step} of 2</p>
              <p className="mt-0.5">{step === 1 ? 'Terms' : 'Payment'}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[11px] font-semibold text-taqon-muted dark:text-white/50 uppercase tracking-wider">
                  Terms &amp; Conditions
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50">
                  {DEPOSIT_TERMS_VERSION} · {DEPOSIT_TERMS_LAST_UPDATED}
                </span>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/5 border-l-2 border-blue-400 dark:border-blue-500/40 px-4 py-3">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-200">
                  By accepting these terms and paying the deposit, you agree to the reservation, site assessment and refund terms below. Please read them carefully before proceeding.
                </p>
              </div>

              <div className="space-y-2">
                {DEPOSIT_TERMS_SECTIONS.map((section, i) => {
                  const open = expandedSection === i;
                  return (
                    <div key={section.title} className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedSection(open ? -1 : i)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">
                          {section.title}
                        </span>
                        {open ? <CaretUp size={14} className="text-gray-400" /> : <CaretDown size={14} className="text-gray-400" />}
                      </button>
                      {open && (
                        <div className="px-4 py-3 space-y-3">
                          {section.clauses.map((c) => (
                            <p key={c.label} className="text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-white/60">
                              <strong className="text-taqon-charcoal dark:text-white/90 font-semibold">{c.label}. </strong>
                              {c.body}
                            </p>
                          ))}
                          {section.refundTable && (
                            <div className="mt-2 rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden text-xs">
                              <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 bg-gray-50 dark:bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/50">
                                <span>Cancellation stage</span>
                                <span>Refund</span>
                              </div>
                              {section.refundTable.map((row) => (
                                <div key={row.stage} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 border-t border-gray-100 dark:border-white/5 text-gray-600 dark:text-white/60">
                                  <span>{row.stage}</span>
                                  <span className={`font-medium ${toneClasses[row.tone] || ''}`}>{row.refund}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {section.footer && (
                            <p className="text-[11px] text-gray-400 dark:text-white/40 italic pt-1">{section.footer}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-white/10 cursor-pointer hover:border-taqon-orange/40 transition-colors">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-taqon-orange focus:ring-taqon-orange"
                />
                <span className="text-sm text-taqon-charcoal dark:text-white/90">
                  I have read and accept the Terms &amp; Conditions above. I understand that the deposit is refundable subject to the cancellation schedule, and that transport/travel costs are deducted after a site visit.
                </span>
              </label>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {!isAuthenticated && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                  <WarningCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-200">
                    You need an account to pay a deposit. <button type="button" onClick={() => openAuthModal?.('login')} className="underline font-semibold">Sign in</button> or create one to continue.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customer_name}
                    onChange={(e) => set('customer_name', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.customer_email}
                    onChange={(e) => set('customer_email', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.customer_phone}
                    onChange={(e) => set('customer_phone', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
                    placeholder="+263 77 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">Installation Address</label>
                  <input
                    type="text"
                    value={form.customer_address}
                    onChange={(e) => set('customer_address', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
                    placeholder="Borrowdale, Harare"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-2">Payment Method *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon;
                    const selected = form.method === m.key;
                    return (
                      <button
                        type="button"
                        key={m.key}
                        onClick={() => set('method', m.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-taqon-orange bg-taqon-orange/5'
                            : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          selected ? 'bg-taqon-orange text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-taqon-charcoal dark:text-white truncate">{m.label}</p>
                          <p className="text-[11px] text-gray-400 dark:text-white/40 truncate">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedMethod?.requiresPhone && (
                <div>
                  <label className="block text-xs font-medium text-taqon-charcoal dark:text-white/70 mb-1">
                    Mobile Money Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
                    placeholder="+263 77 123 4567"
                  />
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-taqon-dark/50 shrink-0">
          {step === 1 ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!termsAccepted}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} weight="bold" /> Continue to Payment
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white font-medium text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !isAuthenticated}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><SpinnerGap size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <>Pay USD {depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
