import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeSimple, Lock, Eye, EyeSlash, User, Phone, CircleNotch, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import useAuthStore from '../../../stores/authStore';
import { authApi } from '../../../api/auth';

export default function RegisterView() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    account_type: 'individual',
    agreed_to_terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register, isLoading, error, clearError, setAuthModalView } = useAuthStore();

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      await register(form);
      setRegistered(true);
    } catch {
      // Error set in store
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const next = window.location.pathname + window.location.search + window.location.hash;
      try { sessionStorage.setItem('taqon-auth-next', next); } catch {}
      const { data } = await authApi.googleLogin(next);
      window.location.href = data.url;
    } catch {
      toast.error('Failed to initiate Google sign-in.');
      setGoogleLoading(false);
    }
  };

  const renderError = (field) => {
    if (typeof error === 'object' && error?.[field]) {
      const msg = Array.isArray(error[field]) ? error[field][0] : error[field];
      return <p className="text-red-400 text-xs mt-1">{msg}</p>;
    }
    return null;
  };

  if (registered) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold auth-text mb-2">Check Your Email</h2>
        <p className="auth-muted text-sm mb-6">
          We've sent a verification link to <span className="auth-text">{form.email}</span>.
          Click the link to activate your account.
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
        <h2 className="text-2xl font-bold font-syne auth-text">Create Account</h2>
        <p className="auth-muted mt-1 text-sm">Join the solar energy revolution</p>
      </div>

      {typeof error === 'string' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Google Sign-In */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 auth-btn-secondary rounded-xl py-3.5 font-medium disabled:opacity-50 mb-6"
      >
        {googleLoading ? (
          <CircleNotch size={18} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Sign up with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px auth-divider" />
        <span className="auth-muted text-xs uppercase">or</span>
        <div className="flex-1 h-px auth-divider" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block auth-label text-sm mb-2">First Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon" />
              <input
                type="text"
                value={form.first_name}
                onChange={update('first_name')}
                placeholder="First name"
                required
                className="auth-input w-full rounded-xl pl-11 pr-4 py-3 text-sm"
              />
            </div>
            {renderError('first_name')}
          </div>
          <div>
            <label className="block auth-label text-sm mb-2">Last Name</label>
            <input
              type="text"
              value={form.last_name}
              onChange={update('last_name')}
              placeholder="Last name"
              required
              className="auth-input w-full rounded-xl px-4 py-3 text-sm"
            />
            {renderError('last_name')}
          </div>
        </div>

        <div>
          <label className="block auth-label text-sm mb-2">Email</label>
          <div className="relative">
            <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon" />
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              required
              className="auth-input w-full rounded-xl pl-11 pr-4 py-3 text-sm"
            />
          </div>
          {renderError('email')}
        </div>

        <div>
          <label className="block auth-label text-sm mb-2">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon" />
            <input
              type="tel"
              value={form.phone_number}
              onChange={update('phone_number')}
              placeholder="+263771234567"
              className="auth-input w-full rounded-xl pl-11 pr-4 py-3 text-sm"
            />
          </div>
          {renderError('phone_number')}
        </div>

        <div>
          <label className="block auth-label text-sm mb-2">Account Type</label>
          <select
            value={form.account_type}
            onChange={update('account_type')}
            className="auth-input w-full rounded-xl px-4 py-3 text-sm"
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div>
          <label className="block auth-label text-sm mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="auth-input w-full rounded-xl pl-11 pr-12 py-3 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 auth-icon hover:opacity-70"
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="auth-muted text-xs mt-1">Must include uppercase, lowercase, and a number</p>
          {renderError('password')}
        </div>

        <div>
          <label className="block auth-label text-sm mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password_confirm}
              onChange={update('password_confirm')}
              placeholder="Confirm your password"
              required
              className="auth-input w-full rounded-xl pl-11 pr-4 py-3 text-sm"
            />
          </div>
          {renderError('password_confirm')}
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreed_to_terms}
            onChange={update('agreed_to_terms')}
            required
            className="mt-1 w-4 h-4 rounded text-taqon-orange focus:ring-taqon-orange accent-taqon-orange"
          />
          <span className="auth-muted text-sm">
            I agree to the{' '}
            <Link to="/terms" className="text-taqon-orange hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-taqon-orange hover:underline">Privacy Policy</Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-taqon-orange text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-taqon-orange/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="auth-muted text-sm">
          Already have an account?{' '}
          <button
            onClick={() => setAuthModalView('login')}
            className="text-taqon-orange hover:text-taqon-amber font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
