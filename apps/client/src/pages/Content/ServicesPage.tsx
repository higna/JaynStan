import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, BookText, Building2, CalendarDays, Code2, ExternalLink, GraduationCap, Image, Palette, PlayCircle, Search, SlidersHorizontal, X } from 'lucide-react';
import { SERVICE_CATEGORIES, type ServiceCategoryId } from '../../domain/service-categories';
import { apiRequest } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';

const serviceIcons = [Code2, Image, Palette, Building2];
const serviceDescriptions: Record<ServiceCategoryId, string> = {
  'software-development': 'Digital products and technical solutions shaped around your project.',
  'graphic-design': 'Visual identities, campaigns, and design systems with a clear point of view.',
  'artwork-painting': 'Original artwork and visual expression for spaces, stories, and brands.',
  architecture: 'Architectural and spatial thinking that brings purpose and character together.',
};
type ContentType = 'project' | 'website' | 'pdf' | 'video' | 'writing' | 'event' | 'class';
type Work = { id: string; title: string; category: ServiceCategoryId; description: string; imageUrl: string; workUrl: string | null; contentType: ContentType; body: string | null; offer: string | null; startsAt: string | null; endsAt: string | null };
const formats: Array<{ value: 'all' | ContentType; label: string }> = [
  { value: 'all', label: 'All work' }, { value: 'project', label: 'Projects' }, { value: 'website', label: 'Websites' },
  { value: 'pdf', label: 'PDFs' }, { value: 'video', label: 'Videos' }, { value: 'writing', label: 'Writing' },
  { value: 'event', label: 'Events & offers' }, { value: 'class', label: 'Classes' },
];
const formatLabels: Record<ContentType, string> = { project: 'Project', website: 'Website', pdf: 'PDF / moodboard', video: 'YouTube video', writing: 'Writing', event: 'Event / promotion', class: 'Class' };
const formatIcons: Record<ContentType, typeof ExternalLink> = { project: Image, website: ExternalLink, pdf: BookOpen, video: PlayCircle, writing: BookText, event: CalendarDays, class: GraduationCap };

function contactTeam(message: string) { window.dispatchEvent(new CustomEvent('jaynstan:open-support', { detail: { message } })); }

