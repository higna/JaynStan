import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, ImagePlus, Pencil, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { SERVICE_CATEGORIES, type ServiceCategoryId } from '../../domain/service-categories';
import { useTheme } from '../../context/ThemeContext';

type ContentType = 'project' | 'website' | 'pdf' | 'video' | 'writing' | 'event' | 'class';
type Work = { id: string; title: string; category: ServiceCategoryId; description: string; imageUrl: string; workUrl: string | null; contentType: ContentType; body: string | null; offer: string | null; startsAt: string | null; endsAt: string | null; isFeatured: boolean };
type WorkForm = { title: string; category: ServiceCategoryId; contentType: ContentType; description: string; imageUrl: string; workUrl: string; body: string; offer: string; startsAt: string; endsAt: string };
const emptyForm: WorkForm = { title: '', category: 'graphic-design', contentType: 'project', description: '', imageUrl: '', workUrl: '', body: '', offer: '', startsAt: '', endsAt: '' };
const labels: Record<ContentType, string> = { project: 'Project', website: 'Website', pdf: 'PDF / moodboard', video: 'YouTube video', writing: 'Writing', event: 'Event / promotion', class: 'Class' };

export default function AdminFeaturedWorksPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const surface = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const fieldStyle = light ? 'border-base-300 bg-base-100 text-base-content focus:border-[#a88417]' : 'border-white/15 bg-white/[.04] text-white focus:border-[#e6c34f]';
  const [works, setWorks] = useState<Work[]>([]);
  const [form, setForm] = useState<WorkForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try { setWorks(await apiRequest<Work[]>('/admin/featured-works', {}, token)); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load portfolio content.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token) return;
    setSaving(true);
    const payload = { ...form, startsAt: form.startsAt || undefined, endsAt: form.endsAt || undefined, offer: form.offer || undefined, workUrl: form.workUrl || undefined, body: form.body || undefined };
    try {
      await apiRequest(editingId ? `/admin/featured-works/${editingId}` : '/admin/featured-works', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }, token);
      toast.success(editingId ? 'Portfolio content updated.' : 'Portfolio content added.');
      setForm(emptyForm); setEditingId(null); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save this portfolio content.'); }
    finally { setSaving(false); }
  }

  function edit(work: Work) {
    setEditingId(work.id);
    setForm({ title: work.title, category: work.category, contentType: work.contentType, description: work.description, imageUrl: work.imageUrl, workUrl: work.workUrl ?? '', body: work.body ?? '', offer: work.offer ?? '', startsAt: work.startsAt?.slice(0, 16) ?? '', endsAt: work.endsAt?.slice(0, 16) ?? '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function toggle(work: Work) {
    if (!token) return;
    try { await apiRequest(`/admin/featured-works/${work.id}`, { method: 'PATCH', body: JSON.stringify({ isFeatured: !work.isFeatured }) }, token); await load(); toast.success(work.isFeatured ? 'Removed from homepage features.' : 'Featured on the homepage.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not update feature status.'); }
  }

  async function remove(work: Work) {
    if (!token) return;
    try { await apiRequest(`/admin/featured-works/${work.id}`, { method: 'DELETE' }, token); setWorks((items) => items.filter((item) => item.id !== work.id)); toast.success('Portfolio content removed.'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove portfolio content.'); }
  }

  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><div className="relative flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Portfolio management</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Works & featured content</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-white">Manage the shared portfolio and choose up to six items for the homepage slider.</p></div><a href="#portfolio-form" className="rounded-full bg-[#e6c34f] px-4 py-2.5 text-xs font-bold text-[#17170f]">Add portfolio work</a></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><WorkStat label="Portfolio listings" value={works.length} light={light}/><WorkStat label="Featured on home" value={`${works.filter((work) => work.isFeatured).length} / 6`} light={light}/><WorkStat label="Available slots" value={Math.max(6 - works.filter((work) => work.isFeatured).length, 0)} light={light}/><WorkStat label="Content formats" value={new Set(works.map((work) => work.contentType)).size} light={light}/></section>

    <form id="portfolio-form" onSubmit={save} className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${surface}`}>
      <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-3 text-[#a88417]">{editingId ? <Pencil size={19} /> : <ImagePlus size={19} />}</span><div><h2 className="font-serif text-2xl">{editingId ? 'Edit portfolio content' : 'Add portfolio content'}</h2><p className={`text-xs ${muted}`}>Image URLs should point to Cloudinary. PDFs use Drive viewer links; videos use YouTube links.</p></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="ml-auto rounded-full p-2 opacity-60 hover:bg-base-200 hover:opacity-100" aria-label="Cancel editing"><X size={17} /></button>}</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="Title" light={light}><input required minLength={2} maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`input w-full ${fieldStyle}`} /></Field>
        <Field label="Discipline" light={light}><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategoryId })} className={`select w-full ${fieldStyle}`}>{SERVICE_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
        <Field label="Content type" light={light}><select value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value as ContentType })} className={`select w-full ${fieldStyle}`}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Cover image URL" light={light}><input required type="url" pattern="https://.*" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className={`input w-full ${fieldStyle}`} placeholder="https://res.cloudinary.com/..." /></Field>
        <Field label="Short summary" wide light={light}><textarea required minLength={10} maxLength={3000} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`textarea w-full ${fieldStyle}`} /></Field>
        {['website', 'pdf', 'video'].includes(form.contentType) && <Field label={form.contentType === 'website' ? 'Website URL' : form.contentType === 'pdf' ? 'Google Drive viewer URL' : 'YouTube URL'} wide light={light}><input required type="url" pattern="https://.*" value={form.workUrl} onChange={(e) => setForm({ ...form, workUrl: e.target.value })} className={`input w-full ${fieldStyle}`} /></Field>}
        {['writing', 'event', 'class'].includes(form.contentType) && <Field label={form.contentType === 'writing' ? 'Writing content' : 'Details'} wide light={light}><textarea required={form.contentType === 'writing'} maxLength={12000} rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={`textarea w-full ${fieldStyle}`} /></Field>}
        {form.contentType === 'event' && <><Field label="Offer / promotion label" light={light}><input maxLength={120} value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} className={`input w-full ${fieldStyle}`} placeholder="Early bird discount" /></Field><Field label="Starts" light={light}><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={`input w-full ${fieldStyle}`} /></Field><Field label="Ends" light={light}><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={`input w-full ${fieldStyle}`} /></Field></>}
      </div>
      <button disabled={saving} className="mt-6 rounded-full bg-[#e6c34f] px-6 py-3 text-sm font-bold text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50">{saving ? 'Savingâ€¦' : editingId ? 'Save changes' : 'Add to portfolio'}</button>
    </form>

    <div className="flex items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#a88417]">Portfolio library</p><h2 className="mt-1 font-serif text-2xl">All advertised work</h2></div><span className={`text-xs ${muted}`}>{works.filter((work) => work.isFeatured).length} of 6 homepage slots used</span></div>
    {loading ? <p className={`py-12 text-center text-sm ${muted}`}>Loading portfolio…</p> : works.length === 0 ? <div className={`rounded-2xl border border-dashed p-10 text-center text-sm ${muted} ${light ? 'border-base-300' : 'border-white/15'}`}>No portfolio content has been added.</div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{works.map((work) => <article key={work.id} className={`group overflow-hidden rounded-2xl border shadow-sm ${surface}`}><div className="relative aspect-[2/1] overflow-hidden"><img src={work.imageUrl} alt={work.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"/><span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white">{SERVICE_CATEGORIES.find((item) => item.id === work.category)?.name}</span><span className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1.5 text-[9px] font-bold uppercase text-white">{labels[work.contentType]}</span>{work.isFeatured && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#e6c34f] px-3 py-1.5 text-[10px] font-bold uppercase text-[#17170f]"><Star size={11} fill="currentColor"/>Homepage</span>}</div><div className="p-4"><h3 className="truncate font-serif text-xl">{work.title}</h3><p className={`mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 ${muted}`}>{work.description}</p><div className="mt-3 flex items-center gap-1.5"><button onClick={() => void toggle(work)} disabled={!work.isFeatured && works.filter((item) => item.isFeatured).length >= 6} className={`flex-1 rounded-full px-3 py-2 text-[11px] font-bold transition disabled:opacity-40 ${work.isFeatured ? light ? 'border border-base-300 text-base-content/70 hover:bg-base-200' : 'border border-white/15 text-white/70 hover:bg-white/5' : 'bg-[#e6c34f] text-[#17170f] hover:bg-[#f0d56f]'}`}>{work.isFeatured ? 'Unfeature' : 'Feature on homepage'}</button><button onClick={() => edit(work)} className={`rounded-full border p-2 transition hover:text-[#a88417] ${light ? 'border-base-300' : 'border-white/15'}`} aria-label={`Edit ${work.title}`}><Pencil size={14}/></button>{work.workUrl && <a href={work.workUrl} target="_blank" rel="noreferrer" className={`rounded-full border p-2 transition hover:text-[#a88417] ${light ? 'border-base-300' : 'border-white/15'}`} aria-label="Open destination"><ExternalLink size={14}/></a>}<button onClick={() => void remove(work)} className={`rounded-full border p-2 transition hover:text-red-500 ${light ? 'border-base-300' : 'border-white/15'}`} aria-label={`Delete ${work.title}`}><Trash2 size={14}/></button></div></div></article>)}</div>}  </div>;
}

function WorkStat({ label, value, light }: { label: string; value: number | string; light: boolean }) {
  return <article className={`flex min-h-28 items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm sm:p-5 ${light ? 'border-base-content/10 bg-base-100' : 'border-white/10 bg-[#171813]'}`}><div><p className={`text-[11px] font-semibold uppercase tracking-wider ${light ? 'text-base-content/50' : 'text-white/50'}`}>{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div><span className="rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Star size={18}/></span></article>;
}
function Field({ label, wide, light, children }: { label: string; wide?: boolean; light: boolean; children: React.ReactNode }) {
  return <label className={`space-y-1.5 text-xs ${light ? 'text-base-content/70' : 'text-white/65'} ${wide ? 'sm:col-span-2 xl:col-span-4' : ''}`}><span>{label}</span>{children}</label>;
}
