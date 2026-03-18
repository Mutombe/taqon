import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lightning, CheckCircle, XCircle, EnvelopeSimple, CircleNotch } from '@phosphor-icons/react';
import { authApi } from '../../../api/auth';
import useAuthStore from '../../../stores/authStore';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const location = useLocation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthStore();
  const email = location.state?.email;
  const [status, setStatus] = useState(token ? 'verifying' : 'pending'); // pending | verifying | success | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      authApi
        .verifyEmail(token)
        .then(() => setStatus('success'))
        .catch((err) => {
          setStatus('error');
          setError(err.response?.data?.error || 'Verification failed.');
        });
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Lightning className="w-8 h-8 text-taqon-orange" />
            <span className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white">TAQON</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-taqon-charcoal/50 border border-gray-200 dark:border-white/10 rounded-2xl p-8 backdrop-blur-sm text-center">
          {status === 'pending' && (
            <>
              <EnvelopeSimple className="w-16 h-16 text-taqon-orange mx-auto mb-4" />
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-3">Check Your Email</h1>
              <p className="text-gray-500 dark:text-white/50 mb-2">
                We've sent a verification link to{' '}
                {email ? <span className="text-taqon-charcoal dark:text-white">{email}</span> : 'your email address'}.
              </p>
              <p className="text-gray-400 dark:text-white/30 text-sm mb-6">
                Click the link in the email to verify your account. The link expires in 24 hours.
              </p>
              <button
                onClick={() => { navigate('/'); openAuthModal('login'); }}
                className="text-taqon-orange hover:text-taqon-amber font-medium text-sm"
              >
                Go to login
              </button>
            </>
          )}

          {status === 'verifying' && (
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-4" />
              <div className="h-7 bg-gray-200 dark:bg-white/10 rounded w-40 mx-auto mb-3" />
              <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-56 mx-auto" />
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-3">Email Verified!</h1>
              <p className="text-gray-500 dark:text-white/50 mb-6">Your account is now fully active.</p>
              <button
                onClick={() => { navigate('/'); openAuthModal('login'); }}
                className="inline-block bg-taqon-orange text-white px-8 py-3 rounded-xl font-semibold hover:bg-taqon-orange/90 transition-all"
              >
                Sign In
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold font-syne text-taqon-charcoal dark:text-white mb-3">Verification Failed</h1>
              <p className="text-gray-500 dark:text-white/50 mb-6">{error}</p>
              <button
                onClick={() => { navigate('/'); openAuthModal('login'); }}
                className="text-taqon-orange hover:text-taqon-amber font-medium"
              >
                Go to login
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
