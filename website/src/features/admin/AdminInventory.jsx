import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Buildings, Cube, Plus, MagnifyingGlass, X, CircleNotch, Pencil, Trash,
  CaretDown, ClockCounterClockwise, FileArrowUp, ClipboardText,
  CurrencyDollar, FilePdf, ArrowDown, ArrowUp, Tag, Check, Copy, Plus as PlusIcon,
  Storefront, LinkSimple, ArrowSquareOut, LinkBreak, Star,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';

const money = (v, cur = 'USD') => (v == null || v === '' ? '—' : `${cur === 'USD' ? '$' : cur + ' '}${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');

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

/* ─────────────────────────── shared modal shell ─────────────────────────── */
function Drawer({ title, onClose, children, zClass = 'z-50' }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className={`fixed inset-0 ${zClass} bg-black/60 backdrop-blur-sm flex items-start justify-end`}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full max-w-md h-full bg-[var(--bg-secondary)] border-l border-[var(--card-border)] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--card-border)]">
          <h2 className="font-syne font-bold text-lg text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{label}</label>
      {children}
    </div>
  );
}

/* Type-ahead combobox: filters an existing list as you type, click a match to
   autofill, or (optionally) create a new one inline. Fully controlled text. */
function Combobox({ value, onChange, options = [], searchFn, onPick, onCreate, placeholder, getSub, autoFocus }) {
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(searchFn);
  searchRef.current = searchFn;
  const q = (value || '').trim().toLowerCase();

  // Server-side search (debounced) — used for high-cardinality lists (materials)
  // so we never preload millions of rows. Falls back to filtering static options.
  useEffect(() => {
    if (!searchRef.current) return undefined;
    if (!q) { setRemote([]); setLoading(false); return undefined; }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try { const res = await searchRef.current(q); if (!cancelled) setRemote(res || []); }
      catch { if (!cancelled) setRemote([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const source = searchFn ? remote : (q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options);
  const filtered = source.slice(0, 8);
  const exact = source.some((o) => o.name.toLowerCase() === q);

  return (
    <div className="relative">
      <input
        autoFocus={autoFocus}
        className="auth-input w-full text-sm"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (loading || filtered.length > 0 || (onCreate && q && !exact)) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {loading && <div className="px-3 py-2 text-xs text-[var(--text-muted)] flex items-center gap-2"><CircleNotch size={13} className="animate-spin" /> Searching…</div>}
          {filtered.map((o) => (
            <button key={o.id} type="button"
              onMouseDown={(e) => { e.preventDefault(); onPick(o); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-tertiary)] flex items-center justify-between gap-2">
              <span className="truncate text-[var(--text-primary)]">{o.name}</span>
              {getSub && <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{getSub(o)}</span>}
            </button>
          ))}
          {onCreate && q && !exact && (
            <button type="button"
              onMouseDown={(e) => { e.preventDefault(); onCreate(value.trim()); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-taqon-orange hover:bg-taqon-orange/10 flex items-center gap-1 border-t border-[var(--card-border)]">
              <PlusIcon size={13} /> Create “{value.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* Supplier picker: type-ahead + "Create …" opens the FULL supplier modal; on
   save it autofills the chosen supplier and you move on. value=id, text=name. */
function SupplierField({ suppliers, value, text, onChange, placeholder }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(null);
  return (
    <>
      <Combobox
        value={text}
        onChange={(t) => onChange('', t)}
        options={suppliers}
        onPick={(o) => onChange(o.id, o.name)}
        onCreate={(name) => setCreating(name)}
        placeholder={placeholder || 'Search or add a supplier…'}
      />
      <AnimatePresence>
        {creating != null && (
          <SupplierModal
            supplier={null}
            initialName={creating}
            zClass="z-[60]"
            onClose={() => setCreating(null)}
            onSaved={(created) => {
              if (created?.id) onChange(created.id, created.name);
              qc.invalidateQueries({ queryKey: ['invSuppliersAll'] });
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* Minimal full modal for creating a material category (used by JIT). */
function CategoryCreateModal({ initialName = '', onClose, onSaved, zClass }) {
  const [form, setForm] = useState({ name: initialName, description: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const { data } = await adminApi.createMaterialCategory(form);
      toast.success('Category added');
      onSaved(data); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to add category')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer title="Add Category" onClose={onClose} zClass={zClass}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name *"><input autoFocus className="auth-input w-full text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Roofing" /></Field>
        <Field label="Description"><textarea rows={2} className="auth-input w-full text-sm resize-y" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">{saving ? <CircleNotch size={15} className="animate-spin" /> : null}Add Category</button>
      </form>
    </Drawer>
  );
}

/* Category picker: select + "+" opens the full category modal; autofills on save. */
function CategoryField({ categories, value, onChange }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(null);
  return (
    <>
      <div className="flex gap-1.5">
        <select className="auth-input flex-1 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
          {categories.length === 0 && <option value="">—</option>}
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="button" onClick={() => setCreating('')} className="px-2.5 rounded-lg border border-[var(--card-border)] text-taqon-orange hover:bg-taqon-orange/10 flex items-center" title="Add category"><PlusIcon size={14} /></button>
      </div>
      <AnimatePresence>
        {creating != null && (
          <CategoryCreateModal
            initialName={creating}
            zClass="z-[60]"
            onClose={() => setCreating(null)}
            onSaved={(created) => { if (created?.id) onChange(created.id); qc.invalidateQueries({ queryKey: ['invCats'] }); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─────────────────────────── Supplier modal ─────────────────────────── */
function SupplierModal({ supplier, initialName = '', onClose, onSaved, zClass }) {
  const [form, setForm] = useState(() => ({
    name: supplier?.name || initialName || '', contact_person: supplier?.contact_person || '', phone: supplier?.phone || '',
    email: supplier?.email || '', address: supplier?.address || '', website: supplier?.website || '',
    notes: supplier?.notes || '', is_active: supplier?.is_active ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const { data: supData } = useQuery({ queryKey: ['invSuppliersAll'], queryFn: () => adminApi.getSuppliers({ page_size: 500 }).then((r) => r.data) });
  const allSuppliers = supData?.results || supData || [];
  const dup = allSuppliers.find((s) => s.name.toLowerCase() === form.name.trim().toLowerCase() && s.slug !== supplier?.slug);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const { data } = supplier?.slug
        ? await adminApi.updateSupplier(supplier.slug, form)
        : await adminApi.createSupplier(form);
      toast.success(supplier?.slug ? 'Supplier updated' : 'Supplier added');
      onSaved(data); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to save supplier')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer title={supplier?.slug ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose} zClass={zClass}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name *">
          <Combobox value={form.name} onChange={(t) => set('name', t)} options={allSuppliers} onPick={(o) => set('name', o.name)} placeholder="Supplier name" />
          {dup && <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">⚠ A supplier named “{dup.name}” already exists.</p>}
        </Field>
        <Field label="Contact person"><input className="auth-input w-full text-sm" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone"><input className="auth-input w-full text-sm" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Email"><input className="auth-input w-full text-sm" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        </div>
        <Field label="Address"><input className="auth-input w-full text-sm" value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Website"><input className="auth-input w-full text-sm" value={form.website} onChange={(e) => set('website', e.target.value)} /></Field>
        <Field label="Notes"><textarea rows={2} className="auth-input w-full text-sm resize-y" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        <label className="flex items-center gap-3 cursor-pointer">
          <button type="button" onClick={() => set('is_active', !form.is_active)} className={`w-11 h-6 rounded-full relative transition-all ${form.is_active ? 'bg-taqon-orange' : 'bg-gray-300 dark:bg-white/15'}`}>
            <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm text-[var(--text-secondary)]">Active</span>
        </label>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <CircleNotch size={15} className="animate-spin" /> : null}{supplier ? 'Save' : 'Add Supplier'}
        </button>
      </form>
    </Drawer>
  );
}

/* ─────────────────────────── Material modal ─────────────────────────── */
function MaterialModal({ material, categories, suppliers = [], onClose, onSaved }) {
  const isDuplicate = !!material && !material.slug; // copied from an existing material
  const [form, setForm] = useState(() => ({
    name: material?.name || '', category: material?.category || (categories[0]?.id || ''),
    specification: material?.specification || '', brand: material?.brand || '', unit: material?.unit || '',
    notes: material?.notes || '', is_active: material?.is_active ?? true,
  }));
  // Starting price for a duplicate — supplier pre-filled from the original, but
  // the admin sets a fresh price (the original's prices are NOT carried over,
  // so the average reflects this new, similar item).
  const [supplier, setSupplier] = useState(isDuplicate ? (material.prices?.[0]?.supplier || '') : '');
  const [supplierText, setSupplierText] = useState(isDuplicate ? (material.prices?.[0]?.supplier_name || '') : '');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const searchMaterials = (s) => adminApi.getMaterials({ search: s, page_size: 8 }).then((r) => r.data.results || r.data || []);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.category) { toast.error('Choose a category'); return; }
    const wantsPrice = isDuplicate && price !== '' && !Number.isNaN(parseFloat(price));
    let startSupplierId = null;
    if (wantsPrice) {
      startSupplierId = supplier || suppliers.find((s) => s.name.toLowerCase() === supplierText.trim().toLowerCase())?.id;
      if (!startSupplierId) { toast.error('Pick a supplier for the starting price'); return; }
    }
    setSaving(true);
    try {
      if (material?.slug) {
        await adminApi.updateMaterial(material.slug, form);
        toast.success('Material updated');
      } else {
        const { data } = await adminApi.createMaterial(form);
        if (wantsPrice) {
          try { await adminApi.setSupplierPrice({ supplier: startSupplierId, material: data.id, price }); }
          catch { toast.error('Material added, but the starting price failed to save'); }
        }
        toast.success(isDuplicate ? (wantsPrice ? 'Duplicate added with its new price' : 'Duplicate added') : 'Material added');
      }
      onSaved(); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to save material')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer title={material?.slug ? 'Edit Material' : (material ? 'Duplicate Material' : 'Add Material')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name *">
          <Combobox value={form.name} onChange={(t) => set('name', t)} searchFn={searchMaterials} onPick={(o) => set('name', o.name)} getSub={(o) => o.category_name} placeholder="e.g. 20mm PVC Pipe" />
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Matching materials appear as you type — pick one to avoid duplicates.</p>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category *">
            <CategoryField categories={categories} value={form.category} onChange={(v) => set('category', v)} />
          </Field>
          <Field label="Unit"><input className="auth-input w-full text-sm" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="each, m, roll…" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Specification"><input className="auth-input w-full text-sm" value={form.specification} onChange={(e) => set('specification', e.target.value)} placeholder="20mm, 2.5mm²…" /></Field>
          <Field label="Brand"><input className="auth-input w-full text-sm" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
        </div>
        <Field label="Notes"><textarea rows={2} className="auth-input w-full text-sm resize-y" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>

        {isDuplicate && (
          <div className="rounded-xl border border-[var(--card-border)] p-3 space-y-3 bg-[var(--bg-tertiary)]/30">
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Starting price for this copy</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">The original's prices aren't carried over — set this copy's own price so its average is based on the new item.</p>
            </div>
            <Field label="Supplier">
              <SupplierField suppliers={suppliers} value={supplier} text={supplierText} onChange={(id, name) => { setSupplier(id); setSupplierText(name); }} />
            </Field>
            <Field label="Price (USD)"><input type="number" step="0.01" className="auth-input w-full text-sm" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="New price for this copy" /></Field>
          </div>
        )}

        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <CircleNotch size={15} className="animate-spin" /> : null}{material ? 'Save' : 'Add Material'}
        </button>
      </form>
    </Drawer>
  );
}

/* ─────────────────────────── Categories manager ─────────────────────────── */
function CategoriesModal({ categories, onClose, onSaved }) {
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const rename = async (cat, name) => {
    if (!name.trim() || name.trim() === cat.name) return;
    try { await adminApi.updateMaterialCategory(cat.slug, { name: name.trim() }); toast.success('Category renamed'); onSaved(); }
    catch (e) { toast.error(firstApiError(e?.response?.data, 'Failed to rename')); }
  };
  const add = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try { await adminApi.createMaterialCategory({ name: newName.trim() }); setNewName(''); toast.success('Category added'); onSaved(); }
    catch (e) { toast.error(firstApiError(e?.response?.data, 'Failed to add')); }
    finally { setBusy(false); }
  };
  const remove = async (cat) => {
    try { await adminApi.deleteMaterialCategory(cat.slug); toast.success('Category deleted'); onSaved(); }
    catch (e) { toast.error(firstApiError(e?.response?.data, 'Cannot delete')); }
  };

  return (
    <Drawer title="Material Categories" onClose={onClose}>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <input defaultValue={c.name} onBlur={(e) => rename(c, e.target.value)} className="auth-input flex-1 text-sm py-1.5" />
            <span className="text-xs text-[var(--text-muted)] w-16 text-right flex-shrink-0">{c.material_count ?? 0} items</span>
            <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 flex-shrink-0" title={c.material_count ? 'Move or delete its materials first' : 'Delete'}><Trash size={14} /></button>
          </div>
        ))}
        {categories.length === 0 && <p className="text-xs text-[var(--text-muted)]">No categories yet.</p>}
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--card-border)]">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" className="auth-input flex-1 text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button onClick={add} disabled={busy || !newName.trim()} className="px-4 py-2 rounded-xl bg-taqon-orange text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1"><Plus size={14} /> Add</button>
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mt-3">Rename by editing a name and clicking away. A category can only be deleted once it has no materials.</p>
    </Drawer>
  );
}

/* ─────────────────── Add-supplier-price (same material) ─────────────────── */
function QuickPriceModal({ material, suppliers, onClose, onSaved }) {
  const qc = useQueryClient();
  const priced = material.prices || [];
  const pricedIds = new Set(priced.map((p) => p.supplier));
  const initSup = suppliers.find((s) => !pricedIds.has(s.id)) || suppliers[0];
  const [supplier, setSupplier] = useState(initSup?.id || '');
  const [supplierText, setSupplierText] = useState(initSup?.name || '');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    let supplierId = supplier;
    if (!supplierId) {
      const m = suppliers.find((s) => s.name.toLowerCase() === supplierText.trim().toLowerCase());
      if (m) supplierId = m.id;
    }
    if (!supplierId) { toast.error('Choose or add a supplier'); return; }
    if (price === '') { toast.error('Enter a price'); return; }
    setSaving(true);
    try {
      await adminApi.setSupplierPrice({ supplier: supplierId, material: material.id, price, note });
      toast.success('Price logged');
      onSaved(); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to log price')); }
    finally { setSaving(false); }
  };

  return (
    <Drawer title="Add supplier price" onClose={onClose}>
      <div className="rounded-xl bg-[var(--bg-tertiary)]/50 p-3 mb-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">{material.name}{material.specification ? ` · ${material.specification}` : ''}</p>
        <p className="text-xs text-[var(--text-muted)]">{material.category_name}{material.unit ? ` · per ${material.unit}` : ''}</p>
        {priced.length > 0 && (
          <div className="mt-2 space-y-0.5 border-t border-[var(--card-border)] pt-2">
            {priced.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{p.supplier_name}</span><span className="font-medium">{money(p.price, p.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Supplier *">
          <SupplierField suppliers={suppliers} value={supplier} text={supplierText} onChange={(id, name) => { setSupplier(id); setSupplierText(name); }} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (USD) *"><input type="number" step="0.01" className="auth-input w-full text-sm" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
          <Field label="Note"><input className="auth-input w-full text-sm" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">Same material, another supplier — its price joins the comparison and the average updates from the two most recent suppliers.</p>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <CircleNotch size={15} className="animate-spin" /> : null}Log price
        </button>
      </form>
    </Drawer>
  );
}

/* ─────────────────────── Log Prices drawer (the entry point) ─────────────────────── */
// Supplier-centric batch entry. A quotation document is OPTIONAL — leave it off
// for prices a supplier simply told you. Materials can be typed in and created
// inline. Every line becomes that supplier's price for the material.
function LogPricesDrawer({ suppliers, categories, onClose, onSaved }) {
  const qc = useQueryClient();
  const [supplier, setSupplier] = useState(suppliers[0]?.id || '');
  const [supplierText, setSupplierText] = useState(suppliers[0]?.name || '');
  const [attachQuote, setAttachQuote] = useState(false);
  const [meta, setMeta] = useState({ title: '', reference: '', quote_date: '' });
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([{ name: '', category: categories[0]?.id || '', price: '', unit: '' }]);
  const [saving, setSaving] = useState(false);

  // High-cardinality: search materials on the server as the user types.
  const searchMaterials = (s) => adminApi.getMaterials({ search: s, page_size: 10 }).then((r) => r.data.results || r.data || []);

  const setRow = (i, k, v) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, { name: '', category: categories[0]?.id || '', price: '', unit: '' }]);
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    let supplierId = supplier;
    if (!supplierId) {
      const m = suppliers.find((s) => s.name.toLowerCase() === supplierText.trim().toLowerCase());
      if (m) supplierId = m.id;
    }
    if (!supplierId) { toast.error('Choose or add a supplier'); return; }
    const items = rows
      .filter((r) => r.name.trim() && r.price !== '')
      .map((r) => ({ material_name: r.name.trim(), category: r.category, price: r.price, unit: r.unit }));
    if (!items.length) { toast.error('Add at least one material with a price'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('supplier', supplierId);
      fd.append('items', JSON.stringify(items));
      if (attachQuote) {
        if (meta.title) fd.append('quotation_title', meta.title);
        if (meta.reference) fd.append('reference', meta.reference);
        if (meta.quote_date) fd.append('quote_date', meta.quote_date);
        if (file) fd.append('quotation_file', file);
      }
      const { data } = await adminApi.batchPrices(fd);
      toast.success(`${data.created} added · ${data.updated} updated`);
      onSaved(); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to log prices')); }
    finally { setSaving(false); }
  };

  return (
    <Drawer title="Log Prices" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Supplier *">
          <SupplierField suppliers={suppliers} value={supplier} text={supplierText} onChange={(id, name) => { setSupplier(id); setSupplierText(name); }} />
        </Field>

        {/* Optional quotation document */}
        <div className="rounded-xl border border-[var(--card-border)] p-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={attachQuote} onChange={(e) => setAttachQuote(e.target.checked)} className="accent-taqon-orange" />
            <span className="text-sm text-[var(--text-secondary)]">Attach a quotation document</span>
          </label>
          {attachQuote && (
            <div className="mt-3 space-y-2">
              <input className="auth-input w-full text-sm" placeholder="Quote title" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className="auth-input w-full text-sm" placeholder="Reference" value={meta.reference} onChange={(e) => setMeta({ ...meta, reference: e.target.value })} />
                <input type="date" className="auth-input w-full text-sm" value={meta.quote_date} onChange={(e) => setMeta({ ...meta, quote_date: e.target.value })} />
              </div>
              <input type="file" accept=".pdf,image/*,.xls,.xlsx,.csv,.doc,.docx" className="text-sm text-[var(--text-secondary)]" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          )}
          <p className="text-[11px] text-[var(--text-muted)] mt-2">Leave unchecked for prices a supplier just told you (verbal / WhatsApp).</p>
        </div>

        {/* Line items */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Items</p>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="rounded-xl bg-[var(--bg-tertiary)]/40 p-2 space-y-1.5">
                <div className="flex gap-1.5">
                  <div className="flex-1">
                    <Combobox
                      value={r.name}
                      onChange={(t) => setRow(i, 'name', t)}
                      searchFn={searchMaterials}
                      onPick={(o) => setRow(i, 'name', o.name)}
                      getSub={(o) => o.category_name}
                      placeholder="Material (type to search or add new)"
                    />
                  </div>
                  {rows.length > 1 && <button type="button" onClick={() => removeRow(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"><X size={14} /></button>}
                </div>
                <div className="flex gap-1.5 items-center">
                  <input type="number" step="0.01" className="auth-input w-24 text-sm py-1.5" placeholder="Price" value={r.price} onChange={(e) => setRow(i, 'price', e.target.value)} />
                  <input className="auth-input w-20 text-sm py-1.5" placeholder="unit" value={r.unit} onChange={(e) => setRow(i, 'unit', e.target.value)} />
                  <div className="flex-1"><CategoryField categories={categories} value={r.category} onChange={(v) => setRow(i, 'category', v)} /></div>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">If the material is new it’s created under the chosen category; if it exists, the category is ignored.</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="mt-2 text-xs text-taqon-orange hover:underline flex items-center gap-1"><Plus size={12} /> Add item</button>
        </div>

        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <CircleNotch size={15} className="animate-spin" /> : null}Log prices
        </button>
      </form>
    </Drawer>
  );
}

/* ─────────────────────────── Quotation upload modal ─────────────────────────── */
function QuotationModal({ suppliers, onClose, onSaved }) {
  const [form, setForm] = useState({ supplier: suppliers[0]?.id || '', title: '', reference: '', quote_date: '', total_amount: '', notes: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.supplier) { toast.error('Choose a supplier'); return; }
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
      if (file) fd.append('file', file);
      await adminApi.uploadQuotation(fd);
      toast.success('Quotation uploaded');
      onSaved(); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to upload')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer title="Upload Quotation" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Supplier *">
          <select className="auth-input w-full text-sm" value={form.supplier} onChange={(e) => set('supplier', e.target.value)}>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Title *"><input className="auth-input w-full text-sm" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. June Plumbing Quote" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Reference"><input className="auth-input w-full text-sm" value={form.reference} onChange={(e) => set('reference', e.target.value)} /></Field>
          <Field label="Quote date"><input type="date" className="auth-input w-full text-sm" value={form.quote_date} onChange={(e) => set('quote_date', e.target.value)} /></Field>
        </div>
        <Field label="Total amount"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} /></Field>
        <Field label="File (PDF / image / spreadsheet)">
          <input type="file" accept=".pdf,image/*,.xls,.xlsx,.csv,.doc,.docx" className="text-sm text-[var(--text-secondary)]" onChange={(e) => setFile(e.target.files[0])} />
        </Field>
        <Field label="Notes"><textarea rows={2} className="auth-input w-full text-sm resize-y" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <CircleNotch size={15} className="animate-spin" /> : null}Upload
        </button>
      </form>
    </Drawer>
  );
}

/* ─────────────────────────── Material row ─────────────────────────── */
function MaterialRow({ material, onAddPrice, onDuplicate, onEdit, onDelete, onShopLink }) {
  const [open, setOpen] = useState(false);
  const prices = material.prices || [];
  return (
    <div className="border-b border-[var(--card-border)] last:border-0">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-3 items-center hover:bg-[var(--bg-tertiary)]/40">
        <div className="min-w-0 flex items-center gap-2.5">
          {material.product_image && (
            <img src={material.product_image} alt="" loading="lazy" className="w-9 h-9 rounded-lg object-cover border border-[var(--card-border)] flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-left w-full min-w-0">
              <CaretDown size={13} className={`flex-shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
              <span className="text-sm font-medium text-[var(--text-primary)] truncate min-w-0" title={material.name}>{material.name}{material.specification ? ` · ${material.specification}` : ''}</span>
              {material.product && (
                <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded flex items-center gap-1 flex-shrink-0 ${material.in_shop ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'}`} title={material.in_shop ? 'Live in the shop' : 'Linked to a product (inactive)'}>
                  <Storefront size={10} /> {material.in_shop ? 'In shop' : 'Linked'}
                </span>
              )}
            </button>
            <p className="text-xs text-[var(--text-muted)] truncate ml-5" title={`${material.category_name}${material.unit ? ` · per ${material.unit}` : ''}`}>{material.category_name}{material.unit ? ` · per ${material.unit}` : ''}</p>
          </div>
        </div>
        <div className="text-sm" title={(material.avg_basis || []).length ? `Average of the latest two suppliers:\n${material.avg_basis.map((b) => `${b.supplier}: ${money(b.price)}`).join('\n')}` : 'Average of the latest two suppliers'}>
          <span className="text-[var(--text-muted)] text-xs">Avg </span><span className="font-semibold text-[var(--text-primary)]">{money(material.avg_price)}</span>
        </div>
        <div className="text-xs text-[var(--text-secondary)]">{material.supplier_count ? `${money(material.min_price)} – ${money(material.max_price)}` : '—'}</div>
        <div className="text-xs">
          {material.cheapest_supplier ? (
            <span className="text-green-600 dark:text-green-400 font-medium">{money(material.cheapest_supplier.price)} · {material.cheapest_supplier.supplier}</span>
          ) : <span className="text-[var(--text-muted)]">No prices</span>}
        </div>
        <div className="flex items-center gap-1 justify-start md:justify-end">
          <button onClick={() => onAddPrice(material)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-taqon-orange hover:bg-taqon-orange/10 flex items-center gap-1" title="Add another supplier's price"><CurrencyDollar size={14} /> Price</button>
          <button onClick={() => onShopLink(material)} className={`p-1.5 rounded-lg hover:bg-taqon-orange/10 ${material.product ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)] hover:text-taqon-orange'}`} title={material.product ? 'Manage shop link' : 'Link to a product / add to shop'}><Storefront size={14} /></button>
          <button onClick={() => onDuplicate(material)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-taqon-orange hover:bg-taqon-orange/10" title="Duplicate material"><Copy size={14} /></button>
          <button onClick={() => onEdit(material)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-taqon-orange hover:bg-taqon-orange/10" title="Edit"><Pencil size={14} /></button>
          <button onClick={() => onDelete(material)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10" title="Delete"><Trash size={14} /></button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-4 pl-10">
              {prices.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-2">No supplier prices yet — click “Price” to log one.</p>
              ) : (
                <div className="rounded-xl border border-[var(--card-border)] overflow-hidden">
                  {prices.map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between gap-4 px-4 py-2 text-sm ${i === 0 ? 'bg-green-500/5' : ''}`}>
                      <span className="text-[var(--text-secondary)] flex items-center gap-2">
                        {i === 0 && <span className="text-[9px] uppercase tracking-wide bg-green-500/15 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">cheapest</span>}
                        {p.supplier_name}
                      </span>
                      <span className="flex items-center gap-3">
                        {p.quotation_title && <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><FilePdf size={11} />{p.quotation_title}</span>}
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap" title="Last updated">{fmtDate(p.updated_at)}</span>
                        <span className="font-semibold text-[var(--text-primary)]">{money(p.price, p.currency)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── Quotation row ─────────────────────────── */
function QuotationRow({ quotation, onDelete }) {
  const [open, setOpen] = useState(false);
  const items = quotation.items || [];
  return (
    <div className="border-b border-[var(--card-border)] last:border-0">
      <div className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[var(--bg-tertiary)]/40">
        <button onClick={() => setOpen((o) => !o)} className="min-w-0 text-left flex items-start gap-2">
          <CaretDown size={13} className={`mt-1 flex-shrink-0 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{quotation.title}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{quotation.supplier_name} · {fmtDate(quotation.quote_date)}{quotation.reference ? ` · ${quotation.reference}` : ''} · {quotation.item_count} item{quotation.item_count === 1 ? '' : 's'}</p>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          {quotation.file_url && <a href={quotation.file_url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-lg text-xs text-taqon-orange hover:bg-taqon-orange/10 flex items-center gap-1"><FilePdf size={14} /> Open</a>}
          <button onClick={onDelete} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"><Trash size={14} /></button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-3 pl-10">
              {items.length === 0 ? <p className="text-xs text-[var(--text-muted)] py-1">No priced items linked to this quotation.</p>
                : (
                  <div className="rounded-xl border border-[var(--card-border)] overflow-hidden">
                    {items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between px-4 py-2 text-sm border-b border-[var(--card-border)] last:border-0">
                        <span className="text-[var(--text-secondary)]">{it.material}</span>
                        <span className="font-semibold text-[var(--text-primary)]">{money(it.price, it.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────── Import shop products into inventory ─────────────── */
function ProductImportModal({ onClose, onImported }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);
  const [done, setDone] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false; setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await adminApi.getAdminProducts({ search: q || undefined, page_size: 20 });
        if (!cancelled) setResults(data.results || data || []);
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const importOne = async (p) => {
    setBusy(p.id);
    try {
      await adminApi.importMaterialFromProduct(p.id);
      setDone((s) => new Set(s).add(p.id));
      toast.success(`Imported “${p.name}”`);
      onImported?.();
    } catch (e) { toast.error(firstApiError(e?.response?.data, 'Failed to import')); }
    finally { setBusy(null); }
  };

  return (
    <Drawer title="Import from Shop" onClose={onClose}>
      <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3">Pull a shop product into inventory so you can track its supplier pricing. The material stays linked to the product.</p>
      <div className="relative mb-3">
        <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input autoFocus className="auth-input w-full pl-9 text-sm" placeholder="Search shop products…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading ? (
        <div className="flex justify-center py-8 text-[var(--text-muted)]"><CircleNotch size={22} className="animate-spin" /></div>
      ) : results.length === 0 ? (
        <p className="text-center text-sm text-[var(--text-muted)] py-8">No products found{q ? ' for this search' : ''}.</p>
      ) : (
        <div className="space-y-1.5">
          {results.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-[var(--card-border)]">
              <span className="min-w-0">
                <span className="block text-sm text-[var(--text-primary)] truncate">{p.name}</span>
                <span className="block text-[11px] text-[var(--text-muted)] truncate">{[p.brand?.name || p.brand, p.category?.name].filter(Boolean).join(' · ')}</span>
              </span>
              {done.has(p.id) ? (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 flex-shrink-0"><Check size={14} /> Imported</span>
              ) : (
                <button onClick={() => importOne(p)} disabled={busy === p.id} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-taqon-orange hover:bg-taqon-orange/10 flex items-center gap-1 flex-shrink-0 disabled:opacity-50">
                  {busy === p.id ? <CircleNotch size={13} className="animate-spin" /> : <ArrowDown size={13} />} Import
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

/* ──────────── Link a material to the shop (existing or new) ──────────── */
function PhotoPicker({ files, onAdd, onRemove, markPrimary = false }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Product photos <span className="text-[var(--text-muted)]">(shown in the shop)</span></label>
      <label className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border-2 border-dashed border-[var(--card-border)] cursor-pointer hover:border-taqon-orange/50 hover:bg-taqon-orange/5 transition-colors text-center">
        <FileArrowUp size={22} className="text-[var(--text-muted)]" />
        <span className="text-xs text-[var(--text-secondary)]">Click to add photos</span>
        <span className="text-[10px] text-[var(--text-muted)]">JPG / PNG · multiple allowed</span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onAdd(e.target.files); e.target.value = ''; }} />
      </label>
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {files.map((f, i) => (
            <div key={f.url} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--card-border)]">
              <img src={f.url} alt="" className="w-full h-full object-cover" />
              {markPrimary && i === 0 && <span className="absolute bottom-0 inset-x-0 bg-taqon-orange/90 text-white text-[9px] text-center py-0.5">Primary</span>}
              <button type="button" onClick={() => onRemove(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={11} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ShopLinkModal({ material, onClose, onChanged }) {
  const [tab, setTab] = useState('existing'); // existing | publish
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [markup, setMarkup] = useState(String(material.markup_pct ?? 0));
  const [files, setFiles] = useState([]); // images to attach to the new shop product
  const linked = !!material.product;

  // Existing photos on the linked shop product (mini gallery manager).
  const { data: linkedProduct, refetch: refetchImages } = useQuery({
    queryKey: ['shopLinkImages', material.product_slug],
    queryFn: () => adminApi.getAdminProduct(material.product_slug).then((r) => r.data),
    enabled: linked && !!material.product_slug,
    staleTime: 0,
  });
  const existingImages = linkedProduct?.images || [];
  const [imgBusy, setImgBusy] = useState(null);
  const imgOp = async (id, fn) => {
    setImgBusy(id);
    try { await fn(); await refetchImages(); onChanged?.(); }
    catch (e) { toast.error(firstApiError(e?.response?.data, 'Image update failed')); }
    finally { setImgBusy(null); }
  };

  const addFiles = (list) => {
    const picked = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...picked.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
  };
  const removeFile = (i) => setFiles((prev) => { URL.revokeObjectURL(prev[i]?.url); return prev.filter((_, idx) => idx !== i); });

  const publish = async () => {
    setBusy(true);
    try {
      const { data } = await adminApi.linkMaterialProduct(material.slug, { create: true, markup_pct: markup || 0 });
      if (files.length && data?.product_slug) {
        const fd = new FormData();
        files.forEach((f) => fd.append('images', f.file));
        try { await adminApi.uploadProductImage(data.product_slug, fd); }
        catch { toast.error('Product created, but image upload failed — add images from the shop.'); }
      }
      toast.success(files.length ? 'Published to the shop with photos' : 'Published to the shop');
      onChanged?.(); onClose();
    } catch (e) { toast.error(firstApiError(e?.response?.data, 'Failed to publish')); }
    finally { setBusy(false); }
  };

  const uploadPhotos = async () => {
    if (!files.length || !material.product_slug) return;
    setBusy(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f.file));
      await adminApi.uploadProductImage(material.product_slug, fd);
      toast.success(`Added ${files.length} photo${files.length > 1 ? 's' : ''} to the product`);
      setFiles([]); await refetchImages(); onChanged?.();
    } catch (e) { toast.error(firstApiError(e?.response?.data, 'Failed to upload photos')); }
    finally { setBusy(false); }
  };
  // Benchmark = the average (mean of the latest two supplier prices).
  const benchmark = material.avg_price ?? null;
  const m = parseFloat(markup);
  const shopPreview = benchmark != null && !Number.isNaN(m)
    ? parseFloat(benchmark) * (1 + m / 100) : null;

  useEffect(() => {
    if (linked || tab !== 'existing') return undefined;
    let cancelled = false; setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await adminApi.getAdminProducts({ search: q || undefined, page_size: 20 });
        if (!cancelled) setResults(data.results || data || []);
      } catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setLoading(false); }
    }, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, tab, linked]);

  const run = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast.success(msg); onChanged?.(); onClose(); }
    catch (e) { toast.error(firstApiError(e?.response?.data, 'Something went wrong')); }
    finally { setBusy(false); }
  };

  if (linked) {
    return (
      <Drawer title="Shop link" onClose={onClose}>
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4 flex items-center gap-3">
          {material.product_image && (
            <img src={material.product_image} alt="" className="w-11 h-11 rounded-lg object-cover border border-green-500/20 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1.5 truncate"><Storefront size={15} className="text-green-600 dark:text-green-400 flex-shrink-0" /> {material.product_name}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{material.in_shop ? 'Live in the shop' : 'Linked — product is inactive'}{material.product_price != null ? ` · ${money(material.product_price)}` : ''}</p>
          </div>
        </div>
        <div className="mb-2">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Markup %</label>
          <div className="relative">
            <input type="number" step="0.5" min="0" className="auth-input w-full text-sm pr-8" value={markup} onChange={(e) => setMarkup(e.target.value)} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">%</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Average {benchmark != null ? money(benchmark) : '—'}
            {shopPreview != null && <> → shop <span className="font-semibold text-[var(--text-primary)]">{money(shopPreview)}</span></>}
            {material.product_price != null ? ` · now ${money(material.product_price)}` : ''}
          </p>
        </div>
        <button onClick={() => run(() => adminApi.linkMaterialProduct(material.slug, { sync_price: true, markup_pct: markup || 0 }), 'Shop price synced')} disabled={busy} className="w-full mb-4 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <CircleNotch size={15} className="animate-spin" /> : <CurrencyDollar size={15} />} Sync price to shop
        </button>

        {/* Product photos — current gallery + add new */}
        <div className="mb-4 pt-4 border-t border-[var(--card-border)] space-y-3">
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-1.5">Current photos ({existingImages.length})</p>
              <div className="grid grid-cols-4 gap-2">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border border-[var(--card-border)]">
                    <img src={img.image || img.image_url} alt={img.alt_text || ''} className="w-full h-full object-cover" />
                    {img.is_primary ? (
                      <span className="absolute bottom-0 inset-x-0 bg-taqon-orange/90 text-white text-[9px] text-center py-0.5">Primary</span>
                    ) : (
                      <button type="button" disabled={imgBusy === img.id} title="Set as primary"
                        onClick={() => imgOp(img.id, () => adminApi.setProductImagePrimary(material.product_slug, img.id))}
                        className="absolute bottom-0.5 left-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-taqon-orange">
                        <Star size={11} />
                      </button>
                    )}
                    <button type="button" disabled={imgBusy === img.id} title="Delete photo"
                      onClick={() => imgOp(img.id, () => adminApi.deleteProductImage(material.product_slug, img.id))}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                      {imgBusy === img.id ? <CircleNotch size={10} className="animate-spin" /> : <X size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <PhotoPicker files={files} onAdd={addFiles} onRemove={removeFile} />
          {files.length > 0 && (
            <button onClick={uploadPhotos} disabled={busy} className="w-full px-4 py-2.5 rounded-xl bg-taqon-dark dark:bg-white text-white dark:text-taqon-dark text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <CircleNotch size={15} className="animate-spin" /> : <FileArrowUp size={15} />} Add {files.length} photo{files.length > 1 ? 's' : ''} to product
            </button>
          )}
        </div>

        {material.product_slug && (
          <a href={`/shop/${material.product_slug}`} target="_blank" rel="noreferrer" className="w-full mb-2 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] flex items-center justify-center gap-2">
            <ArrowSquareOut size={15} /> View in shop
          </a>
        )}
        <button onClick={() => run(() => adminApi.unlinkMaterialProduct(material.slug), 'Unlinked from product')} disabled={busy} className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 text-red-500 text-sm font-medium hover:bg-red-500/10 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <CircleNotch size={15} className="animate-spin" /> : <LinkBreak size={15} />} Unlink from product
        </button>
      </Drawer>
    );
  }

  return (
    <Drawer title="Add to shop" onClose={onClose}>
      <div className="flex gap-1 mb-4 border-b border-[var(--card-border)]">
        {[{ k: 'existing', l: 'Link existing' }, { k: 'publish', l: 'Publish new' }].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.k ? 'border-taqon-orange text-taqon-orange' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>{t.l}</button>
        ))}
      </div>
      {tab === 'existing' ? (
        <>
          <p className="text-xs text-[var(--text-muted)] mb-3">Link “{material.name}” to a product that's already in the shop.</p>
          <div className="relative mb-3">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input autoFocus className="auth-input w-full pl-9 text-sm" placeholder="Search shop products…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {loading ? (
            <div className="flex justify-center py-8 text-[var(--text-muted)]"><CircleNotch size={22} className="animate-spin" /></div>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-[var(--text-muted)] py-8">No products found{q ? ' for this search' : ''}.</p>
          ) : (
            <div className="space-y-1.5">
              {results.map((p) => (
                <button key={p.id} disabled={busy} onClick={() => run(() => adminApi.linkMaterialProduct(material.slug, { product_id: p.id }), `Linked to “${p.name}”`)}
                  className="w-full text-left px-3 py-2.5 rounded-xl border border-[var(--card-border)] hover:border-taqon-orange/50 hover:bg-[var(--bg-tertiary)] flex items-center justify-between gap-3 disabled:opacity-50">
                  <span className="min-w-0">
                    <span className="block text-sm text-[var(--text-primary)] truncate">{p.name}</span>
                    <span className="block text-[11px] text-[var(--text-muted)] truncate">{[p.brand?.name || p.brand, p.category?.name].filter(Boolean).join(' · ')}</span>
                  </span>
                  <LinkSimple size={15} className="text-taqon-orange flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Create a new shop product from this material so it appears in the shop. The shop price is the average supplier price plus your markup.</p>
          <ul className="text-xs text-[var(--text-muted)] space-y-1">
            <li>· Name: {material.name}</li>
            <li>· Category: {material.category_name}{material.brand ? ` · Brand: ${material.brand}` : ''}</li>
          </ul>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Markup %</label>
            <div className="relative">
              <input type="number" step="0.5" min="0" className="auth-input w-full text-sm pr-8" value={markup} onChange={(e) => setMarkup(e.target.value)} placeholder="0" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">%</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)]/60 text-sm flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Average {benchmark != null ? money(benchmark) : '—'}{!Number.isNaN(m) && m > 0 ? ` + ${m}%` : ''}</span>
            <span className="font-bold text-taqon-orange">{shopPreview != null ? money(shopPreview) : '—'}</span>
          </div>

          {/* Product photos — needed in the shop */}
          <PhotoPicker files={files} onAdd={addFiles} onRemove={removeFile} markPrimary />

          <button onClick={publish} disabled={busy} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
            {busy ? <CircleNotch size={15} className="animate-spin" /> : <Storefront size={15} />} Publish to shop{files.length ? ` (${files.length} photo${files.length > 1 ? 's' : ''})` : ''}
          </button>
        </div>
      )}
    </Drawer>
  );
}

/* ─────────────────────────── Main page ─────────────────────────── */
const TABS = [
  { key: 'materials', label: 'Materials & Prices', icon: Cube },
  { key: 'suppliers', label: 'Suppliers', icon: Buildings },
  { key: 'quotations', label: 'Quotations', icon: FileArrowUp },
  { key: 'logs', label: 'Price Logs', icon: ClockCounterClockwise },
  { key: 'audit', label: 'Audit Trail', icon: ClipboardText },
];

// The "categories of things being tracked" in the audit trail.
const AUDIT_TYPES = [
  { key: 'supplier', label: 'Suppliers' },
  { key: 'material', label: 'Materials' },
  { key: 'price', label: 'Prices' },
  { key: 'quotation', label: 'Quotations' },
  { key: 'category', label: 'Categories' },
];
const ACTION_STYLE = {
  created: 'bg-green-500/15 text-green-600 dark:text-green-400',
  updated: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  deleted: 'bg-red-500/15 text-red-600 dark:text-red-400',
};
const PAGE_SIZE = 25;

function Pagination({ page, count, onPage }) {
  if (count == null) return null;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  if (pages <= 1) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <span className="text-xs text-[var(--text-muted)]">{from.toLocaleString()}–{to.toLocaleString()} of {count.toLocaleString()}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-tertiary)]">Previous</button>
        <span className="text-xs text-[var(--text-muted)]">Page {page} / {pages.toLocaleString()}</span>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--bg-tertiary)]">Next</button>
      </div>
    </div>
  );
}

export default function AdminInventory() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('materials');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [auditType, setAuditType] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type, data }

  // Reset to page 1 whenever the active list or its filters change.
  useEffect(() => { setPage(1); }, [tab, search, category, auditType]);

  const summaryQ = useQuery({ queryKey: ['invSummary'], queryFn: () => adminApi.getInventorySummary().then((r) => r.data) });
  const catsQ = useQuery({ queryKey: ['invCats'], queryFn: () => adminApi.getMaterialCategories().then((r) => r.data) });
  // Full supplier list for the comboboxes/dropdowns (suppliers are bounded, not millions).
  const allSuppliersQ = useQuery({ queryKey: ['invSuppliersAll'], queryFn: () => adminApi.getSuppliers({ page_size: 500 }).then((r) => r.data) });
  const allSuppliers = allSuppliersQ.data?.results || allSuppliersQ.data || [];

  const categories = catsQ.data || [];

  // Paginated supplier list for the Suppliers tab.
  const suppliersQ = useQuery({
    queryKey: ['invSuppliers', page, search],
    queryFn: () => adminApi.getSuppliers({ page, page_size: PAGE_SIZE, ...(search ? { search } : {}) }).then((r) => r.data),
    enabled: tab === 'suppliers',
  });
  const suppliers = suppliersQ.data?.results || suppliersQ.data || [];

  const materialParams = useMemo(() => {
    const p = { page, page_size: PAGE_SIZE };
    if (search && tab === 'materials') p.search = search;
    if (category) p.category = category;
    return p;
  }, [page, search, category, tab]);
  const materialsQ = useQuery({ queryKey: ['invMaterials', materialParams], queryFn: () => adminApi.getMaterials(materialParams).then((r) => r.data), enabled: tab === 'materials' });
  const materials = materialsQ.data?.results || materialsQ.data || [];

  const quotesQ = useQuery({ queryKey: ['invQuotations', page], queryFn: () => adminApi.getQuotations({ page, page_size: PAGE_SIZE }).then((r) => r.data), enabled: tab === 'quotations' });
  const quotations = quotesQ.data?.results || quotesQ.data || [];

  const logParams = useMemo(() => {
    const p = { page, page_size: PAGE_SIZE };
    if (search && tab === 'logs') p.search = search;
    if (category) p.category = category;
    return p;
  }, [page, search, category, tab]);
  const logsQ = useQuery({ queryKey: ['invLogs', logParams], queryFn: () => adminApi.getPriceHistory(logParams).then((r) => r.data), enabled: tab === 'logs' });
  const logs = logsQ.data?.results || logsQ.data || [];

  const auditParams = useMemo(() => {
    const p = { page, page_size: PAGE_SIZE };
    if (search && tab === 'audit') p.search = search;
    if (auditType) p.target_type = auditType;
    return p;
  }, [page, search, auditType, tab]);
  const auditQ = useQuery({ queryKey: ['invAudit', auditParams], queryFn: () => adminApi.getInventoryAudit(auditParams).then((r) => r.data), enabled: tab === 'audit' });
  const auditEntries = auditQ.data?.results || auditQ.data || [];

  const activeCount = { materials: materialsQ, suppliers: suppliersQ, quotations: quotesQ, logs: logsQ, audit: auditQ }[tab]?.data?.count;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['invSummary'] });
    qc.invalidateQueries({ queryKey: ['invCats'] });
    qc.invalidateQueries({ queryKey: ['invAllMaterials'] });
    qc.invalidateQueries({ queryKey: ['invMaterials'] });
    qc.invalidateQueries({ queryKey: ['invSuppliers'] });
    qc.invalidateQueries({ queryKey: ['invQuotations'] });
    qc.invalidateQueries({ queryKey: ['invLogs'] });
    qc.invalidateQueries({ queryKey: ['invAudit'] });
  };

  const del = async (fn, label) => {
    try { await fn(); toast.success(`${label} deleted`); refresh(); }
    catch (e) { toast.error(firstApiError(e?.response?.data, 'Failed to delete')); }
  };

  const totals = summaryQ.data?.totals || {};
  const catStats = summaryQ.data?.categories || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)] flex items-center gap-2">
            <Buildings size={24} className="text-taqon-orange" /> Supplier Inventory &amp; Pricing
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Log materials and supplier prices, compare suppliers, and track every price change. Admin-only.</p>
        </div>
        <button
          onClick={() => setModal({ type: 'logprices' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 transition-colors"
        >
          <CurrencyDollar size={16} weight="bold" /> Log Prices
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Suppliers', value: totals.suppliers },
          { label: 'Materials', value: totals.materials },
          { label: 'Prices logged', value: totals.prices },
          { label: 'Quotations', value: totals.quotations },
          { label: 'Price updates', value: totals.price_updates },
        ].map((c) => (
          <div key={c.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3">
            <p className="text-2xl font-bold font-syne text-[var(--text-primary)]">{c.value ?? '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Category roll-up */}
      {catStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {catStats.map((c) => (
            <div key={c.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{c.material_count} items</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Avg {money(c.avg_price)} · {c.priced_count} priced
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--card-border)] overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === t.key ? 'border-taqon-orange text-taqon-orange' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {(tab === 'materials' || tab === 'logs') && (
            <>
              <button onClick={() => setCategory('')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${!category ? 'bg-taqon-orange text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>All</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.slug)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${category === c.slug ? 'bg-taqon-orange text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>{c.name}</button>
              ))}
            </>
          )}
          {tab === 'audit' && (
            <>
              <button onClick={() => setAuditType('')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${!auditType ? 'bg-taqon-orange text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>All</button>
              {AUDIT_TYPES.map((t) => (
                <button key={t.key} onClick={() => setAuditType(t.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${auditType === t.key ? 'bg-taqon-orange text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>{t.label}</button>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(tab === 'materials' || tab === 'suppliers' || tab === 'logs' || tab === 'audit') && (
            <div className="relative w-full sm:w-56">
              <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input className="auth-input w-full pl-9 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
          {tab === 'materials' && <button onClick={() => setModal({ type: 'importProduct' })} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] whitespace-nowrap"><Storefront size={15} /> Import from Shop</button>}
          {tab === 'materials' && <button onClick={() => setModal({ type: 'categories' })} className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] whitespace-nowrap"><Tag size={15} /> Categories</button>}
          {tab === 'materials' && <button onClick={() => setModal({ type: 'material' })} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 whitespace-nowrap"><Plus size={15} /> Material</button>}
          {tab === 'suppliers' && <button onClick={() => setModal({ type: 'supplier' })} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 whitespace-nowrap"><Plus size={15} /> Supplier</button>}
          {tab === 'quotations' && <button onClick={() => setModal({ type: 'quotation' })} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 whitespace-nowrap"><FileArrowUp size={15} /> Upload</button>}
        </div>
      </div>

      {/* ── Materials tab ── */}
      {tab === 'materials' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[var(--card-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <span>Material</span><span>Average</span><span>Range</span><span>Cheapest</span><span className="text-right">Actions</span>
          </div>
          {materialsQ.isLoading ? <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} className="h-10 w-full rounded-xl" />)}</div>
            : materials.length === 0 ? <div className="text-center py-14 text-[var(--text-muted)]"><Cube size={36} className="mx-auto opacity-40 mb-2" />No materials {search || category ? 'match your filters' : 'yet'}</div>
            : materials.map((m) => (
              <MaterialRow
                key={m.id}
                material={m}
                onAddPrice={(mat) => setModal({ type: 'quickprice', data: mat })}
                onShopLink={(mat) => setModal({ type: 'shopLink', data: mat })}
                onDuplicate={(mat) => setModal({ type: 'material', data: { ...mat, slug: undefined, name: `${mat.name} (copy)` } })}
                onEdit={(mat) => setModal({ type: 'material', data: mat })}
                onDelete={(mat) => del(() => adminApi.deleteMaterial(mat.slug), 'Material')}
              />
            ))}
        </div>
      )}

      {/* ── Suppliers tab ── */}
      {tab === 'suppliers' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          {suppliersQ.isLoading ? <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonBox key={i} className="h-10 w-full rounded-xl" />)}</div>
            : suppliers.length === 0 ? <div className="text-center py-14 text-[var(--text-muted)]"><Buildings size={36} className="mx-auto opacity-40 mb-2" />No suppliers yet</div>
            : suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--bg-tertiary)]/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{s.name} {!s.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/15 text-[var(--text-muted)]">inactive</span>}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{[s.contact_person, s.phone, s.email].filter(Boolean).join(' · ') || '—'}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-[var(--text-muted)]">{s.price_count ?? 0} prices · {s.quotation_count ?? 0} quotes</span>
                  <button onClick={() => setModal({ type: 'supplier', data: s })} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-taqon-orange hover:bg-taqon-orange/10"><Pencil size={14} /></button>
                  <button onClick={() => del(() => adminApi.deleteSupplier(s.slug), 'Supplier')} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"><Trash size={14} /></button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── Quotations tab ── */}
      {tab === 'quotations' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          {quotesQ.isLoading ? <div className="p-5 space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} className="h-10 w-full rounded-xl" />)}</div>
            : quotations.length === 0 ? <div className="text-center py-14 text-[var(--text-muted)]"><FileArrowUp size={36} className="mx-auto opacity-40 mb-2" />No quotations uploaded</div>
            : quotations.map((q) => (
              <QuotationRow key={q.id} quotation={q} onDelete={() => del(() => adminApi.deleteQuotation(q.id), 'Quotation')} />
            ))}
        </div>
      )}

      {/* ── Price logs tab ── */}
      {tab === 'logs' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          {logsQ.isLoading ? <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} className="h-10 w-full rounded-xl" />)}</div>
            : logs.length === 0 ? <div className="text-center py-14 text-[var(--text-muted)]"><ClockCounterClockwise size={36} className="mx-auto opacity-40 mb-2" />No price changes logged yet</div>
            : logs.map((l) => {
              const up = l.change_pct != null && parseFloat(l.change_pct) > 0;
              const down = l.change_pct != null && parseFloat(l.change_pct) < 0;
              return (
                <div key={l.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[var(--card-border)] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{l.material_name} <span className="text-[var(--text-muted)] font-normal">@ {l.supplier_name}</span></p>
                    <p className="text-xs text-[var(--text-muted)]">{l.category_name} · {fmtDate(l.created_at)}{l.recorded_by_name ? ` · ${l.recorded_by_name}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-sm">
                    {l.previous_price != null && <span className="text-[var(--text-muted)] line-through">{money(l.previous_price, l.currency)}</span>}
                    <span className="font-semibold text-[var(--text-primary)]">{money(l.price, l.currency)}</span>
                    {l.change_pct != null && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-red-500' : down ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)]'}`}>
                        {up ? <ArrowUp size={12} /> : down ? <ArrowDown size={12} /> : null}{Math.abs(parseFloat(l.change_pct))}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Audit Trail tab ── */}
      {tab === 'audit' && (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
          {auditQ.isLoading ? <div className="p-5 space-y-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} className="h-10 w-full rounded-xl" />)}</div>
            : auditEntries.length === 0 ? <div className="text-center py-14 text-[var(--text-muted)]"><ClipboardText size={36} className="mx-auto opacity-40 mb-2" />No activity logged yet</div>
            : auditEntries.map((a) => (
              <div key={a.id} className="px-5 py-3 border-b border-[var(--card-border)] last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <span className={`mt-0.5 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${ACTION_STYLE[a.action] || 'bg-gray-500/15 text-[var(--text-muted)]'}`}>{a.action_display}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">
                        <span className="text-[var(--text-muted)]">{a.target_type_display}: </span>
                        <span className="font-medium">{a.target_name}</span>
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{a.summary}</p>
                      {a.changes && Object.keys(a.changes).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {Object.entries(a.changes).map(([field, c]) => (
                            <span key={field} className="text-[10px] bg-[var(--bg-tertiary)] rounded px-1.5 py-0.5 text-[var(--text-secondary)]">
                              {field}: <span className="line-through opacity-60">{c.from ?? '—'}</span> → {c.to ?? '—'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[var(--text-secondary)]">{a.actor_name || 'System'}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{fmtDateTime(a.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination (every list tab is server-paginated for scale) */}
      <Pagination page={page} count={activeCount} onPage={setPage} />

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === 'supplier' && <SupplierModal supplier={modal.data} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'material' && <MaterialModal material={modal.data} categories={categories} suppliers={allSuppliers} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'categories' && <CategoriesModal categories={categories} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'quickprice' && <QuickPriceModal material={modal.data} suppliers={allSuppliers} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'logprices' && <LogPricesDrawer suppliers={allSuppliers} categories={categories} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'quotation' && <QuotationModal suppliers={allSuppliers} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'importProduct' && <ProductImportModal onClose={() => setModal(null)} onImported={refresh} />}
        {modal?.type === 'shopLink' && <ShopLinkModal material={modal.data} onClose={() => setModal(null)} onChanged={refresh} />}
      </AnimatePresence>
    </div>
  );
}
