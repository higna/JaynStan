import { useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, MailPlus, ShieldCheck, UserPlus, UsersRound } from 'lucide-react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

type CreatedAccount = { id: string; fullName: string; email: string; role: 'user' | 'admin'; message: string };

export default function AdminAccountsPage() {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const panel = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const field = light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const result = await apiRequest<CreatedAccount>('/admin/accounts', { method: 'POST', body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), role }) }, token);
      setCreated(result);
      setFullName(''); setEmail(''); setRole('user');
      toast.success('Invitation email sent.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not create the account.'); }
    finally { setSaving(false); }
  }

  const isSuperadmin = user?.role === 'superadmin';
  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><div className="relative flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Platform access</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Create an account</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white">Invite a team member by name and email. They’ll receive a secure setup link to activate their account.</p></div><Link to="/dashboard/admin/users" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold text-white">Manage accounts<ArrowRight size={14}/></Link></div></header>
    <section className="grid gap-3 sm:grid-cols-3"><AccountStat icon={UsersRound} title="Account access" value="Invite only" light={light}/><AccountStat icon={MailPlus} title="Setup link" value="One hour" light={light}/><AccountStat icon={ShieldCheck} title="Admin invites" value={isSuperadmin ? 'Available' : 'Superadmin only'} light={light}/></section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
      <form onSubmit={submit} className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${panel}`}><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-3 text-[#a88417]"><UserPlus size={20}/></span><div><h2 className="font-serif text-2xl">Invite a platform member</h2><p className={`text-xs ${muted}`}>A unique email is required for each account.</p></div></div>
        {created && <div role="status" className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 ${light ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-300/20 bg-emerald-300/[.06]'}`}><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18}/><div className="min-w-0"><p className="text-sm font-semibold">Invitation sent to {created.fullName}</p><p className={`mt-1 break-all text-xs ${muted}`}>{created.email} · {created.role === 'user' ? 'Staff' : 'Administrator'}</p><p className={`mt-2 text-xs ${muted}`}>{created.message}</p></div></div>}
        <div className="grid gap-4 sm:grid-cols-2"><label className={`space-y-2 text-sm ${light ? 'text-base-content/75' : 'text-white/70'}`}><span>Full name</span><input required minLength={2} maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className={`input w-full ${field}`} placeholder="Name"/></label><label className={`space-y-2 text-sm ${light ? 'text-base-content/75' : 'text-white/70'}`}><span>Email address</span><input required type="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={`input w-full ${field}`} placeholder="name@example.com"/></label>
          {isSuperadmin && <label className={`space-y-2 text-sm ${light ? 'text-base-content/75' : 'text-white/70'}`}><span>Account role</span><select value={role} onChange={(event) => setRole(event.target.value as 'user' | 'admin')} className={`select w-full ${field}`}><option value="user">Staff / work advertiser</option><option value="admin">Administrator</option></select></label>}
        </div>
        <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 ${light ? 'border-base-300 bg-base-200/60' : 'border-white/10 bg-white/[.025]'}`}><MailPlus size={17} className="mt-0.5 shrink-0 text-[#a88417]"/><p className={`text-xs leading-5 ${muted}`}>The invite email contains a unique one-time link that expires in one hour. Setting a password activates the account and verifies its email.</p></div>
        <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-6 py-3 text-sm font-bold text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50">{saving ? 'Creating account…' : 'Create account and send invite'}<ShieldCheck size={16}/></button>
      </form>

      <aside className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${panel}`}><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">Access levels</p><h2 className="mt-1 font-serif text-2xl">The right access from day one.</h2><div className="mt-5 space-y-4"><AccessInfo icon={UsersRound} title="Staff member" copy="Can apply to advertise work. Provider publishing starts after approval." muted={muted}/><AccessInfo icon={ShieldCheck} title="Administrator" copy="Has immediate publishing access and can manage the platform dashboard." muted={muted}/></div><p className={`mt-5 border-t pt-4 text-xs leading-5 ${muted} ${light ? 'border-base-300' : 'border-white/10'}`}>{isSuperadmin ? 'You can invite either access level.' : 'Only a superadmin can invite administrator accounts.'}</p></aside>
    </div>
  </div>;
}

function AccountStat({ icon: Icon, title, value, light }: { icon: typeof UsersRound; title: string; value: string; light: boolean }) {
  return <article className={`flex min-h-28 items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm ${light ? 'border-base-content/10 bg-base-100' : 'border-white/10 bg-[#171813]'}`}><div><p className={`text-[11px] font-semibold uppercase tracking-wider ${light ? 'text-base-content/50' : 'text-white/50'}`}>{title}</p><p className="mt-2 text-lg font-bold">{value}</p></div><span className="rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Icon size={19}/></span></article>;
}

function AccessInfo({ icon: Icon, title, copy, muted }: { icon: typeof UsersRound; title: string; copy: string; muted: string }) {
  return <div className="flex gap-3"><span className="rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Icon size={17}/></span><div><h3 className="text-sm font-semibold">{title}</h3><p className={`mt-1 text-xs leading-5 ${muted}`}>{copy}</p></div></div>;
}
