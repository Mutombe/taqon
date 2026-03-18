import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendUp, Users, ShoppingCart,
  ChatsTeardrop, CurrencyDollar, ChartBar, ChartPie, MapPin,
} from '@phosphor-icons/react';
import SEO from '../../components/SEO';
import { DashboardKPISkeleton, SkeletonBox } from '../../components/Skeletons';
import { useAdminRevenue, useAdminUserAnalytics, useAdminSupportAnalytics } from '../../hooks/useQueries';

const TABS = [
  { key: 'revenue', label: 'Revenue', icon: CurrencyDollar },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'support', label: 'Support', icon: ChatsTeardrop },
];

export default function AdminAnalytics() {
  const [tab, setTab] = useState('revenue');
  const [days, setDays] = useState(30);

  const { data: revenueData, isLoading: revLoading } = useAdminRevenue({ period: days <= 30 ? 'daily' : 'weekly', days });
  const { data: userData, isLoading: userLoading } = useAdminUserAnalytics({ days });
  const { data: supportData, isLoading: supLoading } = useAdminSupportAnalytics({ days });

  const loading = tab === 'revenue' ? revLoading : tab === 'users' ? userLoading : supLoading;

  return (
    <>
      <SEO title="Analytics" />

      <div className="pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/admin/dashboard" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Analytics</h1>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  tab === key ? 'bg-taqon-orange text-taqon-charcoal dark:text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Period */}
          <div className="flex gap-2 mb-6">
            {[7, 30, 90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  days === d ? 'bg-white/15 text-taqon-charcoal dark:text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {d < 365 ? `${d}d` : '1y'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-6">
              <DashboardKPISkeleton count={4} />
              <SkeletonBox className="h-64 rounded-2xl" />
            </div>
          ) : (
            <>
              {tab === 'revenue' && revenueData && <RevenueTab data={revenueData} />}
              {tab === 'users' && userData && <UsersTab data={userData} />}
              {tab === 'support' && supportData && <SupportTab data={supportData} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Revenue Tab ─────────────────────────────────────────────── */

function RevenueTab({ data }) {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: `$${parseFloat(data.total_revenue).toLocaleString()}`, icon: CurrencyDollar, color: 'text-green-400 bg-green-500/10' },
          { label: 'Total Orders', value: data.total_orders, icon: ShoppingCart, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Payments', value: data.total_payments, icon: TrendUp, color: 'text-purple-400 bg-purple-500/10' },
          { label: 'Avg Order Value', value: `$${parseFloat(data.avg_order_value).toFixed(0)}`, icon: ChartBar, color: 'text-taqon-orange bg-taqon-orange/10' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
              <Icon size={14} />
            </div>
            <p className="text-lg font-bold text-taqon-charcoal dark:text-white font-syne">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
        <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">Revenue Over Time</h3>
        {data.data?.length > 0 ? (
          <div className="h-52">
            <BarChart data={data.data.map((d) => ({ label: d.date, value: parseFloat(d.revenue) }))} />
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No data</p>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
        <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">Payment Methods</h3>
        <div className="space-y-2">
          {Object.entries(data.payment_methods || {}).map(([method, count]) => {
            const total = Object.values(data.payment_methods).reduce((a, b) => a + b, 0);
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={method} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-28 capitalize">{method.replace('_', ' ')}</span>
                <div className="flex-1 h-2 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-taqon-orange rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-16 text-right">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Users Tab ───────────────────────────────────────────────── */

function UsersTab({ data }) {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: data.total_users },
          { label: 'Verified', value: data.verified_users },
          { label: 'Unverified', value: data.unverified_users },
          { label: 'Roles', value: Object.keys(data.by_role || {}).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-4">
            <p className="text-lg font-bold text-taqon-charcoal dark:text-white font-syne">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Growth Chart */}
      <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
        <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">User Growth</h3>
        {data.growth?.length > 0 ? (
          <div className="h-48">
            <BarChart data={data.growth.map((g) => ({ label: g.date, value: g.count }))} />
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No growth data</p>
        )}
      </div>

      {/* By Role */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
          <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">By Role</h3>
          <div className="space-y-2">
            {Object.entries(data.by_role || {}).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-400 capitalize">{role}</span>
                <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
          <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4 flex items-center gap-2">
            <MapPin size={14} className="text-taqon-orange" /> By Province
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(data.by_province || {}).sort((a, b) => b[1] - a[1]).map(([province, count]) => (
              <div key={province} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-400">{province}</span>
                <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Support Tab ─────────────────────────────────────────────── */

function SupportTab({ data }) {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Tickets', value: data.total_tickets },
          { label: 'Avg Satisfaction', value: data.avg_satisfaction ? `${data.avg_satisfaction}/5` : 'N/A' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-4">
            <p className="text-lg font-bold text-taqon-charcoal dark:text-white font-syne">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Daily Tickets Chart */}
      <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
        <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-4">Tickets Over Time</h3>
        {data.daily_tickets?.length > 0 ? (
          <div className="h-48">
            <BarChart data={data.daily_tickets.map((d) => ({ label: d.date, value: d.count }))} />
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No ticket data</p>
        )}
      </div>

      {/* Breakdowns */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { title: 'By Status', data: data.status_breakdown },
          { title: 'By Category', data: data.category_breakdown },
          { title: 'By Priority', data: data.priority_breakdown },
        ].map(({ title, data: breakdown }) => (
          <div key={title} className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5">
            <h3 className="text-sm font-semibold text-taqon-charcoal dark:text-white mb-3">{title}</h3>
            <div className="space-y-2">
              {Object.entries(breakdown || {}).map(([key, count]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Reusable SVG Bar Chart ──────────────────────────────────── */

function BarChart({ data }) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value || 0);
  const max = Math.max(...values, 1);
  const barWidth = Math.max(3, Math.min(18, 580 / data.length - 2));
  const svgWidth = data.length * (barWidth + 2);

  return (
    <div className="w-full h-full overflow-x-auto">
      <svg viewBox={`0 0 ${svgWidth} 180`} className="w-full h-full" preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (values[i] / max) * 160;
          return (
            <rect
              key={i}
              x={i * (barWidth + 2)}
              y={170 - h}
              width={barWidth}
              height={h}
              rx={2}
              fill={values[i] > 0 ? '#F26522' : 'rgba(255,255,255,0.05)'}
              opacity={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}