export default function ServicesPage() {
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const page = light ? 'bg-base-100 text-base-content' : 'bg-[#0d0e0b] text-[#f4f1e8]';
  const muted = light ? 'text-base-content/65' : 'text-white/60';
  const band = light ? 'bg-base-200 border-y border-base-300' : 'bg-[#11120f] border-y border-white/[.07]';
  const card = light ? 'bg-base-100 border-base-300' : 'bg-[#171813] border-white/10';
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ServiceCategoryId>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  useEffect(() => {
    apiRequest<Work[]>('/works').then(setWorks).catch(() => setWorks([])).finally(() => setLoading(false));
  }, []);

  const filteredWorks = useMemo(() => works.filter((work) =>
    (categoryFilter === 'all' || work.category === categoryFilter) &&
    (formatFilter === 'all' || work.contentType === formatFilter) &&
    (!searchQuery.trim() || `${work.title} ${work.description} ${work.category} ${work.body ?? ''}`.toLowerCase().includes(searchQuery.trim().toLowerCase())),
  ), [works, categoryFilter, formatFilter, searchQuery]);
  const hasActiveFilters = categoryFilter !== 'all' || formatFilter !== 'all' || searchQuery.trim() !== '';
  function clearFilters() { setCategoryFilter('all'); setFormatFilter('all'); setSearchQuery(''); }

  return <div className={`min-h-screen ${page}`}>
    <section className="relative flex min-h-[min(600px,65svh)] items-end overflow-hidden bg-black">
      <img src="/Group.png" alt="JaynStan creative collective" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/15" />
      <div className="relative mx-auto w-full max-w-screen-2xl px-5 pb-16 pt-24 sm:px-8 lg:pb-20"><p className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.28em] text-[#e6c34f]"><span className="h-px w-9 bg-[#e6c34f]" /> One team. Many disciplines.</p><h1 className="max-w-4xl font-serif text-6xl font-medium leading-[.94] text-white sm:text-7xl lg:text-8xl">A team for<br /><span className="italic text-[#e6c34f]">the whole brief.</span></h1><p className="mt-6 max-w-xl text-sm leading-7 text-white/75 sm:text-base">JaynStan brings diverse creative and technical skills together. Tell us what you need; the team will shape the right mix of services around it.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => contactTeam('Hello JaynStan, I would like to discuss a project.')} className="inline-flex items-center gap-3 rounded-full bg-[#e6c34f] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#17170f] transition hover:bg-[#f0d56f]">Tell us about your project <ArrowRight size={15} /></button><a href="#portfolio" className="inline-flex items-center gap-3 rounded-full border border-white/35 bg-black/15 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:border-[#e6c34f] hover:text-[#e6c34f]">Browse the portfolio</a></div></div>
      <div className="absolute bottom-0 right-0 hidden border-l border-t border-white/15 bg-black/35 px-7 py-5 text-white backdrop-blur md:block"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/50">Your single point of contact</p><p className="mt-2 font-serif text-xl">The JaynStan team.</p></div>
    </section>

    <section id="portfolio" className={band}><div className="mx-auto max-w-screen-2xl px-5 py-16 sm:px-8 lg:py-20"><div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]">The shared portfolio</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Work, ideas, and things happening.</h2><p className={`mt-3 max-w-2xl text-sm leading-6 ${muted}`}>Browse projects, websites, documents, videos, writing, events, promotions, and classes added by the JaynStan collective.</p></div><span className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>{filteredWorks.length} {filteredWorks.length === 1 ? 'item' : 'items'}</span></div>
      <div className={`sticky top-16 z-30 mb-7 rounded-2xl border p-3 shadow-lg backdrop-blur-xl sm:p-4 ${light ? 'border-base-300 bg-base-100/95' : 'border-white/10 bg-[#11120f]/95'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className={`flex min-h-11 flex-1 items-center gap-3 rounded-xl border px-3 ${light ? 'border-base-300 bg-base-200/60' : 'border-white/10 bg-white/[.04]'}`}><Search size={16} className={muted} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search the portfolio" aria-label="Search the portfolio" className="w-full bg-transparent text-sm outline-none placeholder:text-current/40" />{searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="rounded-full p-1 opacity-60 hover:opacity-100"><X size={14} /></button>}</label>
          <span className={`flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-wider ${muted}`}><SlidersHorizontal size={14} /> Filter work</span>
          {hasActiveFilters && <button type="button" onClick={clearFilters} className="shrink-0 rounded-full border border-current/15 px-3 py-2 text-[11px] font-semibold transition hover:border-[#a88417]/50 hover:text-[#a88417]">Clear filters</button>}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by discipline">{[{ id: 'all', name: 'All disciplines' }, ...SERVICE_CATEGORIES].map((item) => <button key={item.id} aria-pressed={categoryFilter === item.id} onClick={() => setCategoryFilter(item.id as 'all' | ServiceCategoryId)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${categoryFilter === item.id ? 'bg-[#e6c34f] text-[#17170f]' : light ? 'bg-base-200 text-base-content/70 hover:bg-base-300' : 'bg-white/[.06] text-white/65 hover:bg-white/10'}`}>{item.name}</button>)}</div>
        <div className="mt-1 flex gap-2 overflow-x-auto pb-1" aria-label="Filter by format">{formats.map((item) => <button key={item.value} aria-pressed={formatFilter === item.value} onClick={() => setFormatFilter(item.value)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${formatFilter === item.value ? 'border border-[#a88417]/30 bg-[#a88417]/10 text-[#a88417]' : `${muted} hover:bg-black/5`}`}>{item.label}</button>)}</div>
        <p className={`mt-2 px-1 text-[11px] ${muted}`} aria-live="polite">Showing {filteredWorks.length} of {works.length} {works.length === 1 ? 'item' : 'items'}</p>
      </div>

      {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className={`animate-pulse overflow-hidden rounded-2xl border ${card}`}><div className="aspect-[2/1] bg-current/10"/><div className="space-y-3 p-4"><div className="h-4 w-2/3 rounded bg-current/10"/><div className="h-3 w-full rounded bg-current/10"/></div></div>)}</div>
        : filteredWorks.length === 0 ? <div className={`rounded-2xl border border-dashed p-10 text-center ${light ? 'border-base-content/20' : 'border-white/15'}`}><Image size={24} className="mx-auto text-[#a88417]" /><p className="mt-4 font-serif text-2xl">{works.length ? 'No items match these filters.' : 'The portfolio is being prepared.'}</p><p className={`mt-2 text-sm ${muted}`}>If you have a project in mind, contact the JaynStan team.</p><button onClick={() => contactTeam('Hello JaynStan, I would like to discuss a project.')} className="mt-5 text-xs font-bold uppercase tracking-wider text-[#a88417]">Talk to JaynStan <ArrowRight size={14} className="ml-1 inline" /></button></div>
        : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{filteredWorks.map((work) => { const Icon = formatIcons[work.contentType]; const category = SERVICE_CATEGORIES.find((item) => item.id === work.category)?.name ?? work.category; const hasDetails = ['writing', 'event', 'class'].includes(work.contentType); return <article key={work.id} className={`group overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 hover:border-[#c6a333]/50 ${card}`}><div className="relative aspect-[2/1] overflow-hidden"><img src={work.imageUrl} alt={work.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/><span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white backdrop-blur">{category}</span><span className="absolute right-3 top-3 rounded-full bg-black/65 p-2 text-white" title={formatLabels[work.contentType]}><Icon size={14}/></span>{work.offer && <span className="absolute bottom-3 left-3 rounded-full bg-[#e6c34f] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#17170f]">{work.offer}</span>}</div><div className="p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-[#a88417]">{formatLabels[work.contentType]}{work.startsAt ? ` · ${new Date(work.startsAt).toLocaleDateString()}` : ''}</p><h3 className="mt-1.5 truncate font-serif text-xl">{work.title}</h3><p className={`mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 ${muted}`}>{work.description}</p><div className="mt-3 flex items-center justify-between gap-2">{hasDetails ? <button onClick={() => setSelectedWork(work)} className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#a88417]">View details <ArrowRight size={13}/></button> : work.workUrl ? <a href={work.workUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#a88417]">{work.contentType === 'pdf' ? 'Open in Google Drive' : work.contentType === 'video' ? 'Watch on YouTube' : 'Visit website'}<ExternalLink size={13}/></a> : <span className={`text-[11px] ${muted}`}>JaynStan portfolio</span>}<button onClick={() => contactTeam(`Hello JaynStan, I’m interested in “${work.title}”.`)} className={`rounded-full border p-2 transition hover:border-[#a88417]/50 hover:text-[#a88417] ${light ? 'border-base-content/15' : 'border-white/15'}`} aria-label={`Contact JaynStan about ${work.title}`}><ArrowUpRight size={14}/></button></div></div></article>; })}</div>}
    </div></section>

    {selectedWork && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedWork(null)}><section role="dialog" aria-modal="true" aria-labelledby="work-dialog-title" onClick={(event) => event.stopPropagation()} className={`relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-6 shadow-2xl sm:p-8 ${light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/10 bg-[#151611] text-[#f4f1e8]'}`}><button onClick={() => setSelectedWork(null)} aria-label="Close details" className="absolute right-4 top-4 rounded-full p-2 opacity-60 hover:bg-black/5 hover:opacity-100"><X size={18} /></button><img src={selectedWork.imageUrl} alt="" className="mb-6 aspect-[16/8] w-full rounded-2xl object-cover" /><p className="font-mono text-[10px] uppercase tracking-wider text-[#a88417]">{formatLabels[selectedWork.contentType]}{selectedWork.offer ? ` · ${selectedWork.offer}` : ''}</p><h2 id="work-dialog-title" className="mt-2 font-serif text-3xl">{selectedWork.title}</h2><p className={`mt-3 text-sm leading-6 ${muted}`}>{selectedWork.description}</p>{selectedWork.body && <div className={`mt-5 whitespace-pre-wrap border-t border-current/10 pt-5 text-sm leading-7 ${muted}`}>{selectedWork.body}</div>}{selectedWork.startsAt && <p className="mt-5 text-sm">Starts {new Date(selectedWork.startsAt).toLocaleString()}{selectedWork.endsAt ? ` · Ends ${new Date(selectedWork.endsAt).toLocaleString()}` : ''}</p>}<button onClick={() => contactTeam(`Hello JaynStan, I would like to know more about “${selectedWork.title}”.`)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#17170f]">Ask JaynStan <ArrowRight size={14} /></button></section></div>}
  </div>;
}
