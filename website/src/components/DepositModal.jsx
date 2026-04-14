import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, SpinnerGap, WarningCircle, CreditCard, Bank, DeviceMobile,
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
  { key: 'ecocash',       label: 'EcoCash',        icon: DeviceMobile, type: 'mobile' },
  { key: 'onemoney',      label: 'OneMoney',       icon: DeviceMobile, type: 'mobile' },
  { key: 'innbucks',      label: 'InnBucks',       icon: DeviceMobile, type: 'mobile' },
  { key: 'card',          label: 'Card',           icon: CreditCard,   type: 'web' },
  { key: 'zimswitch',     label: 'ZimSwitch',      icon: CreditCard,   type: 'web' },
  { key: 'bank_transfer', label: 'Bank Transfer',  icon: Bank,         type: 'web' },
];

const toneClasses = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger:  'text-red-600 dark:text-red-400',
};

/**
 * Deposit confirmation modal — "Step 2 of 3: Secure your installation".
 * Short, calm, professional. Collects the one thing we don't already have
 * (payment method + mobile phone if applicable), shows what happens next,
 * surfaces the cancellation refund policy, requires T&C acceptance.
 *
 * Props:
 *   pkg: { slug, name, family_name?, inverter_kva?, battery_kwh? }
 *   tierLabel?: string
 *   packageTotal: number
 *   distanceKm: number
 *   onClose(): void
 */
export default function DepositModal({ pkg, tierLabel, packageTotal, distanceKm, onClose }) {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  const [method, setMethod] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const depositAmount = useMemo(() => {
    const total = parseFloat(packageTotal || 0);
    return total > 0 ? (total * DEPOSIT_PERCENT / 100) : 0;
  }, [packageTotal]);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.key === method);
  const requiresPhone = selectedMethod?.type === 'mobile';
  const customerName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.email || '';

  const fmtUSD = (n) => `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to pay a deposit.');
      openAuthModal?.('login');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the terms to continue.');
      return;
    }
    if (!method) {
      toast.error('Select a payment method.');
      return;
    }
    if (requiresPhone && !phone.trim()) {
      toast.error('Phone number is required for mobile money.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await paymentsApi.initiateDeposit({
        package_slug: pkg.slug,
        tier_label: tierLabel || pkg.tier || '',
        distance_km: distanceKm || 10,
        customer_name: customerName,
        customer_email: user?.email || '',
        customer_phone: phone.trim() || user?.phone || '',
        customer_address: address.trim(),
        method,
        phone: requiresPhone ? phone.trim() : '',
        terms_accepted: true,
      });

      const payment = data.payment;
      const deposit = data.deposit;

      // If the backend explicitly returned a failed payment, stop here.
      if (payment?.status === 'failed') {
        toast.error(payment.failure_reason || 'Payment failed to initialise.');
        return;
      }

      // Explicit dispatch per method type — no silent fall-through.
      if (selectedMethod?.type === 'web') {
        // Card, ZimSwitch, Bank Transfer — Paynow's hosted checkout handles it
        if (!payment?.gateway_redirect_url) {
          toast.error(
            'Payment gateway did not return a checkout URL. Please try a different method or contact support.',
          );
          return;
        }
        toast.success('Redirecting to Paynow checkout...');
        window.location.href = payment.gateway_redirect_url;
        return;
      }

      if (selectedMethod?.type === 'mobile') {
        // EcoCash / OneMoney / InnBucks — STK push goes to the customer's phone
        if (!payment?.gateway_poll_url && !payment?.reference) {
          toast.error('Payment was not initialised correctly. Please try again.');
          return;
        }
        toast.success('Check your phone to authorise the payment.');
        window.location.href = `/account/deposits/${deposit.id}`;
        return;
      }

      // Unknown method — shouldn't happen because picker is constrained
      toast.error('Unsupported payment method.');
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
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative bg-white dark:bg-taqon-charcoal rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/10 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 shrink-0">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-white/40 mb-1">
              Step 2 of 3
            </p>
            <h2 className="text-[17px] font-semibold text-taqon-charcoal dark:text-white">
              Secure your installation
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 dark:text-white/40 hover:text-taqon-charcoal dark:hover:text-white transition-colors leading-none text-xl mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {/* Package summary */}
          <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 mb-5">
            <p className="text-[13px] text-gray-500 dark:text-white/50 mb-2">Selected package</p>
            <p className="text-[15px] font-medium text-taqon-charcoal dark:text-white mb-3 truncate">
              {pkg.family_name || pkg.name}{tierLabel ? ` · ${tierLabel}` : ''}
            </p>
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-gray-500 dark:text-white/50">Estimated total</span>
              <span className="text-taqon-charcoal dark:text-white tabular-nums">{fmtUSD(packageTotal)}</span>
            </div>
            <div className="flex justify-between text-[13px] pt-2 border-t border-gray-200 dark:border-white/10">
              <span className="text-gray-500 dark:text-white/50">Deposit required ({DEPOSIT_PERCENT}%)</span>
              <span className="font-semibold text-taqon-charcoal dark:text-white tabular-nums">{fmtUSD(depositAmount)}</span>
            </div>
          </div>

          {/* What happens next */}
          <p className="text-[13px] font-medium text-taqon-charcoal dark:text-white mb-2.5">
            What happens next
          </p>
          <div className="space-y-2.5 mb-5">
            <StepRow num={1} tone="success">
              We schedule a <strong className="font-medium text-taqon-charcoal dark:text-white">site assessment</strong> within 5 business days to verify roof orientation, shading, and structural requirements.
            </StepRow>
            <StepRow num={2} tone="info">
              We confirm your <strong className="font-medium text-taqon-charcoal dark:text-white">final system design and price</strong> within 3 days of the assessment.
            </StepRow>
            <StepRow num={3} tone="neutral">
              Your deposit is <strong className="font-medium text-taqon-charcoal dark:text-white">fully credited</strong> toward your final invoice once installation is confirmed.
            </StepRow>
          </div>

          {/* Cancellation note */}
          <div className="rounded-r-xl bg-amber-50 dark:bg-amber-500/5 border-l-2 border-amber-400 dark:border-amber-500/40 px-3 py-2.5 mb-5">
            <p className="text-[12px] font-medium text-amber-700 dark:text-amber-300 mb-1">
              Note on cancellation after site visit
            </p>
            <p className="text-[12px] text-amber-700 dark:text-amber-300/90 leading-[1.55]">
              If you choose not to proceed after the site assessment, or if the installation is found not feasible, a <strong className="font-semibold">transport &amp; travel fee</strong> will be deducted from your deposit before any refund is issued. The remainder is returned within 7 business days.
            </p>
          </div>

          {/* Address (only if not yet captured in session) */}
          <div className="mb-4">
            <label className="block text-[12px] text-gray-500 dark:text-white/50 mb-1.5">
              Installation address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12 Baines Ave, Borrowdale"
              className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[13px] text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
            />
          </div>

          {/* Payment method — compact grid */}
          <div className="mb-4">
            <label className="block text-[12px] text-gray-500 dark:text-white/50 mb-1.5">
              Payment method
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const selected = method === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                      selected
                        ? 'border-taqon-orange bg-taqon-orange/5 text-taqon-orange'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <Icon size={14} weight={selected ? 'fill' : 'regular'} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile money phone */}
          {requiresPhone && (
            <div className="mb-4">
              <label className="block text-[12px] text-gray-500 dark:text-white/50 mb-1.5">
                Mobile money number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+263 77 123 4567"
                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[13px] text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
              />
            </div>
          )}

          {!isAuthenticated && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 mb-4">
              <WarningCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-700 dark:text-amber-200">
                You need an account to pay a deposit.{' '}
                <button type="button" onClick={() => openAuthModal?.('login')} className="underline font-semibold">
                  Sign in
                </button>{' '}
                to continue.
              </p>
            </div>
          )}

          {/* T&C checkbox */}
          <label className="flex gap-2.5 items-start mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 shrink-0 w-4 h-4 rounded text-taqon-orange focus:ring-taqon-orange"
            />
            <span className="text-[12px] text-gray-500 dark:text-white/60 leading-[1.5]">
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowFullTerms(true)}
                className="text-taqon-orange underline hover:no-underline"
              >
                Quotation Terms &amp; Conditions
              </button>
              , including the transport cost deduction policy on cancellation after site assessment.
            </span>
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-white/10 shrink-0 bg-white dark:bg-taqon-charcoal">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-[13px] font-medium text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !isAuthenticated || !termsAccepted || !method}
            className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-taqon-charcoal dark:bg-taqon-orange text-white text-[13px] font-semibold hover:bg-taqon-charcoal/90 dark:hover:bg-taqon-orange/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><SpinnerGap size={14} className="animate-spin" /> Processing...</>
            ) : (
              <>Pay {fmtUSD(depositAmount)} deposit</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Full T&C overlay */}
      <AnimatePresence>
        {showFullTerms && (
          <FullTermsOverlay onClose={() => setShowFullTerms(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Helpers ─── */

function StepRow({ num, tone = 'neutral', children }) {
  const toneStyle = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    info:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    neutral: 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 border border-gray-200 dark:border-white/10',
  }[tone];
  return (
    <div className="flex gap-2.5 items-start">
      <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-medium mt-[2px] ${toneStyle}`}>
        {num}
      </div>
      <p className="text-[13px] text-gray-600 dark:text-white/60 leading-[1.55] m-0">
        {children}
      </p>
    </div>
  );
}

