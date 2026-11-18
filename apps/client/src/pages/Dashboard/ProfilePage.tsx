import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Check, KeyRound, Save, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, type AuthUser } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SERVICE_CATEGORIES, type ServiceCategoryId } from '../../domain/service-categories';
import { apiRequest } from '../../lib/api';

type Profile = AuthUser & { disciplines: ServiceCategoryId[]; hasPassword: boolean };

export default function ProfilePage() {
  const { token, user, updateUser } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const panel = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [disciplines, setDisciplines] = useState<ServiceCategoryId[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest<Profile>('/auth/profile', {}, token).then((data) => {
      setProfile(data);
      setFullName(data.fullName);
      setDisciplines(data.disciplines);
      updateUser(data);
    }).catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load your profile.')).finally(() => setLoading(false));
  }, [token, updateUser]);

  function toggleDiscipline(id: ServiceCategoryId) {
    setDisciplines((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (newPassword && newPassword !== confirmPassword) { toast.error('The new passwords do not match.'); return; }
    if (newPassword && !currentPassword) { toast.error('Enter your current password to set a new one.'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { fullName, disciplines };
      if (newPassword) { payload.currentPassword = currentPassword; payload.newPassword = newPassword; }
      const updated = await apiRequest<Profile>('/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }, token);
      setProfile(updated);
      updateUser(updated);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Your profile has been updated.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update your profile.'); }
    finally { setSaving(false); }
  }

  return <div className="w-full space-y-7">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Account settings</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Your profile</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white">Manage your account name, password, and the creative disciplines you work in.</p></header>
    {loading ? <div className="py-16 text-center text-sm opacity-60">Loading profile…</div> : <form onSubmit={submit} className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,.9fr)]">
      <section className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${panel}`}><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-3 text-[#a88417]"><UserRound size={20}/></span><div><h2 className="font-serif text-2xl">Profile details</h2><p className={`text-xs ${muted}`}>This information appears across your workspace.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm sm:col-span-2"><span className="font-medium">Full name</span><input required minLength={2} maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="input w-full"/></label><div className="space-y-2 text-sm"><span className="font-medium">Email</span><div className={`input flex w-full items-center ${muted}`}>{profile?.email}</div><p className={`text-xs ${muted}`}>Contact an administrator if you need to change your email.</p></div><div className="space-y-2 text-sm"><span className="font-medium">Account role</span><div className="input flex w-full items-center capitalize">{profile?.role === 'user' ? 'Staff' : profile?.role}</div></div></div>
        <div className="mt-7"><div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="font-semibold">Your disciplines</h3><p className={`mt-1 text-xs ${muted}`}>Select every service area you work in.</p></div><span className={`text-xs ${muted}`}>{disciplines.length} selected</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{SERVICE_CATEGORIES.map((item) => { const selected = disciplines.includes(item.id); return <label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition ${selected ? 'border-[#a88417]/40 bg-[#a88417]/[.07]' : light ? 'border-base-300 hover:border-[#a88417]/30' : 'border-white/10 hover:border-[#a88417]/30'}`}><input type="checkbox" className="checkbox checkbox-sm checkbox-warning" checked={selected} onChange={() => toggleDiscipline(item.id)}/><span className="flex-1 text-sm font-medium">{item.name}</span>{selected && <Check size={15} className="text-[#a88417]"/>}</label>; })}</div></div>
      </section>
      <section className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${panel}`}><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-3 text-[#a88417]"><KeyRound size={20}/></span><div><h2 className="font-serif text-2xl">Password</h2><p className={`text-xs ${muted}`}>Change your sign-in password.</p></div></div>
        {profile?.hasPassword ? <div className="space-y-4"><label className="block space-y-2 text-sm"><span className="font-medium">Current password</span><input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="input w-full" placeholder="Only required when changing password"/></label><label className="block space-y-2 text-sm"><span className="font-medium">New password</span><input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="input w-full" placeholder="Leave blank to keep current password"/></label><label className="block space-y-2 text-sm"><span className="font-medium">Confirm new password</span><input type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input w-full"/></label><p className={`text-xs leading-5 ${muted}`}>Use at least 8 characters. Your session stays active after the password changes.</p></div> : <div className={`rounded-2xl border p-4 text-sm ${light ? 'border-base-300 bg-base-200/50' : 'border-white/10 bg-white/[.03]'}`}><p className="font-medium">Google sign-in account</p><p className={`mt-1 text-xs leading-5 ${muted}`}>To add a password, request a reset link sent to {profile?.email}.</p><Link to="/forgot-password" className="mt-3 inline-flex text-xs font-semibold text-[#a88417]">Set a password<ArrowRight size={14} className="ml-1"/></Link></div>}
        <button disabled={saving} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-5 py-3 text-sm font-bold text-[#17170f] disabled:opacity-50"><Save size={15}/>{saving ? 'Saving…' : 'Save profile'}</button>
      </section>
    </form>}
  </div>;
}
