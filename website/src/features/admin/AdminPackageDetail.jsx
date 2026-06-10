import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  CaretLeft, Pencil, CircleNotch, SolarPanel, Lightning, BatteryFull,
  Clock, GitBranch, CurrencyDollar,
} from '@phosphor-icons/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { PackageItemsEditor, PackageModal } from './AdminPackages';

const money = (v) => `$${parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v, suffix = '') => (v == null || v === '' || parseFloat(v) === 0 ? '—' : `${parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`);

export default function AdminPackageDetail() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

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

      {/* Component manager (the editable heart of the page) */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
        <PackageItemsEditor slug={pkg.slug} items={pkg.items || []} onItemsChanged={onChanged} />
        <p className="text-[11px] text-[var(--text-muted)] mt-4">
          Swapping panels, batteries, inverters or accessories recalculates the package and updates its specs, price and
          the public detail page automatically.
        </p>
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
