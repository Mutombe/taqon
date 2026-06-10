import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  CaretLeft, Pencil, CircleNotch, SolarPanel, Lightning, BatteryFull,
  Clock, GitBranch, CurrencyDollar, Cube, ClockCounterClockwise, ArrowCounterClockwise,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { PackageItemsEditor, PackageModal } from './AdminPackages';

const ACTION_STYLE = {
  added: 'bg-green-500/15 text-green-600 dark:text-green-400',
  swapped: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  quantity: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  removed: 'bg-red-500/15 text-red-600 dark:text-red-400',
};
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');

function TrailTab({ slug, onReverted }) {
  const qc = useQueryClient();
  const [reverting, setReverting] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ['pkgChangelog', slug],
    queryFn: () => adminApi.getPackageChangelog(slug, { page_size: 100 }).then((r) => r.data),
  });
  const entries = data?.results || data || [];

  const revert = async (id) => {
    setReverting(id);
    try {
      await adminApi.revertPackageChange(slug, id);
      toast.success('Change reverted');
      qc.invalidateQueries({ queryKey: ['pkgChangelog', slug] });
      onReverted?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Could not revert this change');
    } finally { setReverting(null); }
  };

  if (isLoading) {
    return <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonBox key={i} className="h-12 w-full rounded-xl" />)}</div>;
  }
  if (entries.length === 0) {
    return <div className="text-center py-14 text-[var(--text-muted)]"><ClockCounterClockwise size={36} className="mx-auto opacity-40 mb-2" />No component changes logged yet.</div>;
  }
  return (
    <div className="divide-y divide-[var(--card-border)]">
      {entries.map((e) => (
        <div key={e.id} className={`flex items-center justify-between gap-4 px-5 py-3 ${e.reverted ? 'opacity-50' : ''}`}>
          <div className="flex items-start gap-2.5 min-w-0">
            <span className={`mt-0.5 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${ACTION_STYLE[e.action] || 'bg-gray-500/15 text-[var(--text-muted)]'}`}>{e.action_display}</span>
            <div className="min-w-0">
              <p className={`text-sm text-[var(--text-primary)] ${e.reverted ? 'line-through' : ''}`}>{e.summary}</p>
              <p className="text-xs text-[var(--text-muted)]">{fmtDateTime(e.created_at)}{e.actor_name ? ` · ${e.actor_name}` : ''}{e.reverted ? ' · reverted' : ''}</p>
            </div>
          </div>
          {!e.reverted && (
            <button onClick={() => revert(e.id)} disabled={reverting === e.id}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-taqon-orange hover:bg-taqon-orange/10 flex items-center gap-1 flex-shrink-0 disabled:opacity-50">
              {reverting === e.id ? <CircleNotch size={13} className="animate-spin" /> : <ArrowCounterClockwise size={13} />} Undo
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

const money = (v) => `$${parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v, suffix = '') => (v == null || v === '' || parseFloat(v) === 0 ? '—' : `${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`);

export default function AdminPackageDetail() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('build');

  const { data: pkg, isLoading } = useQuery({
    queryKey: ['adminPackage', slug],
    queryFn: () => adminApi.getAdminPackage(slug).then((r) => r.data),
  });

  const invalidatePublic = () => {
    ['adminPackages', 'packages', 'package', 'packagePrice', 'families', 'family'].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }));
  };
  // After a component changes, refetch this package (specs/price) + public caches.
  const onChanged = () => {
    qc.invalidateQueries({ queryKey: ['adminPackage', slug] });
    qc.invalidateQueries({ queryKey: ['pkgChangelog', slug] });
    invalidatePublic();
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SkeletonBox className="h-8 w-64 rounded" />
        <SkeletonBox className="h-32 w-full rounded-2xl" />
        <SkeletonBox className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-muted)]">Package not found.</p>
        <Link to="/admin/packages" className="text-taqon-orange hover:underline text-sm mt-2 inline-block">← Back to packages</Link>
      </div>
    );
  }

  const specs = [
    { icon: SolarPanel, label: 'System size', value: num(pkg.system_size_kw, ' kW') },
    { icon: Lightning, label: 'Inverter', value: pkg.inverter_kva ? `${num(pkg.inverter_kva)} kVA` : '—' },
    { icon: BatteryFull, label: 'Battery', value: num(pkg.battery_capacity_kwh, ' kWh') },
    { icon: SolarPanel, label: 'Panels', value: pkg.panel_count || '—' },
    { icon: Clock, label: 'Backup', value: num(pkg.backup_hours, ' h') },
    { icon: GitBranch, label: 'Phase', value: pkg.phase || '—' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Link to="/admin/packages" className="text-xs text-[var(--text-muted)] hover:text-taqon-orange flex items-center gap-1 mb-1"><CaretLeft size={12} /> Packages</Link>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">{pkg.name}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {[pkg.family_name, pkg.variant_name, pkg.tier].filter(Boolean).join(' · ')}
            {!pkg.is_active && <span className="ml-2 text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full">Inactive</span>}
          </p>
        </div>
        <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 transition-colors">
          <Pencil size={15} /> Edit details
        </button>
      </div>

      {/* Price + specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1"><CurrencyDollar size={13} /> Total price</p>
          <p className="text-3xl font-bold font-syne text-taqon-orange mt-1">{money(pkg.price)}</p>
          <div className="mt-3 space-y-1 text-xs">
            {[
              ['Material', pkg.material_cost],
              ['Sundries', pkg.sundries_cost],
              ['Labour', pkg.labour_cost],
              ['Transport', pkg.transport_cost],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-[var(--text-muted)]">
                <span>{label}</span><span className="tabular-nums text-[var(--text-secondary)]">{money(val)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {specs.map((s) => (
            <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3">
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1"><s.icon size={13} className="text-taqon-orange" /> {s.label}</p>
              <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Build / Trail tabs */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[var(--card-border)]">
          {[
            { key: 'build', label: 'Components', icon: Cube },
            { key: 'trail', label: 'Change Trail', icon: ClockCounterClockwise },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-taqon-orange text-taqon-orange' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
        {tab === 'build' ? (
          <div className="p-5">
            <PackageItemsEditor slug={pkg.slug} items={pkg.items || []} onItemsChanged={onChanged} />
            <p className="text-[11px] text-[var(--text-muted)] mt-4">
              Swapping panels, batteries, inverters or accessories recalculates the package and updates its specs, price and
              the public detail page automatically. Every change is recorded in the Change Trail and can be undone.
            </p>
          </div>
        ) : (
          <TrailTab slug={pkg.slug} onReverted={onChanged} />
        )}
      </div>

      {/* Description */}
      {pkg.description && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description</h3>
          <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{pkg.description}</p>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <PackageModal
            pkg={pkg}
            onClose={() => setEditing(false)}
            onSaved={() => { qc.invalidateQueries({ queryKey: ['adminPackage', slug] }); invalidatePublic(); }}
            onCascadeChange={onChanged}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
