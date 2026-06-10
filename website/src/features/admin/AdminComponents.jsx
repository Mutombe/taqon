import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MagnifyingGlass, Pencil, Trash, X, CircleNotch, Cube,
  Package as PackageIcon, Link as LinkIcon, Check, Warning, CaretDown,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { useAdminComponents } from '../../hooks/useQueries';

const CATEGORIES = [
  { key: 'panel', label: 'Panels' },
  { key: 'inverter', label: 'Inverters' },
  { key: 'battery', label: 'Batteries' },
  { key: 'charger', label: 'Charge Controllers' },
  { key: 'mounting', label: 'Mounting' },
  { key: 'cable', label: 'Cables & Wiring' },
  { key: 'accessory', label: 'Accessories' },
];
const CAT_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label]));

const EMPTY = {
  name: '', category: 'accessory', brand: '', model_number: '', price: '',
  currency: 'USD', description: '', image_url: '', product: '',
  wattage: '', voltage: '', capacity_ah: '', capacity_kwh: '', efficiency: '',
  warranty_years: '', weight_kg: '', shop_visible: false, is_active: true,
  is_featured: false, sort_order: 0, specifications: '{}',
};

const money = (v) => (v == null || v === '' ? '—' : `$${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

function firstApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  const d = data.details || data;
  if (typeof d === 'string') return d;
  for (const k of Object.keys(d || {})) {
    const v = d[k];
    if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`;
    if (typeof v === 'string') return `${k}: ${v}`;
  }
  return data.error || fallback;
}

function buildForm(c) {
  if (!c) return EMPTY;
  return {
    ...EMPTY,
    ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? EMPTY[k]])),
    product: c.product || '',
    specifications: typeof c.specifications === 'object' && c.specifications !== null
      ? JSON.stringify(c.specifications, null, 2)
      : (c.specifications || '{}'),
  };
}

