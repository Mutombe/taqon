import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MagnifyingGlass, Wallet, CaretLeft, CaretRight,
  Clock, CheckCircle, XCircle, CurrencyDollar, User, Phone, EnvelopeSimple, MapPin, X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { paymentsApi } from '../../api/payments';
import { SkeletonBox } from '../../components/Skeletons';

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
  paid: { label: 'Paid', class: 'bg-green-500/10 text-green-500', icon: CheckCircle },
  cancelled: { label: 'Cancelled', class: 'bg-red-500/10 text-red-400', icon: XCircle },
  refunded: { label: 'Refunded', class: 'bg-gray-500/10 text-gray-400', icon: XCircle },
  converted: { label: 'Converted', class: 'bg-blue-500/10 text-blue-400', icon: CheckCircle },
};

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.class}`}>
      <Icon size={11} weight="bold" /> {cfg.label}
    </span>
  );
}

function fmtMoney(amount, currency = 'USD') {
  return `${currency} ${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await paymentsApi.adminListDeposits(params);
      setDeposits(data.results || data);
      setTotalCount(data.count ?? (data.results?.length || 0));
      const pageSize = data.results ? (data.results.length || 1) : 1;
      setTotalPages(data.count ? Math.max(1, Math.ceil(data.count / Math.max(1, pageSize))) : 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleUpdate = async (depositId, updates) => {
    setUpdating(true);
    try {
      const { data } = await paymentsApi.adminUpdateDeposit(depositId, updates);
      setDeposits((prev) => prev.map((d) => d.id === depositId ? data : d));
      setSelected(data);
      toast.success('Deposit updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  // Summary counts
  const paidCount = deposits.filter((d) => d.status === 'paid').length;
  const pendingCount = deposits.filter((d) => d.status === 'pending').length;
  const totalValue = deposits
    .filter((d) => d.status === 'paid')
    .reduce((s, d) => s + parseFloat(d.deposit_amount || 0), 0);

  return (
    <>
      <SEO title="Package Deposits" />
      <div className="pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/admin/dashboard" className="text-gray-400 hover:text-taqon-charcoal dark:hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Package Deposits</h1>
              <p className="text-sm text-gray-400">{totalCount} {totalCount === 1 ? 'deposit' : 'deposits'} · Reservation payments for solar packages</p>
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Paid (this page)</p>
              <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mt-1">{paidCount}</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold font-syne text-yellow-500 mt-1">{pendingCount}</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Paid value (this page)</p>
              <p className="text-2xl font-bold font-syne text-green-500 mt-1">{fmtMoney(totalValue)}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone, package..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taqon-orange/30"
              />
            </form>
            <div className="flex gap-2 overflow-x-auto">
              {['', 'pending', 'paid', 'cancelled', 'refunded'].map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                    statusFilter === s ? 'bg-taqon-orange text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonBox key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : deposits.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-dashed border-gray-200 dark:border-white/10">
              <Wallet size={32} className="mx-auto text-gray-300 dark:text-white/20 mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/50">No deposits yet.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 overflow-hidden">
              {deposits.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${i > 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}
                >
                  <div className="w-10 h-10 rounded-lg bg-taqon-orange/10 flex items-center justify-center shrink-0">
                    <Wallet size={16} className="text-taqon-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-taqon-charcoal dark:text-white truncate">{d.customer_name}</p>
                      <StatusPill status={d.status} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-white/40 truncate mt-0.5">
                      {d.package_name} · {d.tier_label || '—'} · {d.inverter_kva ? `${d.inverter_kva}kVA` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-taqon-charcoal dark:text-white tabular-nums">{fmtMoney(d.deposit_amount, d.currency)}</p>
                    <p className="text-[11px] text-gray-400 dark:text-white/40">{fmtDate(d.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40"
              >
                <CaretLeft size={14} />
              </button>
              <span className="text-xs text-gray-500 dark:text-white/50">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40"
              >
                <CaretRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative bg-white dark:bg-taqon-charcoal rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <div>
                <p className="text-[11px] font-semibold text-taqon-orange uppercase tracking-wider">Deposit</p>
                <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white mt-0.5">{selected.package_name}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Financial summary */}
              <div className="rounded-xl bg-taqon-orange/5 border border-taqon-orange/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-taqon-muted dark:text-white/50 uppercase tracking-wider">Deposit ({selected.deposit_percent}%)</p>
                    <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mt-0.5">{fmtMoney(selected.deposit_amount, selected.currency)}</p>
                  </div>
                  <StatusPill status={selected.status} />
                </div>
                <p className="text-xs text-gray-500 dark:text-white/50 mt-2">
                  Full package: {fmtMoney(selected.package_total, selected.currency)} · {selected.distance_km}km from Harare
                </p>
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer</p>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-taqon-charcoal dark:text-white"><User size={14} className="text-gray-400" /> {selected.customer_name}</div>
                  <div className="flex items-center gap-2 text-taqon-charcoal dark:text-white"><EnvelopeSimple size={14} className="text-gray-400" /> {selected.customer_email}</div>
                  {selected.customer_phone && <div className="flex items-center gap-2 text-taqon-charcoal dark:text-white"><Phone size={14} className="text-gray-400" /> {selected.customer_phone}</div>}
                  {selected.customer_address && <div className="flex items-center gap-2 text-taqon-charcoal dark:text-white"><MapPin size={14} className="text-gray-400" /> {selected.customer_address}</div>}
                </div>
              </div>

              {/* Package snapshot */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Package</p>
                <div className="text-sm text-gray-600 dark:text-white/70 space-y-1">
                  <p><strong className="text-taqon-charcoal dark:text-white">Tier:</strong> {selected.tier_label || '—'}</p>
                  <p><strong className="text-taqon-charcoal dark:text-white">Inverter:</strong> {selected.inverter_kva || '—'}kVA</p>
                  <p><strong className="text-taqon-charcoal dark:text-white">Battery:</strong> {selected.battery_kwh || '—'}kWh</p>
                </div>
              </div>

              {/* Payment info */}
              {selected.latest_payment && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Payment</p>
                  <div className="text-sm text-gray-600 dark:text-white/70 space-y-1">
                    <p><strong className="text-taqon-charcoal dark:text-white">Ref:</strong> <code className="font-mono text-xs">{selected.latest_payment.reference}</code></p>
                    <p><strong className="text-taqon-charcoal dark:text-white">Method:</strong> {selected.latest_payment.method}</p>
                    <p><strong className="text-taqon-charcoal dark:text-white">Status:</strong> {selected.latest_payment.status}</p>
                    {selected.latest_payment.paid_at && <p><strong className="text-taqon-charcoal dark:text-white">Paid:</strong> {fmtDate(selected.latest_payment.paid_at)}</p>}
                  </div>
                </div>
              )}

              {/* Terms audit */}
              <div className="text-xs text-gray-400 dark:text-white/40 pt-2 border-t border-gray-100 dark:border-white/5">
                Terms {selected.terms_version} accepted {fmtDate(selected.terms_accepted_at)}
                {selected.terms_accepted_ip ? ` from ${selected.terms_accepted_ip}` : ''}
              </div>

              {/* Admin controls */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'paid', 'cancelled', 'refunded', 'converted'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdate(selected.id, { status: s })}
                      disabled={updating || selected.status === s}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selected.status === s
                          ? 'bg-taqon-orange text-white'
                          : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
                <textarea
                  defaultValue={selected.admin_notes || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (selected.admin_notes || '')) {
                      handleUpdate(selected.id, { admin_notes: e.target.value });
                    }
                  }}
                  rows={3}
                  placeholder="Admin notes (blur to save)..."
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taqon-orange/30"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
