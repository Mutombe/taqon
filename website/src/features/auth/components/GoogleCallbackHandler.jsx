import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CircleNotch } from '@phosphor-icons/react';
import { toast } from 'sonner';
import useAuthStore from '../../../stores/authStore';
import { authApi } from '../../../api/auth';

export default function GoogleCallbackHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');
    const next = searchParams.get('next') || '/';

    if (error) {
      const messages = {
        google_denied: 'Google sign-in was cancelled.',
        google_token_failed: 'Failed to authenticate with Google.',
        google_email_unverified: 'Your Google email is not verified.',
        google_failed: 'Google sign-in failed. Please try again.',
        account_disabled: 'This account has been deactivated.',
      };
      toast.error(messages[error] || 'Google sign-in failed.');
      navigate('/', { replace: true });
      return;
    }

    if (access && refresh) {
      const tokens = { access, refresh };
      localStorage.setItem('taqon-tokens', JSON.stringify(tokens));
      authApi.getProfile()
        .then(({ data: user }) => {
          setAuth(user, tokens);
          toast.success('Signed in with Google!');
          navigate(next, { replace: true });
        })
        .catch(() => {
          localStorage.removeItem('taqon-tokens');
          toast.error('Failed to load profile after Google sign-in.');
          navigate('/', { replace: true });
        });
      return;
    }

    // No tokens, no error — invalid state
    navigate('/', { replace: true });
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mb-4" />
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-40 mx-auto" />
      </div>
    </div>
  );
}
