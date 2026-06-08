import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Images, CircleNotch, MagnifyingGlass } from '@phosphor-icons/react';
import SEO from '../components/SEO';
import { useGallery } from '../hooks/useQueries';

const KINDS = [
  { key: 'all', label: 'All' },
  { key: 'product', label: 'Products' },
  { key: 'blog', label: 'Blog' },
  { key: 'upload', label: 'Other' },
];

function Lightbox({ item, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X size={18} />
      </button>
      <motion.img
        initial={{ scale: 0.92 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.92 }}
        onClick={(e) => e.stopPropagation()}
        src={item.url}
        alt={item.name || ''}
        className="max-w-5xl max-h-[85vh] object-contain rounded-xl"
      />
      {item.name && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
          <p className="text-white text-sm font-medium text-center">{item.name}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function Gallery() {
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);
  const [accumulated, setAccumulated] = useState([]);

  const params = useMemo(() => {
    const p = { page, page_size: 60 };
    if (search) p.search = search;
    return p;
  }, [page, search]);

  const { data, isLoading } = useGallery(params);
  const pageItems = data?.results || data || [];
  const hasMore = pageItems.length === 60;

  // Merge pages as the visitor loads more; reset when search changes.
  const items = useMemo(() => {
    const map = new Map();
    [...accumulated, ...pageItems].forEach((it) => map.set(it.url, it));
    return Array.from(map.values());
  }, [accumulated, pageItems]);

  const visible = kind === 'all' ? items : items.filter((it) => it.kind === kind);

  const loadMore = () => {
    setAccumulated(items);
    setPage((p) => p + 1);
  };

  const onSearch = (v) => {
    setSearch(v);
    setAccumulated([]);
    setPage(1);
  };

  return (
    <>
      <SEO
        title="Gallery"
        description="Browse Taqon Electrico's image gallery — solar products, completed installations, and stories from across Zimbabwe."
        keywords="solar gallery Zimbabwe, solar product photos, Taqon Electrico gallery"
        canonical="https://www.taqon.co.zw/gallery"
      />

      {/* Hero */}
      <section className="relative bg-taqon-dark">
        <div className="max-w-7xl mx-auto px-4 pt-36 lg:pt-44 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-taqon-orange text-sm font-semibold uppercase tracking-[0.15em]">
              <Images size={16} weight="fill" /> Gallery
            </span>
            <h1 className="mt-3 text-4xl lg:text-6xl font-bold font-syne text-white">
              The <span className="text-gradient">Visual Pool</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg max-w-xl">
              Every image across our products, projects, and stories — gathered in one place.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="bg-[var(--bg-primary)] border-b border-[var(--card-border)] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.key}
                onClick={() => setKind(k.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  kind === k.key
                    ? 'bg-taqon-orange text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-taqon-orange'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="auth-input w-full pl-9 text-sm"
              placeholder="Search gallery..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[var(--bg-primary)] min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {isLoading && items.length === 0 ? (
            <div className="flex items-center justify-center py-24 text-[var(--text-muted)]">
              <CircleNotch size={28} className="animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-24 text-[var(--text-muted)]">
              <Images size={44} className="mx-auto mb-3 opacity-40" />
              <p>No images to show{search ? ' for this search' : ''}.</p>
            </div>
          ) : (
            <>
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [&>*]:mb-3">
                {visible.map((it) => (
                  <motion.button
                    key={it.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setActive(it)}
                    className="block w-full break-inside-avoid rounded-xl overflow-hidden group relative bg-[var(--bg-tertiary)]"
                  >
                    <img
                      src={it.url}
                      alt={it.name || ''}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-xs font-medium line-clamp-2">{it.name}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {hasMore && kind === 'all' && !search && (
                <div className="text-center pt-8">
                  <button
                    onClick={loadMore}
                    className="px-6 py-2.5 rounded-xl border border-[var(--card-border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <AnimatePresence>
        {active && <Lightbox item={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </>
  );
}
