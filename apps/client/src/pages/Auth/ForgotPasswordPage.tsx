import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { AuthField, AuthShell } from './LoginPage';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try { const result = await apiRequest<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setSent(true); toast.success(result.message); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not request a password reset.'); }
    finally { setBusy(false); }
  }
  return <AuthShell title={sent ? 'Check your inbox' : 'Reset your password'} subtitle={sent ? 'If an account exists for that address, a reset link is on its way.' : 'Enter the email address on your account and we’ll send a secure reset link.'}>
    {!sent && <form onSubmit={submit} className="space-y-5"><AuthField label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} /><button disabled={busy} className="btn btn-primary w-full">{busy ? 'Sending…' : 'Send reset link'}</button></form>}
    <p className="mt-5 text-center text-sm text-white/55"><Link className="text-[#e6c34f] hover:underline" to="/login">Back to sign in</Link></p>
  </AuthShell>;
}
