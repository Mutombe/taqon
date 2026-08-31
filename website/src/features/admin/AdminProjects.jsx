import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Plus, Trash, FloppyDisk, SpinnerGap, UploadSimple, Star, Eye, EyeSlash,
  Image as ImageIcon, X, PencilSimple, MapPin,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { projectsApi } from '../../api/projects';

const CATEGORIES = ['residential', 'commercial', 'industrial', 'institutional', 'agricultural', 'other'];

// JSON field <-> textarea helpers
const toParagraphs = (t) => (t || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
const fromParagraphs = (a) => (a || []).join('\n\n');
const toLines = (t) => (t || '').split('\n').map((s) => s.trim()).filter(Boolean);
const fromLines = (a) => (a || []).join('\n');
const toSpecs = (t) => {
  const o = {};
  (t || '').split('\n').forEach((l) => {
    const i = l.indexOf(':');
    if (i > 0) {
      const k = l.slice(0, i).trim();
      const v = l.slice(i + 1).trim();
      if (k) o[k] = v;
    }
  });
  return o;
};
const fromSpecs = (obj) => Object.entries(obj || {}).map(([k, v]) => `${k}: ${v}`).join('\n');

const inputCls = 'w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange';
const labelCls = 'block text-xs font-semibold text-taqon-charcoal dark:text-white mb-1.5';

/* ── Editor modal ─────────────────────────────────────────────────────── */
function ProjectEditor({ slug, onClose, onSaved }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const heroRef = useRef(null);
  const galleryRef = useRef(null);
  const [busyImg, setBusyImg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsApi.adminDetail(slug);
      setP(res.data);
    } catch {
      setP(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setP((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (saving || !p) return;
    setSaving(true);
    try {
      const res = await projectsApi.update(slug, {
        title: p.title,
        category: p.category,
        location: p.location,
        kva: p.kva,
        date_label: p.date_label,
        description: p.description,
        full_description: p.full_description,
        specs: p.specs,
        benefits: p.benefits,
        is_published: p.is_published,
        is_featured: p.is_featured,
        sort_order: Number(p.sort_order) || 0,
      });
      setP(res.data);
      toast.success('Project saved.');
      onSaved?.();
    } catch (e) {
      toast.error(e?.response?.data?.title || 'Could not save the project.');
    } finally {
      setSaving(false);
    }
  };

  const uploadHero = async (file) => {
    if (!file) return;
    setBusyImg(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await projectsApi.uploadHero(slug, fd);
      setP(res.data);
      toast.success('Hero image updated.');
      onSaved?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Hero upload failed.');
    } finally {
      setBusyImg(false);
      if (heroRef.current) heroRef.current.value = '';
    }
  };

  const addImage = async (file) => {
    if (!file) return;
    setBusyImg(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      await projectsApi.addImage(slug, fd);
      await load();
      toast.success('Image added.');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Image upload failed.');
    } finally {
      setBusyImg(false);
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  const saveCaption = async (img) => {
    try {
      await projectsApi.updateImage(img.id, { caption: img.caption });
      toast.success('Caption saved.');
    } catch { toast.error('Could not save caption.'); }
  };

  const removeImage = async (img) => {
    if (!window.confirm('Remove this image?')) return;
    try {
      await projectsApi.deleteImage(img.id);
      await load();
    } catch { toast.error('Could not remove image.'); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-3xl my-8 bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-taqon-charcoal rounded-t-2xl z-10">
          <h2 className="font-bold font-syne text-taqon-charcoal dark:text-white">Edit Project</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center text-taqon-muted hover:bg-gray-100 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {loading || !p ? (
          <div className="p-10 flex items-center justify-center gap-2 text-taqon-muted dark:text-white/50">
            {loading ? <><SpinnerGap size={18} className="animate-spin" /> Loading…</> : 'Project not found.'}
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Basics */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Title</label>
                <input className={inputCls} value={p.title || ''} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls} value={p.category || 'residential'} onChange={(e) => set('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>kVA</label>
                <input className={inputCls} value={p.kva || ''} onChange={(e) => set('kva', e.target.value)} placeholder="24kVA" />
              </div>
              <div>
                <label className={labelCls}>Location</label>
                <input className={inputCls} value={p.location || ''} onChange={(e) => set('location', e.target.value)} placeholder="Kadoma" />
              </div>
              <div>
                <label className={labelCls}>Date label</label>
                <input className={inputCls} value={p.date_label || ''} onChange={(e) => set('date_label', e.target.value)} placeholder="Feb 2023" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Short description (cards)</label>
              <textarea rows={2} className={inputCls} value={p.description || ''} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Full description <span className="text-taqon-muted dark:text-white/40 font-normal">— one paragraph per blank line</span></label>
              <textarea rows={5} className={inputCls} defaultValue={fromParagraphs(p.full_description)} onBlur={(e) => set('full_description', toParagraphs(e.target.value))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Specs <span className="text-taqon-muted dark:text-white/40 font-normal">— key: value per line</span></label>
                <textarea rows={4} className={`${inputCls} font-mono text-xs`} defaultValue={fromSpecs(p.specs)} onBlur={(e) => set('specs', toSpecs(e.target.value))} />
              </div>
              <div>
                <label className={labelCls}>Benefits <span className="text-taqon-muted dark:text-white/40 font-normal">— one per line</span></label>
                <textarea rows={4} className={inputCls} defaultValue={fromLines(p.benefits)} onBlur={(e) => set('benefits', toLines(e.target.value))} />
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-taqon-charcoal dark:text-white/80">
                <input type="checkbox" checked={!!p.is_published} onChange={(e) => set('is_published', e.target.checked)} className="accent-taqon-orange" /> Published
              </label>
              <label className="flex items-center gap-2 text-sm text-taqon-charcoal dark:text-white/80">
                <input type="checkbox" checked={!!p.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="accent-taqon-orange" /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-taqon-muted dark:text-white/50">
                Order
                <input type="number" value={p.sort_order ?? 0} onChange={(e) => set('sort_order', e.target.value)} className="w-16 bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-taqon-charcoal dark:text-white outline-none" />
              </label>
            </div>

            {/* Hero */}
            <div>
              <label className={labelCls}>Hero image</label>
              <div className="flex items-center gap-3">
                <div className="w-32 aspect-video rounded-lg overflow-hidden bg-taqon-cream dark:bg-white/5 flex-shrink-0 flex items-center justify-center">
                  {p.hero ? <img src={p.hero} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-taqon-muted" />}
                </div>
                <input ref={heroRef} type="file" accept="image/*" onChange={(e) => uploadHero(e.target.files?.[0])} className="text-xs text-taqon-muted dark:text-white/60 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-taqon-orange/10 file:text-taqon-orange hover:file:bg-taqon-orange/20 file:cursor-pointer" />
              </div>
            </div>

            {/* Gallery */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls + ' mb-0'}>Gallery images</label>
                <input ref={galleryRef} type="file" accept="image/*" onChange={(e) => addImage(e.target.files?.[0])} className="text-xs text-taqon-muted dark:text-white/60 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-taqon-orange/10 file:text-taqon-orange hover:file:bg-taqon-orange/20 file:cursor-pointer" />
              </div>
              {busyImg && <div className="text-xs text-taqon-muted mb-2 flex items-center gap-1"><SpinnerGap size={12} className="animate-spin" /> Working…</div>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(p.images || []).map((img) => (
                  <div key={img.id} className="rounded-lg border border-gray-100 dark:border-white/10 overflow-hidden">
                    <div className="aspect-video bg-taqon-charcoal">
                      {img.src && <img src={img.src} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-2 flex items-center gap-1">
                      <input
                        defaultValue={img.caption}
                        onBlur={(e) => { img.caption = e.target.value; saveCaption(img); }}
                        placeholder="Caption"
                        className="flex-1 min-w-0 bg-transparent text-xs text-taqon-charcoal dark:text-white/80 outline-none"
                      />
                      <button onClick={() => removeImage(img)} className="text-red-500 hover:text-red-600 flex-shrink-0"><Trash size={14} /></button>
                    </div>
                  </div>
                ))}
                {(!p.images || p.images.length === 0) && (
                  <p className="text-xs text-taqon-muted dark:text-white/40 col-span-full">No images yet — add some above.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-taqon-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-white/5">Close</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-taqon-orange text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-50">
                {saving ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />} Save
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body,
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function AdminProjects() {
  const [projects, setProjects] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editSlug, setEditSlug] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsApi.adminList();
      const rows = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setProjects(rows);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createNew = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await projectsApi.create({ title: 'Untitled Project', category: 'residential', is_published: false });
      await load();
      setEditSlug(res.data.slug);
    } catch {
      toast.error('Could not create project.');
    } finally {
      setCreating(false);
    }
  };

  const quickToggle = async (proj, field) => {
    try {
      await projectsApi.update(proj.slug, { [field]: !proj[field] });
      load();
    } catch { toast.error('Update failed.'); }
  };

  const remove = async (proj) => {
    if (!window.confirm(`Delete “${proj.title}”? It will be removed from the site.`)) return;
    try {
      await projectsApi.remove(proj.slug);
      load();
      toast.success('Project deleted.');
    } catch { toast.error('Could not delete.'); }
  };

  return (
    <div className="space-y-6">
      <SEO title="Projects · Admin" noindex />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Projects</h1>
          <p className="text-sm text-taqon-muted dark:text-white/50 mt-1">Manage the public Projects gallery — add, edit, publish, feature and reorder.</p>
        </div>
        <button onClick={createNew} disabled={creating} className="inline-flex items-center gap-2 bg-taqon-orange text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 disabled:opacity-50 flex-shrink-0">
          {creating ? <SpinnerGap size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />} New Project
        </button>
      </motion.div>

      {loading ? (
        <div className="flex items-center gap-2 text-taqon-muted dark:text-white/50 text-sm"><SpinnerGap size={16} className="animate-spin" /> Loading…</div>
      ) : projects && projects.length ? (
        <div className="space-y-3">
          {projects.map((proj) => (
            <div key={proj.id} className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-3 flex items-center gap-4">
              <div className="w-28 aspect-video rounded-lg overflow-hidden bg-taqon-cream dark:bg-white/5 flex-shrink-0 flex items-center justify-center">
                {proj.hero ? <img src={proj.hero} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={18} className="text-taqon-muted" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-taqon-charcoal dark:text-white truncate">{proj.title}</span>
                  {proj.is_featured && <Star size={13} weight="fill" className="text-taqon-orange flex-shrink-0" />}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-taqon-muted dark:text-white/45">
                  <span className="capitalize">{proj.category}</span>
                  {proj.location && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {proj.location}</span>}
                  {proj.kva && <span>{proj.kva}</span>}
                  <span>{(proj.images || []).length} photos</span>
                  {!proj.is_published && <span className="text-amber-500 font-medium">Draft</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => quickToggle(proj, 'is_featured')} title="Feature" className={`w-8 h-8 rounded-lg flex items-center justify-center ${proj.is_featured ? 'text-taqon-orange' : 'text-taqon-muted hover:text-taqon-orange'}`}>
                  <Star size={16} weight={proj.is_featured ? 'fill' : 'regular'} />
                </button>
                <button onClick={() => quickToggle(proj, 'is_published')} title={proj.is_published ? 'Unpublish' : 'Publish'} className="w-8 h-8 rounded-lg flex items-center justify-center text-taqon-muted hover:text-taqon-orange">
                  {proj.is_published ? <Eye size={16} /> : <EyeSlash size={16} />}
                </button>
                <button onClick={() => setEditSlug(proj.slug)} title="Edit" className="w-8 h-8 rounded-lg flex items-center justify-center text-taqon-muted hover:text-taqon-orange">
                  <PencilSimple size={16} />
                </button>
                <button onClick={() => remove(proj)} title="Delete" className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-600">
                  <Trash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-12 text-center">
          <p className="text-taqon-muted dark:text-white/50 text-sm">No projects yet. Click “New Project” to add one.</p>
        </div>
      )}

      <AnimatePresence>
        {editSlug && (
          <ProjectEditor slug={editSlug} onClose={() => setEditSlug(null)} onSaved={load} />
        )}
      </AnimatePresence>
    </div>
  );
}
