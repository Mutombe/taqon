import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, X, CircleNotch, Images, Check } from '@phosphor-icons/react';
import { useAdminMedia } from '../hooks/useQueries';

/**
 * Modal that lets an admin reuse any image already on the site instead of
 * re-uploading. It reads the unified media library (standalone uploads +
 * product images + blog images) and returns the chosen image's URL via
 * onSelect(url, item). Set multiple to allow picking several at once.
 */
export default function LibraryPicker({ onSelect, onClose, multiple = false }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState([]);

  const params = useMemo(() => {
    const p = { page, page_size: 60 };
    if (search) p.search = search;
    return p;
  }, [page, search]);

  const { data, isLoading } = useAdminMedia(params);
  const items = data?.results || data || [];
  const hasMore = items.length === 60;

  const urlOf = (it) => it.url || it.image || it.file;

  const toggle = (it) => {
    const url = urlOf(it);
    if (!url) return;
    if (multiple) {
      setPicked((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
      );
    } else {
      onSelect(url, it);
      onClose();
    }
  };

  const confirmMultiple = () => {
    picked.forEach((url) => {
      const it = items.find((i) => urlOf(i) === url);
      onSelect(url, it);
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2">
            <Images size={20} className="text-taqon-orange" />
            <h3 className="font-syne font-bold text-[var(--text-primary)]">Choose from library</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-[var(--card-border)]">
          <div className="relative max-w-sm">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="auth-input w-full pl-9 text-sm"
              placeholder="Search images..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
              <CircleNotch size={24} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <Images size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">{search ? 'No images match your search' : 'No images in the library yet'}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {items.map((it) => {
                  const url = urlOf(it);
                  const isPicked = multiple && picked.includes(url);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggle(it)}
                      className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        isPicked ? 'border-taqon-orange' : 'border-transparent hover:border-taqon-orange/50'
                      }`}
                      title={it.name || it.source || ''}
                    >
                      <img src={url} alt={it.name || ''} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {isPicked && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-taqon-orange flex items-center justify-center">
                          <Check size={12} weight="bold" className="text-white" />
                        </span>
                      )}
                      {it.kind && it.kind !== 'upload' && (
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded capitalize">
                          {it.kind}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {hasMore && !search && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    className="px-5 py-2 rounded-xl border border-[var(--card-border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    Next page
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer (multi-select) */}
        {multiple && (
          <div className="flex items-center justify-between gap-4 px-5 py-3 border-t border-[var(--card-border)]">
            <span className="text-sm text-[var(--text-muted)]">{picked.length} selected</span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmMultiple}
                disabled={!picked.length}
                className="px-4 py-2 rounded-xl bg-taqon-orange text-white text-sm font-semibold hover:bg-taqon-orange/90 disabled:opacity-50 transition-colors"
              >
                Add {picked.length || ''}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
