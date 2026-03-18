import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, Key, Trash, CircleNotch, Warning, Eye, EyeSlash,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import useAuthStore from '../../stores/authStore';
import SEO from '../../components/SEO';

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  // Password change
  const [pw, setPw] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Delete account
  const [showDelete, setShowDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pw.new_password !== pw.new_password_confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pw.new_password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword(pw);
      toast.success('Password changed successfully.');
      setPw({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      clearAuth();
      toast.success('Account deactivated.');
      navigate('/');
    } catch {
      toast.error('Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <SEO title="Security Settings" />

      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark pt-32 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/account" className="text-gray-400 hover:text-taqon-charcoal dark:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">Security</h1>
          </div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Key size={16} className="text-taqon-orange" />
              <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="relative">
                <label className="block text-xs text-gray-400 mb-1.5">Current Password</label>
                <input
                  type={showOld ? 'text' : 'password'}
                  value={pw.old_password}
                  onChange={(e) => setPw({ ...pw, old_password: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-8 text-gray-500"
                >
                  {showOld ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="relative">
                <label className="block text-xs text-gray-400 mb-1.5">New Password</label>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={pw.new_password}
                  onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                  required minLength={8}
                  className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-8 text-gray-500"
                >
                  {showNew ? <EyeSlash size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={pw.new_password_confirm}
                  onChange={(e) => setPw({ ...pw, new_password_confirm: e.target.value })}
                  required minLength={8}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-warm-200 dark:border-white/10 rounded-lg text-sm text-taqon-charcoal dark:text-white focus:border-taqon-orange/50 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={pwSaving}
                className="px-6 py-2.5 bg-taqon-orange text-taqon-charcoal dark:text-white text-sm font-semibold rounded-lg hover:bg-taqon-orange/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {pwSaving && <CircleNotch size={14} className="animate-spin" />}
                Update Password
              </button>
            </form>
          </motion.div>

          {/* Account Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-taqon-charcoal/40 rounded-xl border border-warm-100 dark:border-white/5 p-5 mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-green-400" />
              <h2 className="text-sm font-semibold text-taqon-charcoal dark:text-white">Account Security</h2>
            </div>
            <p className="text-xs text-gray-400">
              Your account uses JWT-based authentication. Access tokens expire every 30 minutes and refresh tokens last 7 days.
              Logging out invalidates your current session.
            </p>
          </motion.div>

          {/* Delete Account */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-red-500/5 rounded-xl border border-red-500/10 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trash size={16} className="text-red-400" />
              <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
            </div>

            {!showDelete ? (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Permanently deactivate your account. This action cannot be easily undone.
                  Your data will be retained for a period but your account will be inaccessible.
                </p>
                <button
                  onClick={() => setShowDelete(true)}
                  className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  Delete My Account
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
                  <Warning size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">
                    This will deactivate your account. Type <strong>"DELETE"</strong> to confirm.
                  </p>
                </div>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-red-500/20 rounded-lg text-sm text-taqon-charcoal dark:text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowDelete(false); setConfirmText(''); }}
                    className="px-4 py-2 text-xs font-semibold text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={confirmText !== 'DELETE' || deleting}
                    className="px-4 py-2 text-xs font-semibold text-taqon-charcoal dark:text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-30 flex items-center gap-2"
                  >
                    {deleting && <CircleNotch size={12} className="animate-spin" />}
                    Permanently Delete
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
