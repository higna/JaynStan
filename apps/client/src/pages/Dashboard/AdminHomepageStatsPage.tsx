import { useEffect, useState } from 'react';
import { ChartNoAxesColumnIncreasing, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

type Stat = { key: string; label: string; value: string; unit: string };
const defaults: Stat[] = [
  { key: 'clients', label: 'Clients served', value: '100', unit: '+' },
  { key: 'satisfaction', label: 'Satisfaction rating', value: '98', unit: '%' },
  { key: 'disciplines', label: 'Creative disciplines', value: '4', unit: '' },
  { key: 'collective', label: 'Creative collective', value: '1', unit: '' },
];

export default function AdminHomepageStatsPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const panel = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const field = light ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/15 bg-white/[.04] text-white';
  const [stats, setStats] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiRequest<Stat[]>('/admin/site-settings/homepage-stats', {}, token)
      .then((items) => { if (items.length === 4) setStats(items); })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load homepage stats.'))
      .finally(() => setLoading(false));
  }, [token]);

  function update(key: string, values: Partial<Stat>) {
    setStats((items) => items.map((item) => item.key === key ? { ...item, ...values } : item));
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      const result = await apiRequest<Stat[]>('/admin/site-settings/homepage-stats', { method: 'PUT', body: JSON.stringify({ stats }) }, token);
      setStats(result);
      toast.success('Homepage statistics updated.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save homepage stats.'); }
    finally { setSaving(false); }
  }

  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Homepage content</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Homepage statistics</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white">Edit the four public stat cards. Figures and units remain separate for formats like 100 + and 98 %.</p></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Homepage stat preview">{stats.map((stat) => <article key={stat.key} className={`min-h-28 rounded-2xl border p-4 shadow-sm ${panel}`}><p className={`text-xs font-medium ${muted}`}>{stat.label}</p><p className="mt-2 font-serif text-3xl font-semibold">{stat.value}<span className="ml-1 text-lg text-[#a88417]">{stat.unit}</span></p></article>)}</section>
    <section className={`rounded-3xl border p-5 shadow-sm sm:p-7 ${panel}`}><div className="mb-5"><h2 className="font-serif text-2xl">Edit the four cards</h2><p className={`mt-1 text-xs ${muted}`}>Keep each figure concise so the cards stay balanced on the homepage.</p></div><div className="grid gap-3 xl:grid-cols-2">{stats.map((stat, index) => <article key={stat.key} className={`rounded-2xl border p-4 sm:p-5 ${light ? 'border-base-300' : 'border-white/10'}`}><div className="mb-4 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#a88417]/10 text-[#a88417]"><ChartNoAxesColumnIncreasing size={17}/></span><div><p className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>Card 0{index + 1}</p><h3 className="font-semibold">{stat.key}</h3></div></div><div className="grid gap-3 sm:grid-cols-[1fr_1fr_.65fr]"><label className={`space-y-1.5 text-xs ${light ? 'text-base-content/70' : 'text-white/65'}`}><span>Card wording</span><input maxLength={80} value={stat.label} onChange={(e) => update(stat.key, { label: e.target.value })} className={`input input-sm w-full ${field}`} /></label><label className={`space-y-1.5 text-xs ${light ? 'text-base-content/70' : 'text-white/65'}`}><span>Figure</span><input maxLength={24} value={stat.value} onChange={(e) => update(stat.key, { value: e.target.value })} className={`input input-sm w-full ${field}`} /></label><label className={`space-y-1.5 text-xs ${light ? 'text-base-content/70' : 'text-white/65'}`}><span>Unit</span><input maxLength={24} value={stat.unit} onChange={(e) => update(stat.key, { unit: e.target.value })} className={`input input-sm w-full ${field}`} placeholder="+, %, /5" /></label></div></article>)}</div></section>
    <button disabled={loading || saving} onClick={() => void save()} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-6 py-3 text-sm font-bold text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50"><Save size={16} />{saving ? 'Saving…' : 'Save statistics'}</button>
  </div>;
}
