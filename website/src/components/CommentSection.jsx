import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatCircleDots, PaperPlaneTilt, UserCircle, Clock, ThumbsUp, SpinnerGap, ArrowBendDownRight } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { getComments, createComment, likeComment } from '../api/comments';
import useAuthStore from '../stores/authStore';

// Map frontend type prop to backend content_type
const CONTENT_TYPE_MAP = {
  article: 'blog_post',
  project: 'project',
};

function timeAgo(dateStr) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Generate a consistent color from a name
function nameColor(name) {
  const colors = [
    'bg-taqon-orange/20 text-taqon-orange',
    'bg-blue-500/20 text-blue-500',
    'bg-emerald-500/20 text-emerald-500',
    'bg-purple-500/20 text-purple-500',
    'bg-pink-500/20 text-pink-500',
    'bg-amber-500/20 text-amber-500',
    'bg-cyan-500/20 text-cyan-500',
    'bg-rose-500/20 text-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const MAX_REPLY_DEPTH = 4;

function CommentBubble({
  comment,
  onLike,
  onReply,
  replyingTo,
  onSubmitReply,
  onCancelReply,
  isSubmittingReply,
  depth = 0,
  isAuthenticated,
  displayName,
}) {
  const authorName = comment.author_name || comment.user_name || comment.guest_name || 'Anonymous';
  const colorClass = nameColor(authorName);
  const isReplyingHere = replyingTo === comment.id;

  const [replyName, setReplyName] = useState('');
  const [replyText, setReplyText] = useState('');

  // Load saved guest name for reply forms
  useEffect(() => {
    if (!isAuthenticated) {
      const saved = localStorage.getItem('taqon_comment_name');
      if (saved) setReplyName(saved);
    }
  }, [isAuthenticated]);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    const authorForReply = isAuthenticated ? displayName : replyName.trim();
    if (!authorForReply || !replyText.trim()) return;
    onSubmitReply(comment.id, replyText.trim(), replyName.trim());
    setReplyText('');
  };

  const avatarSize = depth >= 1 ? 'w-8 h-8' : 'w-10 h-10';
  const avatarTextSize = depth >= 1 ? 'text-[10px]' : 'text-xs';
  const replies = comment.replies || [];
  const replyCount = replies.length;
  const canReply = depth < MAX_REPLY_DEPTH;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex gap-3 group"
      >
        {/* Avatar */}
        <div className={`${avatarSize} rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 ${avatarTextSize} font-bold`}>
          {getInitials(authorName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-taqon-cream dark:bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-taqon-charcoal dark:text-white">
                {authorName}
              </span>
              <span className="flex items-center gap-1 text-xs text-taqon-muted dark:text-white/30">
                <Clock size={10} />
                {timeAgo(comment.created_at || comment.date)}
              </span>
            </div>
            <p className="text-sm text-taqon-charcoal/80 dark:text-white/60 leading-relaxed whitespace-pre-wrap break-words">
              {comment.text}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-1.5 ml-2">
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.liked
                  ? 'text-taqon-orange font-medium'
                  : 'text-taqon-muted dark:text-white/30 hover:text-taqon-orange'
              }`}
            >
              <ThumbsUp size={12} weight={comment.liked ? 'fill' : 'regular'} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>

            {canReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1 text-xs text-taqon-muted dark:text-white/30 hover:text-taqon-orange transition-colors"
              >
                <ArrowBendDownRight size={12} />
                Reply
              </button>
            )}

            {replyCount > 0 && (
              <span className="text-xs text-taqon-muted dark:text-white/30">
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </div>

          {/* Inline Reply Form */}
          <AnimatePresence>
            {isReplyingHere && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleReplySubmit}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-start gap-2">
                  {/* Guest name input */}
                  {!isAuthenticated && (
                    <input
                      type="text"
                      value={replyName}
                      onChange={(e) => setReplyName(e.target.value)}
                      placeholder="Name"
                      maxLength={50}
                      className="w-24 shrink-0 bg-white dark:bg-white/5 rounded-lg px-3 py-2 text-xs text-taqon-charcoal dark:text-white placeholder:text-taqon-muted/40 dark:placeholder:text-white/20 border border-gray-100 dark:border-white/10 outline-none focus:border-taqon-orange/30 transition-colors"
                    />
                  )}
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    maxLength={1000}
                    rows={1}
                    className="flex-1 bg-white dark:bg-white/5 rounded-lg px-3 py-2 text-xs text-taqon-charcoal dark:text-white placeholder:text-taqon-muted/40 dark:placeholder:text-white/20 border border-gray-100 dark:border-white/10 outline-none focus:border-taqon-orange/30 transition-colors resize-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={
                      (!isAuthenticated && !replyName.trim()) || !replyText.trim() || isSubmittingReply
                    }
                    className="inline-flex items-center gap-1 bg-taqon-orange text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isSubmittingReply ? (
                      <SpinnerGap size={12} className="animate-spin" />
                    ) : (
                      <>
                        Post <PaperPlaneTilt size={10} weight="fill" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelReply}
                    className="text-xs text-taqon-muted dark:text-white/30 hover:text-taqon-charcoal dark:hover:text-white transition-colors py-2 shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className={depth >= 1 ? 'ml-6 pl-4 border-l-2 border-taqon-orange/20 mt-3' : 'ml-6 pl-4 border-l-2 border-taqon-orange/20 mt-3'}>
          <div className="space-y-4">
            {replies.map((reply) => (
              <CommentBubble
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                replyingTo={replyingTo}
                onSubmitReply={onSubmitReply}
                onCancelReply={onCancelReply}
                isSubmittingReply={isSubmittingReply}
                depth={depth + 1}
                isAuthenticated={isAuthenticated}
                displayName={displayName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="bg-gray-200 dark:bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 h-20" />
        <div className="w-12 h-3 bg-gray-200 dark:bg-white/10 rounded ml-2" />
      </div>
    </div>
  );
}

export default function CommentSection({ type, slug, title }) {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const textareaRef = useRef(null);

  const backendContentType = CONTENT_TYPE_MAP[type] || type;

  // Derive display name for authenticated users
  const displayName = isAuthenticated && user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
    : '';

  // Fetch comments from API
  const fetchComments = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setFetchError(null);

    try {
      const data = await getComments(backendContentType, slug, pageNum);
      const results = data.results || data;
      const count = data.count ?? results.length;
      const nextPage = data.next;

      // Normalize comment shape for consistent rendering
      const normalizeComment = (c) => ({
        ...c,
        liked: c.liked || false,
        likes: c.likes_count ?? c.likes ?? 0,
        replies: (c.replies || []).map(normalizeComment),
      });

      const normalized = results.map(normalizeComment);

      if (append) {
        setComments((prev) => [...prev, ...normalized]);
      } else {
        setComments(normalized);
      }
      setTotalCount(count);
      setHasMore(!!nextPage);
      setPage(pageNum);
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.error || 'Failed to load comments.';
      setFetchError(message);
      if (pageNum > 1) {
        toast.error('Could not load more comments');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [backendContentType, slug]);

  // Load comments and saved guest name on mount
  useEffect(() => {
    fetchComments(1);
    if (!isAuthenticated) {
      const savedName = localStorage.getItem('taqon_comment_name');
      if (savedName) setName(savedName);
    }
  }, [fetchComments, isAuthenticated]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchComments(page + 1, true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const authorName = isAuthenticated ? displayName : name.trim();
    if (!authorName || !text.trim()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        content_type: backendContentType,
        content_slug: slug,
        text: text.trim(),
      };

      if (!isAuthenticated) {
        payload.guest_name = name.trim();
      }

      const newComment = await createComment(payload);

      // Normalize the returned comment
      const normalized = {
        ...newComment,
        liked: false,
        likes: newComment.likes_count ?? newComment.likes ?? 0,
        replies: [],
      };

      // Optimistic prepend
      setComments((prev) => [normalized, ...prev]);
      setTotalCount((prev) => prev + 1);

      // Save guest name for convenience
      if (!isAuthenticated) {
        localStorage.setItem('taqon_comment_name', name.trim());
      }

      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.error || 'Failed to post comment. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to recursively insert a reply into the correct parent
  const insertReply = (commentsList, parentId, newReply) => {
    return commentsList.map((c) => {
      if (c.id === parentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply],
        };
      }
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: insertReply(c.replies, parentId, newReply),
        };
      }
      return c;
    });
  };

  // Helper to recursively update a comment (for likes)
  const updateCommentRecursive = (commentsList, commentId, updater) => {
    return commentsList.map((c) => {
      if (c.id === commentId) {
        return updater(c);
      }
      if (c.replies && c.replies.length > 0) {
        return {
          ...c,
          replies: updateCommentRecursive(c.replies, commentId, updater),
        };
      }
      return c;
    });
  };

  const handleReply = (commentId) => {
    setReplyingTo((prev) => (prev === commentId ? null : commentId));
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitReply = async (parentId, replyText, guestName) => {
    setIsSubmittingReply(true);

    try {
      const payload = {
        content_type: backendContentType,
        content_slug: slug,
        text: replyText,
        parent: parentId,
      };

      if (!isAuthenticated) {
        payload.guest_name = guestName;
        localStorage.setItem('taqon_comment_name', guestName);
      }

      const newReply = await createComment(payload);

      const normalized = {
        ...newReply,
        liked: false,
        likes: newReply.likes_count ?? newReply.likes ?? 0,
        replies: [],
      };

      // Insert into the correct parent's replies array
      setComments((prev) => insertReply(prev, parentId, normalized));
      setTotalCount((prev) => prev + 1);
      setReplyingTo(null);

      toast.success('Reply posted!');
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.error || 'Failed to post reply. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLike = async (commentId) => {
    // Optimistic update (recursive)
    setComments((prev) =>
      updateCommentRecursive(prev, commentId, (c) => ({
        ...c,
        liked: !c.liked,
        likes: c.liked ? c.likes - 1 : c.likes + 1,
      }))
    );

    try {
      await likeComment(commentId);
    } catch {
      // Revert on failure
      setComments((prev) =>
        updateCommentRecursive(prev, commentId, (c) => ({
          ...c,
          liked: !c.liked,
          likes: c.liked ? c.likes - 1 : c.likes + 1,
        }))
      );
      toast.error('Could not update like');
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  };

  return (
    <section className="py-16 lg:py-20 bg-white dark:bg-taqon-charcoal">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-taqon-orange/10 flex items-center justify-center">
            <ChatCircleDots size={20} className="text-taqon-orange" />
          </div>
          <div>
            <h3 className="text-xl lg:text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">
              Comments
            </h3>
            <p className="text-xs text-taqon-muted dark:text-white/40">
              {isLoading
                ? 'Loading comments...'
                : totalCount === 0
                  ? 'Be the first to share your thoughts'
                  : `${totalCount} comment${totalCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="bg-taqon-cream dark:bg-taqon-dark rounded-2xl p-5 border border-gray-100 dark:border-white/10">
            {/* Name input — only show for guests */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={18} className="text-taqon-orange" />
                </div>
                <span className="text-sm font-semibold text-taqon-charcoal dark:text-white">
                  {displayName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-taqon-orange/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle size={18} className="text-taqon-orange" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                  className="flex-1 bg-transparent text-sm font-semibold text-taqon-charcoal dark:text-white placeholder:text-taqon-muted/50 dark:placeholder:text-white/20 outline-none"
                />
              </div>
            )}

            {/* Comment textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                autoResize();
              }}
              placeholder={`Share your thoughts on this ${type === 'project' ? 'project' : 'article'}...`}
              maxLength={1000}
              rows={2}
              className="w-full bg-white dark:bg-white/5 rounded-xl px-4 py-3 text-sm text-taqon-charcoal dark:text-white placeholder:text-taqon-muted/40 dark:placeholder:text-white/20 border border-gray-100 dark:border-white/10 outline-none focus:border-taqon-orange/30 transition-colors resize-none"
            />

            {/* Submit row */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-taqon-muted dark:text-white/20">
                {text.length}/1000
              </span>
              <button
                type="submit"
                disabled={
                  (!isAuthenticated && !name.trim()) || !text.trim() || isSubmitting
                }
                className="inline-flex items-center gap-2 bg-taqon-orange text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-taqon-orange/25"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Post <PaperPlaneTilt size={14} weight="fill" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success toast */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 text-center text-sm text-emerald-600 dark:text-emerald-400 font-medium"
              >
                Comment posted successfully!
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {/* Loading skeletons */}
          {isLoading && (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          )}

          {/* Fetch error */}
          {!isLoading && fetchError && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 dark:text-red-400 mb-3">{fetchError}</p>
              <button
                onClick={() => fetchComments(1)}
                className="text-sm text-taqon-orange hover:underline font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {/* Comment bubbles */}
          {!isLoading && !fetchError && (
            <>
              <AnimatePresence mode="popLayout">
                {comments.map((comment) => (
                  <CommentBubble
                    key={comment.id}
                    comment={comment}
                    onLike={handleLike}
                    onReply={handleReply}
                    replyingTo={replyingTo}
                    onSubmitReply={handleSubmitReply}
                    onCancelReply={handleCancelReply}
                    isSubmittingReply={isSubmittingReply}
                    depth={0}
                    isAuthenticated={isAuthenticated}
                    displayName={displayName}
                  />
                ))}
              </AnimatePresence>

              {/* Load more button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 text-sm font-medium text-taqon-orange hover:text-taqon-orange/80 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <SpinnerGap size={16} className="animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more comments'
                    )}
                  </button>
                </div>
              )}

              {/* Empty state */}
              {comments.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-taqon-orange/5 flex items-center justify-center mx-auto mb-4">
                    <ChatCircleDots size={28} className="text-taqon-orange/40" />
                  </div>
                  <p className="text-taqon-muted dark:text-white/30 text-sm">
                    No comments yet. Start the conversation!
                  </p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
