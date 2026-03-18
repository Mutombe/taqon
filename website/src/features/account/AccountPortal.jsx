import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, ShoppingCart, FileText, ChatsTeardrop, BookOpen,
  Heart, MapPin, Bell, Gear, Shield, CaretRight,
  CurrencyDollar, Package, Clock,
} from '@phosphor-icons/react';
import { authApi } from '../../api/auth';
import useAuthStore from '../../stores/authStore';
import SEO from '../../components/SEO';
import { SkeletonBox } from '../../components/Skeletons';

const SECTIONS = [
  { label: 'Orders', to: '/account/orders', icon: ShoppingCart, key: 'total_orders', subKey: 'pending_orders', subLabel: 'pending' },
  { label: 'Quotations', to: '/account/quotations', icon: FileText, key: 'active_quotations' },
  { label: 'Invoices', to: '/account/invoices', icon: CurrencyDollar },
  { label: 'Courses', to: '/courses/my', icon: BookOpen, key: 'enrolled_courses' },
  { label: 'Support Tickets', to: '/support/tickets', icon: ChatsTeardrop, key: 'open_tickets' },
  { label: 'Wishlist', to: '/account/wishlist', icon: Heart, key: 'wishlist_count' },
  { label: 'Addresses', to: '/account/addresses', icon: MapPin, key: 'saved_addresses' },
  { label: 'Notifications', to: '/notifications', icon: Bell, key: 'unread_notifications' },
  { label: 'Profile Settings', to: '/account/profile', icon: User },
  { label: 'Security', to: '/account/security', icon: Shield },
];

export default function AccountPortal() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getSummary()
      .then(({ data }) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO title="My Account" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-taqon-charcoal/40 rounded-2xl border border-warm-100 dark:border-white/5 p-6 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-taqon-orange/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-taqon-orange" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold font-syne text-taqon-charcoal dark:text-white">
                  {user?.first_name} {user?.last_name}
                </h1>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.account_type} Account</p>
              </div>
              <Link
                to="/account/profile"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gray-50 dark:bg-white/5 text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Gear size={14} /> Edit Profile
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-warm-100 dark:border-white/5">
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center space-y-2">
                      <SkeletonBox className="h-6 w-12 rounded-md mx-auto" />
                      <SkeletonBox className="h-3 w-16 rounded-md mx-auto" />
                    </div>
                  ))}
                </>
              ) : summary ? (
                <>
                  <div className="text-center">
                    <p className="text-lg font-bold text-taqon-charcoal dark:text-white font-syne">{summary.total_orders}</p>
                    <p className="text-xs text-gray-500">Orders</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-taqon-charcoal dark:text-white font-syne">
                      ${parseFloat(summary.total_spent || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Spent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-taqon-charcoal dark:text-white font-syne">{summary.enrolled_courses}</p>
                    <p className="text-xs text-gray-500">Courses</p>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>

          {/* Section Links */}
          <div className="grid sm:grid-cols-2 gap-2">
            {SECTIONS.map(({ label, to, icon: Icon, key, subKey, subLabel }, i) => {
              const count = key && summary ? summary[key] : null;
              const subCount = subKey && summary ? summary[subKey] : null;

              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to={to}
                    className="flex items-center gap-3 bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-4 hover:border-taqon-orange/20 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-taqon-orange/10 transition-colors">
                      <Icon size={18} className="text-gray-400 group-hover:text-taqon-orange transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">{label}</p>
                      {subCount != null && subCount > 0 && (
                        <p className="text-xs text-yellow-400">{subCount} {subLabel}</p>
                      )}
                    </div>
                    {count != null && count > 0 && (
                      <span className="min-w-[24px] h-6 px-2 bg-taqon-orange/10 text-taqon-orange text-xs font-bold rounded-full flex items-center justify-center">
                        {count}
                      </span>
                    )}
                    <CaretRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
