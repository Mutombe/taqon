import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

    const code = searchParams.get('code');
    const access = searchParams.get('access');
    const refresh = searchParams.get('refresh');
    const error = searchParams.get('error');
    // Priority: explicit `next` param > Google `state` > sessionStorage > home
    let next = searchParams.get('next') || searchParams.get('state') || '/';
    if (!next || next === '/' || next === '') {
      try {
        const stored = sessionStorage.getItem('taqon-auth-next');
        if (stored && stored !== '/') next = stored;
      } catch {}
    }
    // Safety: only allow in-app paths (not external redirects)
    if (!next.startsWith('/')) next = '/';
    try { sessionStorage.removeItem('taqon-auth-next'); } catch {}

    if (error) {
      const messages = {
        google_denied: 'Google sign-in was cancelled.',
        google_token_failed: 'Failed to authenticate with Google.',
        google_email_unverified: 'Your Google email is not verified.',
        google_failed: 'Google sign-in failed. Please try again.',
        account_disabled: 'This account has been deactivated.',
        access_denied: 'Google sign-in was cancelled.',
      };
      toast.error(messages[error] || 'Google sign-in failed.');
      navigate('/', { replace: true });
      return;
    }

    // New flow: Google redirected here with a code — exchange it via backend
    if (code) {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      authApi.googleCodeExchange(code, redirectUri)
        .then(({ data }) => {
          const tokens = data.tokens;
          const user = data.user;
          localStorage.setItem('taqon-tokens', JSON.stringify(tokens));
          setAuth(user, tokens);
          toast.success('Signed in with Google!');
          navigate(next, { replace: true });
        })
        .catch((err) => {
          const msg = err.response?.data?.error || 'Google sign-in failed.';
          toast.error(msg);
          navigate('/', { replace: true });
        });
      return;
    }

    // Legacy flow: backend redirected here with tokens in URL params
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

    // No code, no tokens, no error — invalid state
    navigate('/', { replace: true });
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="min-h-screen bg-taqon-cream dark:bg-taqon-dark flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-taqon-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-taqon-muted dark:text-white/50 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
