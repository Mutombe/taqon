import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, UploadSimple, DownloadSimple, SpinnerGap, CheckCircle,
  Clock, User as UserIcon, FilePdf, YoutubeLogo, Plus, Trash, FloppyDisk,
  Eye, EyeSlash, SolarPanel, X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { downloadsApi } from '../../api/downloads';
import { solarConfigApi } from '../../api/solarConfig';

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* ── Company Profile upload / replace ─────────────────────────────────── */
function CompanyProfileCard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await downloadsApi.getCompanyProfile();
      setProfile(res.data?.available ? res.data : null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') {
      toast.error('Please choose a PDF file.');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('File is too large (max 50 MB).');
      return;
    }
    setFile(f);
  };

  const upload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await downloadsApi.uploadCompanyProfile(fd);
      toast.success('Company profile updated — it is now live on the website.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Download the currently-served profile (same file visitors get).
  const downloadCurrent = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await solarConfigApi.getBusinessProfile();
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Taqon-Electrico-Company-Profile.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download the current profile.');
    } finally {
      setDownloading(false);
    }
  };

  const remove = async () => {
    if (removing) return;
    if (!window.confirm('Remove the company profile? The download buttons on Contact & About will be hidden until you upload a new one.')) return;
    setRemoving(true);
    try {
      await downloadsApi.deleteCompanyProfile();
      toast.success('Company profile removed.');
      await load();
    } catch {
      toast.error('Could not remove the profile.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
          <FilePdf size={22} className="text-taqon-orange" weight="duotone" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">Company Profile</h2>
          <p className="text-sm text-taqon-muted dark:text-white/50 mt-0.5">
            Upload the PDF the team maintains. The website's “Download Company Profile” buttons
            (Contact &amp; About) serve this file. Until one is uploaded, those buttons stay hidden.
          </p>
        </div>
      </div>

      {/* Current file */}
      <div className="mt-5 rounded-xl border border-gray-100 dark:border-white/10 bg-taqon-cream/60 dark:bg-white/[0.03] p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-taqon-muted dark:text-white/50 text-sm">
            <SpinnerGap size={16} className="animate-spin" /> Loading…
          </div>
        ) : profile ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} weight="fill" className="text-emerald-500 flex-shrink-0" />
                <span className="font-semibold text-sm text-taqon-charcoal dark:text-white truncate">
                  {profile.original_name || 'Company profile.pdf'}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-taqon-muted dark:text-white/45">
                {profile.size_bytes != null && <span>{formatBytes(profile.size_bytes)}</span>}
                <span className="inline-flex items-center gap-1"><Clock size={12} /> {formatDate(profile.updated_at || profile.created_at)}</span>
                {profile.uploaded_by_email && (
                  <span className="inline-flex items-center gap-1"><UserIcon size={12} /> {profile.uploaded_by_email}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={downloadCurrent}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/15 text-sm font-semibold text-taqon-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-60"
              >
                {downloading ? <SpinnerGap size={16} className="animate-spin" /> : <DownloadSimple size={16} />}
                View current
              </button>
              <button
                onClick={remove}
                disabled={removing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-500/30 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all disabled:opacity-60"
              >
                {removing ? <SpinnerGap size={16} className="animate-spin" /> : <Trash size={16} />}
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-taqon-muted dark:text-white/50">
            <FileText size={16} />
            No company profile uploaded yet — the download buttons are hidden on the site.
          </div>
        )}
      </div>

      {/* Upload / replace */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onPick}
          className="block text-sm text-taqon-muted dark:text-white/60 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-taqon-orange/10 file:text-taqon-orange hover:file:bg-taqon-orange/20 file:cursor-pointer"
        />
        <button
          onClick={upload}
          disabled={!file || uploading}
          className="inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {uploading ? <SpinnerGap size={16} className="animate-spin" /> : <UploadSimple size={16} weight="bold" />}
          {profile ? 'Replace file' : 'Upload file'}
        </button>
      </div>
      <p className="mt-2 text-xs text-taqon-muted dark:text-white/40">PDF only · up to 50 MB.</p>
    </div>
  );
}

/* ── Video Stories management ─────────────────────────────────────────── */
function ytId(url = '') {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?#/]+)/);
  return m ? m[1] : '';
}

