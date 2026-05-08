import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { ToggleLeft, ToggleRight, ShieldCheck, SpinnerGap, Lightning } from '@phosphor-icons/react';
import { toast } from 'sonner';
import SEO from '../../components/SEO';
import { featureFlagsApi } from '../../api/featureFlags';
import { SkeletonBox } from '../../components/Skeletons';

/**
 * Admin: lock / unlock platform-level features.
 *
 * Each row maps 1:1 to a row in the FeatureFlag table. Two switches
 * per row: master `is_enabled` and `enabled_for_staff_only` (soft-launch).
 * Edits hit the admin endpoint and invalidate the public flag cache so
 * frontend gates see the new state on next route change.
 */
export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({}); // { [key]: true }
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    featureFlagsApi
      .adminList()
      .then((res) => {
        if (!cancelled) setFlags(res.data);
      })
      .catch(() => toast.error('Could not load feature flags'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = async (flag, patch) => {
    setSaving((s) => ({ ...s, [flag.key]: true }));
    try {
      const res = await featureFlagsApi.adminUpdate(flag.key, patch);
      setFlags((current) =>
        current.map((f) => (f.key === flag.key ? res.data : f)),
      );
      // Invalidate the public-flag cache so live gates re-fetch
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success(`${flag.name} updated`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    } finally {
      setSaving((s) => {
        const next = { ...s };
        delete next[flag.key];
        return next;
      });
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
      <SEO title="Feature Flags · Admin" />

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
            <Lightning size={20} weight="duotone" className="text-taqon-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Feature Flags
            </h1>
            <p className="text-sm text-taqon-muted dark:text-white/50">
              Lock or unlock platform features without touching code or deploying.
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBox key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag, i) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              index={i}
              saving={Boolean(saving[flag.key])}
              onUpdate={update}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FlagRow({ flag, index, saving, onUpdate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className={`bg-white dark:bg-taqon-charcoal rounded-2xl border p-5 transition-colors ${
        flag.is_enabled
          ? 'border-taqon-orange/25'
          : 'border-gray-200 dark:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-taqon-charcoal dark:text-white">
              {flag.name}
            </h2>
            <StatusPill flag={flag} />
          </div>
          <p className="mt-1 text-sm text-taqon-muted dark:text-white/55 leading-relaxed">
            {flag.description}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-wider font-mono text-taqon-muted/70 dark:text-white/35">
            {flag.key}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && (
            <SpinnerGap size={18} className="animate-spin text-taqon-muted" />
          )}
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <ToggleSwitch
          label="Enabled"
          description="Master switch — feature is visible to everyone when on."
          on={flag.is_enabled}
          disabled={saving}
          onChange={(v) => onUpdate(flag, { is_enabled: v })}
        />
        <ToggleSwitch
          label="Staff only"
          description="When enabled & this is on, only signed-in staff users see the live feature."
          on={flag.enabled_for_staff_only}
          disabled={saving || !flag.is_enabled}
          onChange={(v) => onUpdate(flag, { enabled_for_staff_only: v })}
          accent="amber"
        />
      </div>
    </motion.div>
  );
}

function StatusPill({ flag }) {
  if (!flag.is_enabled) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-gray-100 dark:bg-white/10 dark:text-white/50 px-2 py-0.5 rounded-full">
        Off
      </span>
    );
  }
  if (flag.enabled_for_staff_only) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 px-2 py-0.5 rounded-full">
        <ShieldCheck size={10} weight="fill" />
        Staff
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 px-2 py-0.5 rounded-full">
      Live
    </span>
  );
}

function ToggleSwitch({ label, description, on, onChange, disabled, accent = 'orange' }) {
  const accentBg = accent === 'amber'
    ? (on ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/15')
    : (on ? 'bg-taqon-orange' : 'bg-gray-300 dark:bg-white/15');
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`flex items-start gap-3 p-3 rounded-xl text-left transition-all border ${
        on
          ? 'border-taqon-orange/30 bg-taqon-orange/5 dark:bg-taqon-orange/10'
          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`mt-1 inline-flex w-9 h-5 rounded-full p-0.5 transition-colors flex-shrink-0 ${accentBg}`}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
            on ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-taqon-charcoal dark:text-white">
          {label}
        </span>
        <span className="block text-xs text-taqon-muted dark:text-white/45 mt-0.5 leading-snug">
          {description}
        </span>
      </span>
    </button>
  );
}