function FullTermsOverlay({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 12, opacity: 0 }}
        className="relative bg-white dark:bg-taqon-charcoal rounded-2xl w-full max-w-xl shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-white/40">Legal · {DEPOSIT_TERMS_VERSION} · {DEPOSIT_TERMS_LAST_UPDATED}</p>
            <h3 className="text-[15px] font-semibold text-taqon-charcoal dark:text-white">Quotation Terms &amp; Conditions</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-taqon-charcoal dark:hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {DEPOSIT_TERMS_SECTIONS.map((s) => (
            <section key={s.title}>
              <h4 className="text-[13px] font-medium text-taqon-charcoal dark:text-white pb-2 mb-2 border-b border-gray-100 dark:border-white/5">{s.title}</h4>
              <div className="space-y-2">
                {s.clauses.map((c) => (
                  <p key={c.label} className="text-[12.5px] text-gray-600 dark:text-white/60 leading-[1.65]">
                    <strong className="font-medium text-taqon-charcoal dark:text-white/90">{c.label}. </strong>{c.body}
                  </p>
                ))}
                {s.refundTable && (
                  <div className="mt-1.5 rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden text-[12px]">
                    <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 bg-gray-50 dark:bg-white/5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-white/50">
                      <span>Cancellation stage</span>
                      <span>Refund</span>
                    </div>
                    {s.refundTable.map((row) => (
                      <div key={row.stage} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 border-t border-gray-100 dark:border-white/5 text-gray-600 dark:text-white/60">
                        <span>{row.stage}</span>
                        <span className={`font-medium ${toneClasses[row.tone] || ''}`}>{row.refund}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.footer && <p className="text-[11px] text-gray-400 dark:text-white/40 italic pt-1">{s.footer}</p>}
              </div>
            </section>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-taqon-charcoal dark:bg-taqon-orange text-white text-[13px] font-medium hover:opacity-90 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
