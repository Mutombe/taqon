import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CircleNotch, FloppyDisk, Bell, EnvelopeSimple,
  ShoppingCart, CreditCard, FileText, Briefcase,
  ChatsTeardrop, BookOpen, Megaphone, Gear,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { notificationsApi } from '../../api/notifications';
import { DetailPageSkeleton } from '../../components/Skeletons';
import SEO from '../../components/SEO';

const NOTIFICATION_TYPES = [
  { key: 'order_update', label: 'Order Updates', desc: 'When your order status changes', icon: ShoppingCart },
  { key: 'payment_received', label: 'Payment Confirmations', desc: 'When payments are received', icon: CreditCard },
  { key: 'quote_ready', label: 'Quotation Updates', desc: 'When quotes are ready or updated', icon: FileText },
  { key: 'job_assigned', label: 'Job Assignments', desc: 'When technician jobs are assigned', icon: Briefcase },
  { key: 'ticket_reply', label: 'Support Replies', desc: 'When support tickets get replies', icon: ChatsTeardrop },
  { key: 'course_update', label: 'Course Updates', desc: 'Course announcements and progress', icon: BookOpen },
  { key: 'promotion', label: 'Promotions', desc: 'Special offers and deals', icon: Megaphone },
  { key: 'system', label: 'System Notices', desc: 'Important system announcements', icon: Gear },
];

function Toggle({ enabled, onToggle, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-taqon-orange/50 ${
        enabled
          ? 'bg-taqon-orange border-taqon-orange'
          : 'bg-gray-50 dark:bg-white/5 border-white/20'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[22px] w-[22px] rounded-full shadow-sm transition-transform duration-200 ease-in-out ${
          enabled
            ? 'translate-x-[21px] bg-white'
            : 'translate-x-[1px] bg-white/40'
        }`}
        style={{ marginTop: '1px' }}
      />
    </button>
  );
}

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    notificationsApi.getPreferences()
      .then(({ data }) => setPrefs(data))
      .catch(() => toast.error('Failed to load preferences.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (field) => {
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await notificationsApi.updatePreferences(prefs);
      setPrefs(data);
      toast.success('Preferences saved.');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;

  if (!prefs) return null;

  return (
    <>
      <SEO title="Notification Preferences" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <Link to="/notifications" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Notification Preferences</h1>
          </div>

          <p className="text-sm text-gray-400 mb-8 ml-8">
            Choose which notifications you want to receive and how.
          </p>

          {/* Desktop: Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_100px] gap-4 px-5 mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Notification Type</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold text-center flex items-center justify-center gap-1.5">
              <Bell size={12} /> In-App
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold text-center flex items-center justify-center gap-1.5">
              <EnvelopeSimple size={12} /> Email
            </span>
          </div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {NOTIFICATION_TYPES.map(({ key, label, desc, icon: Icon }) => (
              <div
                key={key}
                className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-4 sm:p-5"
              >
                {/* Desktop layout */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_100px] gap-4 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      enabled={!!prefs[`in_app_${key}`]}
                      onToggle={() => toggle(`in_app_${key}`)}
                      label={`${label} in-app notifications`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Toggle
                      enabled={!!prefs[`email_${key}`]}
                      onToggle={() => toggle(`email_${key}`)}
                      label={`${label} email notifications`}
                    />
                  </div>
                </div>

                {/* Mobile layout */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-taqon-charcoal dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 pl-1">
                    <div className="flex items-center gap-3">
                      <Bell size={14} className="text-gray-500" />
                      <span className="text-xs text-gray-400 font-medium">In-App</span>
                      <span className={`text-[10px] font-bold uppercase ${prefs[`in_app_${key}`] ? 'text-taqon-orange' : 'text-gray-600'}`}>
                        {prefs[`in_app_${key}`] ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <Toggle
                      enabled={!!prefs[`in_app_${key}`]}
                      onToggle={() => toggle(`in_app_${key}`)}
                      label={`${label} in-app notifications`}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 pl-1 mt-3 pt-3 border-t border-warm-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <EnvelopeSimple size={14} className="text-gray-500" />
                      <span className="text-xs text-gray-400 font-medium">Email</span>
                      <span className={`text-[10px] font-bold uppercase ${prefs[`email_${key}`] ? 'text-taqon-orange' : 'text-gray-600'}`}>
                        {prefs[`email_${key}`] ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <Toggle
                      enabled={!!prefs[`email_${key}`]}
                      onToggle={() => toggle(`email_${key}`)}
                      label={`${label} email notifications`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-8 w-full py-3.5 bg-taqon-orange hover:bg-taqon-orange/90 text-taqon-charcoal dark:text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? <CircleNotch size={18} className="animate-spin" /> : <FloppyDisk size={18} />}
            Save Preferences
          </button>
        </div>
      </div>
    </>
  );
}
