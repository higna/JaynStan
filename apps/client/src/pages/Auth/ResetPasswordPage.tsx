import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { AuthField, AuthShell } from './LoginPage';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    setBusy(true);
    try { await apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }); setDone(true); window.history.replaceState({}, '', '/reset-password'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Reset link is invalid or expired.'); }
    finally { setBusy(false); }
  }
  return <AuthShell title={done ? 'Password updated' : 'Choose a new password'} subtitle={done ? 'Your password has been changed. Sign in with your new password.' : 'Use at least 8 characters for your new password.'}>
    {!done && (token ? <form onSubmit={submit} className="space-y-5"><AuthField label="New password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={setPassword} /><AuthField label="Confirm password" type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={setConfirmPassword} /><button disabled={busy} className="btn btn-primary w-full">{busy ? 'Updating…' : 'Update password'}</button></form> : <p className="text-sm text-white/55">This reset link is missing or invalid. <Link className="text-[#e6c34f] hover:underline" to="/forgot-password">Request another link</Link>.</p>)}
    {done && <Link to="/login" className="btn btn-primary w-full">Sign in</Link>}
  </AuthShell>;
}
