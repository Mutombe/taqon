import { useState } from 'react';
import { motion } from 'framer-motion';
import { EnvelopeSimple, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import useAuthStore from '../../../stores/authStore';
import { authApi } from '../../../api/auth';

export default function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { setAuthModalView } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await authApi.requestPasswordReset(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold auth-text mb-2">Check Your Email</h2>
        <p className="auth-muted text-sm mb-6">
          If an account exists for <span className="auth-text">{email}</span>, we've sent a password reset link.
        </p>
        <button
          onClick={() => setAuthModalView('login')}
          className="text-taqon-orange hover:text-taqon-amber font-medium text-sm"
        >
          Back to login
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-syne auth-text">Reset Password</h2>
        <p className="auth-muted mt-1 text-sm">We'll send you a reset link</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block auth-label text-sm mb-2">Email Address</label>
          <div className="relative">
            <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 auth-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="auth-input w-full rounded-xl pl-12 pr-4 py-3.5"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-taqon-orange text-white py-3.5 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setAuthModalView('login')}
          className="auth-muted text-sm hover:opacity-70 inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Back to login
        </button>
      </div>
    </div>
  );
}
