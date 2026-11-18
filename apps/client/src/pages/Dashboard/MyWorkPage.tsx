import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, BookOpen, ImagePlus, Layers3, Star, Trash2, Video, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { SERVICE_CATEGORIES, type ServiceCategoryId } from '../../domain/service-categories';
import { useTheme } from '../../context/ThemeContext';

type ContentType = 'project' | 'website' | 'pdf' | 'video' | 'writing' | 'event' | 'class';
type Work = { id: string; title: string; category: ServiceCategoryId; description: string; imageUrl: string; workUrl: string | null; contentType: ContentType; body: string | null; offer: string | null; startsAt: string | null; endsAt: string | null; isFeatured: boolean };
type Application = { status: 'pending' | 'approved' | 'rejected'; review_note: string | null } | null;
const initialForm = { title: '', category: 'graphic-design' as ServiceCategoryId, contentType: 'project' as ContentType, description: '', body: '', workUrl: '', offer: '', startsAt: '', endsAt: '' };
const contentLabels: Record<ContentType, string> = { project: 'Project', website: 'Website', pdf: 'PDF / moodboard', video: 'YouTube video', writing: 'Writing', event: 'Event / promotion', class: 'Class' };

export default function MyWorkPage() {
  const { token, user } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const surface = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const [application, setApplication] = useState<Application>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [applicationResult, workResult] = await Promise.all([
        apiRequest<Application>('/provider-applications/me', {}, token),
        apiRequest<Work[]>('/provider/works', {}, token),
      ]);
      setApplication(applicationResult); setWorks(workResult);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load your work.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !image) { toast.error('Choose a cover image for this work.'); return; }
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => { if (value) data.append(key, value); });
    data.append('image', image);
    setSaving(true);
    try {
      await apiRequest<Work>('/provider/works', { method: 'POST', body: data }, token);
      setForm(initialForm); setImage(null);
      const picker = document.getElementById('work-image') as HTMLInputElement | null;
      if (picker) picker.value = '';
      toast.success('Your work is now listed in the JaynStan portfolio.');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not publish this work.'); }
    finally { setSaving(false); }
  }

  async function remove(work: Work) {
    if (!token) return;
    try {
      await apiRequest(`/provider/works/${work.id}`, { method: 'DELETE' }, token);
      setWorks((items) => items.filter((item) => item.id !== work.id));
      toast.success('Work removed from the portfolio.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove work.'); }
  }

  if (loading) return <div className="py-20 text-center text-sm text-white/50">Loading your work…</div>;
  if (application?.status !== 'approved' && user?.role === 'user') return <div className="w-full space-y-6"><header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Collective portfolio</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Advertise your work</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white">Publishing access opens after your provider application is approved. Client enquiries remain with the JaynStan team.</p></header><section className={`rounded-3xl border p-6 sm:p-8 ${surface}`}><h2 className="font-serif text-2xl">Your work, shared by JaynStan.</h2><p className={`mt-3 max-w-2xl text-sm leading-6 ${muted}`}>Once approved, you can add projects, websites, PDFs, videos, writing, events, promotions, and classes to the shared portfolio.</p>{application?.status === 'pending' && <p className="mt-4 text-sm font-medium text-[#a88417]">Your application is being reviewed.</p>}{application?.status === 'rejected' && application.review_note && <p className="mt-4 text-sm text-red-500">Review note: {application.review_note}</p>}<Link to="/dashboard/provider-application" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#17170f]">{application?.status === 'pending' ? 'View application' : 'Apply to advertise'}<ArrowUpRight size={15}/></Link></section></div>;

  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><div className="relative flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Collective portfolio</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Advertise your work</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-white">Add projects, websites, PDFs, videos, writing, events, promotions, and classes to the shared portfolio. Client requests are handled by JaynStan.</p></div><a href="#add-work" className="inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-4 py-2.5 text-xs font-bold text-[#17170f]">Add a listing<ImagePlus size={15}/></a></div></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Portfolio summary"><WorkStat icon={Layers3} label="Published listings" value={works.length} light={light}/><WorkStat icon={Star} label="Featured works" value={works.filter((work) => work.isFeatured).length} light={light}/><WorkStat icon={Video} label="Content types" value={new Set(works.map((work) => work.contentType)).size} light={light}/><WorkStat icon={ImagePlus} label="Publishing access" value={user?.role === 'user' ? 'Approved' : 'Admin'} light={light}/></section>

    <form id="add-work" onSubmit={submit} className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${surface}`}>
      <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-3 text-[#a88417]"><ImagePlus size={19}/></span><div><h2 className="font-serif text-2xl">Create a listing</h2><p className={`text-xs ${muted}`}>Images are stored in Cloudinary. Link PDFs from Drive and videos from YouTube.</p></div></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 text-xs text-base-content/70"><span>Title</span><input required minLength={2} maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`input w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>
        <label className="space-y-1.5 text-xs text-base-content/70"><span>Category</span><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategoryId })} className={`select w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-[#20211b] text-white'}`}>{SERVICE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="space-y-1.5 text-xs text-base-content/70"><span>Content type</span><select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })} className={`select w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-[#20211b] text-white'}`}>{Object.entries(contentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-1.5 text-xs text-base-content/70"><span>Cover image</span><input id="work-image" required type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className={`file-input w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>
        <label className="space-y-1.5 text-xs text-base-content/70 sm:col-span-2 xl:col-span-4"><span>Summary</span><textarea required minLength={10} maxLength={3000} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`textarea w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>
        {['website', 'pdf', 'video'].includes(form.contentType) && <label className="space-y-1.5 text-xs text-base-content/70 sm:col-span-2 xl:col-span-4"><span>{form.contentType === 'website' ? 'Website URL' : form.contentType === 'pdf' ? 'Google Drive / Docs viewer URL' : 'YouTube URL'}</span><input required type="url" pattern="https://.*" value={form.workUrl} onChange={(e) => setForm({ ...form, workUrl: e.target.value })} className={`input w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} placeholder="https://..." /></label>}
        {['writing', 'event', 'class'].includes(form.contentType) && <label className="space-y-1.5 text-xs text-base-content/70 sm:col-span-2 xl:col-span-4"><span>{form.contentType === 'writing' ? 'Full content' : 'Details'}</span><textarea required={form.contentType === 'writing'} rows={5} maxLength={12000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={`textarea w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>}
        {form.contentType === 'event' && <><label className="space-y-1.5 text-xs text-base-content/70"><span>Promotion / offer label</span><input maxLength={120} value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} className={`input w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} placeholder="Early bird discount" /></label><label className="space-y-1.5 text-xs text-base-content/70"><span>Starts</span><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={`input w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label><label className="space-y-1.5 text-xs text-base-content/70"><span>Ends</span><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={`input w-full ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label></>}
      </div>
      <button disabled={saving} className="mt-6 rounded-full bg-[#e6c34f] px-6 py-3 text-sm font-bold text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50">{saving ? 'Publishing…' : 'Publish to portfolio'}</button>
    </form>

    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">Portfolio</p><h2 className="mt-1 font-serif text-2xl">Your published work</h2></div><span className={`text-xs ${muted}`}>{works.length} {works.length === 1 ? 'listing' : 'listings'}</span></div>
    {works.length === 0 ? <div className={`rounded-2xl border border-dashed p-10 text-center text-sm ${muted} ${light ? 'border-base-300' : 'border-white/15'}`}>You have not published any work yet. Add your first listing above.</div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{works.map((work) => <article key={work.id} className={`overflow-hidden rounded-2xl border shadow-sm ${surface}`}><div className="relative aspect-[2/1]"><img src={work.imageUrl} alt={work.title} className="h-full w-full object-cover"/><span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-bold uppercase text-white">{contentLabels[work.contentType]}</span></div><div className="p-4"><h3 className="truncate font-serif text-xl">{work.title}</h3><p className={`mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 ${muted}`}>{work.description}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="truncate text-[11px] font-medium text-[#a88417]">{work.isFeatured ? 'Featured on homepage' : 'In services portfolio'}</span><div className="flex shrink-0 gap-1.5">{work.workUrl && <a href={work.workUrl} target="_blank" rel="noreferrer" className={`rounded-full border p-2 transition hover:text-[#a88417] ${light ? 'border-base-300' : 'border-white/15'}`} aria-label="Open content"><BookOpen size={14}/></a>}<button type="button" onClick={() => void remove(work)} className={`rounded-full border p-2 transition hover:text-red-500 ${light ? 'border-base-300' : 'border-white/15'}`} aria-label={`Remove ${work.title}`}><Trash2 size={14}/></button></div></div></div></article>)}</div>}
  </div>;
}

function WorkStat({ icon: Icon, label, value, light }: { icon: LucideIcon; label: string; value: number | string; light: boolean }) {
  return <article className={`flex min-h-28 items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm sm:p-5 ${light ? 'border-base-content/10 bg-base-100' : 'border-white/10 bg-[#171813]'}`}><div className="min-w-0"><p className={`truncate text-[11px] font-semibold uppercase tracking-wider ${light ? 'text-base-content/50' : 'text-white/50'}`}>{label}</p><p className="mt-2 truncate text-2xl font-bold capitalize">{value}</p></div><span className="shrink-0 rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Icon size={19}/></span></article>;
}
