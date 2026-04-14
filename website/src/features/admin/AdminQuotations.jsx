import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Lightning, MagnifyingGlass, DownloadSimple,
  User, EnvelopeSimple, Phone, MapPin, Clock, Package,
  ChartBar, X, CaretRight, Sparkle, SpinnerGap, ListBullets,
  CurrencyDollar, ArrowRight,
} from '@phosphor-icons/react';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';

const TABS = [
  { key: 'quotes', label: 'Instant Quotes', icon: DownloadSimple },
  { key: 'sessions', label: 'Advisor Sessions', icon: ChartBar },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-ZW', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function tierBadgeClass(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('budget')) return 'bg-blue-500/10 text-blue-400';
  if (l.includes('recommend') || l.includes('good')) return 'bg-taqon-orange/10 text-taqon-orange';
  if (l.includes('excellent')) return 'bg-emerald-500/10 text-emerald-400';
  return 'bg-gray-500/10 text-gray-400';
}

/* ─── Appliances Table (shared) ─── */
function AppliancesTable({ appliances }) {
  if (!appliances || appliances.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] text-center">
        <ListBullets size={24} className="mx-auto text-[var(--text-muted)] opacity-40 mb-2" />
        <p className="text-xs text-[var(--text-muted)]">
          No appliance list. This quote was likely downloaded from a package detail page (not the Solar Advisor).
        </p>
      </div>
    );
  }

  // Group by category
  const grouped = {};
  for (const a of appliances) {
    const cat = a.category || 'other';
    grouped[cat] = grouped[cat] || [];
    grouped[cat].push(a);
  }

  const totalPP = appliances.reduce((s, a) => s + (parseFloat(a.pp || 0) * (a.quantity || 1)), 0);
  const totalEP = appliances.reduce((s, a) => s + (parseFloat(a.ep || 0) * (a.quantity || 1)), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Selected Appliances ({appliances.length})
        </p>
        <div className="flex gap-3 text-xs">
          <span className="text-[var(--text-muted)]">PP: <strong className="text-[var(--text-primary)] tabular-nums">{totalPP.toFixed(1)}</strong></span>
          <span className="text-[var(--text-muted)]">EP: <strong className="text-[var(--text-primary)] tabular-nums">{totalEP.toFixed(1)}</strong></span>
        </div>
      </div>
      <div className="space-y-3">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
              {cat} &middot; {items.length}
            </div>
            <div>
              {items.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 border-t border-[var(--border-subtle)] first:border-t-0 text-sm"
                >
                  <span className="text-[var(--text-primary)] truncate">{a.name}</span>
                  <span className="text-xs font-bold text-taqon-orange tabular-nums shrink-0">×{a.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Quote Detail Modal ─── */
function QuoteDetailModal({ quoteId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quoteId) return;
    setLoading(true);
    adminApi.getInstantQuoteDetail(quoteId)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [quoteId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl shadow-2xl border border-[var(--card-border)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-taqon-orange" />
            <h3 className="font-syne font-bold text-lg text-[var(--text-primary)]">Quote Details</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] flex items-center justify-center transition-colors">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <SpinnerGap size={24} className="animate-spin text-taqon-orange" />
            </div>
          ) : !data ? (
            <p className="text-center py-8 text-[var(--text-muted)]">Failed to load quote details.</p>
          ) : (
            <div className="space-y-5">
              {/* Customer */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Customer</p>
                <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={14} className="text-[var(--text-muted)]" />
                    <span className="text-[var(--text-primary)] font-medium">{data.customer_name || 'Anonymous'}</span>
                  </div>
                  {data.customer_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <EnvelopeSimple size={14} className="text-[var(--text-muted)]" />
                      <a href={`mailto:${data.customer_email}`} className="text-[var(--text-secondary)] hover:text-taqon-orange transition-colors">
                        {data.customer_email}
                      </a>
                    </div>
                  )}
                  {data.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-[var(--text-muted)]" />
                      <a href={`tel:${data.customer_phone}`} className="text-[var(--text-secondary)] hover:text-taqon-orange transition-colors">
                        {data.customer_phone}
                      </a>
                    </div>
                  )}
                  {data.customer_address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-[var(--text-muted)]" />
                      <span className="text-[var(--text-secondary)]">{data.customer_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Package */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Package</p>
                <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-taqon-orange" />
                      <span className="font-semibold text-[var(--text-primary)]">{data.package_name}</span>
                    </div>
                    {data.tier_label && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierBadgeClass(data.tier_label)}`}>
                        {data.tier_label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">Distance</span>
                    <span className="text-[var(--text-primary)] tabular-nums">{data.distance_km}km from Harare</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Total Price</span>
                    <span className="text-xl font-bold text-taqon-orange font-syne tabular-nums">
                      ${parseFloat(data.total_price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Session (if linked) */}
              {data.session_id && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <Sparkle size={12} className="text-purple-400" weight="fill" />
                    From Solar Advisor
                  </p>
                  <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Total PP</p>
                        <p className="font-bold text-[var(--text-primary)] tabular-nums">{parseFloat(data.session_total_pp || 0).toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Total EP</p>
                        <p className="font-bold text-[var(--text-primary)] tabular-nums">{parseFloat(data.session_total_ep || 0).toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appliances */}
              <div>
                <AppliancesTable appliances={data.appliances || []} />
              </div>

              {/* Meta */}
              <div className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span>Downloaded {formatDate(data.created_at)}</span>
                <span className="font-mono text-[10px] opacity-50">{data.id}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Session Detail Modal ─── */
function SessionDetailModal({ sessionId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    adminApi.getAdvisorSessionDetail(sessionId)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl shadow-2xl border border-[var(--card-border)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightning size={18} className="text-purple-400" />
            <h3 className="font-syne font-bold text-lg text-[var(--text-primary)]">Solar Advisor Session</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] flex items-center justify-center transition-colors">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <SpinnerGap size={24} className="animate-spin text-taqon-orange" />
            </div>
          ) : !data ? (
            <p className="text-center py-8 text-[var(--text-muted)]">Failed to load session.</p>
          ) : (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total PP', value: parseFloat(data.total_pp || 0).toFixed(1) },
                  { label: 'Total EP', value: parseFloat(data.total_ep || 0).toFixed(1) },
                  { label: 'Appliances', value: data.appliance_count || 0 },
                  { label: 'Distance', value: `${data.distance_km || 0}km` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
                    <p className="text-lg font-bold text-[var(--text-primary)] font-syne tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              {/* Matched packages */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Matched Packages</p>
                <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 space-y-2">
                  {[
                    { label: 'Budget', value: data.budget_package, color: 'text-blue-400' },
                    { label: 'Recommended', value: data.good_fit_package, color: 'text-taqon-orange' },
                    { label: 'Excellent', value: data.excellent_package, color: 'text-emerald-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className={`font-semibold ${color}`}>{label}</span>
                      <span className="text-[var(--text-secondary)] truncate ml-2 text-right">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              {(data.priority || data.use_style) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Preferences</p>
                  <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 flex flex-wrap gap-2">
                    {data.priority && (
                      <span className="text-xs px-2 py-1 rounded-md bg-[var(--card-bg)] text-[var(--text-secondary)]">
                        Priority: <strong className="text-[var(--text-primary)]">{data.priority}</strong>
                      </span>
                    )}
                    {data.use_style && (
                      <span className="text-xs px-2 py-1 rounded-md bg-[var(--card-bg)] text-[var(--text-secondary)]">
                        Use: <strong className="text-[var(--text-primary)]">{data.use_style.replace(/_/g, ' ')}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Appliances */}
              <AppliancesTable appliances={data.appliances || []} />

              <div className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span>Session at {formatDate(data.created_at)}</span>
                {data.ip_address && <span className="font-mono text-[10px] opacity-50">{data.ip_address}</span>}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Instant Quotes Tab ─── */
function InstantQuotesTab({ onOpen }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    adminApi.getInstantQuotes({ page_size: 100, search: search || undefined })
      .then(({ data }) => setQuotes(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex gap-4">
              <SkeletonBox className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-48 rounded" />
                <SkeletonBox className="h-3 w-32 rounded" />
              </div>
              <SkeletonBox className="h-6 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          className="auth-input pl-9 pr-4 py-2 text-sm w-full max-w-xs"
          placeholder="Search by name, email, or package..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-16">
          <DownloadSimple size={40} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
          <p className="text-[var(--text-muted)]">{search ? 'No quotes match your search' : 'No instant quotes downloaded yet'}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Quotes will appear here when customers download them</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
            <div className="col-span-3">Customer</div>
            <div className="col-span-3">Package</div>
            <div className="col-span-2">Tier</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Date</div>
          </div>

          {quotes.map((q) => (
            <motion.button
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onOpen(q.id)}
              className="w-full text-left bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 md:grid md:grid-cols-12 md:gap-3 md:items-center hover:border-taqon-orange/30 hover:bg-[var(--bg-tertiary)] transition-all group"
            >
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-taqon-orange/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-taqon-orange" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{q.customer_name || 'Anonymous'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{q.customer_email}</p>
                  </div>
                </div>
              </div>
              <div className="col-span-3 mt-2 md:mt-0">
                <p className="text-sm text-[var(--text-primary)]">{q.package_name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{q.distance_km}km from Harare</p>
              </div>
              <div className="col-span-2 mt-2 md:mt-0">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tierBadgeClass(q.tier_label)}`}>
                  {q.tier_label || 'Standard'}
                </span>
              </div>
              <div className="col-span-2 mt-2 md:mt-0 text-right">
                <span className="text-sm font-bold text-taqon-orange font-syne tabular-nums">
                  ${parseFloat(q.total_price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="col-span-2 mt-2 md:mt-0 text-right flex items-center justify-end gap-2">
                <p className="text-xs text-[var(--text-muted)]">{formatDate(q.created_at)}</p>
                <CaretRight size={12} className="text-[var(--text-muted)] group-hover:text-taqon-orange transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Advisor Sessions Tab ─── */
function AdvisorSessionsTab({ onOpen }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getAdvisorSessions({ page_size: 100 })
      .then(({ data }) => setSessions(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex gap-4">
              <SkeletonBox className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-48 rounded" />
                <SkeletonBox className="h-3 w-64 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <ChartBar size={40} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
          <p className="text-[var(--text-muted)]">No Solar Advisor sessions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
            <div className="col-span-2">PP / EP</div>
            <div className="col-span-1">Appliances</div>
            <div className="col-span-3">Budget Match</div>
            <div className="col-span-3">Recommended Match</div>
            <div className="col-span-1">Distance</div>
            <div className="col-span-2 text-right">Date</div>
          </div>

          {sessions.map((s) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onOpen(s.id)}
              className="w-full text-left bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 md:grid md:grid-cols-12 md:gap-3 md:items-center hover:border-taqon-orange/30 hover:bg-[var(--bg-tertiary)] transition-all group"
            >
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Lightning size={14} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] tabular-nums">PP {parseFloat(s.total_pp).toFixed(1)}</p>
                    <p className="text-[10px] text-[var(--text-muted)] tabular-nums">EP {parseFloat(s.total_ep).toFixed(1)}</p>
                  </div>
                </div>
              </div>
              <div className="col-span-1 mt-1 md:mt-0">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{s.appliance_count}</span>
              </div>
              <div className="col-span-3 mt-1 md:mt-0">
                <p className="text-xs text-[var(--text-primary)] truncate">{s.budget_package || '—'}</p>
              </div>
              <div className="col-span-3 mt-1 md:mt-0">
                <p className="text-xs text-taqon-orange font-medium truncate">{s.good_fit_package || '—'}</p>
              </div>
              <div className="col-span-1 mt-1 md:mt-0">
                <span className="text-xs text-[var(--text-muted)]">{s.distance_km}km</span>
              </div>
              <div className="col-span-2 mt-1 md:mt-0 text-right flex items-center justify-end gap-2">
                <p className="text-xs text-[var(--text-muted)]">{formatDate(s.created_at)}</p>
                <CaretRight size={12} className="text-[var(--text-muted)] group-hover:text-taqon-orange transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminQuotations() {
  const [tab, setTab] = useState('quotes');
  const [openQuoteId, setOpenQuoteId] = useState(null);
  const [openSessionId, setOpenSessionId] = useState(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">Quotations & Solar Advisor</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Click any row to see full details including selected appliances</p>
      </div>

      <div className="flex gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'quotes' && <InstantQuotesTab onOpen={setOpenQuoteId} />}
      {tab === 'sessions' && <AdvisorSessionsTab onOpen={setOpenSessionId} />}

      <AnimatePresence>
        {openQuoteId && <QuoteDetailModal quoteId={openQuoteId} onClose={() => setOpenQuoteId(null)} />}
        {openSessionId && <SessionDetailModal sessionId={openSessionId} onClose={() => setOpenSessionId(null)} />}
      </AnimatePresence>
    </div>
  );
}
