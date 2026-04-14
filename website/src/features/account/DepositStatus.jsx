import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, SpinnerGap, ArrowLeft, Phone,
  EnvelopeSimple, MapPin, Wallet, WarningCircle, ArrowClockwise, DownloadSimple,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { paymentsApi } from '../../api/payments';

const STATUS_CONFIG = {
  pending: {
    label: 'Waiting for Payment',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    message: 'We\u2019re waiting for your payment to be authorised. If you chose mobile money, check your phone for the STK prompt.',
  },
  paid: {
    label: 'Deposit Paid',
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    message: 'Your deposit has been received. A technician will contact you within 5 business days to schedule your site assessment.',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    message: 'This deposit was cancelled. No funds were charged.',
  },
  refunded: {
    label: 'Refunded',
    icon: ArrowClockwise,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    message: 'This deposit has been refunded per our cancellation policy.',
  },
  converted: {
    label: 'Credited to Invoice',
    icon: CheckCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    message: 'Your deposit has been credited toward your final invoice.',
  },
};

const PAYMENT_STATUS_LABEL = {
  pending: 'Pending',
  awaiting_redirect: 'Awaiting checkout',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

function fmtUSD(n) {
  return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function DepositStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollTimer = useRef(null);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await paymentsApi.getDeposit(id);
      setDeposit(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load deposit.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-poll while pending — catches the webhook flipping the status.
  useEffect(() => {
    if (!deposit) return;
    if (deposit.status !== 'pending') return;

    let stopped = false;
    let attempts = 0;
    const tick = async () => {
      if (stopped) return;
      attempts += 1;
      await load({ silent: true });
      // Poll for up to ~3 minutes (every 5s) then back off
      const delay = attempts < 36 ? 5000 : 30000;
      pollTimer.current = setTimeout(tick, delay);
    };
    pollTimer.current = setTimeout(tick, 5000);
    return () => {
      stopped = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deposit?.status]);

  const verifyNow = async () => {
    if (!deposit?.latest_payment?.reference) return;
    try {
      toast.loading('Checking payment status...', { id: 'verify' });
      await paymentsApi.verify(deposit.latest_payment.reference);
      await load({ silent: true });
      toast.success('Status refreshed', { id: 'verify' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not verify payment', { id: 'verify' });
    }
  };

  const downloadReceipt = async () => {
    if (!deposit?.latest_payment?.reference) return;
    try {
      toast.loading('Preparing receipt...', { id: 'receipt' });
      const res = await paymentsApi.downloadReceipt(deposit.latest_payment.reference);
      const contentType = res.headers['content-type'] || 'application/pdf';
      const ext = contentType.includes('html') ? 'html' : 'pdf';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Taqon-Receipt-${deposit.latest_payment.reference}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded', { id: 'receipt' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not download receipt', { id: 'receipt' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4 flex items-center justify-center">
        <SpinnerGap size={28} className="text-taqon-orange animate-spin" />
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <WarningCircle size={28} className="text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">Deposit not found</h1>
          <p className="text-sm text-gray-500 mb-6">{error || 'This deposit could not be loaded.'}</p>
          <Link to="/account" className="text-taqon-orange font-semibold text-sm hover:underline">
            &larr; Back to account
          </Link>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[deposit.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const payment = deposit.latest_payment;

  return (
    <>
      <SEO title="Deposit Status" />
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-28 pb-16 px-4">
        <div className="max-w-xl mx-auto">
          <Link to="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-taqon-charcoal dark:hover:text-white mb-5 transition-colors">
            <ArrowLeft size={14} /> Back to account
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-taqon-charcoal/40 rounded-2xl border border-warm-100 dark:border-white/10 overflow-hidden"
          >
            {/* Status header */}
            <div className={`${cfg.bg} px-6 py-5 flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-full bg-white dark:bg-taqon-dark flex items-center justify-center ${cfg.color}`}>
                <StatusIcon size={20} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-white/50">Reservation deposit</p>
                <h1 className={`text-lg font-semibold font-syne ${cfg.color}`}>{cfg.label}</h1>
              </div>
              {deposit.status === 'pending' && (
                <button
                  onClick={verifyNow}
                  className="text-xs font-semibold text-taqon-charcoal dark:text-white underline hover:no-underline"
                >
                  Refresh
                </button>
              )}
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed mb-5">
                {cfg.message}
              </p>

              {/* Amount */}
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 mb-5">
                <p className="text-[11px] text-gray-500 dark:text-white/50 mb-2 font-semibold uppercase tracking-wider">Deposit ({deposit.deposit_percent}%)</p>
                <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white tabular-nums">
                  {fmtUSD(deposit.deposit_amount)}
                </p>
                <p className="text-[12px] text-gray-500 dark:text-white/50 mt-1">
                  Package total: {fmtUSD(deposit.package_total)} · {deposit.distance_km}km from Harare
                </p>
              </div>

              {/* Package */}
              <div className="space-y-1.5 mb-5">
                <p className="text-[11px] text-gray-500 dark:text-white/50 font-semibold uppercase tracking-wider">Package</p>
                <p className="text-sm font-medium text-taqon-charcoal dark:text-white">{deposit.package_name}</p>
                {deposit.tier_label && (
                  <p className="text-xs text-gray-500">{deposit.tier_label}{deposit.inverter_kva ? ` · ${deposit.inverter_kva}kVA` : ''}{deposit.battery_kwh ? ` · ${deposit.battery_kwh}kWh` : ''}</p>
                )}
              </div>

              {/* Payment info */}
              {payment && (
                <div className="space-y-1.5 mb-5">
                  <p className="text-[11px] text-gray-500 dark:text-white/50 font-semibold uppercase tracking-wider">Payment</p>
                  <div className="text-xs text-gray-600 dark:text-white/60 space-y-1">
                    <p><span className="text-gray-400">Ref:</span> <code className="font-mono">{payment.reference}</code></p>
                    <p><span className="text-gray-400">Method:</span> {payment.method}</p>
                    <p><span className="text-gray-400">Status:</span> {PAYMENT_STATUS_LABEL[payment.status] || payment.status}</p>
                    {payment.paid_at && <p><span className="text-gray-400">Paid at:</span> {fmtDate(payment.paid_at)}</p>}
                  </div>
                </div>
              )}

              {/* Contact snapshot */}
              <div className="pt-4 border-t border-warm-100 dark:border-white/10 space-y-1.5">
                <p className="text-[11px] text-gray-500 dark:text-white/50 font-semibold uppercase tracking-wider mb-1.5">Your details</p>
                <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60"><EnvelopeSimple size={12} /> {deposit.customer_email}</p>
                {deposit.customer_phone && <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60"><Phone size={12} /> {deposit.customer_phone}</p>}
                {deposit.customer_address && <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-white/60"><MapPin size={12} /> {deposit.customer_address}</p>}
              </div>
            </div>
          </motion.div>

          {deposit.status === 'pending' && payment?.gateway_redirect_url && (
            <div className="mt-4 text-center">
              <a
                href={payment.gateway_redirect_url}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90"
              >
                <Wallet size={16} /> Complete payment on Paynow
              </a>
            </div>
          )}

          {deposit.status === 'paid' && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={downloadReceipt}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 active:scale-[0.98] transition-all"
              >
                <DownloadSimple size={16} weight="bold" /> Download Receipt
              </button>
              <p className="text-xs text-gray-500 dark:text-white/40 self-center">A copy has also been emailed to you.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
