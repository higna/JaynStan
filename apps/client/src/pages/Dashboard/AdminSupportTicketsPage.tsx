import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, LifeBuoy, Mail, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/api';

type Reply = { id: string; message: string; createdAt: string; senderName: string; emailSent: boolean };
type Ticket = { id: string; reference: string; senderName: string; senderEmail: string; subject: string; initialMessage: string; status: string; emailSent: boolean; createdAt: string; updatedAt: string; settledAt: string | null; settlementEmailSent: boolean; accountName: string | null; replies: Reply[] };

export default function AdminSupportTicketsPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const panel = light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#171813]';
  const muted = light ? 'text-base-content/60' : 'text-white/55';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const selected = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await apiRequest<Ticket[]>('/support/admin/tickets', {}, token);
      setTickets(result);
      setSelectedId((current) => current && result.some((ticket) => ticket.id === current) ? current : result[0]?.id ?? '');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load support tickets.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selected) return;
    setBusy(true);
    try {
      const result = await apiRequest<{ emailSent: boolean; message: string }>(`/support/admin/tickets/${selected.id}/replies`, { method: 'POST', body: JSON.stringify({ message: reply }) }, token);
      result.emailSent ? toast.success(result.message) : toast.error(result.message);
      setReply('');
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not send the reply.'); }
    finally { setBusy(false); }
  }

  async function settle() {
    if (!token || !selected) return;
    setBusy(true);
    try {
      const result = await apiRequest<{ emailSent: boolean; message: string }>(`/support/admin/tickets/${selected.id}/settle`, { method: 'PATCH' }, token);
      result.emailSent ? toast.success(result.message) : toast.error(result.message);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not settle this ticket.'); }
    finally { setBusy(false); }
  }

  const openCount = tickets.filter((ticket) => ['open', 'in_progress'].includes(ticket.status)).length;
  const settledCount = tickets.filter((ticket) => ['settled', 'resolved', 'closed'].includes(ticket.status)).length;
  return <div className="w-full space-y-6">
    <header className="relative overflow-hidden rounded-3xl bg-[#090a08] p-6 pt-9 text-white shadow-sm sm:p-8 sm:pt-10"><span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white"/><span aria-hidden className="absolute inset-x-0 top-1 h-[5px] bg-[#e6c34f]"/><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#e6c34f]">Team inbox</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Support tickets</h1><p className="mt-2 text-sm leading-6 text-white">Review each request, reply to the requester by email, and mark resolved work as settled.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold text-white"><RefreshCw size={14}/>Refresh inbox</button></div></header>
    <section className="grid gap-3 sm:grid-cols-3"><Metric label="All tickets" value={tickets.length}/><Metric label="Needs response" value={openCount}/><Metric label="Settled" value={settledCount}/></section>
    {loading ? <p className="py-12 text-center text-sm opacity-60">Loading support inbox…</p> : tickets.length === 0 ? <div className={`rounded-3xl border p-10 text-center ${panel}`}><LifeBuoy className="mx-auto text-[#a88417]" size={25}/><h2 className="mt-4 font-serif text-2xl">No support tickets yet</h2><p className={`mt-2 text-sm ${muted}`}>New support requests will appear here.</p></div> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(20rem,.85fr)_minmax(0,1.15fr)]">
      <section className={`overflow-hidden rounded-2xl border shadow-sm ${panel}`}><div className={`border-b p-4 ${light ? 'border-base-300' : 'border-white/10'}`}><h2 className="font-semibold">Inbox</h2><p className={`mt-1 text-xs ${muted}`}>Newest active requests appear first.</p></div><div className="max-h-[70vh] overflow-auto">{tickets.map((ticket) => <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`block w-full border-b p-4 text-left transition last:border-b-0 ${light ? 'border-base-300 hover:bg-base-200/60' : 'border-white/5 hover:bg-white/[.03]'} ${selected?.id === ticket.id ? light ? 'bg-[#e6c34f]/10' : 'bg-[#e6c34f]/[.07]' : ''}`}><div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-[10px] font-bold text-[#a88417]">{ticket.reference}</span><span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${['settled','resolved','closed'].includes(ticket.status) ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-700'}`}>{ticket.status === 'in_progress' ? 'In progress' : ticket.status}</span></div><p className="mt-2 truncate text-sm font-semibold">{ticket.subject}</p><p className={`mt-1 truncate text-xs ${muted}`}>{ticket.senderName} · {ticket.senderEmail}</p><p className={`mt-2 line-clamp-1 text-xs ${muted}`}>{ticket.initialMessage}</p></button>)}</div></section>
      {selected && <section className={`overflow-hidden rounded-2xl border shadow-sm ${panel}`}><header className={`border-b p-4 sm:p-5 ${light ? 'border-base-300' : 'border-white/10'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#a88417]">{selected.reference} · {selected.status.replace('_',' ')}</p><h2 className="mt-1 truncate font-serif text-2xl">{selected.subject}</h2><p className={`mt-1 text-xs ${muted}`}>{selected.senderName} · <a className="underline underline-offset-2" href={`mailto:${selected.senderEmail}`}>{selected.senderEmail}</a>{selected.accountName && ` · Account: ${selected.accountName}`}</p></div><button disabled={busy || selected.status === 'settled' && selected.settlementEmailSent} onClick={() => void settle()} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e6c34f] px-4 py-2.5 text-xs font-bold text-[#17170f] disabled:opacity-50"><CheckCircle2 size={14}/>{selected.status === 'settled' ? selected.settlementEmailSent ? 'Settled' : 'Retry settlement email' : 'Mark settled'}</button></div></header>
        <div className="max-h-[48vh] space-y-3 overflow-auto p-4 sm:p-5"><article className={`rounded-2xl border p-4 ${light ? 'border-base-300 bg-base-200/40' : 'border-white/10 bg-white/[.025]'}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">{selected.senderName}</p><time className={`text-[10px] ${muted}`}>{new Date(selected.createdAt).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{selected.initialMessage}</p></article>{selected.replies.map((item) => <article key={item.id} className="ml-4 rounded-2xl border border-[#a88417]/20 bg-[#a88417]/[.06] p-4 sm:ml-8"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">{item.senderName} {item.emailSent ? <span className="ml-1 font-normal text-emerald-600">· emailed</span> : <span className="ml-1 font-normal text-red-500">· email failed</span>}</p><time className={`text-[10px] ${muted}`}>{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.message}</p></article>)}</div>
        {!['settled','resolved','closed'].includes(selected.status) && <form onSubmit={sendReply} className={`border-t p-4 sm:p-5 ${light ? 'border-base-300' : 'border-white/10'}`}><label className={`mb-2 block text-xs font-semibold ${muted}`} htmlFor="ticket-reply">Reply directly by email</label><textarea id="ticket-reply" required minLength={2} maxLength={5000} rows={4} value={reply} onChange={(event) => setReply(event.target.value)} className={`textarea w-full ${light ? 'border-base-300 bg-base-100' : 'border-white/15 bg-white/[.04] text-white'}`} placeholder="Write a helpful response…"/><button disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#e6c34f] px-5 py-2.5 text-xs font-bold text-[#17170f] disabled:opacity-50"><Send size={14}/>{busy ? 'Sending…' : 'Send reply'}</button><p className={`mt-2 text-[10px] ${muted}`}><Mail size={11} className="mr-1 inline"/>Your reply will be emailed to {selected.senderEmail}.</p></form>}
      </section>}
    </div>}
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="flex min-h-28 items-center justify-between rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"><div><p className="text-[11px] font-semibold uppercase tracking-wider opacity-55">{label}</p><p className="mt-2 font-serif text-3xl font-semibold">{value}</p></div><LifeBuoy size={19} className="text-[#a88417]"/></article>;
}
