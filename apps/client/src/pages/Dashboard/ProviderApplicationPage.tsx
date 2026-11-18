import { useEffect, useState, type FormEvent, type ComponentType } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CheckCircle2, Clock3, FileText, Phone, ShieldCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SERVICE_CATEGORIES, type ServiceCategoryId } from '../../domain/service-categories';

type Application = { id: string; full_name: string; phone: string; category: ServiceCategoryId; status: 'pending' | 'approved' | 'rejected'; review_note: string | null; created_at: string };

export default function ProviderApplicationPage() {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const surface = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const [application, setApplication] = useState<Application | null>(null);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [category, setCategory] = useState<ServiceCategoryId>('software-development');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest<Application | null>('/provider-applications/me', {}, token)
      .then((result) => {
        setApplication(result);
        if (result) { setFullName(result.full_name); setPhone(result.phone); setCategory(result.category); }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load your application.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const result = await apiRequest<Application>('/provider-applications', { method: 'POST', body: JSON.stringify({ fullName, phone, category }) }, token);
      setApplication(result);
      toast.success('Your application has been submitted for review.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not submit your application.'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="grid min-h-56 place-items-center text-sm opacity-60">Loading your application…</div>;
  const status = application?.status ?? 'not-applied';
  const categoryName = application ? categoryLabel(application.category) : 'Choose a category';
  const submitted = application ? new Date(application.created_at).toLocaleDateString() : 'Not submitted';
  const statusText = status === 'approved' ? 'Approved' : status === 'pending' ? 'In review' : status === 'rejected' ? 'Needs update' : 'Not applied';
  const statusIcon = status === 'approved' ? CheckCircle2 : status === 'pending' ? Clock3 : status === 'rejected' ? XCircle : FileText;
  const nextStep = status === 'approved' ? 'Publish your work' : status === 'pending' ? 'Wait for review' : status === 'rejected' ? 'Update and resubmit' : 'Complete the form';

  return <div className="w-full space-y-7">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><div className="relative flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Creative onboarding</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Provider application</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white">Apply to advertise your work in the shared JaynStan portfolio. Our team reviews applications before publishing access is enabled.</p></div>{status === 'approved' && <Link to="/dashboard/my-work" className="inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-4 py-2.5 text-xs font-bold text-[#17170f]">Manage your work<ArrowUpRight size={15}/></Link>}</div></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Application summary">
      <Summary icon={statusIcon} label="Application status" value={statusText} hint="Current review stage" light={light}/>
      <Summary icon={BriefcaseBusiness} label="Primary category" value={categoryName} hint="Your selected discipline" light={light}/>
      <Summary icon={Phone} label="Contact number" value={application?.phone ?? 'Add your number'} hint="Used by the JaynStan team" light={light}/>
      <Summary icon={ShieldCheck} label="Next step" value={nextStep} hint="What happens from here" light={light}/>
    </section>

    {status === 'approved' ? <section className={`rounded-3xl border p-6 sm:p-8 ${surface}`}><div className="flex items-start gap-3"><CheckCircle2 size={22} className="mt-1 text-emerald-600"/><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">You’re approved</p><h2 className="mt-1 font-serif text-2xl">Your creative profile is ready.</h2><p className={`mt-2 text-sm leading-6 ${muted}`}>You can now publish projects, websites, PDFs, videos, writing, events, and classes. Client enquiries continue to come through the JaynStan team.</p><Link to="/dashboard/my-work" className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-5 py-3 text-xs font-bold text-[#17170f]">Add or manage work<ArrowRight size={14}/></Link></div></div></section> : status === 'pending' ? <section className={`rounded-3xl border p-6 sm:p-8 ${surface}`}><div className="flex items-start gap-3"><Clock3 size={22} className="mt-1 text-[#a88417]"/><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">Under review</p><h2 className="mt-1 font-serif text-2xl">Your application is with the team.</h2><p className={`mt-2 text-sm leading-6 ${muted}`}>Submitted {submitted} for {categoryName}. We’ll update this page after an administrator reviews your details.</p></div></div></section> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
      <form onSubmit={submit} className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${surface}`}><div className="mb-6 flex items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-3 text-[#a88417]"><BriefcaseBusiness size={20}/></span><div><h2 className="font-serif text-2xl font-semibold">Your application details</h2><p className={`text-xs ${muted}`}>Share how you contribute to the collective.</p></div></div>
        {status === 'rejected' && <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/[.06] p-4 text-sm"><p className="font-semibold text-red-600">Your previous application needs an update.</p>{application?.review_note && <p className={`mt-1 ${muted}`}>{application.review_note}</p>}<p className={`mt-2 text-xs ${muted}`}>Update the details below and submit again.</p></div>}
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name"><input required minLength={2} maxLength={160} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="input w-full"/></Field><Field label="Phone number"><input required minLength={7} maxLength={40} type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="input w-full"/></Field><Field label="Primary service category" className="sm:col-span-2"><select value={category} onChange={(event) => setCategory(event.target.value as ServiceCategoryId)} className="select w-full">{SERVICE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div>
        <button disabled={submitting} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-6 py-3 text-sm font-bold text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50">{submitting ? 'Submitting…' : status === 'rejected' ? 'Resubmit application' : 'Submit for review'}<ArrowRight size={15}/></button>
      </form>
      <aside className={`rounded-3xl border p-5 sm:p-6 ${surface}`}><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">How review works</p><h2 className="mt-1 font-serif text-2xl">A clear path to publish.</h2><ol className="mt-5 space-y-4">{[['01','Send your details','Tell us your name, number, and primary discipline.'],['02','Team review','An administrator checks your application.'],['03','Share your work','Once approved, add work to the collective portfolio.']].map(([number,title,copy]) => <li key={number} className="flex gap-3"><span className="font-mono text-xs text-[#a88417]">{number}</span><div><h3 className="text-sm font-semibold">{title}</h3><p className={`mt-1 text-xs leading-5 ${muted}`}>{copy}</p></div></li>)}</ol><p className={`mt-5 border-t pt-4 text-xs leading-5 ${muted} ${light ? 'border-base-300' : 'border-white/10'}`}>All client requests are handled by JaynStan as a team. Your listing helps clients discover the collective’s work.</p></aside>
    </div>}
  </div>;
}

function Summary({ icon: Icon, label, value, hint, light }: { icon: ComponentType<{ size?: number }>; label: string; value: string; hint: string; light: boolean }) {
  return <article className={`flex min-h-32 flex-col justify-between gap-4 rounded-2xl border p-4 shadow-sm sm:p-5 ${light ? 'border-base-content/10 bg-base-100' : 'border-white/10 bg-[#171813]'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className={`text-[11px] font-semibold uppercase tracking-wider ${light ? 'text-base-content/50' : 'text-white/50'}`}>{label}</p><p className="mt-2 truncate text-lg font-bold sm:text-xl">{value}</p></div><span className="shrink-0 rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Icon size={19}/></span></div><p className={`text-xs ${light ? 'text-base-content/55' : 'text-white/55'}`}>{hint}</p></article>;
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`space-y-2 text-sm ${className}`}><span className="font-medium">{label}</span>{children}</label>;
}

function categoryLabel(category: ServiceCategoryId) { return SERVICE_CATEGORIES.find((item) => item.id === category)?.name ?? category; }
