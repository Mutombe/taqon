import React, { useState, useEffect } from 'react';
import { DownloadSimple, FileText, SpinnerGap } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { solarConfigApi } from '../api/solarConfig';
import { downloadsApi } from '../api/downloads';

/**
 * Reusable button that downloads Taqon's company profile PDF.
 *
 * Variants:
 *   `primary`   — solid orange CTA, used on hero / contact page
 *   `secondary` — bordered, used inline (about page, nav dropdown footer)
 *   `link`      — text-only, used for inline mentions
 *
 * Override `className` for surface-specific tweaks.
 */
export default function DownloadProfileButton({
  variant = 'primary',
  label = 'Download Company Profile',
  className = '',
  onComplete,
  iconSize = 16,
}) {
  const [loading, setLoading] = useState(false);
  // null = still checking, true/false = whether a profile file has been uploaded.
  const [available, setAvailable] = useState(null);

  useEffect(() => {
    let cancelled = false;
    downloadsApi
      .companyProfileMeta()
      .then((res) => { if (!cancelled) setAvailable(!!res.data?.available); })
      .catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  const baseStyles = {
    primary:
      'bg-taqon-orange text-white hover:bg-taqon-orange/90 px-5 py-3 rounded-xl font-semibold text-sm shadow-sm hover:shadow-md',
    secondary:
      'border border-taqon-charcoal/15 dark:border-white/15 text-taqon-charcoal dark:text-white hover:bg-taqon-charcoal/5 dark:hover:bg-white/5 px-5 py-3 rounded-xl font-semibold text-sm',
    link:
      'text-taqon-orange hover:text-taqon-orange/80 font-semibold text-sm',
  };

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await solarConfigApi.getBusinessProfile();
      const contentType = res.headers['content-type'] || 'application/pdf';
      const ext = contentType.includes('html') ? 'html' : 'pdf';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Taqon-Electrico-Company-Profile.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Company profile downloaded');
      onComplete?.();
    } catch (err) {
      toast.error('Company profile is not available right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Hide entirely until we know a profile file has been uploaded.
  if (!available) return null;

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 ${baseStyles[variant]} ${className}`}
    >
      {loading ? (
        <SpinnerGap size={iconSize} className="animate-spin" />
      ) : variant === 'link' ? (
        <FileText size={iconSize} weight="duotone" />
      ) : (
        <DownloadSimple size={iconSize} weight="bold" />
      )}
      <span>{loading ? 'Preparing…' : label}</span>
    </button>
  );
}
