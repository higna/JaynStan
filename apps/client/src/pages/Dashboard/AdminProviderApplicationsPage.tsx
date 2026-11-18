import { useCallback, useEffect, useState } from 'react';
import { Check, Clock3, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { SERVICE_CATEGORIES, type ServiceCategoryId } from '../../domain/service-categories';
import { apiRequest } from '../../lib/api';

type Application = { id: string; user_id: string; full_name: string; email: string; phone: string; category: ServiceCategoryId; status: 'pending' | 'approved' | 'rejected'; created_at: string };

export default function AdminProviderApplicationsPage() {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const canReview = user?.role === 'admin' || user?.role === 'superadmin';
  const load = useCallback(async () => {
    if (!token || !canReview) return;
    setLoading(true);
    try { setApplications(await apiRequest<Application[]>('/admin/provider-applications', {}, token)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load applications.'); }
    finally { setLoading(false); }
  }, [token, canReview]);
  useEffect(() => { void load(); }, [load]);

  async function act(item: Application, action: 'approved' | 'rejected' | 'revoked') {
    if (!token) return;
    setBusyId(item.id);
    try {
      const endpoint = action === 'revoked' ? 'revoke' : 'review';
      await apiRequest(`/admin/provider-applications/${item.id}/${endpoint}`, { method: 'PATCH', body: JSON.stringify({ decision: action }) }, token);
      toast.success(action === 'approved' ? 'Provider approved.' : action === 'revoked' ? 'Provider access revoked.' : 'Application rejected.');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update application.'); }
    finally { setBusyId(''); }
  }

  if (!canReview) return <div className="rounded-2xl border border-white/10 bg-[#171813] p-8 text-sm text-white/60">You do not have access to application reviews.</div>;
  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Team access</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-3xl font-semibold sm:text-4xl">Provider applications</h1><p className="mt-2 text-sm text-white">Review applications and revoke provider access when needed.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold text-white"><RefreshCw size={14}/>Refresh</button></div></header>
    <div className="grid gap-3 sm:grid-cols-3"><Metric label="Total applications" value={applications.length}/><Metric label="Waiting for review" value={applications.filter((item) => item.status === 'pending').length}/><Metric label="Approved providers" value={applications.filter((item) => item.status === 'approved').length}/></div>
    <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"><header className="border-b border-base-300 px-4 py-4 sm:px-5"><h2 className="font-semibold">Applications register</h2><p className="mt-1 text-xs opacity-60">Review applicant details, approve access, or revoke a provider approval.</p></header>
      {loading ? <p className="p-10 text-center text-sm opacity-60">Loading applications…</p> : applications.length === 0 ? <div className="p-10 text-center"><Clock3 className="mx-auto text-[#a88417]" size={24}/><h3 className="mt-3 font-serif text-xl">No applications yet</h3><p className="mt-1 text-sm opacity-60">Provider applications will appear here.</p></div> : <div className="overflow-x-auto"><table className="table table-sm"><thead><tr><th>Applicant</th><th>Discipline</th><th>Phone</th><th>Submitted</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{applications.map((item) => <tr key={item.id}><td><div className="font-semibold">{item.full_name}</div><div className="text-xs opacity-60">{item.email}</div></td><td className="whitespace-nowrap">{SERVICE_CATEGORIES.find((category) => category.id === item.category)?.name ?? item.category}</td><td className="whitespace-nowrap">{item.phone}</td><td className="whitespace-nowrap text-xs">{new Date(item.created_at).toLocaleDateString()}</td><td><span className={`badge badge-sm capitalize ${item.status === 'approved' ? 'badge-success' : item.status === 'pending' ? 'badge-warning' : 'badge-ghost'}`}>{item.status}</span></td><td><div className="flex justify-end gap-2">{item.status === 'pending' && <><button disabled={busyId === item.id} onClick={() => void act(item, 'rejected')} className="btn btn-xs btn-outline"><X size={13}/>Reject</button><button disabled={busyId === item.id} onClick={() => void act(item, 'approved')} className="btn btn-xs bg-[#e6c34f] text-[#17170f] hover:bg-[#f0d56f]"><Check size={13}/>Approve</button></>}{item.status === 'approved' && <button disabled={busyId === item.id} onClick={() => void act(item, 'revoked')} className="btn btn-xs btn-outline text-error"><X size={13}/>Revoke access</button>}{item.status === 'rejected' && <span className="text-xs opacity-40">No action</span>}</div></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="flex min-h-28 items-center justify-between rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"><div><p className="text-[11px] font-semibold uppercase tracking-wider opacity-55">{label}</p><p className="mt-2 font-serif text-3xl font-semibold">{value}</p></div><Clock3 size={19} className="text-[#a88417]"/></article>;
}
