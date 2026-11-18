import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Activity, ArrowRight, ArrowUpRight, ChartNoAxesColumnIncreasing, Clock3, ImagePlus, RefreshCw, Settings2, Star, UserPlus, UsersRound, type LucideIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/api';

type Application = { id: string; full_name: string; email: string; category: string; created_at: string };
type Work = { id: string; title: string; imageUrl: string; category: string; isFeatured: boolean };

export default function AdminDashboardHome() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const panel = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const [applications, setApplications] = useState<Application[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(false);
    const [applicationResult, workResult] = await Promise.allSettled([
      apiRequest<Application[]>('/admin/provider-applications?status=pending', {}, token),
      apiRequest<Work[]>('/admin/featured-works', {}, token),
    ]);
    if (applicationResult.status === 'fulfilled') setApplications(applicationResult.value);
    if (workResult.status === 'fulfilled') setWorks(workResult.value);
    setLoadError(applicationResult.status === 'rejected' && workResult.status === 'rejected');
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const featuredCount = works.filter((work) => work.isFeatured).length;
  const recentApplications = [...applications].reverse().slice(0, 5);
  const stats = [
    { label: 'Pending applications', value: applications.length, hint: 'Waiting for team review', icon: UsersRound, to: '/dashboard/admin/provider-applications' },
    { label: 'Portfolio works', value: works.length, hint: 'Available on the services page', icon: ImagePlus, to: '/dashboard/admin/featured-works' },
    { label: 'Featured works', value: featuredCount, hint: 'Selected for the homepage', icon: Star, to: '/dashboard/admin/featured-works' },
    { label: 'Open feature slots', value: Math.max(6 - featuredCount, 0), hint: 'Homepage limit: six works', icon: ChartNoAxesColumnIncreasing, to: '/dashboard/admin/featured-works' },
  ];
  const quickActions = [
    { label: 'Review applications', note: 'Approve new creatives', icon: UsersRound, to: '/dashboard/admin/provider-applications' },
    { label: 'Manage portfolio', note: 'Add, edit, and feature work', icon: Star, to: '/dashboard/admin/featured-works' },
    { label: 'Invite a team member', note: 'Create a staff account', icon: UserPlus, to: '/dashboard/admin/accounts' },
    { label: 'Manage users', note: 'Roles and provider access', icon: UsersRound, to: '/dashboard/admin/users' },
    { label: 'Edit homepage content', note: 'Update stats and social links', icon: Settings2, to: '/dashboard/admin/homepage-stats' },
  ];

  return <div className="w-full space-y-7">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-white" />
      <div aria-hidden="true" className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-20 size-64 rounded-full border border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-1 -top-12 size-48 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#e6c34f]"><Activity size={15} /> JaynStan operations</p><h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl">Admin overview</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white">A clear view of the creative collective, the work it shares, and decisions waiting for the team.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[.06] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh overview</button>
      </div>
    </header>

    {loadError && <div role="alert" className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm ${light ? 'border-red-300 bg-red-50 text-red-900' : 'border-red-300/20 bg-red-300/[.05] text-red-100'}`}><span>Dashboard data could not be loaded. Check your connection and try again.</span><button type="button" onClick={() => void load()} className="font-semibold underline underline-offset-4">Try again</button></div>}

    <section aria-label="Platform totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => <AdminStatCard key={stat.label} {...stat} value={loading ? '—' : stat.value} light={light} />)}
    </section>

    <section className="space-y-3" aria-labelledby="admin-queue-heading">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a88417]">Team work</p><h2 id="admin-queue-heading" className="mt-1 text-lg font-semibold">Needs attention</h2></div><p className={`text-xs ${muted}`}>{loading ? 'Loading review queue…' : `${applications.length} ${applications.length === 1 ? 'application' : 'applications'} waiting`}</p></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {recentApplications.length === 0 ? <div className={`col-span-full flex items-center gap-3 rounded-2xl border p-4 ${panel}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${light ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-300/10 text-emerald-200'}`}><Clock3 size={19} /></span><div><p className="text-sm font-semibold">{loading ? 'Loading applications' : 'You’re all caught up'}</p><p className={`mt-0.5 text-xs ${muted}`}>{loading ? 'Checking for new provider applications.' : 'New provider applications will appear here.'}</p></div></div> : recentApplications.map((application) => <Link key={application.id} to="/dashboard/admin/provider-applications" className={`group flex min-h-28 items-center gap-3 rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${panel}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${light ? 'bg-amber-100 text-amber-800' : 'bg-amber-300/10 text-amber-200'}`}><UsersRound size={19} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{application.full_name}</span><span className={`mt-1 block truncate text-xs ${muted}`}>{application.category}</span></span><ArrowUpRight size={15} className={`shrink-0 ${muted} transition group-hover:text-[#a88417]`} /></Link>)}
      </div>
    </section>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]">
      <section className={`overflow-hidden rounded-3xl border shadow-sm ${panel}`}>
        <header className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6 ${light ? 'border-base-content/5 bg-base-200/30' : 'border-white/5 bg-white/[.02]'}`}><div><h2 className="text-sm font-semibold">Featured portfolio</h2><p className={`mt-0.5 text-xs ${muted}`}>Current homepage selections</p></div><Link to="/dashboard/admin/featured-works" className="inline-flex items-center gap-1 text-xs font-semibold text-[#a88417] hover:underline">Manage works <ArrowRight size={14} /></Link></header>
        {loading ? <p className={`p-6 text-sm ${muted}`}>Loading portfolio…</p> : featuredCount === 0 ? <div className="p-6"><p className={`text-sm ${muted}`}>No work is featured on the homepage yet.</p><Link to="/dashboard/admin/featured-works" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#a88417]">Choose featured works <ArrowRight size={13} /></Link></div> : <div className="grid gap-3 p-4 sm:grid-cols-2">{works.filter((work) => work.isFeatured).slice(0, 4).map((work) => <article key={work.id} className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 ${light ? 'border-base-content/10' : 'border-white/10'}`}><img src={work.imageUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" /><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{work.title}</h3><p className={`mt-1 truncate text-xs ${muted}`}>{work.category}</p></div><Star size={14} className="ml-auto shrink-0 fill-[#e6c34f] text-[#e6c34f]" /></article>)}</div>}
      </section>

      <section className={`overflow-hidden rounded-3xl border shadow-sm ${panel}`}>
        <header className={`border-b px-5 py-4 sm:px-6 ${light ? 'border-base-content/5 bg-base-200/30' : 'border-white/5 bg-white/[.02]'}`}><h2 className="text-sm font-semibold">Quick actions</h2><p className={`mt-0.5 text-xs ${muted}`}>Get to the work you do most often</p></header>
        <ul className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1">{quickActions.map(({ label, note, icon: Icon, to }) => <li key={label}><Link to={to} className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm transition ${light ? 'border-base-content/10 hover:border-[#a88417]/30 hover:bg-[#a88417]/[.04]' : 'border-white/10 hover:border-[#a88417]/30 hover:bg-white/[.03]'}`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#a88417]/10 text-[#a88417]"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">{label}</span><span className={`mt-0.5 block text-[10px] ${muted}`}>{note}</span></span><ArrowRight size={14} className={`shrink-0 ${muted} transition group-hover:translate-x-0.5 group-hover:text-[#a88417]`} /></Link></li>)}</ul>
      </section>
    </div>
  </div>;
}

function AdminStatCard({ icon: Icon, label, value, hint, to, light }: { icon: LucideIcon; label: string; value: number | string; hint: string; to: string; light: boolean }) {
  return <Link to={to} className={`group flex min-h-32 flex-col justify-between gap-5 rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${light ? 'border-base-content/10 bg-base-100 hover:border-[#a88417]/30' : 'border-white/10 bg-[#171813] hover:border-[#a88417]/40'}`}>
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className={`truncate text-[11px] font-semibold uppercase tracking-wider ${light ? 'text-base-content/50' : 'text-white/50'}`}>{label}</p><p className="mt-2 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{typeof value === 'number' ? value.toLocaleString() : value}</p></div><span className="shrink-0 rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"><Icon size={20} /></span></div>
    <div className="flex items-center justify-between gap-2 text-xs"><span className={`truncate ${light ? 'text-base-content/55' : 'text-white/55'}`}>{hint}</span><span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#a88417]">View<ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" /></span></div>
  </Link>;
}
