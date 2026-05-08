import React from 'react';
import { Navigate } from 'react-router-dom';
import { LockKey } from '@phosphor-icons/react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

/**
 * Gates a subtree of UI behind a platform feature flag.
 *
 * Usage:
 *   <FeatureGate flag="installer_accounts">
 *     <InstallerSignupForm />
 *   </FeatureGate>
 *
 * Props:
 *   flag         — required, the feature key (e.g. "installer_accounts")
 *   children     — what to render when the flag is ON
 *   fallback     — what to render when OFF; if omitted, a default
 *                  "Coming soon" panel renders
 *   redirectTo   — alternative: hard-redirect when OFF (useful for
 *                  whole-page routes; pass e.g. "/")
 *   showWhileLoading — render the children optimistically while the
 *                  flag is loading (default false → fail-closed)
 */
export default function FeatureGate({
  flag,
  children,
  fallback,
  redirectTo,
  showWhileLoading = false,
}) {
  const { isFlagOn, isLoaded, isLoading } = useFeatureFlags();

  if (isLoading && !isLoaded) {
    return showWhileLoading ? <>{children}</> : null;
  }

  if (isFlagOn(flag)) {
    return <>{children}</>;
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  return <ComingSoonPanel flag={flag} />;
}

function ComingSoonPanel({ flag }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-taqon-cream dark:bg-taqon-dark px-4 py-24">
      <div className="max-w-md text-center bg-white dark:bg-taqon-charcoal rounded-3xl border border-gray-100 dark:border-white/10 p-10 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-taqon-orange/10 flex items-center justify-center mx-auto mb-5">
          <LockKey size={26} weight="duotone" className="text-taqon-orange" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-taqon-orange">Coming soon</p>
        <h2 className="mt-3 text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
          This feature isn't live yet
        </h2>
        <p className="mt-3 text-sm text-taqon-muted dark:text-white/50 leading-relaxed">
          We're rolling this out shortly. Check back here, or reach out via
          WhatsApp and we'll let you know the moment it goes live.
        </p>
        <a
          href="/contact"
          className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-taqon-orange text-white font-semibold text-sm hover:bg-taqon-orange/90 transition-all"
        >
          Talk to us
        </a>
        <p className="mt-4 text-[10px] text-taqon-muted/60 dark:text-white/30 uppercase tracking-wider">
          Feature: {flag}
        </p>
      </div>
    </div>
  );
}

/**
 * Inline conditional helper — renders children only when the flag is on.
 * Use for nav links, CTAs, dashboard widgets that should silently disappear.
 *
 *   <FeatureFlag flag="equipment_marketplace">
 *     <Link to="/shop">Shop</Link>
 *   </FeatureFlag>
 */
export function FeatureFlag({ flag, children, fallback = null }) {
  const { isFlagOn, isLoaded } = useFeatureFlags();
  if (!isLoaded) return fallback;
  return isFlagOn(flag) ? <>{children}</> : fallback;
}
