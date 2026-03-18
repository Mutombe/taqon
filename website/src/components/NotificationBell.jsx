import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, Checks, ArrowSquareOut, X,
  ShoppingCart, ChatsTeardrop, Briefcase, BookOpen,
  CreditCard, FileText, Megaphone, Gear,
} from '@phosphor-icons/react';
import { notificationsApi } from '../api/notifications';
import useAuthStore from '../stores/authStore';

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
  order_update: 'text-blue-400',
  payment_received: 'text-green-400',
  quote_ready: 'text-purple-400',
  job_assigned: 'text-yellow-400',
  ticket_reply: 'text-taqon-orange',
  course_update: 'text-cyan-400',
  promotion: 'text-pink-400',
  system: 'text-gray-400',
};

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Poll unread count every 30s (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch {
      // Silently fail (user may not be logged in)
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getNotifications({ page_size: 8 });
      setNotifications(data.results || data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) fetchNotifications();
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      notificationsApi.markRead(notification.id).catch(() => {});
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    setIsOpen(false);
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-taqon-orange text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-taqon-charcoal rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-taqon-orange hover:underline flex items-center gap-1"
                  >
                    <Checks size={12} /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[360px]">
              {loading ? (
                <div className="py-4 px-4 space-y-3 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded w-full" />
                        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell size={28} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.notification_type] || Bell;
                  const color = TYPE_COLORS[n.notification_type] || 'text-gray-400';
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 ${
                        !n.is_read ? 'bg-taqon-orange/5' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 ${color}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold line-clamp-1 ${n.is_read ? 'text-gray-400' : 'text-white'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-gray-600 flex-shrink-0">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>
                        {n.action_label && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-taqon-orange mt-1">
                            {n.action_label} <ArrowSquareOut size={8} />
                          </span>
                        )}
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkRead(n.id, e)}
                          className="self-center p-1 text-gray-600 hover:text-taqon-orange transition-colors flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 px-4 py-2">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-xs text-taqon-orange hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
