import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, ShoppingCart, CurrencyDollar, FileText, ChatsTeardrop,
  BookOpen, Wrench, TrendUp, ArrowUpRight, ArrowDownRight,
  WarningCircle, UserPlus, CreditCard, Pulse,
  ChartBar, Clock, CaretRight, DownloadSimple, Lightning,
} from '@phosphor-icons/react';
import SEO from '../../components/SEO';
import { DashboardKPISkeleton, SkeletonBox } from '../../components/Skeletons';
import { useAdminDashboard, useAdminRecentActivity, useAdminRevenue } from '../../hooks/useQueries';

const KPI_CARDS = [
  { key: 'total_revenue', label: 'Total Revenue', icon: CurrencyDollar, color: 'text-green-400 bg-green-500/10', prefix: '$', format: 'currency' },
  { key: 'revenue_this_month', label: 'This Month', icon: TrendUp, color: 'text-emerald-400 bg-emerald-500/10', prefix: '$', format: 'currency' },
  { key: 'total_orders', label: 'Total Orders', icon: ShoppingCart, color: 'text-blue-400 bg-blue-500/10' },
  { key: 'total_users', label: 'Total Users', icon: Users, color: 'text-purple-400 bg-purple-500/10' },
  { key: 'total_instant_quotes', label: 'Instant Quotes', icon: DownloadSimple, color: 'text-indigo-400 bg-indigo-500/10', link: '/admin/quotations' },
  { key: 'total_advisor_sessions', label: 'Advisor Sessions', icon: Lightning, color: 'text-pink-400 bg-pink-500/10', link: '/admin/quotations' },
  { key: 'pending_orders', label: 'Pending Orders', icon: Clock, color: 'text-yellow-400 bg-yellow-500/10' },
  { key: 'open_tickets', label: 'Open Tickets', icon: ChatsTeardrop, color: 'text-taqon-orange bg-taqon-orange/10' },
];

const ACTIVITY_ICONS = {
  order: ShoppingCart,
  user: UserPlus,
  ticket: ChatsTeardrop,
  payment: CreditCard,
};

const ACTIVITY_COLORS = {
  order: 'text-blue-400 bg-blue-500/10',
  user: 'text-purple-400 bg-purple-500/10',
  ticket: 'text-taqon-orange bg-taqon-orange/10',
  payment: 'text-green-400 bg-green-500/10',
};