function VideoRow({ video, onChanged }) {
  const [title, setTitle] = useState(video.title);
  const [subtitle, setSubtitle] = useState(video.subtitle || '');
  const [url, setUrl] = useState(video.youtube_url);
  const [order, setOrder] = useState(video.order);
  const [active, setActive] = useState(video.is_active);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty =
    title !== video.title ||
    subtitle !== (video.subtitle || '') ||
    url !== video.youtube_url ||
    Number(order) !== video.order ||
    active !== video.is_active;

  const thumb = ytId(url) ? `https://img.youtube.com/vi/${ytId(url)}/hqdefault.jpg` : null;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await downloadsApi.updateVideoStory(video.id, {
        title, subtitle, youtube_url: url, order: Number(order) || 0, is_active: active,
      });
      toast.success('Video saved.');
      onChanged();
    } catch (e) {
      toast.error(e?.response?.data?.youtube_url || 'Could not save. Check the YouTube link.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleting) return;
    if (!window.confirm('Remove this video from the homepage?')) return;
    setDeleting(true);
    try {
      await downloadsApi.deleteVideoStory(video.id);
      toast.success('Video removed.');
      onChanged();
    } catch {
      toast.error('Could not remove the video.');
      setDeleting(false);
    }
  };

  return (
    <div className={`rounded-xl border p-3 flex gap-3 ${active ? 'border-gray-100 dark:border-white/10' : 'border-dashed border-gray-200 dark:border-white/10 opacity-70'}`}>
      <div className="w-28 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-taqon-charcoal">
        {thumb
          ? <img src={thumb} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-white/30"><YoutubeLogo size={20} /></div>}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title"
          className="w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange" />
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube link"
            className="flex-1 min-w-0 bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange" />
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Label"
            className="sm:w-44 bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1 text-xs text-taqon-muted dark:text-white/50">
            Order
            <input type="number" value={order} onChange={(e) => setOrder(e.target.value)}
              className="w-14 bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-taqon-charcoal dark:text-white outline-none" />
          </label>
          <button onClick={() => setActive(!active)} className="inline-flex items-center gap-1 text-xs font-medium text-taqon-muted dark:text-white/60 hover:text-taqon-orange">
            {active ? <><Eye size={14} /> Visible</> : <><EyeSlash size={14} /> Hidden</>}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={remove} disabled={deleting} className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50">
              {deleting ? <SpinnerGap size={14} className="animate-spin" /> : <Trash size={14} />} Remove
            </button>
            <button onClick={save} disabled={!dirty || saving} className="inline-flex items-center gap-1 bg-taqon-orange text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-taqon-orange/90 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? <SpinnerGap size={14} className="animate-spin" /> : <FloppyDisk size={14} />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoStoriesCard() {
  const [videos, setVideos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', youtube_url: '', subtitle: 'Smart Solar Choices Zimbabwe' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await downloadsApi.adminVideoStories();
      const rows = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setVideos(rows);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (adding) return;
    if (!draft.title.trim() || !draft.youtube_url.trim()) {
      toast.error('Add a title and a YouTube link.');
      return;
    }
    setAdding(true);
    try {
      await downloadsApi.createVideoStory({
        title: draft.title.trim(),
        youtube_url: draft.youtube_url.trim(),
        subtitle: draft.subtitle.trim(),
        order: (videos?.length || 0),
      });
      toast.success('Video added.');
      setDraft({ title: '', youtube_url: '', subtitle: 'Smart Solar Choices Zimbabwe' });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.youtube_url || 'Could not add. Check the YouTube link.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
          <YoutubeLogo size={22} className="text-taqon-orange" weight="duotone" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">Video Stories</h2>
          <p className="text-sm text-taqon-muted dark:text-white/50 mt-0.5">
            The “Solar Insights &amp; Guides” videos on the homepage. Paste any YouTube link — the
            thumbnail is pulled automatically and the video plays in a pop-up on the site.
          </p>
        </div>
      </div>

      {/* Add new */}
      <div className="mt-5 rounded-xl border border-dashed border-gray-200 dark:border-white/15 p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Video title" className="flex-1 bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange" />
          <input value={draft.youtube_url} onChange={(e) => setDraft({ ...draft, youtube_url: e.target.value })}
            placeholder="https://youtu.be/…" className="flex-1 bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange" />
          <button onClick={add} disabled={adding}
            className="inline-flex items-center justify-center gap-2 bg-taqon-orange text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-taqon-orange/90 disabled:opacity-50 flex-shrink-0">
            {adding ? <SpinnerGap size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />} Add
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-taqon-muted dark:text-white/50 text-sm"><SpinnerGap size={16} className="animate-spin" /> Loading…</div>
        ) : videos && videos.length ? (
          videos.map((v) => <VideoRow key={v.id} video={v} onChanged={load} />)
        ) : (
          <p className="text-sm text-taqon-muted dark:text-white/50">No videos yet — add one above.</p>
        )}
      </div>
    </div>
  );
}

/* ── Package video guides (overview + per family) ─────────────────────── */
function GuideUrlInput({ value, onChange, placeholder = 'https://youtu.be/… (leave blank for “coming soon”)' }) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-taqon-cream dark:bg-taqon-dark border border-gray-200 dark:border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-taqon-charcoal dark:text-white outline-none focus:border-taqon-orange"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Clear (show “coming soon”)"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-taqon-muted hover:text-red-500"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  );
}

