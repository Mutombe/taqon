import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MagnifyingGlass, Pencil, Trash, Article, Eye,
  CircleNotch, CaretLeft, CaretRight, X,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { SkeletonBox } from '../../components/Skeletons';
import { useAdminBlogPosts } from '../../hooks/useQueries';

function TableSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-3/4 rounded" />
            <SkeletonBox className="h-3 w-40 rounded" />
          </div>
          <SkeletonBox className="h-5 w-20 rounded-full" />
          <SkeletonBox className="h-4 w-24 rounded" />
          <SkeletonBox className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ published }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      published
        ? 'bg-blue-500/10 text-blue-400'
        : 'bg-gray-500/10 text-[var(--text-muted)]'
    }`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function DeleteModal({ post, onConfirm, onCancel, deleting }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-sm w-full"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <Trash size={24} className="text-red-400" />
        </div>
        <h3 className="font-syne font-bold text-lg text-[var(--text-primary)] text-center mb-1">Delete Post</h3>
        <p className="text-sm text-[var(--text-muted)] text-center mb-6">
          Delete <strong className="text-[var(--text-primary)]">{post.title}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {deleting ? <CircleNotch size={14} className="animate-spin" /> : null}
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminBlog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const queryParams = useMemo(() => {
    const p = { page, page_size: 20 };
    if (search) p.search = search;
    if (statusFilter !== '') p.is_published = statusFilter;
    return p;
  }, [page, search, statusFilter]);

  const { data: postsData, isLoading: loading } = useAdminBlogPosts(queryParams);
  const posts = postsData?.results || postsData || [];
  const totalCount = postsData?.count || posts.length;
  const totalPages = Math.ceil(totalCount / 20);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteBlogPost(deleteTarget.slug);
      toast.success('Post deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-syne font-bold text-2xl text-[var(--text-primary)]">Blog Posts</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{totalCount} total posts</p>
        </div>
        <Link
          to="/admin/blog/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-taqon-orange text-white rounded-xl text-sm font-semibold hover:bg-taqon-orange/90 transition-colors shadow-lg shadow-taqon-orange/20"
        >
          <Plus size={16} weight="bold" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="auth-input w-full pl-9 text-sm"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="auth-input text-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Article size={48} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
            <p className="text-[var(--text-muted)]">No blog posts found</p>
            <Link to="/admin/blog/new" className="mt-4 inline-block text-sm text-taqon-orange hover:underline">
              Write your first post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--card-border)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">Views</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-64">{post.title}</p>
                        {post.excerpt && <p className="text-xs text-[var(--text-muted)] truncate max-w-64 mt-0.5">{post.excerpt}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-[var(--text-secondary)]">{post.category?.name || post.category || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge published={post.is_published} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-[var(--text-muted)]">
                        {post.is_published ? formatDate(post.published_at) : formatDate(post.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                        <Eye size={13} />
                        <span>{post.view_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {post.slug && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                          >
                            <Eye size={15} />
                          </a>
                        )}
                        <Link
                          to={`/admin/blog/${post.slug}/edit`}
                          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-taqon-orange transition-colors"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors">
              <CaretLeft size={16} />
            </button>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 transition-colors">
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            post={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
