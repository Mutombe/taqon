import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, UploadSimple, DownloadSimple, SpinnerGap, CheckCircle,
  Clock, User as UserIcon, FilePdf,
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
            <button
              onClick={downloadCurrent}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/15 text-sm font-semibold text-taqon-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-60 flex-shrink-0"
            >
              {downloading ? <SpinnerGap size={16} className="animate-spin" /> : <DownloadSimple size={16} />}
              View current
            </button>
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
        <p className="text-sm text-taqon-muted dark:text-white/50 mt-1">
          Content the team maintains directly — no developer needed.
        </p>
      </motion.div>

      <CompanyProfileCard />
    </div>
  );
}