function PackageGuidesCard() {
  const [overview, setOverview] = useState('');
  const [families, setFamilies] = useState([]);
  const [initial, setInitial] = useState({ overview: '', families: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await solarConfigApi.getAdminPackageGuides();
      const ov = res.data?.overview_youtube_url || '';
      const fams = (res.data?.families || []).map((f) => ({ ...f, guide_youtube_url: f.guide_youtube_url || '' }));
      setOverview(ov);
      setFamilies(fams);
      setInitial({ overview: ov, families: Object.fromEntries(fams.map((f) => [f.slug, f.guide_youtube_url])) });
    } catch {
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = overview !== initial.overview
    || families.some((f) => (initial.families[f.slug] ?? '') !== f.guide_youtube_url);

  const setFam = (slug, val) => setFamilies((prev) => prev.map((f) => (f.slug === slug ? { ...f, guide_youtube_url: val } : f)));

  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    try {
      await solarConfigApi.updatePackageGuides({
        overview_youtube_url: overview,
        families: families.map((f) => ({ slug: f.slug, guide_youtube_url: f.guide_youtube_url })),
      });
      toast.success('Package guides saved.');
      await load();
    } catch {
      toast.error('Could not save package guides.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-taqon-charcoal rounded-2xl border border-gray-100 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
          <SolarPanel size={22} className="text-taqon-orange" weight="duotone" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold font-syne text-taqon-charcoal dark:text-white">Package Guides</h2>
          <p className="text-sm text-taqon-muted dark:text-white/50 mt-0.5">
            The video guides on the Packages page and each package detail page. Paste a YouTube link;
            leave a field blank to show a clean “Video coming soon” instead.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-taqon-muted dark:text-white/50 text-sm">
          <SpinnerGap size={16} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Overview */}
          <div>
            <label className="block text-xs font-semibold text-taqon-charcoal dark:text-white mb-1.5">
              Overview guide <span className="text-taqon-muted dark:text-white/40 font-normal">— main Packages page</span>
            </label>
            <GuideUrlInput value={overview} onChange={setOverview} />
          </div>

          {/* Per family */}
          {families.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-taqon-charcoal dark:text-white mb-2">Per-family guides</p>
              <div className="space-y-2">
                {families.map((f) => (
                  <div key={f.slug} className="grid sm:grid-cols-[180px_1fr] gap-2 items-center">
                    <span className="text-sm text-taqon-charcoal dark:text-white/80 truncate">{f.name}</span>
                    <GuideUrlInput value={f.guide_youtube_url} onChange={(v) => setFam(f.slug, v)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 bg-taqon-orange text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-taqon-orange/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} weight="bold" />}
              Save guides
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSiteContent() {
  return (
    <div className="space-y-6">
      <SEO title="Site Content · Admin" noindex />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Site Content</h1>
      </motion.div>

      <CompanyProfileCard />
      <VideoStoriesCard />
      <PackageGuidesCard />
    </div>
  );
}
