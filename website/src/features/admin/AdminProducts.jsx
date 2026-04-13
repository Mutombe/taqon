import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MagnifyingGlass, Pencil, Trash, X, UploadSimple,
  Package, CheckCircle, XCircle, Star, Tag, CircleNotch,
  Funnel, CaretLeft, CaretRight, Image as ImageIcon,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { useAdminProducts, useCategories, useBrands } from '../../hooks/useQueries';

const EMPTY_FORM = {
  name: '', sku: '', category: '', brand: '', price: '', compare_at_price: '',
  is_on_sale: false, description: '', short_description: '', stock_quantity: '',
  warranty_period: '', specifications: '{}', is_active: true, is_featured: false,
};

function StatusBadge({ active }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'
    }`}>
      {active ? <CheckCircle size={11} weight="fill" /> : <XCircle size={11} weight="fill" />}
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
          <SkeletonBox className="w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-48 rounded" />
            <SkeletonBox className="h-3 w-24 rounded" />
          </div>
          <SkeletonBox className="h-4 w-20 rounded" />
          <SkeletonBox className="h-4 w-16 rounded" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
          <SkeletonBox className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function SpecEditor({ value, onChange }) {
  const [pairs, setPairs] = useState(() => {
    try {
      const obj = JSON.parse(value || '{}');
      return Object.entries(obj).map(([k, v]) => ({ k, v }));
    } catch { return []; }
  });

  const update = (newPairs) => {
    setPairs(newPairs);
    const obj = {};
    newPairs.forEach(({ k, v }) => { if (k.trim()) obj[k.trim()] = v; });
    onChange(JSON.stringify(obj));
  };

  const addRow = () => update([...pairs, { k: '', v: '' }]);
  const removeRow = (i) => update(pairs.filter((_, idx) => idx !== i));
  const setKey = (i, val) => update(pairs.map((p, idx) => idx === i ? { ...p, k: val } : p));
  const setVal = (i, val) => update(pairs.map((p, idx) => idx === i ? { ...p, v: val } : p));

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="auth-input flex-1 text-sm py-1.5"
            placeholder="Key"
            value={pair.k}
            onChange={(e) => setKey(i, e.target.value)}
          />
          <input
            className="auth-input flex-1 text-sm py-1.5"
            placeholder="Value"
            value={pair.v}
            onChange={(e) => setVal(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-xs text-taqon-orange hover:text-taqon-orange/80 transition-colors flex items-center gap-1"
      >
        <Plus size={12} /> Add specification
      </button>
    </div>
  );
}

function ImageUploadArea({ images, onUpload, onDelete, productSlug }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!productSlug) {
      toast.error('Save the product first, then upload images.');
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('images', file);
        const { data } = await adminApi.uploadProductImage(productSlug, fd);
        // Response is an array of images
        const uploaded = Array.isArray(data) ? data : [data];
        uploaded.forEach((img) => onUpload(img));
      }
      toast.success('Images uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-[var(--input-border)] rounded-xl p-6 text-center cursor-pointer hover:border-taqon-orange/50 transition-colors"
      >
        <UploadSimple size={28} className="mx-auto text-[var(--text-muted)] mb-2" />
        <p className="text-sm text-[var(--text-muted)]">
          {uploading ? 'Uploading...' : 'Click or drag & drop images'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square bg-[var(--bg-tertiary)]">
              <img src={img.image || img.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onDelete(img.id)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Trash size={18} className="text-red-400" />
              </button>
              {img.is_primary && (
                <span className="absolute top-1 left-1 bg-taqon-orange text-white text-[9px] px-1 rounded">Primary</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductModal({ product, categories, brands, onClose, onSaved }) {
  const [form, setForm] = useState(product ? {
    name: product.name || '',
    sku: product.sku || '',
    category: product.category?.id || product.category || '',
    brand: product.brand?.id || product.brand || '',
    price: product.price || '',
    compare_at_price: product.compare_at_price || '',
    is_on_sale: product.is_on_sale || false,
    description: product.description || '',
    short_description: product.short_description || '',
    stock_quantity: product.stock_quantity ?? '',
    warranty_period: product.warranty_period || '',
    specifications: typeof product.specifications === 'object'
      ? JSON.stringify(product.specifications)
      : product.specifications || '{}',
    is_active: product.is_active ?? true,
    is_featured: product.is_featured || false,
  } : EMPTY_FORM);
  const [images, setImages] = useState(product?.images || []);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState(product?.slug || null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      let specs = {};
      try { specs = JSON.parse(form.specifications || '{}'); } catch {}
      const payload = { ...form, specifications: specs };

      let saved;
      if (savedSlug) {
        const { data } = await adminApi.updateProduct(savedSlug, payload);
        saved = data;
        toast.success('Product updated');
      } else {
        const { data } = await adminApi.createProduct(payload);
        saved = data;
        setSavedSlug(data.slug);
        toast.success('Product created — you can now upload images');
      }
      onSaved(saved);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imgId) => {
    if (!savedSlug) return;
    try {
      await adminApi.deleteProductImage(savedSlug, imgId);
      setImages((imgs) => imgs.filter((i) => i.id !== imgId));
    } catch {
      toast.error('Failed to delete image');
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
          className="w-full max-w-xl h-full bg-[var(--bg-secondary)] border-l border-[var(--card-border)] overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--card-border)]">
            <h2 className="font-syne font-bold text-lg text-[var(--text-primary)]">
              {product ? 'Edit Product' : 'Add Product'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Basic info */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Basic Info</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Product Name *</label>
                  <input className="auth-input w-full" value={form.name} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">SKU</label>
                  <input className="auth-input w-full" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category</label>
                  <select className="auth-input w-full" value={form.category} onChange={(e) => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Brand</label>
                  <select className="auth-input w-full" value={form.brand} onChange={(e) => set('brand', e.target.value)}>
                    <option value="">Select brand</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Warranty</label>
                  <input className="auth-input w-full" value={form.warranty_period} onChange={(e) => set('warranty_period', e.target.value)} placeholder="e.g. 2 years" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Pricing</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Price *</label>
                  <input type="number" step="0.01" className="auth-input w-full" value={form.price} onChange={(e) => set('price', e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Compare-at Price</label>
                  <input type="number" step="0.01" className="auth-input w-full" value={form.compare_at_price} onChange={(e) => set('compare_at_price', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Stock Quantity</label>
                  <input type="number" className="auth-input w-full" value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => set('is_on_sale', !form.is_on_sale)}
                    className={`w-11 h-6 rounded-full relative transition-all duration-200 ${form.is_on_sale ? 'bg-taqon-orange shadow-sm shadow-taqon-orange/30' : 'bg-gray-300 dark:bg-white/15'}`}
                  >
                    <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${form.is_on_sale ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-[var(--text-secondary)]">On Sale</span>
                </label>
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Descriptions</h3>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Short Description</label>
                <textarea className="auth-input w-full resize-none" rows={2} value={form.short_description} onChange={(e) => set('short_description', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Full Description</label>
                <textarea className="auth-input w-full resize-none" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Specifications</h3>
              <SpecEditor value={form.specifications} onChange={(v) => set('specifications', v)} />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Settings</h3>
              <div className="flex flex-col gap-3">
                {[
                  { key: 'is_active', label: 'Active (visible in store)' },
                  { key: 'is_featured', label: 'Featured product' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => set(key, !form[key])}
                      className={`w-11 h-6 rounded-full relative transition-all duration-200 flex-shrink-0 ${form[key] ? 'bg-taqon-orange shadow-sm shadow-taqon-orange/30' : 'bg-gray-300 dark:bg-white/15'}`}
                    >
                      <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${form[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Images</h3>
              <ImageUploadArea
                images={images}
                productSlug={savedSlug}
                onUpload={(img) => setImages((imgs) => [...imgs, img])}
                onDelete={handleDeleteImage}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-[var(--bg-secondary)] pb-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? <CircleNotch size={16} className="animate-spin" /> : null}
                {savedSlug ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DeleteModal({ product, onConfirm, onCancel, deleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-sm w-full"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash size={24} className="text-red-400" />
        </div>
        <h3 className="font-syne font-bold text-lg text-[var(--text-primary)] text-center mb-1">Delete Product</h3>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">
          Are you sure you want to delete <strong className="text-[var(--text-primary)]">{product.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {deleting ? <CircleNotch size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState([]);

  const queryParams = useMemo(() => {
    const p = { page, page_size: 20 };
    if (search) p.search = search;
    if (categoryFilter) p.category = categoryFilter;
    if (statusFilter !== '') p.is_active = statusFilter;
    return p;
  }, [page, search, categoryFilter, statusFilter]);

  const { data: productsData, isLoading: loading } = useAdminProducts(queryParams);
  const products = productsData?.results || productsData || [];
  const totalCount = productsData?.count || products.length;
  const totalPages = Math.ceil(totalCount / 20);

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ['adminProducts'] });

  const handleSaved = () => { invalidateProducts(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteProduct(deleteTarget.slug);
      toast.success('Product deleted');
      setDeleteTarget(null);
      invalidateProducts();
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkToggle = async (active) => {
    if (!selected.length) return;
    try {
      const slugs = products.filter((p) => selected.includes(p.id)).map((p) => p.slug);
      await Promise.all(slugs.map((slug) => adminApi.updateProduct(slug, { is_active: active })));
      toast.success(`${selected.length} products ${active ? 'activated' : 'deactivated'}`);
      setSelected([]);
      invalidateProducts();
    } catch {
      toast.error('Bulk action failed');
    }
  };

  const toggleSelect = (id) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const allSelected = products.length > 0 && products.every((p) => selected.includes(p.id));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">Products</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{totalCount} total products</p>
        </div>
        <button
          onClick={() => setModalProduct(false)}
          className="flex items-center gap-2 px-4 py-2.5 bg-taqon-orange text-white rounded-xl text-sm font-semibold hover:bg-taqon-orange/90 transition-colors shadow-lg shadow-taqon-orange/20"
        >
          <Plus size={16} weight="bold" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="auth-input w-full pl-9 text-sm"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="auth-input text-sm"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="auth-input text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-[var(--text-muted)]">{selected.length} selected</span>
            <button onClick={() => handleBulkToggle(true)} className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-xs font-medium hover:bg-green-500/20 transition-colors">Activate</button>
            <button onClick={() => handleBulkToggle(false)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">Deactivate</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">No products found</p>
            <button onClick={() => setModalProduct(false)} className="mt-4 text-sm text-taqon-orange hover:underline">
              Add your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? [] : products.map((p) => p.id))}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {products.map((product) => {
                  const thumb = product.primary_image?.image || product.primary_image?.url || product.primary_image?.image_url || product.images?.[0]?.image || null;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[var(--bg-tertiary)] flex-shrink-0 overflow-hidden">
                            {thumb
                              ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                              : <ImageIcon size={20} className="m-auto text-[var(--text-muted)] mt-3" />
                            }
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-40">{product.name}</p>
                              {product.is_featured && <Star size={12} weight="fill" className="text-yellow-400 flex-shrink-0" />}
                            </div>
                            {product.sku && <p className="text-xs text-[var(--text-muted)]">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-[var(--text-secondary)]">
                          {product.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">${parseFloat(product.price || 0).toFixed(2)}</span>
                          {product.is_on_sale && (
                            <span className="ml-1.5 text-xs bg-taqon-orange/10 text-taqon-orange px-1.5 rounded">Sale</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-sm ${(product.stock_quantity || 0) < 5 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                          {product.stock_quantity ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={product.is_active} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModalProduct(product)}
                            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-taqon-orange transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
            >
              <CaretLeft size={16} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalProduct !== null && (
          <ProductModal
            key="product-modal"
            product={modalProduct || null}
            categories={categories}
            brands={brands}
            onClose={() => setModalProduct(null)}
            onSaved={(p) => { handleSaved(p); }}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            key="delete-modal"
            product={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
