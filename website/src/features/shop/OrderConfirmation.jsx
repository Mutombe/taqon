import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, DownloadSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { shopApi } from '../../api/shop';
import { paymentsApi } from '../../api/payments';
import { DetailPageSkeleton } from '../../components/Skeletons';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paidPayment, setPaidPayment] = useState(null);

  useEffect(() => {
    shopApi.getOrder(orderNumber)
      .then(({ data }) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderNumber]);

  // When order is paid, look up a paid Payment so we can offer receipt download
  useEffect(() => {
    if (!order || order.payment_status !== 'paid') return;
    paymentsApi.getOrderPayments(order.order_number)
      .then(({ data }) => {
        const paid = (Array.isArray(data) ? data : data.results || []).find((p) => p.status === 'paid');
        if (paid) setPaidPayment(paid);
      })
      .catch(() => {});
  }, [order]);

  const downloadReceipt = async () => {
    if (!paidPayment?.reference) return;
    try {
      toast.loading('Preparing receipt...', { id: 'receipt' });
      const res = await paymentsApi.downloadReceipt(paidPayment.reference);
      const contentType = res.headers['content-type'] || 'application/pdf';
      const ext = contentType.includes('html') ? 'html' : 'pdf';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Taqon-Receipt-${paidPayment.reference}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded', { id: 'receipt' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not download receipt', { id: 'receipt' });
    }
  };

  if (loading) return <DetailPageSkeleton />;

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center"
      >
        <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white mb-3">Order Confirmed!</h1>
        <p className="text-gray-500 dark:text-white/50 text-lg mb-2">Thank you for your order</p>
        <p className="text-taqon-orange font-semibold text-xl mb-8">{orderNumber}</p>

        {order && (
          <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 text-left mb-8">
            <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4 flex items-center gap-2">
              <Package size={18} /> Order Summary
            </h2>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-white/70">{item.product_name} x{item.quantity}</span>
                  <span className="text-taqon-charcoal dark:text-white">${parseFloat(item.total_price).toFixed(2)}</span>
                </div>
              ))}
              <hr className="border-warm-200 dark:border-white/10" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-white/50">Subtotal</span>
                <span className="text-taqon-charcoal dark:text-white">${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-white/50">Delivery</span>
                  <span className="text-taqon-charcoal dark:text-white">${parseFloat(order.delivery_fee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t border-warm-200 dark:border-white/10">
                <span className="text-taqon-charcoal dark:text-white">Total</span>
                <span className="text-taqon-orange">${parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-warm-200 dark:border-white/10">
              <p className="text-gray-500 dark:text-white/50 text-sm">Status: <span className="text-taqon-orange capitalize">{order.status}</span></p>
              <p className="text-gray-500 dark:text-white/50 text-sm">Payment: <span className="capitalize">{order.payment_status}</span></p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {paidPayment && (
            <button
              onClick={downloadReceipt}
              className="inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 active:scale-[0.98] transition-all"
            >
              <DownloadSimple size={16} weight="bold" /> Download Receipt
            </button>
          )}
          <Link
            to="/account/orders"
            className="inline-flex items-center justify-center gap-2 border border-warm-200 dark:border-white/20 text-taqon-charcoal dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            View My Orders <ArrowRight size={16} />
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 border border-warm-200 dark:border-white/20 text-taqon-charcoal dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            Continue Shopping
          </Link>
        </div>

        {paidPayment && (
          <p className="text-xs text-gray-500 dark:text-white/40 mt-4">A copy of the receipt has also been emailed to you.</p>
        )}
      </motion.div>
    </div>
  );
}
