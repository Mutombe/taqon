import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeSlash, Lightning, CheckCircle } from '@phosphor-icons/react';
import { authApi } from '../../../api/auth';
import useAuthStore from '../../../stores/authStore';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { openAuthModal } = useAuthStore();
  const [form, setForm] = useState({ new_password: '', new_password_confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.new_password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authApi.confirmPasswordReset({ token, ...form });
      setSuccess(true);
      setTimeout(() => { navigate('/'); openAuthModal('login'); }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-taqon-charcoal dark:text-white mb-4">Invalid Reset Link</h1>
          <p className="text-gray-500 dark:text-white/50 mb-6">This password reset link is invalid or has expired.</p>
          <button
            onClick={() => { navigate('/'); openAuthModal('forgot-password'); }}
            className="text-taqon-orange hover:text-taqon-amber font-medium"
          >
            Request a new reset link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Lightning className="w-8 h-8 text-taqon-orange" />
            <span className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">TAQON</span>
          </Link>
          <h1 className="text-3xl font-bold font-syne text-taqon-charcoal dark:text-white">New Password</h1>
          <p className="text-gray-500 dark:text-white/50 mt-2">Enter your new password below</p>
        </div>

        <div className="bg-white dark:bg-taqon-charcoal/50 border border-gray-200 dark:border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-taqon-charcoal dark:text-white mb-2">Password Reset!</h2>
              <p className="text-gray-500 dark:text-white/50 text-sm">Redirecting you to login...</p>
            </motion.div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-taqon-muted dark:text-white/70 text-sm mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.new_password}
                      onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60"
                    >
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-taqon-muted dark:text-white/70 text-sm mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-white/30" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.new_password_confirm}
                      onChange={(e) => setForm({ ...form, new_password_confirm: e.target.value })}
                      placeholder="Confirm new password"
                      required
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-taqon-charcoal dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-taqon-orange/50 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-taqon-orange text-white py-3.5 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
