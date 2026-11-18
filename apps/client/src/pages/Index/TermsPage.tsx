import { useTheme } from '../../context/ThemeContext';

export default function TermsPage() {
  const { theme } = useTheme();
  const light = theme === 'bumblebee';
  return <main className={`min-h-[60vh] px-5 py-20 sm:px-8 ${light ? 'bg-base-100 text-base-content' : 'bg-[#0d0e0b] text-[#f4f1e8]'}`}>
    <div className="mx-auto max-w-screen-2xl"><p className="font-mono text-[10px] uppercase tracking-[.22em] text-[#a88417]">JaynStan</p><h1 className="mt-3 font-serif text-5xl">Terms</h1><div className={`mt-7 max-w-2xl rounded-2xl border p-6 text-sm leading-7 ${light ? 'border-base-300 bg-base-200 text-base-content/70' : 'border-white/10 bg-[#171813] text-white/60'}`}><p>Our platform terms are being prepared. For questions about account access, portfolio content, or project enquiries, contact the JaynStan team using the support button.</p></div></div>
  </main>;
}
