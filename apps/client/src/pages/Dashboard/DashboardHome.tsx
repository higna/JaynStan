import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CheckCircle2, Compass, ImagePlus, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/api';
import AdminDashboardHome from './AdminDashboardHome';

type Application = { status: 'pending' | 'approved' | 'rejected'; review_note: string | null } | null;
type Work = { id: string; title: string; description: string; imageUrl: string; isFeatured: boolean };

export default function DashboardHome() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const panel = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const [application, setApplication] = useState<Application>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const [appResult, workResult] = await Promise.allSettled([
      apiRequest<Application>('/provider-applications/me', {}, token),
      apiRequest<Work[]>('/provider/works', {}, token),
    ]);
    if (appResult.status === 'fulfilled') setApplication(appResult.value);
    if (workResult.status === 'fulfilled') setWorks(workResult.value);
    setLoading(false);
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  if (user?.role === 'admin' || user?.role === 'superadmin') return <AdminDashboardHome />;
  if (!user) return null;

  const approved = application?.status === 'approved';
  const status = application?.status === 'approved' ? 'Approved' : application?.status === 'pending' ? 'In review' : application?.status === 'rejected' ? 'Update needed' : 'Not applied';
  const guidance = approved
    ? 'You can advertise work in the shared portfolio. Project enquiries are coordinated by the JaynStan team.'
    : application?.status === 'pending'
      ? 'Your details are with the team for review. We’ll update your application status here.'
      : application?.status === 'rejected'
        ? application.review_note || 'Review your details and submit an updated provider application.'
        : 'Apply with your name, phone number, and primary category. Once approved, you can add work to the public portfolio.';
  return <div className="w-full space-y-7">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/>
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full border border-white/15"/>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Your JaynStan workspace</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Welcome, {user.fullName.split(' ')[0]}.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white">See your account status, manage your shared portfolio, and keep your creative profile up to date.</p></div><Link to={approved ? '/dashboard/my-work' : '/dashboard/provider-application'} className="inline-flex items-center gap-2 self-start rounded-full bg-[#e6c34f] px-4 py-2.5 text-xs font-bold text-[#17170f] transition hover:bg-[#f0d56f] sm:self-auto">{approved ? 'Manage your work' : 'Provider application'}<ArrowUpRight size={15}/></Link></div>
    </header>

    <section aria-label="Account summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={BriefcaseBusiness} label="Provider application" value={loading ? '…' : status} hint="Application status" light={light}/>
      <Stat icon={ImagePlus} label="Advertised works" value={loading ? '…' : works.length.toLocaleString()} hint="Published portfolio items" light={light}/>
      <Stat icon={ShieldCheck} label="Account role" value="Staff" hint="JaynStan platform access" light={light}/>
      <Stat icon={CheckCircle2} label="Profile status" value={approved ? 'Active' : application?.status === 'pending' ? 'In review' : 'Getting started'} hint="Access to advertise work" light={light}/>
    </section>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
      <section className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${panel}`}><div className="flex items-start gap-3"><span className="rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]">{approved ? <CheckCircle2 size={19}/> : <ShieldCheck size={19}/>}</span><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">Creative profile</p><h2 className="mt-1 font-serif text-2xl">{approved ? 'You’re part of the collective.' : application?.status === 'pending' ? 'Your application is under review.' : 'Share your work with JaynStan.'}</h2></div></div><p className={`mt-3 text-sm leading-6 ${muted}`}>{guidance}</p><Link to={approved ? '/dashboard/my-work' : '/dashboard/provider-application'} className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a88417]">{approved ? 'Add or manage work' : application ? 'View application' : 'Start application'}<ArrowRight size={14}/></Link></section>
      <section className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${panel}`}><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">Explore JaynStan</p><h2 className="mt-1 font-serif text-2xl">Creative work, together.</h2><p className={`mt-2 text-sm leading-6 ${muted}`}>Browse the collective portfolio. The team coordinates every client enquiry and brings the right skills together.</p><Link to="/services" className={`mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold ${light ? 'border-base-300' : 'border-white/15'}`}><Compass size={15}/>Browse services</Link></section>
    </div>

    <section className="space-y-3"><div className="flex items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">Your portfolio</p><h2 className="mt-1 font-serif text-2xl">Recently shared work</h2></div>{approved && <Link to="/dashboard/my-work" className={`text-xs font-semibold ${muted}`}>View all<ArrowRight size={13} className="ml-1 inline"/></Link>}</div>
      {!approved ? <div className={`flex items-center gap-3 rounded-2xl border p-4 ${panel}`}><UsersRound size={19} className="text-[#a88417]"/><p className={`text-sm ${muted}`}>Your work list will be available once your provider application is approved.</p></div> : works.length === 0 ? <div className={`rounded-2xl border border-dashed p-7 text-center text-sm ${muted}`}>You haven’t published work yet. Add your first portfolio item when you’re ready.</div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{works.slice(0,3).map((work) => <article key={work.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${panel}`}><img src={work.imageUrl} alt="" className="size-16 shrink-0 rounded-xl object-cover"/><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{work.title}</h3><p className={`mt-1 line-clamp-2 text-xs ${muted}`}>{work.description}</p></div></article>)}</div>}
    </section>
  </div>;
}

function Stat({ icon: Icon, label, value, hint, light }: { icon: ComponentType<{ size?: number }>; label: string; value: string; hint: string; light: boolean }) {
  return <article className={`flex min-h-32 flex-col justify-between gap-4 rounded-2xl border p-4 shadow-sm sm:p-5 ${light ? 'border-base-content/10 bg-base-100' : 'border-white/10 bg-[#171813]'}`}><div className="flex items-start justify-between gap-3"><div><p className={`text-[11px] font-semibold uppercase tracking-wider ${light ? 'text-base-content/50' : 'text-white/50'}`}>{label}</p><p className="mt-2 text-2xl font-bold capitalize">{value}</p></div><span className="rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Icon size={19}/></span></div><p className={`text-xs ${light ? 'text-base-content/55' : 'text-white/55'}`}>{hint}</p></article>;
}
