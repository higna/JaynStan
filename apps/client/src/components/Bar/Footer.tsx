import { Link } from 'react-router';
import { Facebook, LockKeyhole, MessageCircle, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/api';

type Platform = 'facebook' | 'whatsapp' | 'twitter';
type SocialLink = { platform: Platform; url: string | null; enabled: boolean };
const icons = { facebook: Facebook, whatsapp: MessageCircle, twitter: Twitter };
const labels: Record<Platform, string> = { facebook: 'Facebook', whatsapp: 'WhatsApp', twitter: 'X / Twitter' };

export default function Footer() {
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const [links, setLinks] = useState<SocialLink[]>([]);
  useEffect(() => { apiRequest<SocialLink[]>('/site-settings/social-links').then(setLinks).catch(() => setLinks([])); }, []);

  return <footer className={`border-t bg-black py-5 text-white ${light ? 'border-base-300' : 'border-white/10'}`}>
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-8 lg:px-12">
      <div className="grid items-center gap-4 text-center md:grid-cols-3 md:text-left">
        <Link to="/" className="justify-self-center font-serif text-xl font-semibold tracking-wide md:justify-self-start">JAYNSTAN <span className="font-mono text-[10px] tracking-widest text-[#e6c34f]">ESPIRE</span></Link>
        <div className="flex items-center justify-center gap-3">{links.filter((link) => link.enabled && link.url).map((link) => { const Icon = icons[link.platform]; return <a key={link.platform} href={link.url!} target="_blank" rel="noopener noreferrer" aria-label={labels[link.platform]} title={labels[link.platform]} className="rounded-full border border-white/15 p-2.5 text-white/75 transition hover:border-[#e6c34f]/50 hover:text-[#e6c34f]"><Icon size={17} /></a>; })}</div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-white/65 md:justify-self-end"><Link to="/about" className="transition hover:text-[#e6c34f]">About</Link><Link to="/services" className="transition hover:text-[#e6c34f]">Services</Link><Link to="/login" className="inline-flex items-center gap-1 transition hover:text-[#e6c34f]"><LockKeyhole size={12} /> Staff login</Link></nav>
      </div>
      <div className="mt-3 text-center text-[11px] text-white/45"><p>© {new Date().getFullYear()}. All rights reserved.</p></div>
    </div>
  </footer>;
}
