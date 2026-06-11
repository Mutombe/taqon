import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash, X, CircleNotch, MagnifyingGlass, Sun, Sparkle, Drop,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';

const money = (v) => `$${parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function firstApiError(data, fallback) {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const d = data.details || data;
  for (const k of Object.keys(d || {})) {
    const v = d[k];
    if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`;
    if (typeof v === 'string') return `${k}: ${v}`;
  }
  return data.error || fallback;
}

const EMPTY = {
  name: '', system_type: 'gravity', capacity_litres: 100, variant: 'standard', brand: '', geyser_unit: '',
  short_description: '', description: '', price: '', material_cost: '', sundries_cost: '', labour_cost: '',
  transport_cost: '', distance_km: '10', image_url: '', is_active: true, is_featured: false, sort_order: 0,
  whats_included: [], features: [], specifications: {},
};

function Field({ label, children, span }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      {children}
    </div>
  );
}

function GeyserModal({ pkg, onClose, onSaved }) {
  const editing = !!pkg?.slug;
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(pkg || {}),
    whats_included: pkg?.whats_included || [],
    features: pkg?.features || [],
    specifications: pkg?.specifications || {},
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const linesToArr = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  const [specsText, setSpecsText] = useState(() => JSON.stringify(form.specifications || {}, null, 2));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    let specs = {};
    try { specs = specsText.trim() ? JSON.parse(specsText) : {}; }
    catch { toast.error('Specifications must be valid JSON'); return; }
    setSaving(true);
    const payload = {
      ...form,
      capacity_litres: parseInt(form.capacity_litres, 10) || 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
      price: form.price || 0,
      material_cost: form.material_cost || 0,
      sundries_cost: form.sundries_cost || 0,
      labour_cost: form.labour_cost || 0,
      transport_cost: form.transport_cost || 0,
      distance_km: form.distance_km || 0,
      whats_included: form.whats_included,
      features: form.features,
      specifications: specs,
    };
    delete payload.is_smart; delete payload.created_at; delete payload.updated_at; delete payload.id; delete payload.components;
    try {
      if (editing) await adminApi.updateGeyserPackage(pkg.slug, payload);
      else await adminApi.createGeyserPackage(payload);
      toast.success(editing ? 'Package updated' : 'Package created');
      onSaved();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to save')); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full max-w-lg h-full bg-[var(--bg-secondary)] border-l border-[var(--card-border)] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--card-border)]">
          <h2 className="font-syne font-bold text-lg text-[var(--text-primary)]">{editing ? 'Edit Geyser Package' : 'New Geyser Package'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Name *" span={2}><input className="auth-input w-full text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="System">
              <select className="auth-input w-full text-sm" value={form.system_type} onChange={(e) => set('system_type', e.target.value)}>
                <option value="gravity">Gravity (Non-Pressure)</option>
                <option value="pressure">Pressure</option>
              </select>
            </Field>
            <Field label="Variant">
              <select className="auth-input w-full text-sm" value={form.variant} onChange={(e) => set('variant', e.target.value)}>
                <option value="standard">Standard</option>
                <option value="smart">Smart</option>
              </select>
            </Field>
            <Field label="Capacity (L)"><input type="number" className="auth-input w-full text-sm" value={form.capacity_litres} onChange={(e) => set('capacity_litres', e.target.value)} /></Field>
            <Field label="Brand"><input className="auth-input w-full text-sm" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
          </div>
          <Field label="Collector / geyser unit" span={2}><input className="auth-input w-full text-sm" value={form.geyser_unit} onChange={(e) => set('geyser_unit', e.target.value)} /></Field>
          <Field label="Short description" span={2}><input className="auth-input w-full text-sm" value={form.short_description} onChange={(e) => set('short_description', e.target.value)} /></Field>
          <Field label="Description" span={2}><textarea rows={3} className="auth-input w-full text-sm resize-y" value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Selling price (USD) *"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
            <Field label="Material cost"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.material_cost} onChange={(e) => set('material_cost', e.target.value)} /></Field>
            <Field label="Sundries"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.sundries_cost} onChange={(e) => set('sundries_cost', e.target.value)} /></Field>
            <Field label="Labour"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.labour_cost} onChange={(e) => set('labour_cost', e.target.value)} /></Field>
            <Field label="Transport"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.transport_cost} onChange={(e) => set('transport_cost', e.target.value)} /></Field>
            <Field label="Distance (km)"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.distance_km} onChange={(e) => set('distance_km', e.target.value)} /></Field>
          </div>

          <Field label="What's included (one per line)" span={2}>
            <textarea rows={5} className="auth-input w-full text-sm resize-y" value={(form.whats_included || []).join('\n')} onChange={(e) => set('whats_included', linesToArr(e.target.value))} />
          </Field>
          <Field label="Features (one per line)" span={2}>
            <textarea rows={4} className="auth-input w-full text-sm resize-y" value={(form.features || []).join('\n')} onChange={(e) => set('features', linesToArr(e.target.value))} />
          </Field>
          <Field label="Specifications (JSON)" span={2}>
            <textarea rows={5} className="auth-input w-full text-sm resize-y font-mono text-xs" value={specsText} onChange={(e) => setSpecsText(e.target.value)} />
          </Field>
          <Field label="Image URL" span={2}><input className="auth-input w-full text-sm" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="/geysers/solar-geyser-01.jpg" /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sort order"><input type="number" className="auth-input w-full text-sm" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} /></Field>
          </div>
          <div className="flex gap-4">
            {[['is_active', 'Active'], ['is_featured', 'Featured']].map(([k, lbl]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer">
                <button type="button" onClick={() => set(k, !form[k])} className={`w-10 h-5.5 rounded-full relative transition-all ${form[k] ? 'bg-taqon-orange' : 'bg-gray-300 dark:bg-white/15'}`} style={{ width: 40, height: 22 }}>
                  <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${form[k] ? 'translate-x-[18px]' : ''}`} />
                </button>
                <span className="text-sm text-[var(--text-secondary)]">{lbl}</span>
              </label>
            ))}
          </div>

          <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <CircleNotch size={15} className="animate-spin" /> : null}{editing ? 'Save changes' : 'Create package'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function AdminGeyserPackages() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminGeyserPackages', search],
    queryFn: () => adminApi.getGeyserPackages({ search: search || undefined, page_size: 100 }).then((r) => r.data),
  });
  const packages = data?.results || data || [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['adminGeyserPackages'] });
    qc.invalidateQueries({ queryKey: ['geyserPackages'] });
    qc.invalidateQueries({ queryKey: ['sidebarCounts'] });
    setModal(null);
  };

  const grouped = useMemo(() => {
    const g = { gravity: [], pressure: [] };
    packages.forEach((p) => (g[p.system_type] || (g[p.system_type] = [])).push(p));
    return g;
  }, [packages]);

  const remove = async () => {
    try { await adminApi.deleteGeyserPackage(del.slug); toast.success('Deleted'); setDel(null); refresh(); }
    catch (e) { toast.error(firstApiError(e?.response?.data, 'Failed to delete')); }
  };

  const Row = (p) => (
    <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--bg-tertiary)]/40">
      <div className="w-9 h-9 rounded-lg bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
        {p.is_smart ? <Sparkle size={16} className="text-taqon-orange" weight="fill" /> : <Drop size={16} className="text-taqon-orange" weight="duotone" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{p.name}{!p.is_active && <span className="ml-2 text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full">Inactive</span>}</p>
        <p className="text-xs text-[var(--text-muted)]">{p.capacity_litres}L · {p.variant} · {p.brand}</p>
      </div>
      <span className="text-sm font-semibold text-taqon-orange tabular-nums">{money(p.price)}</span>
      <button onClick={() => setModal(p)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-taqon-orange hover:bg-taqon-orange/10"><Pencil size={14} /></button>
      <button onClick={() => setDel(p)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"><Trash size={14} /></button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)] flex items-center gap-2"><Sun size={22} className="text-taqon-orange" weight="fill" /> Solar Geyser Packages</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{packages.length} packages · pricing from the package workbook</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90"><Plus size={15} /> New package</button>
      </div>

      <div className="relative max-w-sm">
        <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input className="auth-input w-full pl-9 text-sm" placeholder="Search packages…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} className="h-12 w-full rounded-xl" />)}</div>
      ) : (
        ['gravity', 'pressure'].map((sys) => (grouped[sys]?.length ? (
          <div key={sys} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--bg-tertiary)]/50 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {sys === 'pressure' ? 'Pressure' : 'Gravity (Non-Pressure)'} · {grouped[sys].length}
            </div>
            {grouped[sys].map(Row)}
          </div>
        ) : null))
      )}

      <AnimatePresence>
        {modal && <GeyserModal pkg={modal} onClose={() => setModal(null)} onSaved={refresh} />}
        {del && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setDel(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[var(--bg-secondary)] rounded-2xl p-6 max-w-sm w-full border border-[var(--card-border)]">
              <h3 className="font-syne font-bold text-[var(--text-primary)]">Delete package?</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">“{del.name}” will be removed from the website.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDel(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)]">Cancel</button>
                <button onClick={remove} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
