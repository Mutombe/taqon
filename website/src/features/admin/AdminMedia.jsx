import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadSimple, Trash, MagnifyingGlass, X, CircleNotch,
  Image as ImageIcon, FileImage, ArrowsOut,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { useAdminMedia } from '../../hooks/useQueries';

function formatBytes(bytes) {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ImagePreviewModal({ item, onClose }) {
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
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X size={18} />
      </button>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden"
      >
        <img
          src={item.image || item.url || item.file}
          alt={item.name || item.filename}
          className="max-w-full max-h-[85vh] object-contain"
        />
      </motion.div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
        <p className="text-white text-sm font-medium">{item.name || item.filename}</p>
        <p className="text-white/60 text-xs text-center">{formatBytes(item.size)} · {formatDate(item.created_at)}</p>
      </div>
    </motion.div>
  );
}

function DeleteModal({ item, onConfirm, onCancel, deleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-sm w-full"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash size={24} className="text-red-400" />
        </div>
        <h3 className="font-syne font-bold text-lg text-[var(--text-primary)] text-center mb-1">Delete Image</h3>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">
          Delete <strong className="text-[var(--text-primary)]">{item.name || item.filename}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
            {deleting ? <CircleNotch size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UploadZone({ onUpload, uploading }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    if (files.length) onUpload(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => !uploading && fileRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
        dragging
          ? 'border-taqon-orange bg-taqon-orange/5 scale-[1.01]'
          : 'border-[var(--input-border)] hover:border-taqon-orange/50 hover:bg-[var(--bg-tertiary)]'
      }`}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <div className="flex items-center justify-center gap-3">
          <CircleNotch size={24} className="text-taqon-orange animate-spin" />
          <span className="text-sm text-[var(--text-muted)]">Uploading...</span>
        </div>
      ) : (
        <>
          <UploadSimple size={36} className={`mx-auto mb-3 transition-colors ${dragging ? 'text-taqon-orange' : 'text-[var(--text-muted)]'}`} />
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
            {dragging ? 'Drop to upload' : 'Click or drag & drop images'}
          </p>
          <p className="text-xs text-[var(--text-muted)]">PNG, JPG, WebP, GIF up to 10MB each</p>
        </>
      )}
    </div>
  );
}

function MediaCard({ item, onPreview, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const src = item.image || item.url || item.file || item.thumbnail;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-[var(--bg-tertiary)] overflow-hidden relative">
        {src ? (
          <img src={src} alt={item.name || item.filename} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileImage size={32} className="text-[var(--text-muted)] opacity-40" />
          </div>
        )}

        {/* Hover actions overlay */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
            >
              <button
                onClick={() => onPreview(item)}
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                title="Preview"
              >
                <ArrowsOut size={16} />
              </button>
              <button
                onClick={() => onDelete(item)}
                className="w-9 h-9 rounded-xl bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                title="Delete"
              >
                <Trash size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-medium text-[var(--text-primary)] truncate" title={item.name || item.filename}>
          {item.name || item.filename || 'Untitled'}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-[var(--text-muted)]">{formatBytes(item.size)}</span>
          <span className="text-xs text-[var(--text-muted)]">{formatDate(item.created_at)}</span>
        </div>
        {item.product && (
          <p className="text-xs text-taqon-orange truncate mt-0.5" title={item.product?.name || item.product}>
            {item.product?.name || item.product}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function GridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-[var(--card-border)]">
          <SkeletonBox className="aspect-square w-full rounded-none" />
          <div className="p-2.5 space-y-1.5">
            <SkeletonBox className="h-3 w-3/4 rounded" />
            <SkeletonBox className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminMedia() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const queryParams = useMemo(() => {
    const p = { page, page_size: 48 };
    if (search) p.search = search;
    return p;
  }, [page, search]);

  const { data: mediaData, isLoading: loading } = useAdminMedia(queryParams);
  const media = mediaData?.results || mediaData || [];
  const hasMore = media.length === 48;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminMedia'] });

  const handleUpload = async (files) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('name', file.name);
        fd.append('size', file.size);
        await adminApi.uploadMedia(fd);
      }
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`);
      invalidate();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteMedia(deleteTarget.id);
      toast.success('File deleted');
      setDeleteTarget(null);
      invalidate();
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = search
    ? media.filter((m) => (m.name || m.filename || '').toLowerCase().includes(search.toLowerCase()))
    : media;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">Media Library</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{media.length} files</p>
        </div>
      </div>

      {/* Upload Zone */}
      <UploadZone onUpload={handleUpload} uploading={uploading} />

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          className="auth-input w-full pl-9 text-sm"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <GridSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon size={48} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
          <p className="text-[var(--text-muted)]">
            {search ? 'No files match your search' : 'No media files yet'}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Upload some images to get started</p>
        </div>
      ) : (
        <>
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onPreview={setPreviewItem}
                  onDelete={setDeleteTarget}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {hasMore && !search && (
            <div className="text-center pt-2">
              <button
                onClick={() => { setPage((p) => p + 1); fetchMedia(false); }}
                className="px-6 py-2.5 rounded-xl border border-[var(--card-border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {previewItem && (
          <ImagePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
        )}
        {deleteTarget && (
          <DeleteModal
            item={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
