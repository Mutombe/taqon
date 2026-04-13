import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash, X, SolarPanel, CircleNotch,
  CheckCircle, Star, Lightning, MagnifyingGlass,
  ArrowsClockwise, CaretDown, Package as PackageIcon,
  Swap, Warning,
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
  name: '', tier: 'starter', description: '', short_description: '',
  features: [''], suitable_for: [''],
  system_size_kw: '', inverter_rating_va: '', inverter_kva: '', battery_capacity_kwh: '',
  estimated_daily_output_kwh: '', backup_hours: '',
  panel_count: '', phase: '1P', distance_km: '10',
  variant_name: '', variant_code: '', inverter_brand: '', smart_load_supported: false,
  family: '',
  pp_min: '', pp_max: '', ep_min: '', ep_max: '',
  recharge_class: 'moderate', comfort_class: 'balanced', management_tolerance: 'medium',
  is_active: true, is_popular: false,
};

/* ─── Tag List (features / suitable_for) ─── */
function TagList({ items, onChange, placeholder, label }) {
  const add = () => onChange([...items, '']);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, val) => onChange(items.map((f, idx) => idx === i ? val : f));

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</label>
      {items.map((f, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="auth-input flex-1 text-sm py-1.5"
            placeholder={placeholder || `Item ${i + 1}`}
            value={f}
            onChange={(e) => update(i, e.target.value)}
          />
          {items.length > 1 && (
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-taqon-orange hover:text-taqon-orange/80 transition-colors flex items-center gap-1">
        <Plus size={12} /> Add
      </button>
    </div>
  );
}

/* ─── Component Picker (searchable dropdown) ─── */
function ComponentPicker({ value, onChange, components, excludeIds = [] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const available = components.filter(c => !excludeIds.includes(c.id));
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(c => c.name.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q));
  }, [components, excludeIds, search]);

  const selected = components.find(c => c.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="auth-input w-full text-sm text-left flex items-center justify-between gap-2 py-2"
      >
        <span className={selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
          {selected ? `${selected.name} ($${parseFloat(selected.price).toLocaleString()})` : 'Select component...'}
        </span>
        <CaretDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl max-h-60 overflow-hidden">
          <div className="p-2 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                className="auth-input w-full text-xs pl-8 py-1.5"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] p-3 text-center">No components found</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-between ${c.id === value ? 'bg-taqon-orange/10 text-taqon-orange' : 'text-[var(--text-secondary)]'}`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[var(--text-muted)] shrink-0 ml-2">${parseFloat(c.price).toLocaleString()} &middot; {c.category}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Package Items Table ─── */
function PackageItemsEditor({ slug, items: initialItems, onItemsChanged }) {
  const [items, setItems] = useState(initialItems || []);
  const [components, setComponents] = useState([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [addingComponent, setAddingComponent] = useState(null); // component_id being added
  const [saving, setSaving] = useState(null); // item id being saved

  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);

  useEffect(() => {
    if (!slug) return;
    setLoadingComponents(true);
    adminApi.getAdminComponents({ page_size: 200 })
      .then(({ data }) => setComponents(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoadingComponents(false));
  }, [slug]);

  const existingComponentIds = items.map(i => i.component?.id).filter(Boolean);

  const handleAdd = async (componentId) => {
    if (!componentId) return;
    setAddingComponent(componentId);
    try {
      await adminApi.addPackageItem(slug, { component_id: componentId, quantity: 1 });
      const { data } = await adminApi.getPackageItems(slug);
      setItems(data);
      onItemsChanged?.();
      toast.success('Component added');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add component');
    } finally {
      setAddingComponent(null);
    }
  };

  const handleUpdateQty = async (itemId, qty) => {
    if (qty < 1) return;
    setSaving(itemId);
    try {
      await adminApi.updatePackageItem(slug, itemId, { quantity: qty });
      const { data } = await adminApi.getPackageItems(slug);
      setItems(data);
      onItemsChanged?.();
    } catch (err) {
      toast.error('Failed to update quantity');
    } finally {
      setSaving(null);
    }
  };

  const handleSwap = async (itemId, newComponentId) => {
    setSaving(itemId);
    try {
      await adminApi.updatePackageItem(slug, itemId, { component_id: newComponentId });
      const { data } = await adminApi.getPackageItems(slug);
      setItems(data);
      onItemsChanged?.();
      toast.success('Component swapped');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to swap component');
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (itemId) => {
    setSaving(itemId);
    try {
      await adminApi.removePackageItem(slug, itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      onItemsChanged?.();
      toast.success('Component removed');
    } catch {
      toast.error('Failed to remove component');
    } finally {
      setSaving(null);
    }
  };

  if (!slug) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Warning size={16} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300">Save the package first, then manage components here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Components ({items.length})
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          Material: ${items.reduce((s, i) => s + parseFloat(i.line_total || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Existing items */}
      <div className="space-y-2">
        {items.map((item) => {
          const comp = item.component || {};
          return (
            <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{comp.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{comp.category} &middot; ${parseFloat(comp.price || 0).toLocaleString()}/ea</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || saving === item.id}
                  className="w-6 h-6 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center text-xs hover:bg-[var(--card-border)] disabled:opacity-30 transition-colors"
                >-</button>
                <span className="w-7 text-center text-xs font-semibold text-[var(--text-primary)] tabular-nums">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                  disabled={saving === item.id}
                  className="w-6 h-6 rounded-md bg-[var(--bg-secondary)] text-[var(--text-muted)] flex items-center justify-center text-xs hover:bg-[var(--card-border)] disabled:opacity-30 transition-colors"
                >+</button>
              </div>
              <span className="text-xs font-semibold text-taqon-orange tabular-nums w-16 text-right shrink-0">
                ${parseFloat(item.line_total || 0).toLocaleString()}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={saving === item.id}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors shrink-0"
              >
                {saving === item.id ? <CircleNotch size={12} className="animate-spin" /> : <Trash size={12} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add component */}
      {!loadingComponents && (
        <div className="pt-2">
          <ComponentPicker
            value={null}
            onChange={handleAdd}
            components={components}
            excludeIds={existingComponentIds}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Field Group Helper ─── */
function Field({ label, children, hint, span = 1 }) {
  return (
    <div className={span === 2 ? 'col-span-2' : span === 3 ? 'col-span-3' : ''}>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{hint}</p>}
    </div>
  );
}

/* ─── Package Edit Modal ─── */
function PackageModal({ pkg, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    if (!pkg) return EMPTY_FORM;
    return {
      name: pkg.name || '',
      tier: pkg.tier || 'starter',
      description: pkg.description || '',
      short_description: pkg.short_description || '',
      features: Array.isArray(pkg.features) && pkg.features.length ? pkg.features : [''],
      suitable_for: Array.isArray(pkg.suitable_for) && pkg.suitable_for.length ? pkg.suitable_for : [''],
      system_size_kw: pkg.system_size_kw || '',
      inverter_rating_va: pkg.inverter_rating_va || '',
      inverter_kva: pkg.inverter_kva || '',
      battery_capacity_kwh: pkg.battery_capacity_kwh || '',
      estimated_daily_output_kwh: pkg.estimated_daily_output_kwh || '',
      backup_hours: pkg.backup_hours || '',
      panel_count: pkg.panel_count || '',
      phase: pkg.phase || '1P',
      distance_km: pkg.distance_km || '10',
      variant_name: pkg.variant_name || '',
      variant_code: pkg.variant_code || '',
      inverter_brand: pkg.inverter_brand || '',
      smart_load_supported: pkg.smart_load_supported || false,
      family: pkg.family || '',
      pp_min: pkg.pp_min || '',
      pp_max: pkg.pp_max || '',
      ep_min: pkg.ep_min || '',
      ep_max: pkg.ep_max || '',
      recharge_class: pkg.recharge_class || 'moderate',
      comfort_class: pkg.comfort_class || 'balanced',
      management_tolerance: pkg.management_tolerance || 'medium',
      is_active: pkg.is_active ?? true,
      is_popular: pkg.is_popular || false,
    };
  });
  const [saving, setSaving] = useState(false);
  const [families, setFamilies] = useState([]);
  const [priceInfo, setPriceInfo] = useState(pkg ? {
    price: pkg.price, material_cost: pkg.material_cost,
    sundries_cost: pkg.sundries_cost, labour_cost: pkg.labour_cost,
    transport_cost: pkg.transport_cost,
  } : null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Load families for dropdown
  useEffect(() => {
    adminApi.getAdminFamilies({ page_size: 50 })
      .then(({ data }) => setFamilies(data.results || data || []))
      .catch(() => {});
  }, []);

  const refreshPrice = async () => {
    if (!pkg?.slug) return;
    try {
      const { data } = await adminApi.recalculatePackage(pkg.slug, { distance_km: form.distance_km || 10 });
      setPriceInfo(data);
      toast.success('Price recalculated');
    } catch {
      toast.error('Failed to recalculate');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Package name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        features: form.features.filter((f) => f.trim()),
        suitable_for: form.suitable_for.filter((f) => f.trim()),
        family: form.family || null,
      };
      if (pkg?.slug) {
        await adminApi.updatePackage(pkg.slug, payload);
        toast.success('Package updated');
      } else {
        await adminApi.createPackage(payload);
        toast.success('Package created');
      }
      onSaved();
      onClose();
    } catch (err) {
      const data = err?.response?.data;
      const msg = typeof data === 'object' ? Object.entries(data).map(([k,v]) => `${k}: ${v}`).join(', ') : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-2xl h-full bg-[var(--bg-secondary)] border-l border-[var(--card-border)] overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--card-border)]">
            <h2 className="font-syne font-bold text-lg text-[var(--text-primary)]">
              {pkg ? 'Edit Package' : 'Add Package'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* ── Package Info ── */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <PackageIcon size={14} /> Package Info
              </h3>
              <Field label="Package Name *">
                <input className="auth-input w-full" value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Family">
                  <select className="auth-input w-full text-sm" value={form.family} onChange={(e) => set('family', e.target.value)}>
                    <option value="">None</option>
                    {families.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.kva_rating} kVA)</option>
                    ))}
                  </select>
                </Field>
                <Field label="Variant Name" hint="e.g. V1.0, Performance">
                  <input className="auth-input w-full text-sm" value={form.variant_name} onChange={(e) => set('variant_name', e.target.value)} />
                </Field>
                <Field label="Tier">
                  <select className="auth-input w-full text-sm" value={form.tier} onChange={(e) => set('tier', e.target.value)}>
                    <option value="starter">Starter</option>
                    <option value="popular">Popular</option>
                    <option value="premium">Premium</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </Field>
              </div>
              <Field label="Short Description">
                <input className="auth-input w-full text-sm" value={form.short_description} onChange={(e) => set('short_description', e.target.value)} />
              </Field>
              <Field label="Full Description">
                <textarea className="auth-input w-full resize-none text-sm" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>

            {/* ── System Specs ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <Lightning size={14} /> System Specs
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Variant Code" hint="HE-1, HL-3, HD-2">
                  <input className="auth-input w-full text-sm" value={form.variant_code} onChange={(e) => set('variant_code', e.target.value)} />
                </Field>
                <Field label="Inverter Brand">
                  <select className="auth-input w-full text-sm" value={form.inverter_brand} onChange={(e) => set('inverter_brand', e.target.value)}>
                    <option value="">Select...</option>
                    <option value="must">Must</option>
                    <option value="growatt">Growatt</option>
                    <option value="sunsynk">Sunsynk</option>
                    <option value="deye">Deye</option>
                  </select>
                </Field>
                <Field label="Phase">
                  <select className="auth-input w-full text-sm" value={form.phase} onChange={(e) => set('phase', e.target.value)}>
                    <option value="1P">Single Phase</option>
                    <option value="3P">Three Phase</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Field label="Inverter kVA">
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.inverter_kva} onChange={(e) => set('inverter_kva', e.target.value)} />
                </Field>
                <Field label="Battery kWh">
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.battery_capacity_kwh} onChange={(e) => set('battery_capacity_kwh', e.target.value)} />
                </Field>
                <Field label="Panels">
                  <input type="number" className="auth-input w-full text-sm" value={form.panel_count} onChange={(e) => set('panel_count', e.target.value)} />
                </Field>
                <Field label="System kW">
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.system_size_kw} onChange={(e) => set('system_size_kw', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Inverter VA">
                  <input type="number" className="auth-input w-full text-sm" value={form.inverter_rating_va} onChange={(e) => set('inverter_rating_va', e.target.value)} />
                </Field>
                <Field label="Daily Output kWh">
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.estimated_daily_output_kwh} onChange={(e) => set('estimated_daily_output_kwh', e.target.value)} />
                </Field>
                <Field label="Backup Hours">
                  <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.backup_hours} onChange={(e) => set('backup_hours', e.target.value)} />
                </Field>
              </div>
            </div>

            {/* ── Capability Bands (PP / EP) ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Capability Bands (Recommendation Engine)
              </h3>
              <div className="grid grid-cols-4 gap-3">
                <Field label="PP Min">
                  <input type="number" step="0.01" className="auth-input w-full text-sm" value={form.pp_min} onChange={(e) => set('pp_min', e.target.value)} />
                </Field>
                <Field label="PP Max">
                  <input type="number" step="0.01" className="auth-input w-full text-sm" value={form.pp_max} onChange={(e) => set('pp_max', e.target.value)} />
                </Field>
                <Field label="EP Min">
                  <input type="number" step="0.01" className="auth-input w-full text-sm" value={form.ep_min} onChange={(e) => set('ep_min', e.target.value)} />
                </Field>
                <Field label="EP Max">
                  <input type="number" step="0.01" className="auth-input w-full text-sm" value={form.ep_max} onChange={(e) => set('ep_max', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Recharge Class">
                  <select className="auth-input w-full text-sm" value={form.recharge_class} onChange={(e) => set('recharge_class', e.target.value)}>
                    {['basic','moderate','balanced','strong','premium'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Comfort Class">
                  <select className="auth-input w-full text-sm" value={form.comfort_class} onChange={(e) => set('comfort_class', e.target.value)}>
                    {['budget','balanced','premium'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Mgmt Tolerance">
                  <select className="auth-input w-full text-sm" value={form.management_tolerance} onChange={(e) => set('management_tolerance', e.target.value)}>
                    {['high','medium','low'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* ── Components (items) ── */}
            <PackageItemsEditor
              slug={pkg?.slug}
              items={pkg?.items || []}
              onItemsChanged={refreshPrice}
            />

            {/* ── Price (computed, read-only) ── */}
            {priceInfo && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Price Breakdown</h3>
                  <button type="button" onClick={refreshPrice} className="text-xs text-taqon-orange hover:text-taqon-orange/80 flex items-center gap-1 transition-colors">
                    <ArrowsClockwise size={12} /> Recalculate
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Distance (km)">
                    <input type="number" step="0.1" className="auth-input w-full text-sm" value={form.distance_km} onChange={(e) => set('distance_km', e.target.value)} />
                  </Field>
                  <Field label="Total Price">
                    <div className="auth-input w-full text-sm bg-[var(--bg-tertiary)] font-bold text-taqon-orange">
                      ${parseFloat(priceInfo.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </Field>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    ['Material', priceInfo.material_cost],
                    ['Sundries', priceInfo.sundries_cost],
                    ['Labour', priceInfo.labour_cost],
                    ['Transport', priceInfo.transport_cost],
                  ].map(([label, val]) => (
                    <div key={label} className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-center">
                      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
                      <p className="font-semibold text-[var(--text-primary)] tabular-nums">${parseFloat(val || 0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Features & Suitable For ── */}
            <TagList items={form.features} onChange={(f) => set('features', f)} placeholder="Feature..." label="Features" />
            <TagList items={form.suitable_for} onChange={(f) => set('suitable_for', f)} placeholder="e.g. residential, small_business" label="Suitable For" />

            {/* ── Settings ── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Settings</h3>
              {[
                { key: 'is_active', label: 'Active', desc: 'Visible on packages page' },
                { key: 'is_popular', label: 'Popular', desc: 'Shows "Most Popular" badge' },
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

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-2 pb-8">
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

/* ─── Delete Modal ─── */
function DeleteModal({ pkg, onConfirm, onCancel, deleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
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

/* ─── Package Card ─── */
function PackageCard({ pkg, onEdit, onDelete }) {
  const tier = TIER_CONFIG[pkg.tier] || TIER_CONFIG.starter;
  const itemCount = pkg.items?.length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative bg-[var(--card-bg)] border rounded-2xl p-5 flex flex-col gap-3 ${
        pkg.is_popular ? 'border-taqon-orange/40 shadow-lg shadow-taqon-orange/10' : 'border-[var(--card-border)]'
      }`}
    >
      {pkg.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-taqon-orange text-white text-xs font-semibold shadow-lg">
            <Star size={10} weight="fill" /> Popular
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tier.color}`}>{tier.label}</span>
            {pkg.variant_code && (
              <span className="text-[10px] font-mono bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">{pkg.variant_code}</span>
            )}
            {!pkg.is_active && (
              <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full">Inactive</span>
            )}
          </div>
          <h3 className="font-syne font-bold text-sm text-[var(--text-primary)] leading-tight">{pkg.name}</h3>
          {pkg.family_name && (
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{pkg.family_name} &middot; {pkg.variant_name || 'Default'}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onEdit(pkg)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-taqon-orange transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(pkg)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors">
            <Trash size={14} />
          </button>
        </div>
      </div>

      {/* Price */}
      <p className="text-lg font-bold text-taqon-orange font-syne tabular-nums">
        ${parseFloat(pkg.price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </p>

      {/* Specs row */}
      <div className="flex flex-wrap gap-1.5">
        {pkg.inverter_kva > 0 && (
          <span className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Lightning size={10} className="text-yellow-400" /> {pkg.inverter_kva} kVA
          </span>
        )}
        {pkg.battery_capacity_kwh > 0 && (
          <span className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-2 py-0.5 rounded-lg">
            {pkg.battery_capacity_kwh} kWh
          </span>
        )}
        {pkg.panel_count > 0 && (
          <span className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-2 py-0.5 rounded-lg">
            {pkg.panel_count} panels
          </span>
        )}
        {pkg.inverter_brand && (
          <span className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-2 py-0.5 rounded-lg capitalize">
            {pkg.inverter_brand}
          </span>
        )}
        {itemCount > 0 && (
          <span className="text-[10px] bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-2 py-0.5 rounded-lg">
            {itemCount} components
          </span>
        )}
      </div>

      {/* PP / EP bands */}
      {(parseFloat(pkg.pp_min) > 0 || parseFloat(pkg.ep_min) > 0) && (
        <div className="flex gap-3 text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
          <span>PP: {pkg.pp_min}–{pkg.pp_max}</span>
          <span>EP: {pkg.ep_min}–{pkg.ep_max}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Card Skeleton ─── */
function CardSkeleton() {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-3">
      <SkeletonBox className="h-4 w-16 rounded-full" />
      <SkeletonBox className="h-5 w-32 rounded" />
      <SkeletonBox className="h-6 w-20 rounded" />
      <div className="flex gap-1.5">
        <SkeletonBox className="h-5 w-16 rounded-lg" />
        <SkeletonBox className="h-5 w-16 rounded-lg" />
        <SkeletonBox className="h-5 w-16 rounded-lg" />
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminPackages() {
  const queryClient = useQueryClient();
  const [modalPkg, setModalPkg] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const { data: packagesRaw, isLoading: loading } = useAdminPackages();
  const packages = packagesRaw?.results || packagesRaw || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminPackages'] });

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

  const filtered = useMemo(() => {
    let result = [...packages];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.variant_code?.toLowerCase().includes(q) ||
        p.family_name?.toLowerCase().includes(q) ||
        p.inverter_brand?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (a.family_name || '').localeCompare(b.family_name || '') || parseFloat(a.price) - parseFloat(b.price));
  }, [packages, search]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">Packages</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{packages.length} solar packages</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="auth-input pl-9 pr-4 py-2 text-sm w-56"
              placeholder="Search packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setModalPkg(false)}
            className="flex items-center gap-2 px-4 py-2.5 bg-taqon-orange text-white rounded-xl text-sm font-semibold hover:bg-taqon-orange/90 transition-colors shadow-lg shadow-taqon-orange/20"
          >
            <Plus size={16} weight="bold" /> Add Package
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <SolarPanel size={48} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-[var(--text-muted)]">{search ? 'No packages match your search' : 'No packages yet'}</p>
          {!search && (
            <button onClick={() => setModalPkg(false)} className="mt-4 text-sm text-taqon-orange hover:underline">
              Create your first package
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} onEdit={setModalPkg} onDelete={setDeleteTarget} />
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
            onSaved={invalidate}
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
