import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutDashboard, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { to: '/', text: 'Home' },
  { to: '/about', text: 'About' },
  { to: '/services', text: 'Services' },
];

export default function NavBar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHomeTransparent = location.pathname === '/' && !scrolled;
  const isLight = theme === 'bumblebee';

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = before; window.removeEventListener('keydown', closeOnEscape); };
  }, [menuOpen]);

  const headerSurface = isHomeTransparent
    ? 'bg-transparent'
    : isLight
      ? 'border-b border-base-300 bg-base-200/85 shadow-sm backdrop-blur-lg'
      : 'border-b border-white/10 bg-black/85 shadow-sm backdrop-blur-lg';

  return <>
    <nav className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${headerSurface}`}>
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" aria-label="JaynStan home" className="shrink-0 rounded">
            <img src="/JaynStan.png" alt="JaynStan Espire" className="h-11 w-auto object-contain" />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ to, text }) => {
              const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
              return <Link key={to} to={to} aria-current={active ? 'page' : undefined} className={`relative px-3 py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:rounded-full after:bg-[#e6c34f] after:transition-all ${active ? 'text-[#e6c34f] after:w-4' : isHomeTransparent ? 'text-white/80 hover:text-[#e6c34f] after:w-0' : isLight ? 'text-base-content/70 hover:text-base-content after:w-0' : 'text-white/70 hover:text-white after:w-0'}`}>{text}</Link>;
            })}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={toggleTheme} aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`} className={`btn btn-ghost btn-circle ${isHomeTransparent ? 'text-white hover:text-[#e6c34f]' : isLight ? 'text-base-content' : 'text-white'}`}>{isLight ? <Moon size={19} /> : <Sun size={19} />}</button>
            {user && <><Link to="/dashboard" className={`btn btn-ghost btn-sm gap-2 ${isHomeTransparent ? 'text-white hover:text-[#e6c34f]' : ''}`}><LayoutDashboard size={15} /> Workspace</Link><button type="button" onClick={signOut} className={`btn btn-ghost btn-sm gap-2 ${isHomeTransparent ? 'text-white hover:text-[#e6c34f]' : ''}`}><LogOut size={15} /> Sign out</button></>}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button type="button" onClick={toggleTheme} aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`} className={`btn btn-ghost btn-circle btn-sm ${isHomeTransparent ? 'text-white' : isLight ? 'text-base-content' : 'text-white'}`}>{isLight ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="jaynstan-mobile-menu" aria-label="Open menu" className={`btn btn-ghost btn-circle btn-sm ${isHomeTransparent ? 'text-white' : isLight ? 'text-base-content' : 'text-white'}`}><Menu size={20} /></button>
          </div>
        </div>
      </div>
    </nav>

    <div id="jaynstan-mobile-menu" className={`fixed inset-0 z-[60] md:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
      <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label="Site menu" className={`absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col border-l p-5 shadow-2xl transition-transform ${isLight ? 'border-base-300 bg-base-100 text-base-content' : 'border-white/10 bg-[#11120f] text-white'} ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-current/10 pb-4"><span className="font-serif text-xl font-semibold">Menu</span><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="btn btn-ghost btn-circle btn-sm"><X size={19} /></button></div>
        <nav className="mt-5 flex flex-col gap-1">{navLinks.map(({ to, text }) => { const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to); return <Link key={to} to={to} className={`rounded-xl px-4 py-3 text-sm font-medium ${active ? 'bg-[#e6c34f]/10 text-[#a88417]' : 'text-current/70 hover:bg-current/5 hover:text-current'}`}>{text}</Link>; })}</nav>
        {user && <div className="mt-auto border-t border-current/10 pt-4"><p className="px-3 pb-3 text-xs text-current/50">Signed in as {user.fullName}</p><Link to="/dashboard" className="btn btn-outline w-full"><LayoutDashboard size={16} /> Workspace</Link><button type="button" onClick={signOut} className="btn btn-ghost mt-2 w-full"><LogOut size={16} /> Sign out</button></div>}
      </aside>
    </div>
  </>;
}
