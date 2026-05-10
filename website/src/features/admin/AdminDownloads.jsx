import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DownloadSimple, FileText, Package, ShoppingCart, BookOpen,
  ChartLineUp, MagnifyingGlass, Calendar, Clock, X,
  CheckCircle, WarningCircle, ChartBar,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { downloadsApi } from '../../api/downloads';
import { SkeletonBox } from '../../components/Skeletons';

const KIND_META = {
  business_profile:    { label: 'Company Profile',  icon: BookOpen, tone: 'orange' },
  packages_catalogue:  { label: 'Packages Catalogue', icon: FileText, tone: 'violet' },
  instant_quote:       { label: 'Instant Quote',     icon: FileText, tone: 'emerald' },
  package_brochure:    { label: 'Package Brochure',  icon: Package,  tone: 'blue' },
  product_brochure:    { label: 'Product Brochure',  icon: ShoppingCart, tone: 'amber' },
  other:               { label: 'Other',             icon: DownloadSimple, tone: 'gray' },
};

const TONE = {
  orange:  'bg-taqon-orange/10 text-taqon-orange',
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  violet:  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  gray:    'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/55',
};

export default function AdminDownloads() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState('');
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (kindFilter) params.kind = kindFilter;
      if (search.trim()) params.search = search.trim();
      const [listRes, statsRes] = await Promise.all([
        downloadsApi.adminList(params),
        downloadsApi.adminStats(),
      ]);
      setItems(listRes.data?.results || listRes.data || []);
      setStats(statsRes.data);
    } catch {
      toast.error('Could not load downloads');
    } finally {
      setLoading(false);
    }
  }, [kindFilter, search]);

  useEffect(() => { load(); }, [load]);

  const kindCounts = useMemo(() => {
    const m = {};
    if (stats?.by_kind) for (const row of stats.by_kind) m[row.kind] = row.count;
    return m;
  }, [stats]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <SEO title="Downloads · Admin" />

      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
            <DownloadSimple size={20} weight="duotone" className="text-taqon-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Downloads
            </h1>
            <p className="text-sm text-taqon-muted dark:text-white/50">
              Every catalogue, brochure, profile, and quote pulled from the platform.
            </p>
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={ChartLineUp}
          label="Total downloads"
          value={stats?.total ?? '—'}
          tone="orange"
        />
        <StatCard
          icon={Calendar}
          label="Last 7 days"
          value={stats?.last_7d ?? '—'}
          tone="blue"
        />
        <StatCard
          icon={Clock}
          label="Last 24 hours"
          value={stats?.last_24h ?? '—'}
          tone="violet"
        />
        <StatCard
          icon={WarningCircle}
          label="Failed"
          value={stats?.failed_total ?? '—'}
          tone={stats?.failed_total > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* Kind filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterPill
          label="All kinds"
          count={stats?.total ?? 0}
          active={!kindFilter}
          onClick={() => setKindFilter('')}
        />
        {Object.entries(KIND_META).filter(([k]) => k !== 'other').map(([key, meta]) => (
          <FilterPill
            key={key}
            label={meta.label}
            icon={meta.icon}
            count={kindCounts[key] || 0}
            active={kindFilter === key}
            tone={meta.tone}
            onClick={() => setKindFilter(key)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-taqon-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by document, customer name, email, IP..."
          className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl bg-white dark:bg-taqon-charcoal border border-gray-200 dark:border-white/10 text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => <SkeletonBox key={i} className="h-16" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-taqon-orange/10 flex items-center justify-center mb-4">
            <DownloadSimple size={26} weight="duotone" className="text-taqon-orange" />
          </div>
          <p className="text-base font-semibold text-taqon-charcoal dark:text-white">No downloads here.</p>
          <p className="text-sm text-taqon-muted dark:text-white/45 mt-1">
            Customer downloads (brochures, catalogues, quotes, the company profile) appear here in real time.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
          {items.map((it, i) => (
            <DownloadRow
              key={it.id}
              item={it}
              divider={i < items.length - 1}
              onOpen={() => setActive(it)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && <DetailDrawer item={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = 'orange' }) {
  return (
    <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TONE[tone]}`}>
        <Icon size={18} weight="duotone" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest font-bold text-taqon-muted dark:text-white/45 truncate">{label}</p>
        <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white tabular-nums mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, tone = 'gray', icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
        active
          ? 'bg-taqon-orange text-white border-taqon-orange shadow-sm shadow-taqon-orange/20'
          : `${TONE[tone]} border-transparent hover:border-gray-200 dark:hover:border-white/15`
      }`}
    >
      {Icon && <Icon size={12} weight="duotone" />}
      {label}
      {count > 0 && (
        <span className={`text-[10px] tabular-nums px-1.5 rounded-full ${active ? 'bg-white/25' : 'bg-black/5 dark:bg-white/15'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function DownloadRow({ item, divider, onOpen }) {
  const meta = KIND_META[item.kind] || KIND_META.other;
  const Icon = meta.icon;
  const created = new Date(item.created_at);
  const ago = relativeTime(created);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
        divider ? 'border-b border-gray-100 dark:border-white/10' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TONE[meta.tone]}`}>
        <Icon size={18} weight="duotone" />
      </div>
      <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-center">
        <div className="sm:col-span-4 min-w-0">
          <p className="font-semibold text-taqon-charcoal dark:text-white text-sm truncate">
            {item.target_label || item.target_slug || meta.label}
          </p>
          <p className="text-xs text-taqon-muted dark:text-white/45 truncate">{meta.label}</p>
        </div>
        <div className="sm:col-span-3 min-w-0 text-xs text-taqon-charcoal/75 dark:text-white/55 truncate">
          {item.customer_email
            ? <span>{item.customer_name || item.customer_email}</span>
            : item.user_email
              ? <span>{item.user_email}</span>
              : <span className="text-taqon-muted/60">Anonymous</span>}
        </div>
        <div className="sm:col-span-2 text-xs text-taqon-charcoal/75 dark:text-white/55 truncate">
          {item.surface_display || '—'}
        </div>
        <div className="sm:col-span-2 text-xs text-taqon-muted dark:text-white/45 tabular-nums truncate">
          {ago}
        </div>
        <div className="sm:col-span-1 flex items-center justify-end gap-1.5">
          {item.success ? (
            <CheckCircle size={14} weight="fill" className="text-emerald-500" />
          ) : (
            <WarningCircle size={14} weight="fill" className="text-amber-500" />
          )}
        </div>
      </div>
    </button>
  );
}

function DetailDrawer({ item, onClose }) {
  const meta = KIND_META[item.kind] || KIND_META.other;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.aside
        initial={{ x: 360 }}
        animate={{ x: 0 }}
        exit={{ x: 360 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md bg-white dark:bg-taqon-charcoal h-full overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white dark:bg-taqon-charcoal border-b border-gray-100 dark:border-white/10 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-bold font-syne text-taqon-charcoal dark:text-white">Download detail</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
            <X size={18} className="text-taqon-muted" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${TONE[meta.tone]}`}>
              <Icon size={22} weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white leading-tight">
                {item.target_label || item.target_slug || meta.label}
              </p>
              <p className="text-xs text-taqon-muted dark:text-white/45 mt-1">{meta.label}</p>
            </div>
            {item.success ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-1 rounded-full">
                Success
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 px-2 py-1 rounded-full">
                Failed
              </span>
            )}
          </div>

          <Section title="Who">
            {item.user_email && <Row label="Account">{item.user_email}</Row>}
            {item.customer_name && <Row label="Name">{item.customer_name}</Row>}
            {item.customer_email && <Row label="Email">{item.customer_email}</Row>}
            {item.ip_address && <Row label="IP">{item.ip_address}</Row>}
          </Section>

          <Section title="Where">
            <Row label="Surface">{item.surface_display}</Row>
            {item.referer && <Row label="Referer"><span className="text-xs break-all">{item.referer}</span></Row>}
            <Row label="Time">{new Date(item.created_at).toLocaleString()}</Row>
          </Section>

          {item.user_agent && (
            <Section title="User agent">
              <p className="text-[11px] font-mono break-all text-taqon-muted dark:text-white/55 leading-relaxed">
                {item.user_agent}
              </p>
            </Section>
          )}

          {Object.keys(item.metadata || {}).length > 0 && (
            <Section title="Metadata">
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(item.metadata).map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-100 dark:border-white/5 last:border-0">
                      <td className="py-1.5 pr-3 text-taqon-muted dark:text-white/45 align-top w-1/3">{k}</td>
                      <td className="py-1.5 text-taqon-charcoal dark:text-white/85 break-all">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <Section title="Outcome">
            {item.file_size_bytes && <Row label="File size">{Math.round(item.file_size_bytes / 1024)} KB</Row>}
            {!item.success && item.failure_reason && <Row label="Failure">{item.failure_reason}</Row>}
          </Section>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-taqon-orange mb-2">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
      <span className="text-xs text-taqon-muted dark:text-white/45 min-w-[88px]">{label}</span>
      <span className="text-sm text-taqon-charcoal dark:text-white/85 flex-1 min-w-0">{children}</span>
    </div>
  );
}

function relativeTime(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
