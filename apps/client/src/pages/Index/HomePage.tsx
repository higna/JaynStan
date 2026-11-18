import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, Code2, FolderKanban, Image, Layers3, MessageSquareText, Palette, Sparkles, Star, Workflow } from 'lucide-react';
import { Link } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { SERVICE_CATEGORIES } from '../../domain/service-categories';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/api';

const serviceIcons = [Code2, Image, Palette, Building2];
type FeaturedWork = { id: string; title: string; category: string; description: string; imageUrl: string; workUrl: string | null };
type HomepageStat = { key: string; label: string; value: string; unit: string };
const initialStats: HomepageStat[] = [
  { key: 'clients', label: 'Clients served', value: '100', unit: '+' },
  { key: 'satisfaction', label: 'Satisfaction rating', value: '98', unit: '%' },
  { key: 'disciplines', label: 'Creative disciplines', value: '4', unit: '' },
  { key: 'collective', label: 'Creative collective', value: '1', unit: '' },
];
export default function HomePage() {
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const page = light ? 'bg-base-100 text-base-content' : 'bg-[#0d0e0b] text-[#f4f1e8]';
  const muted = light ? 'text-base-content/65' : 'text-white/60';
  const band = light ? 'bg-base-200 border-y border-base-300' : 'bg-[#11120f] border-y border-white/[.07]';
  const card = light ? 'bg-base-100 border-base-300' : 'bg-[#171813] border-white/10';
  const [featuredWorks, setFeaturedWorks] = useState<FeaturedWork[]>([]);
  const featuredTrack = useRef<HTMLDivElement>(null);
  const [sliderPaused, setSliderPaused] = useState(false);
  const [stats, setStats] = useState<HomepageStat[]>(initialStats);
  function openSupport() { window.dispatchEvent(new Event('jaynstan:open-support')); }

  useEffect(() => {
    apiRequest<FeaturedWork[]>('/featured-works')
      .then(setFeaturedWorks)
      .catch(() => setFeaturedWorks([]));
  }, []);
  useEffect(() => {
    apiRequest<HomepageStat[]>('/site-settings/homepage-stats').then((items) => {
      if (items.length === 4) setStats(items);
    }).catch(() => setStats(initialStats));
  }, []);

  useEffect(() => {
    const track = featuredTrack.current;
    if (!track || featuredWorks.length < 2 || sliderPaused) return;
    const timer = window.setInterval(() => {
      const firstCard = track.querySelector<HTMLElement>('[data-feature-card]');
      if (!firstCard) return;
      const step = firstCard.offsetWidth + 16;
      const end = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft + step >= end - 8) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: step, behavior: 'smooth' });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [featuredWorks.length, sliderPaused]);

  return <div className={`overflow-hidden ${page}`}>
    <section className="relative flex min-h-[min(740px,76svh)] items-center overflow-hidden bg-black pb-10 pt-32">
      <img src="/Hero.png" alt="JaynStan creative collective" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
      <div className="relative mx-auto grid w-full max-w-screen-2xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-28">
        <div className="max-w-3xl">
          <p className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.28em] text-[#e6c34f] sm:text-[11px]"><span className="h-px w-9 bg-[#e6c34f]" /> JaynStan Espire Enclave</p>
          <h1 className="font-serif text-6xl font-medium leading-[.93] tracking-[-.035em] text-white sm:text-7xl lg:text-[94px]">Where ideas<br />find their <span className="italic text-[#e6c34f]">form.</span></h1>
          <p className="mt-7 max-w-xl text-sm leading-7 text-white/75 sm:text-base">A creative home for design, art, technology, and architecture. Find the expertise and inspiration to bring your next idea to life.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/services" className="inline-flex items-center gap-3 rounded-full bg-[#e6c34f] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#17170f] transition hover:bg-[#f0d56f]">Explore services <ArrowUpRight size={15} /></Link><Link to="/about" className="inline-flex items-center gap-3 rounded-full border border-white/40 bg-black/15 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:border-[#e6c34f] hover:text-[#e6c34f]">Our story</Link></div>
        </div>
        <aside className="hidden justify-self-end lg:block"><div className="w-[320px] rounded-3xl border border-white/20 bg-black/25 p-7 text-white shadow-2xl backdrop-blur-md"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#e6c34f]">A space for</p><div className="mt-5 space-y-4">{['Visual identity', 'Digital experiences', 'Art and expression', 'Architecture and space'].map((item, index) => <div key={item} className="flex items-center gap-3 border-b border-white/15 pb-4 last:border-0 last:pb-0"><span className="font-mono text-[10px] text-[#e6c34f]">0{index + 1}</span><span className="font-serif text-xl">{item}</span></div>)}</div><Link to="/services" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#e6c34f] transition hover:text-white">Find your discipline <ArrowRight size={14} /></Link></div></aside>
      </div>
      <div className="absolute bottom-0 right-0 hidden border-l border-t border-white/15 bg-black/35 px-7 py-5 text-white backdrop-blur md:block"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/45">Our creative fields</p><p className="mt-2 font-serif text-xl">Design · Art · Tech · Space</p></div>
    </section>

    <section className={band}><div className="mx-auto grid max-w-screen-2xl grid-cols-2 divide-x divide-current/10 px-5 py-7 sm:px-8 sm:py-9 md:grid-cols-4">{stats.map((stat) => <div key={stat.key} className="px-2 text-center sm:px-5"><p className="font-serif text-3xl text-[#a88417] sm:text-4xl">{stat.value}<span className="ml-0.5 text-2xl">{stat.unit}</span></p><p className={`mt-1 font-mono text-[8px] uppercase tracking-[.13em] sm:text-[10px] sm:tracking-[.18em] ${muted}`}>{stat.label}</p></div>)}</div></section>

    <section className={band}><div className="mx-auto max-w-screen-2xl px-5 py-20 sm:px-8 lg:py-24"><div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]">What we do</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Good work starts with a connection.</h2></div><Link to="/services" className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition hover:text-[#a88417] ${muted}`}>Browse all services <ArrowRight size={15} /></Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{SERVICE_CATEGORIES.map((item, index) => { const Icon = serviceIcons[index]; return <Link key={item.id} to={`/services?filter=${item.id}`} className={`group relative min-h-32 overflow-hidden rounded-2xl border p-3 transition hover:-translate-y-1 hover:border-[#c6a333]/60 sm:p-4 ${card}`}><span className={`absolute right-4 top-4 font-mono text-[10px] ${light ? 'text-base-content/30' : 'text-white/25'}`}>0{index + 1}</span><Icon size={18} className="text-[#a88417]" /><h3 className="mt-4 font-serif text-lg">{item.name}</h3><span className={`mt-2 inline-flex items-center gap-2 text-[11px] transition group-hover:text-[#a88417] ${muted}`}>Explore <ArrowUpRight size={13}/></span></Link>; })}</div>
    </div></section>

    <section className={`border-y px-5 py-20 sm:px-8 lg:py-24 ${light ? 'border-base-300 bg-base-100' : 'border-white/[.07] bg-[#0d0e0b]'}`}>
      <div className="mx-auto max-w-screen-2xl">
        <div className="mx-auto mb-12 max-w-2xl text-center"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]">A simple process</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">From first thought to finished work.</h2><p className={`mt-4 text-sm leading-7 ${muted}`}>Start with the idea. Our team helps shape the brief, bring the right skills together, and carry the work through.</p></div>
        <div className="grid gap-4 md:grid-cols-3">{[
          { icon: MessageSquareText, step: '01', title: 'Tell us what you need', copy: 'Share the idea, challenge, or opportunity you want to explore.' },
          { icon: Workflow, step: '02', title: 'We shape the brief', copy: 'We work out the right approach and bring together the disciplines your project calls for.' },
          { icon: Layers3, step: '03', title: 'The team brings it to life', copy: 'JaynStan coordinates the work from the first direction to the final delivery.' },
        ].map(({ icon: Icon, step, title, copy }) => <article key={step} className={`rounded-2xl border p-4 sm:p-5 ${card}`}><div className="flex items-center justify-between"><Icon size={22} className="text-[#a88417]" /><span className="font-mono text-xs text-[#a88417]">{step}</span></div><h3 className="mt-6 font-serif text-xl">{title}</h3><p className={`mt-3 text-sm leading-6 ${muted}`}>{copy}</p></article>)}</div>
      </div>
    </section>

    <section className="mx-auto max-w-screen-2xl px-5 py-20 sm:px-8 lg:py-24">
      <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]">Selected by JaynStan</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Featured works.</h2><p className={`mt-3 max-w-lg text-sm leading-6 ${muted}`}>A selection of up to six works chosen by our team to share with the community.</p></div><div className="flex items-center gap-4"><Link to="/services" className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition hover:text-[#a88417] ${muted}`}>Explore services <ArrowRight size={15} /></Link>{featuredWorks.length > 1 && <div className="flex gap-2"><button type="button" onClick={() => featuredTrack.current?.scrollBy({ left: -360, behavior: 'smooth' })} aria-label="Previous featured works" className={`rounded-full border p-2 transition hover:border-[#a88417] hover:text-[#a88417] ${light ? 'border-base-300' : 'border-white/15'}`}><ArrowLeft size={16} /></button><button type="button" onClick={() => featuredTrack.current?.scrollBy({ left: 360, behavior: 'smooth' })} aria-label="Next featured works" className={`rounded-full border p-2 transition hover:border-[#a88417] hover:text-[#a88417] ${light ? 'border-base-300' : 'border-white/15'}`}><ArrowRight size={16} /></button></div>}</div></div>
      {featuredWorks.length ? <div className="relative left-1/2 w-screen -translate-x-1/2" onMouseEnter={() => setSliderPaused(true)} onMouseLeave={() => setSliderPaused(false)} onFocus={() => setSliderPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSliderPaused(false); }}><div className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r ${light ? 'from-base-100' : 'from-[#0d0e0b]'} to-transparent sm:w-12`} /><div ref={featuredTrack} role="region" aria-label="Featured works slider" tabIndex={0} className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-4 sm:px-8 lg:px-12 [scrollbar-width:thin]">{featuredWorks.slice(0, 6).map((work) => { const category = SERVICE_CATEGORIES.find((item) => item.id === work.category); return <article data-feature-card key={work.id} className={`group w-[80%] shrink-0 snap-start overflow-hidden rounded-2xl border sm:w-[calc(44%-0.5rem)] lg:w-[calc(24%-0.75rem)] ${card}`}><div className="relative aspect-[2/1] overflow-hidden"><img src={work.imageUrl} alt={work.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/><span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white backdrop-blur">{category?.name ?? work.category}</span><span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#e6c34f] px-2.5 py-1.5 text-[9px] font-bold uppercase text-[#17170f]"><Star size={11} fill="currentColor"/>Featured</span></div><div className="p-4"><h3 className="truncate font-serif text-xl">{work.title}</h3><p className={`mt-1.5 line-clamp-2 min-h-10 text-xs leading-5 ${muted}`}>{work.description}</p>{work.workUrl && <a href={work.workUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#a88417]">View work <ArrowUpRight size={13}/></a>}</div></article>; })}</div><div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l ${light ? 'from-base-100' : 'from-[#0d0e0b]'} to-transparent sm:w-12`} /></div> : <div className={`rounded-2xl border border-dashed p-8 text-center sm:p-12 ${light ? 'border-base-content/20' : 'border-white/15'}`}><FolderKanban size={25} className="mx-auto text-[#a88417]" /><p className="mt-4 font-serif text-2xl">New work is on the way.</p><p className={`mt-2 text-sm ${muted}`}>The JaynStan team will feature selected work here.</p></div>}
    </section>

    <section className={band}>
      <div className="mx-auto grid max-w-screen-2xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-16 lg:py-24">
        <div><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]">More than a single format</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Good ideas can take many forms.</h2><p className={`mt-4 max-w-lg text-sm leading-7 ${muted}`}>Explore work across the collective, from visual pieces and digital projects to written work, events, and learning experiences.</p><Link to="/services" className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a88417] transition hover:gap-3">See all work <ArrowRight size={15} /></Link></div>
        <div className="grid gap-3 sm:grid-cols-2">{[
          { title: 'Visual work', copy: 'Identity, graphics, illustration, and art direction.' },
          { title: 'Digital projects', copy: 'Websites and digital experiences built around a clear purpose.' },
          { title: 'Words and ideas', copy: 'Writing and content shaped for people, brands, and communities.' },
          { title: 'Gather and learn', copy: 'Events, promotions, and classes shared by the collective.' },
        ].map((item, index) => <article key={item.title} className={`rounded-2xl border p-4 sm:p-5 ${card}`}><span className="font-mono text-[10px] text-[#a88417]">0{index + 1}</span><h3 className="mt-3 font-serif text-xl">{item.title}</h3><p className={`mt-2 text-sm leading-6 ${muted}`}>{item.copy}</p></article>)}</div>
      </div>
    </section>

    <section className="mx-auto grid max-w-screen-2xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-28"><div className="relative min-h-[340px] overflow-hidden rounded-3xl sm:min-h-[440px]"><img src="/Group.png" alt="JaynStan creative collective" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><span className="absolute bottom-5 left-6 font-mono text-[10px] uppercase tracking-[.2em] text-white/80">JaynStan · Espire Enclave</span></div><div><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]"><Sparkles size={14} /> More than a portfolio</p><h2 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">One team to take care of the full brief.</h2><p className={`mt-5 text-sm leading-7 ${muted}`}>Tell JaynStan what you are looking to make. We bring the right mix of disciplines together and coordinate the work as one team.</p><Link to="/about" className="mt-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a88417] transition hover:gap-3">Get to know JaynStan <ArrowRight size={15} /></Link></div></section>


  </div>;
}
