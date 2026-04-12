import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash, X, SolarPanel, CircleNotch,
  CheckCircle, Star, Lightning,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { useAdminPackages } from '../../hooks/useQueries';

const TIER_CONFIG = {
  starter: { label: 'Starter', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  popular: { label: 'Popular', color: 'bg-taqon-orange/10 text-taqon-orange border-taqon-orange/20' },
  premium: { label: 'Premium', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  commercial: { label: 'Commercial', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

const EMPTY_FORM = {
  name: '', tier: 'starter', price: '', description: '', short_description: '',
  features: [''],
  system_size_kw: '', inverter_rating_va: '', inverter_kva: '', battery_capacity_kwh: '',
  panel_count: '', phase: '1P',
  variant_code: '', inverter_brand: '', smart_load_supported: false,
  pp_min: '', pp_max: '', ep_min: '', ep_max: '',
  recharge_class: 'moderate', comfort_class: 'balanced', management_tolerance: 'medium',
  is_active: true, is_popular: false,
};

function FeatureList({ features, onChange }) {
  const add = () => onChange([...features, '']);
  const remove = (i) => onChange(features.filter((_, idx) => idx !== i));
  const update = (i, val) => onChange(features.map((f, idx) => idx === i ? val : f));

  return (
    <div className="space-y-2">
      {features.map((f, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="auth-input flex-1 text-sm py-1.5"
            placeholder={`Feature ${i + 1}`}
            value={f}
            onChange={(e) => update(i, e.target.value)}
          />
          {features.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs text-taqon-orange hover:text-taqon-orange/80 transition-colors flex items-center gap-1"
      >
        <Plus size={12} /> Add feature
      </button>
    </div>
  );
}

function PackageModal({ pkg, onClose, onSaved }) {
  const [form, setForm] = useState(pkg ? {
    name: pkg.name || '',
    tier: pkg.tier || 'starter',
    price: pkg.price || '',
    description: pkg.description || '',
    short_description: pkg.short_description || '',
    features: Array.isArray(pkg.features) ? (pkg.features.length ? pkg.features : ['']) : [''],
    system_size_kw: pkg.system_size_kw || '',
    inverter_rating_va: pkg.inverter_rating_va || '',
    inverter_kva: pkg.inverter_kva || '',
    battery_capacity_kwh: pkg.battery_capacity_kwh || '',
    panel_count: pkg.panel_count || '',
    phase: pkg.phase || '1P',
    variant_code: pkg.variant_code || '',
    inverter_brand: pkg.inverter_brand || '',
    smart_load_supported: pkg.smart_load_supported || false,
    pp_min: pkg.pp_min || '',
    pp_max: pkg.pp_max || '',
    ep_min: pkg.ep_min || '',
    ep_max: pkg.ep_max || '',
    recharge_class: pkg.recharge_class || 'moderate',
    comfort_class: pkg.comfort_class || 'balanced',
    management_tolerance: pkg.management_tolerance || 'medium',
    is_active: pkg.is_active ?? true,
    is_popular: pkg.is_popular || false,
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Package name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features.filter((f) => f.trim()),
      };
      let saved;
      if (pkg?.slug) {
        ({ data: saved } = await adminApi.updatePackage(pkg.slug, payload));
        toast.success('Package updated');
      } else {
        ({ data: saved } = await adminApi.createPackage(payload));
        toast.success('Package created');
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-lg h-full bg-[var(--bg-secondary)] border-l border-[var(--card-border)] overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--card-border)]">
            <h2 className="font-syne font-bold text-lg text-[var(--text-primary)]">
              {pkg ? 'Edit Package' : 'Add Package'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Basic */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Package Info</h3>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Package Name *</label>
                <input className="auth-input w-full" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tier</label>
                  <select className="auth-input w-full" value={form.tier} onChange={(e) => set('tier', e.target.value)}>
                    <option value="starter">Starter</option>
                    <option value="popular">Popular</option>
                    <option value="premium">Premium</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Price</label>
                  <input
                    className="auth-input w-full"
                    placeholder="e.g. From $1,200"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
                <textarea className="auth-input w-full resize-none" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Features</h3>
              <FeatureList features={form.features} onChange={(f) => set('features', f)} />
            </div>

            {/* System Specs */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">System Specs</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Variant Code</label>
                  <input className="auth-input w-full text-sm" placeholder="e.g. HE-1, HL-3" value={form.variant_code} onChange={(e) => set('variant_code', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Inverter Brand</label>
                  <select className="auth-input w-full text-sm" value={form.inverter_brand} onChange={(e) => set('inverter_brand', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="must">Must</option>
                    <option value="growatt">Growatt</option>
                    <option value="sunsynk">Sunsynk</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Inverter kVA</label>
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.inverter_kva} onChange={(e) => set('inverter_kva', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Battery (kWh)</label>
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.battery_capacity_kwh} onChange={(e) => set('battery_capacity_kwh', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Panels</label>
                  <input type="number" className="auth-input w-full text-sm" value={form.panel_count} onChange={(e) => set('panel_count', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Phase</label>
                  <select className="auth-input w-full text-sm" value={form.phase} onChange={(e) => set('phase', e.target.value)}>
                    <option value="1P">Single Phase</option>
                    <option value="3P">Three Phase</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">System kW</label>
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.system_size_kw} onChange={(e) => set('system_size_kw', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Inverter VA</label>
                  <input type="number" className="auth-input w-full text-sm" value={form.inverter_rating_va} onChange={(e) => set('inverter_rating_va', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Capability Bands */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Capability Bands (Recommendation Engine)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">PP Min</label>
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.pp_min} onChange={(e) => set('pp_min', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">PP Max</label>
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.pp_max} onChange={(e) => set('pp_max', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">EP Min</label>
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.ep_min} onChange={(e) => set('ep_min', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">EP Max</label>
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.ep_max} onChange={(e) => set('ep_max', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Recharge</label>
                  <select className="auth-input w-full text-sm" value={form.recharge_class} onChange={(e) => set('recharge_class', e.target.value)}>
                    <option value="basic">Basic</option>
                    <option value="moderate">Moderate</option>
                    <option value="balanced">Balanced</option>
                    <option value="strong">Strong</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Comfort</label>
                  <select className="auth-input w-full text-sm" value={form.comfort_class} onChange={(e) => set('comfort_class', e.target.value)}>
                    <option value="budget">Budget</option>
                    <option value="balanced">Balanced</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mgmt Tolerance</label>
                  <select className="auth-input w-full text-sm" value={form.management_tolerance} onChange={(e) => set('management_tolerance', e.target.value)}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Settings</h3>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'is_active', label: 'Active', desc: 'Visible on packages page' },
                  { key: 'is_popular', label: 'Mark as Popular', desc: 'Shows a "Most Popular" badge' },
                  { key: 'smart_load_supported', label: 'Smart Load', desc: 'Inverter supports smart load scheduling' },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => set(key, !form[key])}
                      className={`w-10 h-5.5 rounded-full relative transition-colors flex-shrink-0 ${form[key] ? 'bg-taqon-orange' : 'bg-[var(--input-border)]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                      <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-sm font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {saving ? <CircleNotch size={16} className="animate-spin" /> : null}
                {pkg ? 'Save Changes' : 'Create Package'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DeleteModal({ pkg, onConfirm, onCancel, deleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-sm w-full"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash size={24} className="text-red-400" />
        </div>
        <h3 className="font-syne font-bold text-lg text-[var(--text-primary)] text-center mb-1">Delete Package</h3>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">
          Delete <strong className="text-[var(--text-primary)]">{pkg.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            {deleting ? <CircleNotch size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PackageCard({ pkg, onEdit, onDelete }) {
  const tier = TIER_CONFIG[pkg.tier] || TIER_CONFIG.starter;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative bg-[var(--card-bg)] border rounded-2xl p-5 flex flex-col gap-4 ${
        pkg.is_popular ? 'border-taqon-orange/40 shadow-lg shadow-taqon-orange/10' : 'border-[var(--card-border)]'
      }`}
    >
      {pkg.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-taqon-orange text-white text-xs font-semibold shadow-lg">
            <Star size={10} weight="fill" /> Most Popular
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${tier.color}`}>
              {tier.label}
            </span>
            {!pkg.is_active && (
              <span className="text-xs bg-gray-500/10 text-[var(--text-muted)] px-2 py-0.5 rounded-full">Inactive</span>
            )}
          </div>
          <h3 className="font-syne font-bold text-[var(--text-primary)]">{pkg.name}</h3>
          <p className="text-taqon-orange font-semibold text-sm mt-0.5">{pkg.price}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(pkg)}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-taqon-orange transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(pkg)}
            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
          >
            <Trash size={15} />
          </button>
        </div>
      </div>

      {pkg.description && (
        <p className="text-sm text-[var(--text-muted)]">{pkg.description}</p>
      )}

      {Array.isArray(pkg.features) && pkg.features.length > 0 && (
        <ul className="space-y-1.5">
          {pkg.features.filter(Boolean).slice(0, 5).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <CheckCircle size={14} weight="fill" className="text-green-400 mt-0.5 flex-shrink-0" />
              {f}
            </li>
          ))}
          {pkg.features.filter(Boolean).length > 5 && (
            <li className="text-xs text-[var(--text-muted)] pl-5">+{pkg.features.filter(Boolean).length - 5} more</li>
          )}
        </ul>
      )}

      {(pkg.system_size_kw || pkg.inverter_rating_va || pkg.battery_capacity_kwh) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-subtle)]">
          {pkg.system_size_kw && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-lg">
              <Lightning size={11} className="text-yellow-400" />
              {pkg.system_size_kw} kW
            </div>
          )}
          {pkg.battery_capacity_kwh && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-lg">
              {pkg.battery_capacity_kwh} kWh
            </div>
          )}
          {pkg.inverter_rating_va && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-lg">
              {pkg.inverter_rating_va} VA
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4">
      <SkeletonBox className="h-5 w-20 rounded-full" />
      <SkeletonBox className="h-6 w-36 rounded" />
      <SkeletonBox className="h-4 w-20 rounded" />
      <div className="space-y-2">
        {[1,2,3].map((i) => <SkeletonBox key={i} className="h-4 w-full rounded" />)}
      </div>
    </div>
  );
}

export default function AdminPackages() {
  const queryClient = useQueryClient();
  const [modalPkg, setModalPkg] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: packagesRaw, isLoading: loading } = useAdminPackages();
  const packages = packagesRaw?.results || packagesRaw || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminPackages'] });

  const handleSaved = () => { invalidate(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deletePackage(deleteTarget.slug);
      toast.success('Package deleted');
      setDeleteTarget(null);
      invalidate();
    } catch {
      toast.error('Failed to delete package');
    } finally {
      setDeleting(false);
    }
  };

  const tierOrder = { starter: 0, popular: 1, premium: 2, commercial: 3 };
  const sorted = [...packages].sort((a, b) => (tierOrder[a.tier] ?? 4) - (tierOrder[b.tier] ?? 4));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">Packages</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{packages.length} solar packages</p>
        </div>
        <button
          onClick={() => setModalPkg(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-taqon-orange text-white rounded-xl text-sm font-semibold hover:bg-taqon-orange/90 transition-colors shadow-lg shadow-taqon-orange/20"
        >
          <Plus size={16} weight="bold" />
          Add Package
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20">
          <SolarPanel size={48} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-[var(--text-muted)]">No packages yet</p>
          <button onClick={() => setModalPkg(false)} className="mt-4 text-sm text-taqon-orange hover:underline">
            Create your first package
          </button>
        </div>
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {sorted.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onEdit={setModalPkg}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modalPkg !== null && (
          <PackageModal
            key="pkg-modal"
            pkg={modalPkg || null}
            onClose={() => setModalPkg(null)}
            onSaved={handleSaved}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete-modal"
            pkg={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
