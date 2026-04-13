import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Lightning, MagnifyingGlass, DownloadSimple,
  User, EnvelopeSimple, Phone, MapPin, Clock, Package,
  ChartBar,
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

/* ─── Instant Quotes Tab ─── */
function InstantQuotesTab() {
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
          <p className="text-xs text-[var(--text-muted)] mt-1">Quotes will appear here when customers download them from the Solar Advisor</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
            <div className="col-span-3">Customer</div>
            <div className="col-span-3">Package</div>
            <div className="col-span-2">Tier</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Date</div>
          </div>

          {quotes.map((q) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 md:grid md:grid-cols-12 md:gap-3 md:items-center"
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
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  q.tier_label?.toLowerCase().includes('budget') ? 'bg-blue-500/10 text-blue-400' :
                  q.tier_label?.toLowerCase().includes('recommend') || q.tier_label?.toLowerCase().includes('good') ? 'bg-taqon-orange/10 text-taqon-orange' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {q.tier_label || 'Standard'}
                </span>
              </div>
              <div className="col-span-2 mt-2 md:mt-0 text-right">
                <span className="text-sm font-bold text-taqon-orange font-syne tabular-nums">
                  ${parseFloat(q.total_price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="col-span-2 mt-2 md:mt-0 text-right">
                <p className="text-xs text-[var(--text-muted)]">{formatDate(q.created_at)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Advisor Sessions Tab ─── */
function AdvisorSessionsTab() {
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
          <p className="text-xs text-[var(--text-muted)] mt-1">Sessions will appear here when customers use the Solar Advisor</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)]">
            <div className="col-span-2">PP / EP</div>
            <div className="col-span-1">Appliances</div>
            <div className="col-span-3">Budget Match</div>
            <div className="col-span-3">Recommended Match</div>
            <div className="col-span-1">Distance</div>
            <div className="col-span-2 text-right">Date</div>
          </div>

          {sessions.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 md:grid md:grid-cols-12 md:gap-3 md:items-center"
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
              <div className="col-span-2 mt-1 md:mt-0 text-right">
                <p className="text-xs text-[var(--text-muted)]">{formatDate(s.created_at)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminQuotations() {
  const [tab, setTab] = useState('quotes');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">Quotations & Solar Advisor</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Track instant quote downloads and recommendation sessions</p>
      </div>

      {/* Tabs */}
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

      {/* Tab content */}
      {tab === 'quotes' && <InstantQuotesTab />}
      {tab === 'sessions' && <AdvisorSessionsTab />}
    </div>
  );
}
