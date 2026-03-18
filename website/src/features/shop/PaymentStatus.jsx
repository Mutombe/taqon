import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleNotch, CheckCircle, XCircle, Clock, ArrowsClockwise } from '@phosphor-icons/react';
import { paymentsApi } from '../../api/payments';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Payment Pending', description: 'Waiting for payment confirmation...' },
  awaiting_redirect: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Awaiting Payment', description: 'Please complete payment on your mobile device.' },
  processing: { icon: CircleNotch, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing', description: 'Your payment is being processed.' },
  paid: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Payment Successful', description: 'Your payment has been received!' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Payment Failed', description: 'We could not process your payment.' },
  cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Payment Cancelled', description: 'This payment was cancelled.' },
};

export default function PaymentStatus() {
  const { reference } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const orderNumber = location.state?.orderNumber || '';

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const pollCount = useRef(0);
  const pollTimer = useRef(null);

  // Initial fetch
  useEffect(() => {
    paymentsApi.getPayment(reference)
      .then(({ data }) => setPayment(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reference]);

  // Auto-poll for pending/processing payments
  useEffect(() => {
    if (!payment) return;
    if (['paid', 'failed', 'cancelled', 'refunded'].includes(payment.status)) return;

    const poll = async () => {
      if (pollCount.current >= 60) return; // Stop after 5 minutes (every 5s)
      pollCount.current += 1;
      setPolling(true);
      try {
        const { data } = await paymentsApi.verify(reference);
        setPayment(data);

        if (['paid', 'failed', 'cancelled'].includes(data.status)) {
          clearInterval(pollTimer.current);
          if (data.status === 'paid' && orderNumber) {
            // Auto-redirect to confirmation after 3 seconds
            setTimeout(() => {
              navigate(`/order-confirmation/${orderNumber}`, { replace: true });
            }, 3000);
          }
        }
      } catch {
        // Keep polling on error
      } finally {
        setPolling(false);
      }
    };

    pollTimer.current = setInterval(poll, 5000);
    return () => clearInterval(pollTimer.current);
  }, [payment?.status, reference, orderNumber, navigate]);

  const handleManualCheck = async () => {
    setPolling(true);
    try {
      const { data } = await paymentsApi.verify(reference);
      setPayment(data);
    } catch {
      // ignore
    } finally {
      setPolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16">
        <div className="max-w-lg mx-auto px-4 animate-pulse">
          <div className="rounded-2xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 p-8">
            <div className="w-16 h-16 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-6" />
            <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-48 mx-auto mb-3" />
            <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-64 mx-auto mb-8" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 dark:bg-white/5 rounded" />
              <div className="h-4 bg-gray-100 dark:bg-white/5 rounded" />
              <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
            </div>
            <div className="h-12 bg-gray-200 dark:bg-white/10 rounded-xl mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4 text-center">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">Payment Not Found</h1>
        <Link to="/account/orders" className="text-taqon-orange hover:underline text-sm">
          View My Orders
        </Link>
      </div>
    );
  }

  const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const isTerminal = ['paid', 'failed', 'cancelled', 'refunded'].includes(payment.status);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center"
      >
        <div className={`w-24 h-24 ${config.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <StatusIcon
            className={`w-12 h-12 ${config.color} ${
              !isTerminal ? 'animate-spin' : ''
            }`}
          />
        </div>

        <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">{config.label}</h1>
        <p className="text-gray-500 dark:text-white/50 mb-2">{config.description}</p>

        {payment.failure_reason && (
          <p className="text-red-400 text-sm mb-4">{payment.failure_reason}</p>
        )}

        <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 text-left mt-8 mb-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">Reference</span>
              <span className="text-taqon-charcoal dark:text-white font-mono text-xs">{payment.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">Amount</span>
              <span className="text-taqon-charcoal dark:text-white font-semibold">${parseFloat(payment.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">Method</span>
              <span className="text-taqon-charcoal dark:text-white capitalize">{payment.method.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-white/50">Status</span>
              <span className={`capitalize font-medium ${config.color}`}>
                {payment.status.replace(/_/g, ' ')}
              </span>
            </div>
            {orderNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-white/50">Order</span>
                <span className="text-taqon-orange font-medium">{orderNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!isTerminal && (
            <button
              onClick={handleManualCheck}
              disabled={polling}
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-50"
            >
              <ArrowsClockwise size={16} className={polling ? 'animate-spin' : ''} />
              {polling ? 'Checking...' : 'Check Payment Status'}
            </button>
          )}

          {payment.status === 'paid' && orderNumber && (
            <div>
              <Link
                to={`/order-confirmation/${orderNumber}`}
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
              >
                View Order Confirmation
              </Link>
              <p className="text-gray-400 dark:text-white/30 text-xs mt-2">Redirecting automatically...</p>
            </div>
          )}

          {payment.status === 'failed' && orderNumber && (
            <Link
              to={`/account/orders/${orderNumber}`}
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/10 text-taqon-charcoal dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
            >
              View Order & Retry Payment
            </Link>
          )}

          <div>
            <Link
              to="/account/orders"
              className="text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white text-sm transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>

        {!isTerminal && (
          <p className="text-gray-400 dark:text-white/20 text-xs mt-8">
            This page auto-refreshes every 5 seconds. You can also check manually.
          </p>
        )}
      </motion.div>
    </div>
  );
}
