import { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { BriefcaseBusiness, ChartNoAxesColumnIncreasing, ChevronDown, ChevronLeft, ClipboardList, ImagePlus, LayoutDashboard, LifeBuoy, Link2, LogOut, Menu, Moon, Sparkles, Star, Sun, UserPlus, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardLayout() {
  const { user, ready, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ Admin: true, Users: true });
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isLight = theme === 'bumblebee';

  if (!ready) return <div className="grid min-h-screen place-items-center bg-[#0b0b09] text-white/60">Loading your workspace…</div>;
  if (!user) return <Navigate to="/login?returnTo=/dashboard" replace />;

  const workspaceItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/profile', label: 'My profile', icon: UserRound },
    ...(!isAdmin ? [{ to: '/dashboard/provider-application', label: 'Provider application', icon: BriefcaseBusiness }] : []),
    { to: '/dashboard/my-work', label: 'Advertise work', icon: ImagePlus },
  ];
  const adminGroups = isAdmin ? [
    { label: 'Admin', items: [
      { to: '/dashboard/admin/featured-works', label: 'Featured works', icon: Star },
      { to: '/dashboard/admin/site-links', label: 'Social links', icon: Link2 },
      { to: '/dashboard/admin/homepage-stats', label: 'Homepage stats', icon: ChartNoAxesColumnIncreasing },
      { to: '/dashboard/admin/support-tickets', label: 'Support tickets', icon: LifeBuoy },
    ] },
    { label: 'Users', items: [
      { to: '/dashboard/admin/users', label: 'Manage users', icon: UserPlus },
      { to: '/dashboard/admin/accounts', label: 'Create accounts', icon: UserPlus },
      { to: '/dashboard/admin/provider-applications', label: 'Applications', icon: ClipboardList },
    ] },
  ] : [];

  return <div className={`dashboard-shell min-h-screen ${isLight ? 'bg-base-100 text-base-content' : 'bg-[#0d0e0b] text-[#f4f1e8]'}`}>
    <header className={`sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 backdrop-blur-xl sm:px-7 ${isLight ? 'border-base-300 bg-base-100/90' : 'border-white/10 bg-[#11120f]/90'}`}>
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(!mobileOpen)} className={`rounded-lg p-2 md:hidden ${isLight ? 'text-base-content/65 hover:bg-base-200' : 'text-white/65 hover:bg-white/5'}`} aria-label="Toggle workspace navigation">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
        <Link to="/" className="font-serif text-xl font-semibold tracking-wide">JAYNSTAN<span className="ml-2 font-mono text-[10px] tracking-[.2em] text-[#e6c34f]">WORKSPACE</span></Link>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" onClick={toggleTheme} aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`} title={`Switch to ${isLight ? 'dark' : 'light'} mode`} className={`rounded-full p-2 transition ${isLight ? 'text-base-content/70 hover:bg-base-200 hover:text-base-content' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>{isLight ? <Moon size={18} /> : <Sun size={18} />}</button>
        <span className={`hidden sm:inline ${isLight ? 'text-base-content/55' : 'text-white/55'}`}>{user.fullName}</span>
        <span className="rounded-full border border-[#e6c34f]/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#e6c34f]">{user.role}</span>
        <button onClick={() => { signOut(); navigate('/'); }} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 transition ${isLight ? 'text-base-content/60 hover:bg-base-200 hover:text-base-content' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}><LogOut size={16} /><span className="hidden sm:inline">Sign out</span></button>
      </div>
    </header>

    <div className="flex w-full">
      {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 top-16 z-20 bg-black/60 md:hidden" />}
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed bottom-0 left-0 top-16 z-30 w-72 border-r p-4 transition-transform md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)] md:translate-x-0 ${isLight ? 'border-base-300 bg-base-100' : 'border-white/10 bg-[#11120f]'}`}>
        <nav className="space-y-1">
          <p className={`mb-2 px-3 font-mono text-[10px] uppercase tracking-[.2em] ${isLight ? 'text-base-content/40' : 'text-white/35'}`}>Workspace</p>
          {workspaceItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'border border-[#e6c34f]/20 bg-[#e6c34f]/10 text-[#a88417]' : isLight ? 'text-base-content/65 hover:bg-base-200 hover:text-base-content' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}><Icon size={17} />{label}</NavLink>)}
          {adminGroups.map(({ label, items }) => {
            const isExpanded = expandedGroups[label as keyof typeof expandedGroups];
            const groupIsActive = items.some((item) => location.pathname === item.to);
            return <section key={label} className="pt-4">
              <button type="button" onClick={() => setExpandedGroups((current) => ({ ...current, [label]: !current[label as keyof typeof current] }))} aria-expanded={isExpanded} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 font-mono text-[10px] uppercase tracking-[.2em] transition ${groupIsActive ? 'text-[#a88417]' : isLight ? 'text-base-content/45 hover:text-base-content' : 'text-white/40 hover:text-white/70'}`}><span>{label}</span><ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
              {isExpanded && <div className="mt-1 space-y-1">{items.map(({ to, label: itemLabel, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'border border-[#e6c34f]/20 bg-[#e6c34f]/10 text-[#a88417]' : isLight ? 'text-base-content/65 hover:bg-base-200 hover:text-base-content' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}><Icon size={17} />{itemLabel}</NavLink>)}</div>}
            </section>;
          })}
        </nav>
        <div className={`mt-8 rounded-2xl border p-4 ${isLight ? 'border-base-300 bg-base-200' : 'border-white/10 bg-white/[.025]'}`}>
          <Sparkles size={17} className="text-[#e6c34f]" />
          <p className="mt-3 text-sm font-semibold">Share your work</p>
          <p className={`mt-1 text-xs leading-5 ${isLight ? 'text-base-content/55' : 'text-white/50'}`}>Apply to become a provider to publish services and portfolio work.</p>
          <Link to="/dashboard/provider-application" onClick={() => setMobileOpen(false)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#e6c34f]">Provider application <ChevronLeft className="rotate-180" size={14} /></Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 pb-16 sm:px-6 lg:px-8"><Outlet /></div>
      </main>
    </div>
  </div>;
}
