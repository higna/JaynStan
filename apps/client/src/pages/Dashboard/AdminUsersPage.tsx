import { useCallback, useEffect, useState } from 'react';
import { Search, Shield, Trash2, UserRound, UsersRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

type ManagedUser = { id: string; full_name: string; email: string; phone: string | null; role: 'user' | 'admin' | 'superadmin'; email_verified: boolean; created_at: string; provider_status: 'pending' | 'approved' | 'rejected' | null };

export default function AdminUsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setUsers(await apiRequest<ManagedUser[]>(`/admin/users?search=${encodeURIComponent(search)}`, {}, token)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load users.'); }
    finally { setLoading(false); }
  }, [token, search]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 250); return () => window.clearTimeout(timer); }, [load]);

  async function setRole(target: ManagedUser, role: ManagedUser['role']) {
    if (!token) return;
    setBusy(target.id);
    try {
      await apiRequest(`/admin/users/${target.id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, token);
      toast.success(role === 'user' ? 'Account is now staff access.' : `Role updated to ${role}.`);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update account role.'); }
    finally { setBusy(''); }
  }

  async function deleteAccount(target: ManagedUser) {
    if (!token || !window.confirm(`Permanently delete ${target.full_name} (${target.email})?`)) return;
    setBusy(target.id);
    try {
      await apiRequest(`/admin/users/${target.id}`, { method: 'DELETE' }, token);
      setUsers((items) => items.filter((item) => item.id !== target.id));
      toast.success('Account deleted.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not delete account.'); }
    finally { setBusy(''); }
  }

  const isSuperadmin = user?.role === 'superadmin';
  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Platform access</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-3xl font-semibold sm:text-4xl">User management</h1><p className="mt-2 text-sm text-white">Manage staff accounts, roles, and provider access.</p></div><Link to="/dashboard/admin/accounts" className="rounded-full bg-[#e6c34f] px-4 py-2.5 text-xs font-bold text-[#17170f]">Create account</Link></div></header>
    <div className="grid gap-3 sm:grid-cols-3"><Metric title="Listed accounts" value={users.length} icon={UsersRound}/><Metric title="Administrators" value={users.filter((item) => item.role !== 'user').length} icon={Shield}/><Metric title="Provider access" value={users.filter((item) => item.provider_status === 'approved' || item.role !== 'user').length} icon={UserRound}/></div>
    <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100"><div className="flex flex-col gap-3 border-b border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Platform accounts</h2><p className="mt-1 text-xs opacity-60">Up to 300 most recent accounts. Admin accounts can publish work without an application.</p></div><label className="relative block w-full sm:max-w-xs"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-45"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="input input-sm w-full pl-9"/></label></div>
      {loading ? <p className="p-8 text-center text-sm opacity-60">Loading accounts…</p> : users.length === 0 ? <p className="p-8 text-center text-sm opacity-60">No matching accounts.</p> : <div className="overflow-x-auto"><table className="table"><thead><tr><th>Account</th><th>Role</th><th>Provider access</th><th>Joined</th><th>Manage</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><div className="font-semibold">{item.full_name}</div><div className="text-xs opacity-60">{item.email}</div></td><td><span className="badge badge-ghost uppercase">{item.role}</span></td><td className="capitalize">{item.role !== 'user' ? 'Automatic' : item.provider_status ?? 'None'}</td><td className="whitespace-nowrap text-xs">{new Date(item.created_at).toLocaleDateString()}</td><td>{item.id === user?.id || item.role === 'superadmin' && !isSuperadmin ? <span className="text-xs opacity-45">Protected</span> : <div className="flex flex-wrap gap-2">{item.role !== 'user' && <button disabled={busy === item.id} onClick={() => void setRole(item, 'user')} className="btn btn-xs btn-outline">Revoke admin role</button>}{isSuperadmin && item.role === 'user' && <button disabled={busy === item.id} onClick={() => void setRole(item, 'admin')} className="btn btn-xs btn-outline">Make admin</button>}{isSuperadmin && <button disabled={busy === item.id} onClick={() => void deleteAccount(item)} className="btn btn-xs btn-outline btn-error" aria-label={`Delete ${item.full_name}`}><Trash2 size={13}/> Delete</button>}</div>}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof UsersRound }) {
  return <article className="flex min-h-28 items-center justify-between rounded-2xl border border-base-300 bg-base-100 p-4"><div><p className="text-xs opacity-60">{title}</p><p className="mt-2 font-serif text-3xl font-semibold">{value.toLocaleString()}</p></div><span className="rounded-xl bg-[#e6c34f]/15 p-3 text-[#a88417]"><Icon size={19}/></span></article>;
}
