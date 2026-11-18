import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUp, LifeBuoy, MessageCircle, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export default function SupportWidget() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 420);
    const onOpen = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as { message?: string; subject?: string } | undefined : undefined;
      if (detail?.message) setMessage(detail.message);
      if (detail?.subject) setSubject(detail.subject);
      setOpen(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('jaynstan:open-support', onOpen);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('jaynstan:open-support', onOpen);
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiRequest<{ message: string; ticket?: { reference: string } }>('/support/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      }, token ?? undefined);
      toast.success(result.ticket ? `Ticket ${result.ticket.reference} created.` : result.message);
      setSubject('');
      setMessage('');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send your support request.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    {open && <section role="dialog" aria-modal="false" aria-labelledby="support-title" className="fixed bottom-24 right-4 z-[70] max-h-[calc(100vh-8rem)] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-white/10 bg-[#151611] text-[#f4f1e8] shadow-2xl shadow-black/50 sm:bottom-24 sm:right-6">
      <div className="flex items-start justify-between border-b border-white/10 bg-[#1b1c16] p-5">
        <div className="flex items-start gap-3"><span className="rounded-xl bg-[#e6c34f]/10 p-2.5 text-[#e6c34f]"><LifeBuoy size={19} /></span><div><h2 id="support-title" className="font-serif text-2xl">How can we help?</h2><p className="mt-1 text-xs text-white/50">We’ll create a ticket and email the JaynStan team.</p></div></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close support" className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"><X size={18} /></button>
      </div>
      <form onSubmit={submit} className="space-y-4 p-5">
        <label className="block space-y-1.5 text-xs text-white/65"><span>Your name</span><input required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="input input-sm w-full border-white/15 bg-white/[.04] text-white focus:border-[#e6c34f]" placeholder="Name" /></label>
        <label className="block space-y-1.5 text-xs text-white/65"><span>Email for reply</span><input required type="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="input input-sm w-full border-white/15 bg-white/[.04] text-white focus:border-[#e6c34f]" placeholder="you@example.com" /></label>
        <label className="block space-y-1.5 text-xs text-white/65"><span>Subject</span><input required minLength={3} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="input input-sm w-full border-white/15 bg-white/[.04] text-white focus:border-[#e6c34f]" placeholder="What is this about?" /></label>
        <label className="block space-y-1.5 text-xs text-white/65"><span>How can we help?</span><textarea required minLength={10} maxLength={5000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} className="textarea textarea-sm w-full resize-none border-white/15 bg-white/[.04] text-white focus:border-[#e6c34f]" placeholder="Tell us what you need help with…" /></label>
        <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e6c34f] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50">{busy ? 'Sending…' : 'Send to support'} <Send size={14} /></button>
        <p className="text-center text-[10px] text-white/35">{user ? 'Your request will be linked to your account.' : 'No account is needed. We’ll reply to the email you provide.'}</p>
      </form>
    </section>}

    {showTop && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" title="Back to top" className={`fixed right-5 z-[65] grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#171813] text-white/75 shadow-lg transition hover:border-[#e6c34f]/60 hover:text-[#e6c34f] sm:right-7 ${open ? 'bottom-[29rem]' : 'bottom-[5.25rem]'}`}><ArrowUp size={18} /></button>}
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Close support' : 'Contact support'} title="Contact support" className="fixed bottom-5 right-5 z-[70] grid h-14 w-14 place-items-center rounded-full bg-[#e6c34f] text-[#17170f] shadow-xl shadow-black/30 transition hover:scale-105 hover:bg-[#f0d56f] sm:bottom-6 sm:right-7">{open ? <X size={21} /> : <MessageCircle size={22} />}</button>
  </>;
}
