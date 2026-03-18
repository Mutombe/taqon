import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, CaretRight, Bag } from '@phosphor-icons/react';
import { shopApi } from '../../api/shop';
import { OrderListSkeleton } from '../../components/Skeletons';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 15;

const STATUS_COLORS = {
  pending: 'bg-yellow-500/10 text-yellow-400',
  confirmed: 'bg-blue-500/10 text-blue-400',
  processing: 'bg-purple-500/10 text-purple-400',
  ready_for_delivery: 'bg-cyan-500/10 text-cyan-400',
  out_for_delivery: 'bg-indigo-500/10 text-indigo-400',
  delivered: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
  refunded: 'bg-gray-500/10 text-gray-400',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await shopApi.getOrders({ page, page_size: PAGE_SIZE });
      setOrders(data.results || data);
      if (data.count) setTotalPages(Math.ceil(data.count / PAGE_SIZE));
    } catch {}
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white mb-8"
        >
          My Orders
        </motion.h1>

        {loading ? (
          <OrderListSkeleton count={4} />
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Bag className="w-16 h-16 text-gray-300 dark:text-white/20 mx-auto mb-4" />
            <h2 className="text-xl text-gray-500 dark:text-white/50 mb-4">No orders yet</h2>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-6 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
            >
              Start Shopping
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order, i) => (
                <motion.div
                  key={order.order_number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/account/orders/${order.order_number}`}
                    className="block bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-5 hover:border-taqon-orange/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-taqon-orange/10 rounded-xl flex items-center justify-center">
                          <Package className="w-6 h-6 text-taqon-orange" />
                        </div>
                        <div>
                          <h3 className="text-taqon-charcoal dark:text-white font-semibold">{order.order_number}</h3>
                          <p className="text-gray-400 dark:text-white/40 text-sm">
                            {new Date(order.created_at).toLocaleDateString('en-ZW', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                            {' '}&bull;{' '}{order.total_items} item{order.total_items !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-taqon-charcoal dark:text-white font-semibold">${parseFloat(order.total).toFixed(2)}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] || 'bg-white/10 text-white/50'}`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <CaretRight className="w-5 h-5 text-gray-400 dark:text-white/30 group-hover:text-taqon-orange transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
        )}
      </div>
    </div>
  );
}
