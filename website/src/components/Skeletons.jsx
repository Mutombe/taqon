/**
 * Reusable skeleton loader primitives.
 * All skeletons use the same pulse animation and respect dark mode.
 */

// Base building block -- a pulsing rectangle
export function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/70 dark:bg-white/[0.06] rounded ${className}`}
    />
  );
}

// Circular skeleton (avatars, icons)
export function SkeletonCircle({ size = 40, className = '' }) {
  return (
    <div
      className={`animate-pulse bg-gray-200/70 dark:bg-white/[0.06] rounded-full flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

// ----- Page-level skeleton layouts -----

// Cart page skeleton
export function CartPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {/* Header row */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3">
          <SkeletonBox className="col-span-6 h-3 w-24 rounded-md" />
          <SkeletonBox className="col-span-2 h-3 w-12 mx-auto rounded-md" />
          <SkeletonBox className="col-span-2 h-3 w-16 mx-auto rounded-md" />
          <SkeletonBox className="col-span-2 h-3 w-12 ml-auto rounded-md" />
        </div>
        {[1, 2, 3].map((i) => (
          <CartItemSkeleton key={i} />
        ))}
      </div>
      <div className="lg:col-span-1">
        <OrderSummarySkeleton />
      </div>
    </div>
  );
}

// Single cart item skeleton
export function CartItemSkeleton() {
  return (
    <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 flex items-center gap-4">
          <SkeletonBox className="w-20 h-20 flex-shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-3/4 rounded-md" />
            <SkeletonBox className="h-3 w-20 rounded-md" />
          </div>
        </div>
        <div className="md:col-span-2 flex justify-center">
          <SkeletonBox className="h-4 w-16 rounded-md" />
        </div>
        <div className="md:col-span-2 flex justify-center">
          <SkeletonBox className="h-10 w-24 rounded-lg" />
        </div>
        <div className="md:col-span-2 flex justify-end gap-3">
          <SkeletonBox className="h-5 w-16 rounded-md" />
          <SkeletonBox className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Order summary sidebar skeleton
export function OrderSummarySkeleton() {
  return (
    <div className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
      <SkeletonBox className="h-6 w-36 rounded-md" />
      <div className="space-y-3">
        <div className="flex justify-between">
          <SkeletonBox className="h-4 w-24 rounded-md" />
          <SkeletonBox className="h-4 w-16 rounded-md" />
        </div>
        <div className="flex justify-between">
          <SkeletonBox className="h-4 w-16 rounded-md" />
          <SkeletonBox className="h-4 w-12 rounded-md" />
        </div>
        <div className="border-t border-warm-200 dark:border-white/10 pt-3">
          <div className="flex justify-between">
            <SkeletonBox className="h-5 w-12 rounded-md" />
            <SkeletonBox className="h-7 w-24 rounded-md" />
          </div>
        </div>
      </div>
      <SkeletonBox className="h-12 w-full rounded-xl" />
      <SkeletonBox className="h-3 w-48 rounded-md" />
    </div>
  );
}

// Wishlist grid skeleton
export function WishlistSkeleton({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <WishlistItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Single wishlist item skeleton
export function WishlistItemSkeleton() {
  return (
    <div className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 overflow-hidden">
      <SkeletonBox className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <SkeletonBox className="h-4 w-3/4 rounded-md" />
        <SkeletonBox className="h-4 w-20 rounded-md" />
        <div className="flex gap-2 mt-3">
          <SkeletonBox className="flex-1 h-9 rounded-lg" />
          <SkeletonBox className="h-9 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Order history list skeleton
export function OrderListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-taqon-charcoal/50 border border-warm-200 dark:border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SkeletonBox className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-32 rounded-md" />
                <SkeletonBox className="h-3 w-48 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right space-y-2">
                <SkeletonBox className="h-4 w-16 rounded-md ml-auto" />
                <SkeletonBox className="h-5 w-20 rounded-full ml-auto" />
              </div>
              <SkeletonBox className="w-5 h-5 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Notification list skeleton
export function NotificationListSkeleton({ count = 6 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-xl p-4 flex items-start gap-3"
        >
          <SkeletonCircle size={40} />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-3/4 rounded-md" />
            <SkeletonBox className="h-3 w-1/2 rounded-md" />
            <SkeletonBox className="h-3 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Admin dashboard KPI skeleton
export function DashboardKPISkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <SkeletonBox className="w-10 h-10 rounded-xl" />
            <SkeletonBox className="h-3 w-20 rounded-md" />
          </div>
          <SkeletonBox className="h-8 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// Course catalog card skeleton
export function CourseCardSkeleton() {
  return (
    <div className="bg-white dark:bg-taqon-charcoal/40 rounded-2xl border border-warm-100 dark:border-white/5 overflow-hidden">
      <SkeletonBox className="aspect-video w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <SkeletonBox className="h-5 w-20 rounded-full" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonBox className="h-5 w-3/4 rounded-md" />
        <SkeletonBox className="h-3 w-full rounded-md" />
        <SkeletonBox className="h-3 w-2/3 rounded-md" />
        <div className="flex justify-between items-center pt-3 border-t border-warm-100 dark:border-white/5">
          <SkeletonBox className="h-4 w-16 rounded-md" />
          <SkeletonBox className="h-4 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Account portal grid skeleton
export function AccountGridSkeleton({ count = 10 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-xl p-5 flex items-center gap-4"
        >
          <SkeletonBox className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-24 rounded-md" />
            <SkeletonBox className="h-3 w-12 rounded-md" />
          </div>
          <SkeletonBox className="w-5 h-5 rounded" />
        </div>
      ))}
    </div>
  );
}

// Detail page skeleton (order detail, quotation detail, etc.)
export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <SkeletonBox className="h-4 w-24 rounded-md mb-6" />
        <SkeletonBox className="h-8 w-64 rounded-lg mb-2" />
        <SkeletonBox className="h-4 w-40 rounded-md mb-8" />

        {/* Status bar skeleton */}
        <div className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <SkeletonCircle size={32} />
                <SkeletonBox className="h-3 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Content blocks */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-2xl p-6">
            <SkeletonBox className="h-5 w-32 rounded-md mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-warm-100 dark:border-white/5 last:border-0">
                <SkeletonBox className="w-14 h-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonBox className="h-4 w-3/4 rounded-md" />
                  <SkeletonBox className="h-3 w-24 rounded-md" />
                </div>
                <SkeletonBox className="h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-2xl p-6">
            <SkeletonBox className="h-5 w-24 rounded-md mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonBox className="h-4 w-24 rounded-md" />
                  <SkeletonBox className="h-4 w-16 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic page-level skeleton with heading area
export function PageSkeleton({ lines = 3, cards = 0, cardColumns = 3 }) {
  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4 mb-8">
          <SkeletonBox className="h-8 w-48 rounded-lg" />
          <SkeletonBox className="h-4 w-32 rounded-md" />
        </div>
        {lines > 0 && (
          <div className="space-y-3 mb-8">
            {Array.from({ length: lines }).map((_, i) => (
              <SkeletonBox
                key={i}
                className="h-4 rounded-md"
                style={{ width: `${90 - i * 10}%` }}
              />
            ))}
          </div>
        )}
        {cards > 0 && (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cardColumns}, 1fr)` }}
          >
            {Array.from({ length: cards }).map((_, i) => (
              <SkeletonBox key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
