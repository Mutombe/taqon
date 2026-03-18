import { SkeletonBox } from './Skeletons';

/**
 * Page-level skeleton shown as Suspense fallback for lazy-loaded routes.
 * Mimics a generic page layout so the transition feels seamless.
 */
export default function PageLoader() {
  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Heading area */}
        <div className="space-y-3 mb-10">
          <SkeletonBox className="h-4 w-24 rounded-md" />
          <SkeletonBox className="h-9 w-72 rounded-lg" />
          <SkeletonBox className="h-4 w-96 rounded-md" />
        </div>

        {/* Content area -- grid of cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-taqon-charcoal/40 border border-warm-100 dark:border-white/5 rounded-2xl overflow-hidden"
            >
              <SkeletonBox className="aspect-video w-full rounded-none" />
              <div className="p-5 space-y-3">
                <SkeletonBox className="h-4 w-3/4 rounded-md" />
                <SkeletonBox className="h-3 w-full rounded-md" />
                <SkeletonBox className="h-3 w-2/3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
