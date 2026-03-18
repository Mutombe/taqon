import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Clock, CircleNotch, CreditCard } from '@phosphor-icons/react';
import { shopApi } from '../../api/shop';
import { paymentsApi } from '../../api/payments';
import { toast } from 'sonner';
import { DetailPageSkeleton } from '../../components/Skeletons';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered'];
const STATUS_ICONS = { pending: Clock, confirmed: CheckCircle, processing: Package, ready_for_delivery: Package, out_for_delivery: Truck, delivered: CheckCircle, cancelled: XCircle };

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    shopApi.getOrder(orderNumber)
      .then(({ data }) => setOrder(data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await shopApi.cancelOrder(orderNumber);
      const { data } = await shopApi.getOrder(orderNumber);
      setOrder(data);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Link to="/account/orders" className="inline-flex items-center gap-1 text-gray-500 dark:text-white/50 hover:text-taqon-charcoal dark:hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to orders
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Order {order.order_number}</h1>
              <p className="text-gray-400 dark:text-white/40 text-sm">
                Placed on {new Date(order.created_at).toLocaleDateString('en-ZW', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {order.payment_status !== 'paid' && order.status === 'pending' && (
                <Link
                  to={`/checkout`}
                  state={{ retryOrder: order.order_number }}
                  className="px-4 py-2 bg-taqon-orange text-white rounded-xl text-sm font-semibold hover:bg-taqon-orange/90 transition-all inline-flex items-center gap-1.5"
                >
                  <CreditCard size={14} /> Pay Now
                </Link>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 border border-red-500/30 text-red-400 rounded-xl text-sm hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Status timeline */}
          {order.status !== 'cancelled' && order.status !== 'refunded' && (
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = STATUS_ICONS[step] || Clock;
                  const isActive = i <= currentStep;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-taqon-orange text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/30'}`}>
                        <Icon size={14} />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-taqon-orange' : 'bg-warm-200 dark:bg-white/10'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-taqon-orange font-medium mt-3 capitalize">{order.status.replace(/_/g, ' ')}</p>
            </div>
          )}

          {/* Items */}
          <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Items</h2>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-warm-100 dark:border-white/5 last:border-0">
                  <div>
                    <p className="text-taqon-charcoal dark:text-white text-sm">{item.product_name}</p>
                    <p className="text-gray-400 dark:text-white/40 text-xs">SKU: {item.product_sku} &bull; Qty: {item.quantity}</p>
                  </div>
                  <p className="text-taqon-charcoal dark:text-white font-medium">${parseFloat(item.total_price).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary + Delivery */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Order Total</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Subtotal</span><span className="text-taqon-charcoal dark:text-white">${parseFloat(order.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Delivery</span><span className="text-taqon-charcoal dark:text-white">${parseFloat(order.delivery_fee).toFixed(2)}</span></div>
                {parseFloat(order.discount_amount) > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500 dark:text-white/50">Discount</span><span className="text-green-400">-${parseFloat(order.discount_amount).toFixed(2)}</span></div>
                )}
                <hr className="border-warm-200 dark:border-white/10" />
                <div className="flex justify-between font-semibold text-lg"><span className="text-taqon-charcoal dark:text-white">Total</span><span className="text-taqon-orange">${parseFloat(order.total).toFixed(2)}</span></div>
              </div>
            </div>

            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Delivery Details</h2>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500 dark:text-white/50">Type: <span className="text-taqon-charcoal dark:text-white capitalize">{order.delivery_type}</span></p>
                {order.delivery_address && <p className="text-gray-500 dark:text-white/50">Address: <span className="text-taqon-charcoal dark:text-white">{order.delivery_address}</span></p>}
                {order.delivery_city && <p className="text-gray-500 dark:text-white/50">City: <span className="text-taqon-charcoal dark:text-white">{order.delivery_city}</span></p>}
                {order.delivery_province && <p className="text-gray-500 dark:text-white/50">Province: <span className="text-taqon-charcoal dark:text-white capitalize">{order.delivery_province}</span></p>}
                <p className="text-gray-500 dark:text-white/50">Payment: <span className="text-taqon-charcoal dark:text-white capitalize">{order.payment_method || 'Not set'}</span></p>
                <p className="text-gray-500 dark:text-white/50">Payment Status: <span className="text-taqon-charcoal dark:text-white capitalize">{order.payment_status}</span></p>
              </div>
            </div>
          </div>

          {/* Status History */}
          {order.status_history?.length > 0 && (
            <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 mt-6">
              <h2 className="text-taqon-charcoal dark:text-white font-semibold mb-4">Status History</h2>
              <div className="space-y-3">
                {order.status_history.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-taqon-orange mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-taqon-charcoal dark:text-white capitalize">{entry.old_status ? `${entry.old_status} → ` : ''}{entry.new_status.replace(/_/g, ' ')}</p>
                      {entry.notes && <p className="text-gray-400 dark:text-white/40">{entry.notes}</p>}
                      <p className="text-gray-400 dark:text-white/30 text-xs">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
