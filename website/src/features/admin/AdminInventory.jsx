import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Buildings, Cube, Plus, MagnifyingGlass, X, CircleNotch, Pencil, Trash,
  CaretDown, ClockCounterClockwise, FileArrowUp,
  CurrencyDollar, FilePdf, ArrowDown, ArrowUp,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';

const money = (v, cur = 'USD') => (v == null || v === '' ? '—' : `${cur === 'USD' ? '$' : cur + ' '}${parseFloat(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

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
function Drawer({ title, onClose, children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end"
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

/* ─────────────────────────── Supplier modal ─────────────────────────── */
function SupplierModal({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: supplier?.name || '', contact_person: supplier?.contact_person || '', phone: supplier?.phone || '',
    email: supplier?.email || '', address: supplier?.address || '', website: supplier?.website || '',
    notes: supplier?.notes || '', is_active: supplier?.is_active ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (supplier?.slug) await adminApi.updateSupplier(supplier.slug, form);
      else await adminApi.createSupplier(form);
      toast.success(supplier ? 'Supplier updated' : 'Supplier added');
      onSaved(); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to save supplier')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer title={supplier ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name *"><input className="auth-input w-full text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
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
function MaterialModal({ material, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: material?.name || '', category: material?.category || (categories[0]?.id || ''),
    specification: material?.specification || '', brand: material?.brand || '', unit: material?.unit || '',
    notes: material?.notes || '', is_active: material?.is_active ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.category) { toast.error('Choose a category'); return; }
    setSaving(true);
    try {
      if (material?.slug) await adminApi.updateMaterial(material.slug, form);
      else await adminApi.createMaterial(form);
      toast.success(material ? 'Material updated' : 'Material added');
      onSaved(); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to save material')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer title={material ? 'Edit Material' : 'Add Material'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name *"><input className="auth-input w-full text-sm" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. 20mm PVC Pipe" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category *">
            <select className="auth-input w-full text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Unit"><input className="auth-input w-full text-sm" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="each, m, roll…" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Specification"><input className="auth-input w-full text-sm" value={form.specification} onChange={(e) => set('specification', e.target.value)} placeholder="20mm, 2.5mm²…" /></Field>
          <Field label="Brand"><input className="auth-input w-full text-sm" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
        </div>
        <Field label="Notes"><textarea rows={2} className="auth-input w-full text-sm resize-y" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <CircleNotch size={15} className="animate-spin" /> : null}{material ? 'Save' : 'Add Material'}
        </button>
      </form>
    </Drawer>
  );
}

/* ─────────────────────────── Set-price modal ─────────────────────────── */
function SetPriceModal({ material, suppliers, onClose, onSaved }) {
  const [form, setForm] = useState({ supplier: suppliers[0]?.id || '', price: '', quoted_at: '', source_quotation: '', note: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const { data: quotes } = useQuery({
    queryKey: ['invQuotes', form.supplier],
    queryFn: () => adminApi.getQuotations({ supplier: form.supplier, page_size: 100 }).then((r) => r.data),
    enabled: !!form.supplier,
  });
  const quotations = quotes?.results || quotes || [];
  const submit = async (e) => {
    e.preventDefault();
    if (!form.supplier) { toast.error('Choose a supplier'); return; }
    if (form.price === '') { toast.error('Enter a price'); return; }
    setSaving(true);
    try {
      await adminApi.setSupplierPrice({
        supplier: form.supplier, material: material.id, price: form.price,
        quoted_at: form.quoted_at || null, source_quotation: form.source_quotation || null, note: form.note,
      });
      toast.success('Price logged');
      onSaved(); onClose();
    } catch (err) { toast.error(firstApiError(err?.response?.data, 'Failed to log price')); }
    finally { setSaving(false); }
  };
  return (
    <Drawer title={`Log price — ${material.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Supplier *">
          <select className="auth-input w-full text-sm" value={form.supplier} onChange={(e) => set('supplier', e.target.value)}>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (USD) *"><input type="number" step="0.01" className="auth-input w-full text-sm" value={form.price} onChange={(e) => set('price', e.target.value)} /></Field>
          <Field label="Quoted on"><input type="date" className="auth-input w-full text-sm" value={form.quoted_at} onChange={(e) => set('quoted_at', e.target.value)} /></Field>
        </div>
        <Field label="From quotation (optional)">
          <select className="auth-input w-full text-sm" value={form.source_quotation} onChange={(e) => set('source_quotation', e.target.value)}>
            <option value="">— none —</option>
            {quotations.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </Field>
        <Field label="Note"><input className="auth-input w-full text-sm" value={form.note} onChange={(e) => set('note', e.target.value)} /></Field>
        <p className="text-[11px] text-[var(--text-muted)]">Logging a price for a supplier already priced on this material updates it and records the change in the price log.</p>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <CircleNotch size={15} className="animate-spin" /> : null}Log price
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
function MaterialRow({ material, onSetPrice, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const prices = material.prices || [];
  return (
    <div className="border-b border-[var(--card-border)] last:border-0">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-3 items-center hover:bg-[var(--bg-tertiary)]/40">
        <div className="min-w-0">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-left">
            <CaretDown size={13} className={`text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{material.name}{material.specification ? ` · ${material.specification}` : ''}</span>
          </button>
          <p className="text-xs text-[var(--text-muted)] ml-5">{material.category_name}{material.unit ? ` · per ${material.unit}` : ''}</p>
        </div>
        <div className="text-sm"><span className="text-[var(--text-muted)] text-xs">Avg </span><span className="font-semibold text-[var(--text-primary)]">{money(material.avg_price)}</span></div>
        <div className="text-xs text-[var(--text-secondary)]">{material.supplier_count ? `${money(material.min_price)} – ${money(material.max_price)}` : '—'}</div>
        <div className="text-xs">
          {material.cheapest_supplier ? (
            <span className="text-green-600 dark:text-green-400 font-medium">{money(material.cheapest_supplier.price)} · {material.cheapest_supplier.supplier}</span>
          ) : <span className="text-[var(--text-muted)]">No prices</span>}
        </div>
        <div className="flex items-center gap-1 justify-start md:justify-end">
          <button onClick={() => onSetPrice(material)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-taqon-orange hover:bg-taqon-orange/10 flex items-center gap-1" title="Log a supplier price"><CurrencyDollar size={14} /> Price</button>
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

/* ─────────────────────────── Main page ─────────────────────────── */
const TABS = [
  { key: 'materials', label: 'Materials & Prices', icon: Cube },
  { key: 'suppliers', label: 'Suppliers', icon: Buildings },
  { key: 'quotations', label: 'Quotations', icon: FileArrowUp },
  { key: 'logs', label: 'Price Logs', icon: ClockCounterClockwise },
];

export default function AdminInventory() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('materials');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modal, setModal] = useState(null); // { type, data }

  const summaryQ = useQuery({ queryKey: ['invSummary'], queryFn: () => adminApi.getInventorySummary().then((r) => r.data) });
  const catsQ = useQuery({ queryKey: ['invCats'], queryFn: () => adminApi.getMaterialCategories().then((r) => r.data) });
  const suppliersQ = useQuery({ queryKey: ['invSuppliers', search], queryFn: () => adminApi.getSuppliers({ page_size: 200, ...(tab === 'suppliers' && search ? { search } : {}) }).then((r) => r.data) });

  const categories = catsQ.data || [];
  const suppliers = suppliersQ.data?.results || suppliersQ.data || [];

  const materialParams = useMemo(() => {
    const p = { page_size: 200 };
    if (search && tab === 'materials') p.search = search;
    if (category) p.category = category;
    return p;
  }, [search, category, tab]);

  const materialsQ = useQuery({
    queryKey: ['invMaterials', materialParams],
    queryFn: () => adminApi.getMaterials(materialParams).then((r) => r.data),
    enabled: tab === 'materials',
  });
  const materials = materialsQ.data?.results || materialsQ.data || [];

  const quotesQ = useQuery({
    queryKey: ['invQuotations'],
    queryFn: () => adminApi.getQuotations({ page_size: 200 }).then((r) => r.data),
    enabled: tab === 'quotations',
  });
  const quotations = quotesQ.data?.results || quotesQ.data || [];

  const logParams = useMemo(() => {
    const p = { page_size: 100 };
    if (search && tab === 'logs') p.search = search;
    if (category) p.category = category;
    return p;
  }, [search, category, tab]);
  const logsQ = useQuery({ queryKey: ['invLogs', logParams], queryFn: () => adminApi.getPriceHistory(logParams).then((r) => r.data), enabled: tab === 'logs' });
  const logs = logsQ.data?.results || logsQ.data || [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['invSummary'] });
    qc.invalidateQueries({ queryKey: ['invMaterials'] });
    qc.invalidateQueries({ queryKey: ['invSuppliers'] });
    qc.invalidateQueries({ queryKey: ['invQuotations'] });
    qc.invalidateQueries({ queryKey: ['invLogs'] });
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
        </div>
        <div className="flex items-center gap-2">
          {(tab === 'materials' || tab === 'suppliers' || tab === 'logs') && (
            <div className="relative w-full sm:w-56">
              <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input className="auth-input w-full pl-9 text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          )}
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
            : materials.map((m) => <MaterialRow key={m.id} material={m} onSetPrice={(mat) => setModal({ type: 'price', data: mat })} onEdit={(mat) => setModal({ type: 'material', data: mat })} onDelete={(mat) => del(() => adminApi.deleteMaterial(mat.slug), 'Material')} />)}
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
              <div key={q.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--bg-tertiary)]/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{q.title}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{q.supplier_name} · {fmtDate(q.quote_date)}{q.reference ? ` · ${q.reference}` : ''}{q.total_amount ? ` · ${money(q.total_amount, q.currency)}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {q.file_url && <a href={q.file_url} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-lg text-xs text-taqon-orange hover:bg-taqon-orange/10 flex items-center gap-1"><FilePdf size={14} /> Open</a>}
                  <button onClick={() => del(() => adminApi.deleteQuotation(q.id), 'Quotation')} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"><Trash size={14} /></button>
                </div>
              </div>
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

      {/* Modals */}
      <AnimatePresence>
        {modal?.type === 'supplier' && <SupplierModal supplier={modal.data} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'material' && <MaterialModal material={modal.data} categories={categories} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'price' && <SetPriceModal material={modal.data} suppliers={suppliers} onClose={() => setModal(null)} onSaved={refresh} />}
        {modal?.type === 'quotation' && <QuotationModal suppliers={suppliers} onClose={() => setModal(null)} onSaved={refresh} />}
      </AnimatePresence>
    </div>
  );
}
