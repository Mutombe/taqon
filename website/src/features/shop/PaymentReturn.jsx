import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CircleNotch, CheckCircle, XCircle } from '@phosphor-icons/react';
import { paymentsApi } from '../../api/payments';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | failed | not_found

  const reference = searchParams.get('ref') || searchParams.get('reference') || '';

  useEffect(() => {
    if (!reference) {
      setStatus('not_found');
      return;
    }

    const verify = async () => {
      try {
        const { data } = await paymentsApi.verify(reference);

        if (data.status === 'paid') {
          setStatus('success');
          // Try to find the order number from metadata
          const orderNumber = data.metadata?.order_number;
          if (orderNumber) {
            setTimeout(() => {
              navigate(`/order-confirmation/${orderNumber}`, { replace: true });
            }, 2000);
          }
        } else if (['failed', 'cancelled'].includes(data.status)) {
          setStatus('failed');
        } else {
          // Still pending — redirect to status polling page
          navigate(`/payment/status/${reference}`, { replace: true });
        }
      } catch {
        setStatus('not_found');
      }
    };

    verify();
  }, [reference, navigate]);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center px-4">
      <div className="text-center">
        {status === 'loading' && (
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-gray-200 dark:bg-white/10 rounded w-48 mx-auto mb-3" />
            <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-64 mx-auto" />
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">Payment Successful!</h1>
            <p className="text-gray-500 dark:text-white/50 text-sm">Redirecting to your order...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">Payment Failed</h1>
            <p className="text-gray-500 dark:text-white/50 text-sm mb-6">Your payment could not be processed.</p>
            <Link
              to="/account/orders"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
            >
              View My Orders
            </Link>
          </>
        )}

        {status === 'not_found' && (
          <>
            <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-2">Payment Not Found</h1>
            <p className="text-gray-500 dark:text-white/50 text-sm mb-6">We couldn't find this payment reference.</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
            >
              Continue Shopping
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
