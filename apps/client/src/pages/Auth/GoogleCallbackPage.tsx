import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { AlertCircle, ArrowLeft, LoaderCircle } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth, type AuthUser } from '../../context/AuthContext';
import { AuthShell } from './LoginPage';

type AuthResult = { accessToken: string; tokenType: 'Bearer'; user: AuthUser };

export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const didExchange = useRef(false);
  const code = searchParams.get('code');

  useEffect(() => {
    if (didExchange.current) return;
    didExchange.current = true;
    if (!code) {
      setError('Google sign-in was cancelled or could not be completed.');
      return;
    }
    apiRequest<AuthResult>('/auth/google/exchange', {
      method: 'POST', body: JSON.stringify({ code }),
    }).then((result) => {
      setSession(result);
      navigate('/', { replace: true });
    }).catch(() => setError('Google sign-in code expired. Please try again.'));
  }, [code, navigate, setSession]);

  if (error) return <AuthShell title="Sign-in failed" subtitle="We couldn?t complete Google sign-in.">
    <div className="rounded-2xl border border-red-300/15 bg-red-300/[.05] p-4">
      <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 shrink-0 text-red-300" size={19} /><div><p className="text-sm font-semibold text-white">Google sign-in was cancelled or could not be completed.</p><p className="mt-1 text-xs leading-5 text-white/55">You can return to the sign-in page and try again.</p></div></div>
    </div>
    <Link to="/login" replace className="btn btn-primary mt-5 w-full"><ArrowLeft size={16} /> Return to sign in</Link>
  </AuthShell>;

  return <AuthShell title="Completing sign-in" subtitle="Please wait while we securely connect your JaynStan account.">
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm text-white/60"><LoaderCircle className="animate-spin text-[#e6c34f]" size={19} /> Connecting your account?</div>
  </AuthShell>;
}
