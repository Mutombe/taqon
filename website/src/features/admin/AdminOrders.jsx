import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MagnifyingGlass, ShoppingCart, CaretLeft, CaretRight,
  Package, Clock, Truck, CheckCircle, XCircle, Funnel,
} from '@phosphor-icons/react';
import SEO from '../../components/SEO';
import { DashboardKPISkeleton, OrderListSkeleton, SkeletonBox } from '../../components/Skeletons';
import { useAdminOrderAnalytics } from '../../hooks/useQueries';

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  confirmed: { label: 'Confirmed', class: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
  processing: { label: 'Processing', class: 'bg-indigo-500/10 text-indigo-400', icon: Package },
  ready_for_delivery: { label: 'Ready', class: 'bg-purple-500/10 text-purple-400', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', class: 'bg-taqon-orange/10 text-taqon-orange', icon: Truck },
  delivered: { label: 'Delivered', class: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', class: 'bg-red-500/10 text-red-400', icon: XCircle },
  refunded: { label: 'Refunded', class: 'bg-gray-500/10 text-gray-400', icon: XCircle },
};

const PAYMENT_STATUS_CONFIG = {
  unpaid: 'text-red-400',
  pending: 'text-yellow-400',
  paid: 'text-green-400',
  partially_refunded: 'text-orange-400',
  refunded: 'text-gray-400',
  failed: 'text-red-500',
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('');
  const [days, setDays] = useState(30);

  const { data: analytics, isLoading: loading } = useAdminOrderAnalytics({ days });

  if (loading) {
    return (
      <div className="pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-3 mb-8">
            <SkeletonBox className="h-7 w-52 rounded-lg" />
            <SkeletonBox className="h-4 w-40 rounded-md" />
          </div>
          <DashboardKPISkeleton count={4} />
          <div className="mt-8">
            <OrderListSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Order Management" />

      <div className="pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/admin/dashboard" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Order Management</h1>
              <p className="text-sm text-gray-400">{analytics?.total_orders || 0} total orders</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex gap-2 mb-6">
            {[7, 30, 90, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  days === d ? 'bg-taqon-orange text-taqon-charcoal dark:text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {d === 365 ? '1 Year' : `${d} Days`}
              </button>
            ))}
          </div>

          {/* Status Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {Object.entries(analytics?.status_breakdown || {}).map(([statusKey, count]) => {
              const config = STATUS_CONFIG[statusKey] || { label: statusKey, class: 'bg-gray-500/10 text-gray-400', icon: Package };
              const Icon = config.icon;
              return (
                <motion.div
                  key={statusKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border border-warm-100 dark:border-white/5 p-4 cursor-pointer transition-all ${
                    statusFilter === statusKey ? 'border-taqon-orange/40 bg-taqon-orange/5' : 'bg-white dark:bg-taqon-charcoal/40'
                  }`}
                  onClick={() => setStatusFilter(statusFilter === statusKey ? '' : statusKey)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.class}`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{config.label}</span>
                  </div>
                  <p className="text-xl font-bold text-taqon-charcoal dark:text-white font-syne">{count}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Daily Orders Chart */}
          <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5 mb-6">
            <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">Orders Over Time</h2>
            {analytics?.daily_orders?.length > 0 ? (
              <div className="h-40">
                <OrdersChart data={analytics.daily_orders} />
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No order data for this period</p>
            )}
          </div>

          {/* Top Products */}
          {analytics?.top_products?.length > 0 && (
            <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5 mb-6">
              <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">Top Products</h2>
              <div className="space-y-2">
                {analytics.top_products.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-5">{i + 1}.</span>
                      <span className="text-sm text-gray-300">{p.product__title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">{p.qty} sold</span>
                      <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">${parseFloat(p.revenue).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Status Breakdown */}
          <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
            <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">Payment Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(analytics?.payment_status_breakdown || {}).map(([statusKey, count]) => (
                <div key={statusKey} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                  <span className={`text-xs font-semibold capitalize ${PAYMENT_STATUS_CONFIG[statusKey] || 'text-gray-400'}`}>
                    {statusKey.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-bold text-taqon-charcoal dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Mini Orders Line Chart ──────────────────────────────────── */

function OrdersChart({ data }) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.count || 0);
  const max = Math.max(...values, 1);
  const w = 600;
  const h = 150;
  const padding = 5;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1 || 1)) * (w - 2 * padding);
    const y = h - padding - (v / max) * (h - 2 * padding);
    return `${x},${y}`;
  });

  const areaPoints = [...points, `${w - padding},${h - padding}`, `${padding},${h - padding}`];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F26522" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#F26522" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill="url(#ordersGrad)" />
      <polyline points={points.join(' ')} fill="none" stroke="#F26522" strokeWidth="2" />
    </svg>
  );
}