/* ── Usage pills: which packages a component feeds into ── */
function UsageCell({ component }) {
  const [open, setOpen] = useState(false);
  const uses = component.used_in_packages || [];
  const count = component.package_count ?? uses.length;
  if (!count) {
    return <span className="text-xs text-[var(--text-muted)]">Not used yet</span>;
  }
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs font-medium text-taqon-orange hover:underline"
      >
        <PackageIcon size={13} /> {count} package{count > 1 ? 's' : ''}
        <CaretDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-20 mt-1 left-0 min-w-[200px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl p-2 space-y-1"
          >
            {uses.map((u) => (
              <div key={u.slug} className="flex items-center justify-between gap-3 text-xs px-2 py-1 rounded-lg hover:bg-[var(--bg-tertiary)]">
                <span className="text-[var(--text-secondary)] truncate">{u.name}</span>
                <span className="text-[var(--text-muted)] flex-shrink-0">×{u.quantity}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Inline price editor — edits cascade to every package using the component ── */
function PriceCell({ component, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(component.price ?? ''));
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValue(String(component.price ?? '')); }, [component.price]);

  const commit = async () => {
    setEditing(false);
    if (value === '' || parseFloat(value) === parseFloat(component.price)) return;
    setSaving(true);
    try {
      await adminApi.updateComponent(component.slug, { price: value });
      const n = component.package_count ?? (component.used_in_packages || []).length;
      toast.success(n ? `Price updated — ${n} package${n > 1 ? 's' : ''} recalculated` : 'Price updated');
      onSaved();
    } catch (e) {
      toast.error(firstApiError(e?.response?.data, 'Failed to update price'));
      setValue(String(component.price ?? ''));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        step="0.01"
        className="auth-input w-24 text-sm py-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setValue(String(component.price ?? '')); setEditing(false); } }}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)] hover:text-taqon-orange transition-colors"
      title="Click to edit price (cascades to packages)"
    >
      {saving ? <CircleNotch size={13} className="animate-spin" /> : null}
      {money(component.price)}
      <Pencil size={11} className="opacity-40" />
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition-all flex-shrink-0 ${checked ? 'bg-taqon-orange' : 'bg-gray-300 dark:bg-white/15'}`}
      >
        <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </label>
  );
}

function ComponentModal({ component, products, onClose, onSaved }) {
  const isNew = !component;
  const [form, setForm] = useState(() => buildForm(component));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Load full detail (specifications etc.) when editing.
  useEffect(() => {
    let cancelled = false;
    if (!component?.slug) return undefined;
    adminApi.getAdminComponent(component.slug)
      .then(({ data }) => { if (!cancelled) setForm(buildForm(data)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [component?.slug]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (form.price === '' || form.price === null) { toast.error('Price is required'); return; }
    let specs = {};
    try { specs = JSON.parse(form.specifications || '{}'); }
    catch { toast.error('Specifications has invalid JSON'); return; }

    setSaving(true);
    try {
      const payload = { ...form, specifications: specs };
      // Numeric/optional fields: drop blanks so DRF defaults apply.
      ['wattage', 'voltage', 'capacity_ah', 'capacity_kwh', 'efficiency', 'warranty_years', 'weight_kg', 'sort_order'].forEach((k) => {
        if (payload[k] === '' || payload[k] === null) delete payload[k];
      });
      if (!payload.product) payload.product = null;

      if (component?.slug) {
        await adminApi.updateComponent(component.slug, payload);
        toast.success('Component updated');
      } else {
        await adminApi.createComponent(payload);
        toast.success('Component created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(firstApiError(err?.response?.data, 'Failed to save component'));
    } finally {
      setSaving(false);
    }
  };

  const numField = (k, label, props = {}) => (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      <input type="number" className="auth-input w-full text-sm" value={form[k]} onChange={(e) => set(k, e.target.value)} {...props} />
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="w-full max-w-lg h-full bg-[var(--bg-secondary)] border-l border-[var(--card-border)] overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--card-border)]">
            <h2 className="font-syne font-bold text-lg text-[var(--text-primary)]">{isNew ? 'Add Component' : 'Edit Component'}</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><X size={18} /></button>
          </div>

          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Name *</label>
              <input className="auth-input w-full text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. 5kVA Sunsynk Hybrid Inverter" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Category *</label>
                <select className="auth-input w-full text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Price (USD) *</label>
                <input type="number" step="0.01" className="auth-input w-full text-sm" value={form.price} onChange={(e) => set('price', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Brand</label>
                <input className="auth-input w-full text-sm" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Sunsynk" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Model number</label>
                <input className="auth-input w-full text-sm" value={form.model_number} onChange={(e) => set('model_number', e.target.value)} />
              </div>
            </div>

            {/* Link to a shop Product — keeps name/brand/description/price in sync both ways */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                <LinkIcon size={12} className="inline mr-1" />Linked shop product (optional)
              </label>
              <select className="auth-input w-full text-sm" value={form.product || ''} onChange={(e) => set('product', e.target.value)}>
                <option value="">— Not linked —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {form.product && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Linked: editing the product’s price, name, brand or description syncs to this component (and vice-versa).
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <textarea rows={2} className="auth-input w-full text-sm resize-y" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Image URL</label>
              <input className="auth-input w-full text-sm" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" />
            </div>

            <div className="pt-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Specs</p>
              <div className="grid grid-cols-3 gap-3">
                {numField('wattage', 'Wattage (W)')}
                {numField('voltage', 'Voltage (V)', { step: '0.1' })}
                {numField('capacity_kwh', 'Capacity (kWh)', { step: '0.01' })}
                {numField('capacity_ah', 'Capacity (Ah)', { step: '0.1' })}
                {numField('efficiency', 'Efficiency (%)', { step: '0.01' })}
                {numField('warranty_years', 'Warranty (yrs)')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Specifications (JSON)</label>
              <textarea rows={3} className="auth-input w-full text-sm font-mono resize-y" value={form.specifications} onChange={(e) => set('specifications', e.target.value)} />
            </div>

            <div className="space-y-3 pt-1">
              <Toggle checked={form.shop_visible} onChange={(v) => set('shop_visible', v)} label="Visible in shop" />
              <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label="Active" />
              <Toggle checked={form.is_featured} onChange={(v) => set('is_featured', v)} label="Featured" />
            </div>

            <div className="flex gap-3 pt-2 sticky bottom-0 bg-[var(--bg-secondary)] pb-1">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)]">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <CircleNotch size={15} className="animate-spin" /> : null}
                {isNew ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DeleteModal({ component, onConfirm, onCancel, deleting }) {
  const n = component.package_count ?? (component.used_in_packages || []).length;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-sm w-full">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"><Trash size={24} className="text-red-400" /></div>
        <h3 className="font-syne font-bold text-lg text-[var(--text-primary)] text-center mb-1">Delete Component</h3>
        <p className="text-sm text-[var(--text-muted)] text-center mb-4">
          Delete <strong className="text-[var(--text-primary)]">{component.name}</strong>?
        </p>
        {n > 0 && (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl p-3 mb-4">
            <Warning size={16} className="flex-shrink-0 mt-0.5" />
            <span>This component is used in <strong>{n} package{n > 1 ? 's' : ''}</strong>. Removing it will drop it from those packages and recalculate their prices.</span>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)]">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <CircleNotch size={14} className="animate-spin" /> : null} Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminComponents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // component or {} for new
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [products, setProducts] = useState([]);

  const params = useMemo(() => {
    const p = { page, page_size: 100 };
    if (search) p.search = search;
    if (category) p.category = category;
    return p;
  }, [page, search, category]);

  const { data, isLoading } = useAdminComponents(params);
  const components = data?.results || data || [];
  const total = data?.count ?? components.length;
  const hasMore = !!data?.next;

  useEffect(() => {
    adminApi.getAdminProducts({ page_size: 200 })
      .then(({ data: d }) => setProducts(d.results || d || []))
      .catch(() => {});
  }, []);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['adminComponents'] });
    // Component changes cascade to package pricing — refresh those too.
    queryClient.invalidateQueries({ queryKey: ['adminPackages'] });
    queryClient.invalidateQueries({ queryKey: ['packages'] });
    queryClient.invalidateQueries({ queryKey: ['package'] });
    queryClient.invalidateQueries({ queryKey: ['packagePrice'] });
    queryClient.invalidateQueries({ queryKey: ['families'] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteComponent(deleteTarget.slug);
      toast.success('Component deleted');
      setDeleteTarget(null);
      invalidate();
    } catch (e) {
      toast.error(firstApiError(e?.response?.data, 'Failed to delete'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)] flex items-center gap-2">
            <Cube size={24} className="text-taqon-orange" /> Components &amp; Accessories
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {total} item{total === 1 ? '' : 's'} — the building blocks every package is assembled from. Edit one and every package using it recalculates.
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 transition-colors"
        >
          <Plus size={16} /> Add component
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setCategory(''); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!category ? 'bg-taqon-orange text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-taqon-orange'}`}>All</button>
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => { setCategory(c.key); setPage(1); }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === c.key ? 'bg-taqon-orange text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-taqon-orange'}`}>{c.label}</button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="auth-input w-full pl-9 text-sm" placeholder="Search name, brand, model…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[var(--card-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>Component</span><span>Brand / Category</span><span>Price</span><span>Used in</span><span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">{Array.from({ length: 8 }).map((_, i) => <SkeletonBox key={i} className="h-12 w-full rounded-xl" />)}</div>
        ) : components.length === 0 ? (
          <div className="text-center py-16">
            <Cube size={40} className="mx-auto text-[var(--text-muted)] opacity-40 mb-3" />
            <p className="text-[var(--text-muted)]">{search || category ? 'No components match your filters' : 'No components yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--card-border)]">
            {components.map((c) => (
              <div key={c.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-3 items-center hover:bg-[var(--bg-tertiary)]/40 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate flex items-center gap-1.5">
                    {c.name}
                    {c.product && <LinkIcon size={12} className="text-taqon-orange flex-shrink-0" title={`Linked to product: ${c.product_name || ''}`} />}
                    {!c.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/15 text-[var(--text-muted)]">inactive</span>}
                  </p>
                  {c.model_number && <p className="text-xs text-[var(--text-muted)] truncate">{c.model_number}</p>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] truncate">{c.brand || '—'}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-taqon-orange/10 text-taqon-orange">{CAT_LABEL[c.category] || c.category}</span>
                </div>
                <div><PriceCell component={c} onSaved={invalidate} /></div>
                <div><UsageCell component={c} /></div>
                <div className="flex items-center gap-1 justify-start md:justify-end">
                  <button onClick={() => setEditing(c)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-taqon-orange hover:bg-taqon-orange/10 transition-colors" title="Edit"><Pencil size={15} /></button>
                  <button onClick={() => setDeleteTarget(c)} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete"><Trash size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-sm text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-tertiary)]">Previous</button>
          <span className="text-sm text-[var(--text-muted)]">Page {page}</span>
          <button disabled={!hasMore} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-sm text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-tertiary)]">Next</button>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <ComponentModal
            component={editing.slug ? editing : null}
            products={products}
            onClose={() => setEditing(null)}
            onSaved={invalidate}
          />
        )}
        {deleteTarget && (
          <DeleteModal component={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deleting} />
        )}
      </AnimatePresence>
    </div>
  );
}
