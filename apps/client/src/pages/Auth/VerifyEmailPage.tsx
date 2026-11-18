import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { AuthField, AuthShell } from './LoginPage';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [state, setState] = useState<'loading' | 'verified' | 'invalid'>(token ? 'loading' : 'invalid');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => { if (active) setState('verified'); })
      .catch(() => { if (active) setState('invalid'); })
      .finally(() => { if (active) window.history.replaceState({}, '', '/verify-email'); });
    return () => { active = false; };
  }, [token]);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try { const result = await apiRequest<{ message: string }>('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }); toast.success(result.message); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not send the email.'); }
    finally { setBusy(false); }
  }

  if (state === 'loading') return <AuthShell title="Verifying your email" subtitle="Please wait while we confirm your email address."><p className="text-sm text-white/55">Checking verification link…</p></AuthShell>;
  if (state === 'verified') return <AuthShell title="Email verified" subtitle="Your email is confirmed. You can now sign in to JaynStan."><Link to="/login" className="btn btn-primary w-full">Sign in</Link></AuthShell>;
  return <AuthShell title="Verify your email" subtitle="The verification link may have expired. Enter your email and we’ll send a fresh one.">
    <form onSubmit={resend} className="space-y-5"><AuthField label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} /><button disabled={busy} className="btn btn-primary w-full">{busy ? 'Sending…' : 'Resend verification email'}</button></form>
    <p className="mt-5 text-center text-sm text-white/55"><Link className="text-[#e6c34f] hover:underline" to="/login">Back to sign in</Link></p>
  </AuthShell>;
}
