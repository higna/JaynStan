import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState(searchParams.get('subject')?.toLowerCase() === 'partnership' ? 'Partnership' : '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const muted = light ? 'text-base-content/65' : 'text-white/60';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await apiRequest<{ message: string; ticket?: { reference: string } }>('/support/contact', {
        method: 'POST', body: JSON.stringify({ name, email, subject, message }),
      }, token ?? undefined);
      setSent(true);
      toast.success(result.ticket ? `Ticket ${result.ticket.reference} created.` : result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  }

  return <main className={`min-h-screen ${light ? 'bg-base-100 text-base-content' : 'bg-[#0d0e0b] text-[#f4f1e8]'}`}>
    <section className="relative isolate overflow-hidden border-b border-white/10 px-5 pb-12 pt-28 sm:px-8 sm:pb-16">
      <img src="/Divider.png" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-55" />
      <div className="absolute inset-0 -z-10 bg-black/75" />
      <div className="mx-auto max-w-screen-2xl"><Link to="/" className="inline-flex items-center gap-2 text-xs text-white/65 transition hover:text-[#e6c34f]"><ArrowLeft size={14} /> Back home</Link><p className="mt-7 font-mono text-[10px] uppercase tracking-[.25em] text-[#e6c34f]">Contact JaynStan</p><h1 className="mt-2 max-w-3xl font-serif text-5xl text-white sm:text-6xl">Let’s start a conversation.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/75">Tell us what you’re thinking about. Our team will get back to you and help find the right next step.</p></div>
    </section>

    <section className="mx-auto grid max-w-screen-2xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-16 lg:py-16">
      <aside className="pt-2"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#a88417]">A collective response</p><h2 className="mt-3 font-serif text-3xl">One message brings the right people together.</h2><p className={`mt-3 text-sm leading-7 ${muted}`}>Whether you have a project, want to partner with the collective, or need support, send us a note. All enquiries are handled by the JaynStan team.</p><div className={`mt-6 rounded-2xl border p-4 text-sm ${light ? 'border-base-300 bg-base-200' : 'border-white/10 bg-[#151611]'}`}><p className="font-semibold">Looking to partner?</p><p className={`mt-1 text-xs leading-5 ${muted}`}>Set the subject to “Partnership” and tell us a little about how you’d like to work together.</p></div></aside>

      <div className={`rounded-3xl border p-5 shadow-xl sm:p-7 ${light ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#151611]'}`}>
        {sent ? <div className="py-12 text-center"><CheckCircle2 size={34} className="mx-auto text-emerald-500" /><h2 className="mt-4 font-serif text-3xl">Message received.</h2><p className={`mt-2 text-sm ${muted}`}>The JaynStan team will be in touch soon.</p><Link to="/" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a88417]">Return home <ArrowRight size={14} /></Link></div> : <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`space-y-1.5 text-xs ${muted}`}><span>Your name</span><input required minLength={2} maxLength={160} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={`input w-full ${light ? 'border-base-300 bg-base-200 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>
            <label className={`space-y-1.5 text-xs ${muted}`}><span>Email for reply</span><input required type="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={`input w-full ${light ? 'border-base-300 bg-base-200 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>
          </div>
          <label className={`block space-y-1.5 text-xs ${muted}`}><span>Subject</span><input required minLength={3} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Partnership, project enquiry, support…" className={`input w-full ${light ? 'border-base-300 bg-base-200 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>
          <label className={`block space-y-1.5 text-xs ${muted}`}><span>Your message</span><textarea required minLength={10} maxLength={5000} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us a little about what you have in mind…" className={`textarea w-full resize-y ${light ? 'border-base-300 bg-base-200 text-base-content' : 'border-white/15 bg-white/[.04] text-white'}`} /></label>
          <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e6c34f] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[#17170f] transition hover:bg-[#f0d56f] disabled:opacity-50">{busy ? 'Sending…' : 'Send your message'} <Send size={14} /></button>
          <p className={`text-center text-[10px] ${muted}`}>{user ? 'Your ticket will be linked to your account.' : 'No account is needed. We’ll create a ticket and reply to your email.'}</p>
        </form>}
      </div>
    </section>
  </main>;
}
