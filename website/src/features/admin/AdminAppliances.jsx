import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MagnifyingGlass, Plus, Pencil, Trash, X,
  CaretLeft, CaretRight, Check, Lightning, CheckCircle, XCircle,
  Funnel, SpinnerGap,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';

const CATEGORIES = [
  { value: 'lounge',   label: 'Lounge' },
  { value: 'kitchen',  label: 'Kitchen' },
  { value: 'bedroom',  label: 'Bedroom' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'laundry',  label: 'Laundry' },
  { value: 'office',   label: 'Office' },
  { value: 'garage',   label: 'Garage & Workshop' },
  { value: 'outdoor',  label: 'Outdoor' },
  { value: 'security', label: 'Security' },
  { value: 'other',    label: 'Other' },
];

const EMPTY_FORM = {
  name: '',
  slug: '',
  category: 'lounge',
  icon_name: '',
  typical_wattage: 0,
  power_points: 0,
  energy_points: 0,
  concurrency_factor: 1,
  night_use_factor: 0,
  smart_load_eligible: false,
  description: '',
  is_active: true,
  sort_order: 0,
};

function categoryLabel(v) {
  return CATEGORIES.find((c) => c.value === v)?.label || v;
}

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 220);
}

/* ─── List page ─── */

export default function AdminAppliances() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState('');
  const [ordering, setOrdering] = useState('sort_order');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const [editing, setEditing] = useState(null);  // null = closed, {} = new, {…} = editing existing
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = { page };
      if (search.trim()) params.search = search.trim();
      if (category) params.category = category;
      if (isActive) params.is_active = isActive;
      if (ordering) params.ordering = ordering;
      const { data } = await adminApi.getAdminAppliances(params);
      setItems(data.results || data);
      setTotalCount(data.count ?? (data.results?.length || 0));
      setNextPage(data.next || null);
      setPrevPage(data.previous || null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load appliances');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, isActive, ordering]);

  useEffect(() => { load(); }, [load]);

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await adminApi.deleteAppliance(deleting.slug);
      toast.success(`Deleted ${deleting.name}`);
      setDeleting(null);
      load({ silent: true });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed');
    }
  };

  const activeCount = items.filter((a) => a.is_active).length;
  const smartCount = items.filter((a) => a.smart_load_eligible).length;

  return (
    <>
      <SEO title="Appliances" />
      <div className="pb-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/admin/dashboard" className="text-gray-400 hover:text-taqon-charcoal dark:hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Appliances</h1>
                <p className="text-sm text-gray-400">
                  {totalCount} total &middot; these power the Solar Advisor PP/EP scoring
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditing({ ...EMPTY_FORM })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 active:scale-[0.98] transition-all shadow-lg shadow-taqon-orange/20"
            >
              <Plus size={16} weight="bold" /> Add Appliance
            </button>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active (this page)</p>
              <p className="text-2xl font-bold font-syne text-green-500 mt-1">{activeCount}</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Smart-load eligible</p>
              <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mt-1">{smartCount}</p>
            </div>
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 p-4">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Showing</p>
              <p className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mt-1">{items.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <form onSubmit={handleSubmitSearch} className="flex-1 relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, slug, description..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taqon-orange/30"
              />
            </form>

            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-taqon-orange/30"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <select
              value={isActive}
              onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-taqon-orange/30"
            >
              <option value="">Active &amp; inactive</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>

            <select
              value={ordering}
              onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-taqon-orange/30"
            >
              <option value="sort_order">Sort order</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="-typical_wattage">Wattage (high to low)</option>
              <option value="typical_wattage">Wattage (low to high)</option>
              <option value="-power_points">Power points (high to low)</option>
              <option value="-energy_points">Energy points (high to low)</option>
              <option value="-created_at">Newest</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonBox key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-dashed border-gray-200 dark:border-white/10">
              <Lightning size={32} className="mx-auto text-gray-300 dark:text-white/20 mb-3" />
              <p className="text-sm text-gray-500 dark:text-white/50 mb-4">No appliances match your filters.</p>
              <button
                onClick={() => setEditing({ ...EMPTY_FORM })}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90"
              >
                <Plus size={14} weight="bold" /> Add first appliance
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-white dark:bg-taqon-charcoal/40 border border-gray-200 dark:border-white/5 overflow-hidden">
              {/* Header row — desktop only */}
              <div className="hidden lg:grid grid-cols-[minmax(0,2.5fr)_1fr_70px_80px_80px_70px_auto] gap-3 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <div>Name &amp; slug</div>
                <div>Category</div>
                <div className="text-right">Watts</div>
                <div className="text-right">PP</div>
                <div className="text-right">EP</div>
                <div className="text-center">Status</div>
                <div></div>
              </div>

              {items.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[minmax(0,2.5fr)_1fr_auto] lg:grid-cols-[minmax(0,2.5fr)_1fr_70px_80px_80px_70px_auto] gap-3 items-center px-4 py-3 border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-taqon-charcoal dark:text-white truncate flex items-center gap-1.5">
                      {a.name}
                      {a.smart_load_eligible && (
                        <span title="Smart-load eligible" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-taqon-orange/10 text-taqon-orange">
                          <Lightning size={9} weight="fill" />
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] font-mono text-gray-400 dark:text-white/40 truncate">{a.slug}</p>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-white/60 truncate lg:text-sm">
                    <span className="hidden lg:inline">{categoryLabel(a.category)}</span>
                    <span className="lg:hidden inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-[10px] font-medium">
                      {categoryLabel(a.category)}
                    </span>
                  </div>
                  <div className="hidden lg:block text-right text-sm text-gray-600 dark:text-white/60 tabular-nums">
                    {a.typical_wattage}W
                  </div>
                  <div className="hidden lg:block text-right text-sm font-semibold text-taqon-charcoal dark:text-white tabular-nums">
                    {parseFloat(a.power_points).toFixed(2)}
                  </div>
                  <div className="hidden lg:block text-right text-sm font-semibold text-taqon-charcoal dark:text-white tabular-nums">
                    {parseFloat(a.energy_points).toFixed(2)}
                  </div>
                  <div className="hidden lg:flex items-center justify-center">
                    {a.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-500">
                        <CheckCircle size={10} weight="bold" /> On
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/10 text-gray-500">
                        <XCircle size={10} weight="bold" /> Off
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditing(a)}
                      className="p-2 rounded-lg text-gray-400 hover:text-taqon-orange hover:bg-taqon-orange/10 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleting(a)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {(nextPage || prevPage) && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!prevPage}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40"
              >
                <CaretLeft size={14} />
              </button>
              <span className="text-xs text-gray-500 dark:text-white/50 px-2">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!nextPage}
                className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-40"
              >
                <CaretRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create modal */}
      <AnimatePresence>
        {editing && (
          <ApplianceEditor
            initial={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load({ silent: true }); }}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setDeleting(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative bg-white dark:bg-taqon-charcoal rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                  <Trash size={18} weight="bold" />
                </div>
                <h3 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">Delete appliance?</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-white/60 mb-5">
                <strong>{deleting.name}</strong> will be soft-deleted and removed from the Solar Advisor picker. You can restore it from the Django admin later.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleting(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Editor modal ─── */

function ApplianceEditor({ initial, onClose, onSaved }) {
  const isNew = !initial?.slug;
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initial }));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-generate slug from name for new appliances
  useEffect(() => {
    if (isNew && !slugTouched) {
      set('slug', slugify(form.name));
    }
  }, [form.name, isNew, slugTouched]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.slug.trim()) e.slug = 'Slug is required';
    if (form.typical_wattage < 0) e.typical_wattage = 'Must be ≥ 0';
    if (parseFloat(form.power_points) < 0) e.power_points = 'Must be ≥ 0';
    if (parseFloat(form.energy_points) < 0) e.energy_points = 'Must be ≥ 0';
    const cf = parseFloat(form.concurrency_factor);
    if (isNaN(cf) || cf < 0 || cf > 1) e.concurrency_factor = 'Must be between 0 and 1';
    const nuf = parseFloat(form.night_use_factor);
    if (isNaN(nuf) || nuf < 0 || nuf > 1) e.night_use_factor = 'Must be between 0 and 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      icon_name: (form.icon_name || '').trim(),
      typical_wattage: parseInt(form.typical_wattage) || 0,
      power_points: parseFloat(form.power_points) || 0,
      energy_points: parseFloat(form.energy_points) || 0,
      concurrency_factor: parseFloat(form.concurrency_factor) || 0,
      night_use_factor: parseFloat(form.night_use_factor) || 0,
      smart_load_eligible: !!form.smart_load_eligible,
      description: form.description || '',
      is_active: !!form.is_active,
      sort_order: parseInt(form.sort_order) || 0,
    };

    try {
      if (isNew) {
        await adminApi.createAppliance(payload);
        toast.success(`Created ${payload.name}`);
      } else {
        await adminApi.updateAppliance(initial.slug, payload);
        toast.success(`Updated ${payload.name}`);
      }
      onSaved();
    } catch (err) {
      const data = err.response?.data || {};
      // Map backend field errors onto our form errors
      const fieldErrors = {};
      for (const [k, v] of Object.entries(data)) {
        fieldErrors[k] = Array.isArray(v) ? v.join(' ') : String(v);
      }
      setErrors(fieldErrors);
      toast.error(data.detail || 'Save failed — check the form for errors');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        className="relative bg-white dark:bg-taqon-charcoal rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-white/10 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-white/40">
              {isNew ? 'New appliance' : 'Edit appliance'}
            </p>
            <h2 className="text-lg font-semibold font-syne text-taqon-charcoal dark:text-white mt-0.5">
              {form.name || 'Untitled'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 hover:text-taqon-charcoal dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Section: Basics */}
            <Section label="Basics">
              <Row>
                <Field label="Name *" error={errors.name} span={2}>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Fridge (Large)"
                    className={inputCls}
                  />
                </Field>
                <Field label="Category *" error={errors.category}>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>
              </Row>

              <Row>
                <Field label="Slug *" hint="URL-safe identifier. Auto-generated from name for new items." error={errors.slug}>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => { set('slug', e.target.value); setSlugTouched(true); }}
                    className={`${inputCls} font-mono text-xs`}
                  />
                </Field>
                <Field label="Icon name" hint="Phosphor icon, e.g. Television" error={errors.icon_name}>
                  <input
                    type="text"
                    value={form.icon_name}
                    onChange={(e) => set('icon_name', e.target.value)}
                    placeholder="Lightning"
                    className={inputCls}
                  />
                </Field>
              </Row>

              <Field label="Description" hint="Shown in the Solar Advisor when users tap info." error={errors.description}>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Typical daily use, notes on power draw, etc."
                  className={inputCls}
                />
              </Field>
            </Section>

            {/* Section: Power + scoring */}
            <Section label="Power &amp; scoring" hint="These drive the Solar Advisor PP/EP totals.">
              <Row>
                <Field label="Typical wattage (W) *" error={errors.typical_wattage}>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.typical_wattage}
                    onChange={(e) => set('typical_wattage', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Power points (PP) *" hint="Instantaneous demand weight" error={errors.power_points}>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.power_points}
                    onChange={(e) => set('power_points', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Energy points (EP) *" hint="Daily energy weight" error={errors.energy_points}>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.energy_points}
                    onChange={(e) => set('energy_points', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </Row>

              <Row>
                <Field label="Concurrency factor" hint="0-1: how often it's on at the same time as other loads" error={errors.concurrency_factor}>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.concurrency_factor}
                    onChange={(e) => set('concurrency_factor', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Night use factor" hint="0-1: share of daily runtime after dark (battery load)" error={errors.night_use_factor}>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.night_use_factor}
                    onChange={(e) => set('night_use_factor', e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Sort order" hint="Lower numbers appear first within the category" error={errors.sort_order}>
                  <input
                    type="number"
                    step={1}
                    value={form.sort_order}
                    onChange={(e) => set('sort_order', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </Row>
            </Section>

            {/* Section: Flags */}
            <Section label="Flags">
              <div className="grid sm:grid-cols-2 gap-3">
                <Toggle
                  label="Smart-load eligible"
                  hint="Can be deferred / scheduled by smart-load inverters (Sunsynk etc.)"
                  checked={form.smart_load_eligible}
                  onChange={(v) => set('smart_load_eligible', v)}
                />
                <Toggle
                  label="Active"
                  hint="Visible in the Solar Advisor appliance picker"
                  checked={form.is_active}
                  onChange={(v) => set('is_active', v)}
                />
              </div>
            </Section>
          </div>

          {/* Footer */}
          <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100 dark:border-white/10 shrink-0 bg-white dark:bg-taqon-charcoal">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-[13px] font-medium text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-taqon-orange text-white text-[13px] font-semibold hover:bg-taqon-orange/90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {submitting ? (
                <><SpinnerGap size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><Check size={14} weight="bold" /> {isNew ? 'Create appliance' : 'Save changes'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ─── Form primitives ─── */

const inputCls = 'w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-taqon-charcoal dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-taqon-orange/30 focus:border-taqon-orange';

function Section({ label, hint, children }) {
  return (
    <section className="space-y-2.5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-white/40">{label}</p>
        {hint && <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>;
}

function Field({ label, hint, error, span = 1, children }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : ''}>
      <label className="block text-[12px] text-gray-500 dark:text-white/50 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer hover:border-taqon-orange/40 transition-colors">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded text-taqon-orange focus:ring-taqon-orange"
      />
      <div className="flex-1">
        <p className="text-sm font-medium text-taqon-charcoal dark:text-white">{label}</p>
        {hint && <p className="text-[11px] text-gray-400 dark:text-white/40 mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}
