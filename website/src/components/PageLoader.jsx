import React from 'react';

export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-taqon-cream dark:bg-taqon-dark">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-taqon-orange/20 border-t-taqon-orange rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-taqon-muted text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