function formatValue(val, format, prefix = '') {
  if (format === 'currency') {
    const num = parseFloat(val) || 0;
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `${prefix}${Number(val || 0).toLocaleString()}`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useAdminDashboard();
  const { data: activity = [] } = useAdminRecentActivity({ limit: 15 });
  const { data: revenue } = useAdminRevenue({ period: 'daily', days: 30 });

  const loading = dashLoading;
  const error = dashError ? 'Failed to load dashboard data.' : null;

  if (loading) {
    return (
      <div className="pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-3 mb-8">
            <SkeletonBox className="h-7 w-48 rounded-lg" />
            <SkeletonBox className="h-4 w-64 rounded-md" />
          </div>
          <DashboardKPISkeleton count={8} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <SkeletonBox className="h-80 rounded-2xl" />
            <SkeletonBox className="h-80 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <WarningCircle size={32} className="text-red-400" />
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      <SEO title="Admin Dashboard" />

      <div className="pb-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">Platform overview and management</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/users"
                className="px-4 py-2 text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Manage Users
              </Link>
              <Link
                to="/admin/orders"
                className="px-4 py-2 text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Manage Orders
              </Link>
              <Link
                to="/admin/analytics"
                className="px-4 py-2 text-xs font-semibold bg-taqon-orange text-taqon-charcoal dark:text-white rounded-lg hover:bg-taqon-orange/90 transition-colors"
              >
                Full Analytics
              </Link>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {KPI_CARDS.map(({ key, label, icon: Icon, color, prefix, format, link }, i) => {
              const badge = key === 'total_instant_quotes' && dashboard?.instant_quotes_today > 0
                ? `+${dashboard.instant_quotes_today} today`
                : key === 'total_advisor_sessions' && dashboard?.advisor_sessions_today > 0
                ? `+${dashboard.advisor_sessions_today} today`
                : null;

              const card = (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white dark:bg-taqon-charcoal/40 rounded-xl p-4 border border-warm-100 dark:border-white/5 ${link ? 'hover:border-taqon-orange/30 transition-colors cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                      <Icon size={16} />
                    </div>
                    {badge && (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-400">
                        <ArrowUpRight size={10} /> {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-taqon-charcoal dark:text-white font-syne">
                    {formatValue(dashboard?.[key], format, prefix)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </motion.div>
              );

              return link ? (
                <Link key={key} to={link}>{card}</Link>
              ) : (
                <div key={key}>{card}</div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Revenue Chart Area */}
            <div className="lg:col-span-2 bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white flex items-center gap-2">
                  <ChartBar size={16} className="text-taqon-orange" />
                  Revenue (Last 30 Days)
                </h2>
                <Link to="/admin/analytics" className="text-xs text-taqon-orange hover:underline">
                  Details
                </Link>
              </div>

              {revenue?.data?.length > 0 ? (
                <div className="h-48">
                  <RevenueChart data={revenue.data} />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-sm text-gray-500">
                  No revenue data yet
                </div>
              )}

              {/* Revenue summary row */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-warm-100 dark:border-white/5">
                <div>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-sm font-bold text-taqon-charcoal dark:text-white">${parseFloat(revenue?.total_revenue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-sm font-bold text-taqon-charcoal dark:text-white">{revenue?.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Order</p>
                  <p className="text-sm font-bold text-taqon-charcoal dark:text-white">${parseFloat(revenue?.avg_order_value || 0).toFixed(0)}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-4">
              {/* User roles */}
              <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
                <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">Users by Role</h3>
                <div className="space-y-2">
                  {Object.entries(dashboard?.users_by_role || {}).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 capitalize">{role}</span>
                      <span className="text-xs font-semibold text-taqon-charcoal dark:text-white">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solar Advisor Activity */}
              <Link to="/admin/quotations" className="block bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5 hover:border-taqon-orange/30 transition-colors">
                <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3 flex items-center gap-2">
                  <Lightning size={14} className="text-taqon-orange" />
                  Solar Advisor
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Sessions (all-time)</span>
                    <span className="text-sm font-bold text-taqon-charcoal dark:text-white tabular-nums">{dashboard?.total_advisor_sessions || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Sessions this month</span>
                    <span className="text-sm font-bold text-taqon-charcoal dark:text-white tabular-nums">{dashboard?.advisor_sessions_month || 0}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-warm-100 dark:border-white/5">
                    <span className="text-xs text-gray-400">Quotes downloaded</span>
                    <span className="text-sm font-bold text-taqon-orange tabular-nums">{dashboard?.total_instant_quotes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Quotes today</span>
                    <span className="text-sm font-bold text-green-400 tabular-nums">{dashboard?.instant_quotes_today || 0}</span>
                  </div>
                </div>
              </Link>

              {/* Technicians */}
              <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
                <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">Technicians</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-lg font-bold text-taqon-charcoal dark:text-white">{dashboard?.active_technicians || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending Jobs</p>
                    <p className="text-lg font-bold text-yellow-400">{dashboard?.pending_jobs || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6 bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white flex items-center gap-2">
                <Pulse size={16} className="text-taqon-orange" />
                Recent Activity
              </h2>
            </div>

            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {activity.map((a, i) => {
                  const Icon = ACTIVITY_ICONS[a.type] || Pulse;
                  const color = ACTIVITY_COLORS[a.type] || 'text-gray-400 bg-gray-500/10';
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-taqon-charcoal dark:text-white truncate">{a.title}</p>
                        <p className="text-xs text-gray-500 truncate">{a.description}</p>
                      </div>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">{timeAgo(a.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Instant Quotes', to: '/admin/quotations', icon: DownloadSimple, badge: dashboard?.total_instant_quotes },
              { label: 'Advisor Sessions', to: '/admin/quotations', icon: Lightning, badge: dashboard?.total_advisor_sessions },
              { label: 'Manage Orders', to: '/admin/orders', icon: ShoppingCart, badge: dashboard?.pending_orders },
              { label: 'Manage Users', to: '/admin/users', icon: Users, badge: null },
            ].map(({ label, to, icon: Icon, badge }) => (
              <Link
                key={label}
                to={to}
                className="flex items-center gap-3 bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-4 hover:border-taqon-orange/20 transition-colors group"
              >
                <Icon size={16} className="text-gray-400 group-hover:text-taqon-orange transition-colors" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-300">{label}</p>
                </div>
                {badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 bg-taqon-orange text-taqon-charcoal dark:text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge}
                  </span>
                )}
                <CaretRight size={14} className="text-gray-600" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Mini SVG Revenue Bar Chart ──────────────────────────────── */

function RevenueChart({ data }) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => parseFloat(d.revenue) || 0);
  const max = Math.max(...values, 1);
  const barWidth = Math.max(4, Math.min(20, 600 / data.length - 2));
  const svgWidth = data.length * (barWidth + 2);

  return (
    <div className="w-full h-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} 180`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        {data.map((d, i) => {
          const h = (values[i] / max) * 160;
          return (
            <g key={i}>
              <rect
                x={i * (barWidth + 2)}
                y={170 - h}
                width={barWidth}
                height={h}
                rx={2}
                fill={values[i] > 0 ? '#F26522' : 'rgba(255,255,255,0.05)'}
                opacity={0.8}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
