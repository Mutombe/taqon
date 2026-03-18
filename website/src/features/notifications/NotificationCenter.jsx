import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell, Check, Checks, Trash, Gear,
  ShoppingCart, ChatsTeardrop, Briefcase, BookOpen,
  CreditCard, FileText, Megaphone,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { notificationsApi } from '../../api/notifications';
import SEO from '../../components/SEO';
import { NotificationListSkeleton } from '../../components/Skeletons';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 20;

const TYPE_ICONS = {
  order_update: ShoppingCart,
  payment_received: CreditCard,
  quote_ready: FileText,
  job_assigned: Briefcase,
  ticket_reply: ChatsTeardrop,
  course_update: BookOpen,
  promotion: Megaphone,
  system: Gear,
};

const TYPE_COLORS = {
  order_update: 'text-blue-400 bg-blue-500/10',
  payment_received: 'text-green-400 bg-green-500/10',
  quote_ready: 'text-purple-400 bg-purple-500/10',
  job_assigned: 'text-yellow-400 bg-yellow-500/10',
  ticket_reply: 'text-taqon-orange bg-taqon-orange/10',
  course_update: 'text-cyan-400 bg-cyan-500/10',
  promotion: 'text-pink-400 bg-pink-500/10',
  system: 'text-gray-400 bg-gray-500/10',
};

const TYPE_LABELS = {
  order_update: 'Order Update',
  payment_received: 'Payment',
  quote_ready: 'Quotation',
  job_assigned: 'Job',
  ticket_reply: 'Support',
  course_update: 'Course',
  promotion: 'Promotion',
  system: 'System',
};

const FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (filter === 'unread') params.is_read = 'false';
      if (filter === 'read') params.is_read = 'true';
      if (typeFilter) params.type = typeFilter;

      const { data } = await notificationsApi.getNotifications(params);
      setNotifications(data.results || data);
      if (data.count) setTotalPages(Math.ceil(data.count / PAGE_SIZE));
    } catch {}
    setLoading(false);
  }, [filter, typeFilter, page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { setPage(1); }, [filter, typeFilter]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const { data } = await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success(`${data.marked_read} notifications marked as read.`);
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleClearRead = async () => {
    try {
      const { data } = await notificationsApi.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.is_read));
      toast.success(`${data.deleted} read notifications cleared.`);
    } catch {
      toast.error('Failed to clear.');
    }
  };

  const handleClick = (notification) => {
    if (!notification.is_read) handleMarkRead(notification.id);
    if (notification.action_url) navigate(notification.action_url);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <SEO title="Notifications" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Notifications</h1>
                <p className="text-sm text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              <Link
                to="/notifications/preferences"
                className="p-2 text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors"
              >
                <Gear size={18} />
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-taqon-orange bg-taqon-orange/10 rounded-lg hover:bg-taqon-orange/20 transition-colors"
                >
                  <Checks size={14} /> Mark all read
                </button>
              )}
              <button
                onClick={handleClearRead}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Trash size={14} /> Clear read
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  filter === f.value
                    ? 'bg-taqon-orange text-taqon-charcoal dark:text-white'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="border-l border-warm-200 dark:border-white/10 mx-1" />
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                !typeFilter ? 'bg-white/15 text-taqon-charcoal dark:text-white' : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              All Types
            </button>
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                  typeFilter === type
                    ? 'bg-white/15 text-taqon-charcoal dark:text-white'
                    : 'bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <NotificationListSkeleton count={6} />
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-taqon-charcoal/30 rounded-2xl border border-warm-100 dark:border-white/5">
              <Bell size={40} className="text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-400 mb-1">No Notifications</h3>
              <p className="text-sm text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <>
            <div className="space-y-2">
              {notifications.map((n, i) => {
                const Icon = TYPE_ICONS[n.notification_type] || Bell;
                const colorClass = TYPE_COLORS[n.notification_type] || 'text-gray-400 bg-gray-500/10';
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`group flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      n.is_read
                        ? 'bg-white dark:bg-taqon-charcoal/30 border-warm-100 dark:border-white/5 hover:border-warm-200 dark:border-white/10'
                        : 'bg-taqon-orange/5 border-taqon-orange/10 hover:border-taqon-orange/20'
                    }`}
                    onClick={() => handleClick(n)}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${n.is_read ? 'text-gray-400' : 'text-taqon-charcoal dark:text-white'}`}>
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-600 flex-shrink-0 mt-0.5">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      {n.action_label && (
                        <span className="inline-block text-[11px] text-taqon-orange mt-1">{n.action_label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                          className="p-1.5 text-gray-500 hover:text-taqon-orange transition-colors"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </>
          )}
        </div>
      </div>
    </>
  );
}
