import { ArrowRight, ArrowUpRight, Building2, Code2, Heart, Image, Palette, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router';
import { SERVICE_CATEGORIES } from '../../domain/service-categories';
import { useTheme } from '../../context/ThemeContext';

const team = [
  { role: 'Creative Director', image: '/Creative Director.png', number: '01', focus: 'Creative direction' },
  { role: 'Art & Architectural Design Director', image: '/Art Director.png', number: '02', focus: 'Art and spaces' },
  { role: 'Chief Technical Director', image: '/Technical Director.png', number: '03', focus: 'Technology' },
];
const categoryIcons = [Code2, Image, Palette, Building2];

export default function AboutPage() {
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const page = light ? 'bg-base-100 text-base-content' : 'bg-[#0d0e0b] text-[#f4f1e8]';
  const muted = light ? 'text-base-content/65' : 'text-white/60';
  const band = light ? 'border-y border-base-300 bg-base-200' : 'border-y border-white/[.07] bg-[#11120f]';
  const card = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#151611]';
  function openSupport() { window.dispatchEvent(new Event('jaynstan:open-support')); }

  return <div className={`min-h-screen ${page}`}>
    <section className="relative flex min-h-[min(680px,75svh)] items-end overflow-hidden bg-black">
      <img src="/Group.png" alt="JaynStan creative collective" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
      <div className="relative mx-auto w-full max-w-screen-2xl px-5 pb-16 pt-24 sm:px-8 sm:pb-20"><p className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.28em] text-[#e6c34f]"><span className="h-px w-9 bg-[#e6c34f]" /> The story of JaynStan</p><h1 className="max-w-4xl font-serif text-6xl font-medium leading-[.94] text-white sm:text-7xl lg:text-8xl">Creative thinking.<br /><span className="italic text-[#e6c34f]">Shared vision.</span></h1><p className="mt-6 max-w-xl text-sm leading-7 text-white/75 sm:text-base">JaynStan Espire Enclave brings art, design, architecture, and technology together to make ideas real.</p><Link to="/services" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#e6c34f] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#17170f] transition hover:bg-[#f0d56f]">Explore our services <ArrowUpRight size={15} /></Link></div>
      <div className="absolute bottom-0 right-0 hidden border-l border-t border-white/15 bg-black/40 px-7 py-5 text-white backdrop-blur md:block"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-white/55">Our approach</p><p className="mt-2 font-serif text-xl">Curiosity, craft, collaboration.</p></div>
    </section>

    <section className="mx-auto grid max-w-screen-2xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20 lg:py-28">
      <div className={`relative min-h-[300px] overflow-hidden rounded-3xl border sm:min-h-[400px] ${light ? 'border-base-300 bg-base-200' : 'border-white/10 bg-[#171813]'}`}><img src="/Founders.png" alt="JaynStan founders" className="absolute inset-0 h-full w-full object-cover object-[50%_10%]" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" /><p className="absolute bottom-5 left-6 font-mono text-[10px] uppercase tracking-[.2em] text-white/80">JaynStan Espire Enclave</p></div>
      <div><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]"><Heart size={14} /> What brings us together</p><h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">A shared home for creative disciplines.</h2><p className={`mt-6 text-sm leading-7 ${muted}`}>We believe the strongest ideas happen when different perspectives meet. JaynStan is a place for makers and problem solvers to share their work, connect with people who need their skills, and grow through collaboration.</p><p className={`mt-4 text-sm leading-7 ${muted}`}>From visual identity and artwork to digital products and architecture, we make room for craft and thoughtful experimentation.</p><div className="mt-8 grid grid-cols-2 gap-3">{['Make with intention', 'Learn from each other', 'Stay curious', 'Build together'].map((item, index) => <div key={item} className={`flex items-center gap-3 rounded-xl border p-3 text-xs ${light ? 'border-base-300 bg-base-200 text-base-content/75' : 'border-white/10 bg-white/[.025] text-white/75'}`}><span className="font-mono text-[#a88417]">0{index + 1}</span>{item}</div>)}</div></div>
    </section>

    <section className={band}><div className="mx-auto max-w-screen-2xl px-5 py-20 sm:px-8 lg:py-28"><div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]"><Users size={14} /> Our creative minds</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">The people behind the ideas.</h2></div><p className={`max-w-md text-sm leading-6 ${muted}`}>Different disciplines, one collaborative spirit. Get to know the team shaping the work.</p></div>
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">{team.map((member) => <article key={member.number} className={`group relative aspect-square overflow-hidden rounded-2xl border ${light ? 'border-base-300 bg-base-300' : 'border-white/10 bg-[#191a15]'}`}><img src={member.image} alt={member.role} className="h-full w-full object-cover object-[50%_15%] transition duration-700 group-hover:scale-[1.035]" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/10" /><p className="absolute left-5 top-5 font-mono text-xs tracking-widest text-white/75">/{member.number}</p><div className="absolute inset-x-5 bottom-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#e6c34f]">{member.focus}</p><h3 className="mt-2 font-serif text-2xl text-white sm:text-3xl">{member.role}</h3></div></article>)}</div>
    </div></section>

    <section className="mx-auto max-w-screen-2xl px-5 py-20 sm:px-8 lg:py-28"><div className="mb-9"><p className="font-mono text-[10px] uppercase tracking-[.24em] text-[#a88417]">What we bring together</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Many ways to make an impact.</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{SERVICE_CATEGORIES.map((category, index) => { const Icon = categoryIcons[index]; return <Link key={category.id} to={`/services?filter=${category.id}`} className={`group rounded-2xl border p-4 transition hover:-translate-y-1 hover:border-[#c6a333]/60 ${card}`}><Icon size={20} className="text-[#a88417]" /><h3 className="mt-5 font-serif text-lg">{category.name}</h3><span className={`mt-3 inline-flex items-center gap-2 text-xs transition group-hover:text-[#a88417] ${muted}`}>Discover <ArrowRight size={14} /></span></Link>; })}</div></section>

    <section className={band}><div className="mx-auto flex max-w-screen-2xl flex-col items-start justify-between gap-5 px-5 py-12 sm:flex-row sm:items-center sm:px-8"><div><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#a88417]">Grow with the collective</p><h2 className="mt-2 font-serif text-3xl">Interested in becoming a creative partner?</h2><p className={`mt-2 max-w-2xl text-sm leading-6 ${muted}`}>Tell us about your practice and how you would like to collaborate with JaynStan.</p></div><Link to="/contact?subject=partnership" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e6c34f] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#17170f] transition hover:bg-[#f0d56f]">Talk partnership <ArrowRight size={14} /></Link></div></section>

    <section id="contact" className="relative isolate overflow-hidden border-t px-5 py-20 text-center text-white sm:px-8 lg:py-28"><img src="/Divider.png" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" /><div className="absolute inset-0 -z-10 bg-black/65" /><div className="relative mx-auto max-w-2xl"><Sparkles size={22} className="mx-auto text-[#e6c34f]" /><h2 className="mt-4 font-serif text-4xl sm:text-5xl">Let?s talk about what you?re making.</h2><p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/75">Have a question, a project in mind, or need a hand? Our support team is one message away.</p><button type="button" onClick={openSupport} className="mt-7 inline-flex items-center gap-3 rounded-full bg-[#e6c34f] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#17170f] transition hover:bg-[#f0d56f]">Talk to our team <ArrowRight size={15} /></button></div></section>
  </div>;
}
