import { useEffect, useState } from 'react';
import { Facebook, MessageCircle, Save, Twitter } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

type SocialPlatform = 'facebook' | 'whatsapp' | 'twitter';
type SocialLink = { platform: SocialPlatform; url: string | null; enabled: boolean };
const defaults: SocialLink[] = [
  { platform: 'facebook', url: '', enabled: false },
  { platform: 'whatsapp', url: '', enabled: false },
  { platform: 'twitter', url: '', enabled: false },
];
const labels: Record<SocialPlatform, string> = { facebook: 'Facebook', whatsapp: 'WhatsApp', twitter: 'X / Twitter' };
const icons = { facebook: Facebook, whatsapp: MessageCircle, twitter: Twitter };

export default function AdminSocialLinksPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const panel = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const field = light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white';
  const [links, setLinks] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest<SocialLink[]>('/admin/site-settings/social-links', {}, token)
      .then((saved) => setLinks(defaults.map((item) => saved.find((link) => link.platform === item.platform) ?? item)))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load social links.'))
      .finally(() => setLoading(false));
  }, [token]);

  function update(platform: SocialPlatform, change: Partial<SocialLink>) {
    setLinks((items) => items.map((item) => item.platform === platform ? { ...item, ...change } : item));
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await apiRequest<SocialLink[]>('/admin/site-settings/social-links', { method: 'PUT', body: JSON.stringify({ links }) }, token);
      setLinks(defaults.map((item) => updated.find((link) => link.platform === item.platform) ?? item));
      toast.success('Social links updated across JaynStan.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save social links.'); }
    finally { setSaving(false); }
  }

  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Public profile</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Social links</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white">Manage the social links shown in JaynStan’s shared footer. Disabled links stay hidden from visitors.</p></header>
    <section className="grid gap-3 sm:grid-cols-3">{links.map((link) => { const Icon = icons[link.platform]; return <article key={link.platform} className={`flex min-h-28 items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm ${panel}`}><div className="flex items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Icon size={18}/></span><div><p className={`text-[11px] font-semibold uppercase tracking-wider ${muted}`}>{labels[link.platform]}</p><p className="mt-1 text-sm font-semibold">{link.enabled && link.url ? 'Published' : 'Hidden'}</p></div></div></article>; })}</section>
    <section className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${panel}`}><div className="mb-5"><h2 className="font-serif text-2xl">Footer channels</h2><p className={`mt-1 text-xs ${muted}`}>Enter a complete HTTPS address and choose whether to show it publicly.</p></div><div className="grid gap-3">{links.map((link) => { const Icon = icons[link.platform]; return <article key={link.platform} className={`rounded-2xl border p-4 sm:p-5 ${light ? 'border-base-300' : 'border-white/10'}`}><div className="flex flex-wrap items-center gap-3"><span className="rounded-xl bg-[#a88417]/10 p-2.5 text-[#a88417]"><Icon size={18}/></span><div className="min-w-0 flex-1"><h3 className="font-semibold">{labels[link.platform]}</h3><p className={`text-xs ${muted}`}>Add a secure HTTPS URL</p></div><label className={`flex items-center gap-2 text-xs ${muted}`}><input type="checkbox" checked={link.enabled} onChange={(e) => update(link.platform, { enabled: e.target.checked })} className="checkbox checkbox-sm checkbox-warning"/>Show in footer</label></div><input type="url" pattern="https://.*" placeholder={link.platform === 'whatsapp' ? 'https://wa.me/...' : 'https://...'} value={link.url ?? ''} onChange={(e) => update(link.platform, { url: e.target.value })} className={`input mt-4 w-full ${field}`} /></article>; })}</div></section>
    <button disabled={loading || saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-6 py-3 text-sm font-bold text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50"><Save size={16}/>{saving ? 'Saving…' : 'Save social links'}</button>
  </div>;
}
