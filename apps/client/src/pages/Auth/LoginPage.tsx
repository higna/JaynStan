import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { ApiError, apiRequest } from '../../lib/api';
import { useAuth, type AuthUser } from '../../context/AuthContext';

type AuthResult = { accessToken: string; tokenType: 'Bearer'; user: AuthUser };

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiRequest<AuthResult>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      setSession(result);
      navigate('/');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        toast.custom((t) => <div role="alert" className={`w-[min(25rem,calc(100vw-2rem))] rounded-2xl border border-[#e6c34f]/25 bg-[#171813] p-4 text-[#f4f1e8] shadow-2xl ${t.visible ? 'opacity-100' : 'opacity-0'}`}><p className="text-sm font-semibold">You are not a staff member of the platform.</p><p className="mt-1 text-xs leading-5 text-white/60">If you would like to partner with JaynStan, kindly reach out to our team.</p><Link to="/contact?subject=partnership" onClick={() => toast.dismiss(t.id)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#e6c34f] hover:underline">Contact support <ArrowLeft className="rotate-180" size={13} /></Link></div>, { duration: 7500, position: 'top-center' });
      } else {
        toast.error(error instanceof Error ? error.message : 'Could not sign in.');
      }
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell title="Staff sign in" subtitle="Sign in to manage your work and collaborate with the JaynStan team.">
    <form onSubmit={submit} className="space-y-5">
      <AuthField label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
      <label className="form-control w-full"><span className="mb-2 text-sm font-medium text-white/75">Password</span><span className="relative"><input className="input w-full border-white/15 bg-white/[.04] pr-12 text-white placeholder:text-white/30 focus:border-[#e6c34f] focus:outline-none" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/45 transition hover:text-white">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
      <button className="btn btn-primary mt-2 w-full" disabled={busy}><LockKeyhole size={16} />{busy ? 'Signing in?' : 'Sign in to workspace'}</button>
    </form>
    <div className="mt-5 flex justify-between gap-4 text-xs"><Link className="text-white/55 transition hover:text-[#e6c34f]" to="/forgot-password">Forgot password?</Link><Link className="text-white/55 transition hover:text-[#e6c34f]" to="/verify-email">Resend verification</Link></div>
    <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="font-mono text-[9px] uppercase tracking-wider text-white/35">or</span><span className="h-px flex-1 bg-white/10" /></div>
    <GoogleButton />
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3.5"><ShieldCheck className="mt-0.5 shrink-0 text-[#e6c34f]" size={17} /><p className="text-[11px] leading-5 text-white/55">This workspace is for JaynStan staff and invited collaborators. <Link to="/contact?subject=partnership" className="font-semibold text-[#e6c34f] hover:underline">Interested in partnering?</Link></p></div>
  </AuthShell>;
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <main className="min-h-screen bg-[#0b0b09] text-[#f5f2e8] lg:grid lg:grid-cols-2">
    <aside className="relative hidden min-h-screen overflow-hidden lg:flex lg:items-end">
      <img src="/Group.png" alt="JaynStan creative team" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      <div className="relative z-10 max-w-xl p-12 xl:p-16">
        <p className="mb-4 flex items-center gap-2 font-mono text-xs tracking-[.28em] text-[#e6c34f]"><Sparkles size={15} /> JAYNSTAN ESPIRE</p>
        <h2 className="font-serif text-5xl font-semibold leading-tight xl:text-6xl">A home for ideas worth sharing.</h2>
        <p className="mt-5 max-w-md text-white/70">Discover creative work, connect with its makers, and bring your next idea to life.</p>
      </div>
    </aside>
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-10 lg:py-10">
      <img src="/Hero.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 lg:hidden" />
      <div className="absolute inset-0 bg-[#0b0b09]/75 backdrop-blur-sm lg:hidden" />
      <div className="relative z-10 w-full max-w-lg">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-[#e6c34f]"><ArrowLeft size={16} /> Back to JaynStan</Link>
        <div className="rounded-3xl border border-white/10 bg-[#181813]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[.22em] text-[#e6c34f]">JaynStan account</p>
          <h1 className="font-serif text-4xl font-semibold">{title}</h1>
          <p className="mb-8 mt-3 text-sm leading-7 text-white/60">{subtitle}</p>
          {children}
        </div>
      </div>
    </section>
  </main>;
}

export function AuthField({ label, type, value, onChange, autoComplete, minLength }: {
  label: string; type: string; value: string; onChange: (value: string) => void;
  autoComplete?: string; minLength?: number;
}) {
  const id = label.toLowerCase().replaceAll(' ', '-');
  return <label className="form-control w-full">
    <span className="mb-2 text-sm font-medium text-white/75">{label}</span>
    <input className="input w-full border-white/15 bg-white/[.04] text-white placeholder:text-white/30 focus:border-[#e6c34f] focus:outline-none" id={id} type={type} autoComplete={autoComplete} minLength={minLength} required value={value} onChange={(event) => onChange(event.target.value)} />
  </label>;
}

export function GoogleButton() {
  return <a href="/api/auth/google" className="btn mt-3 w-full border-white/20 bg-white/[.03] text-white hover:border-[#e6c34f]/60 hover:bg-white/[.07]">Continue with Google</a>;
}
