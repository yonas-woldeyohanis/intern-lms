import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, ArrowLeftRight, BookMarked, Tags,
  UserSquare2, FileBarChart, ShieldCheck, Settings, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'librarian', 'user'] },
  { to: '/books', label: 'Books', icon: BookOpen, roles: ['admin', 'librarian', 'user'] },
  { to: '/borrow-return', label: 'Borrow & Return', icon: ArrowLeftRight, roles: ['admin', 'librarian'] },
  { to: '/my-loans', label: 'My Borrowed Books', icon: BookMarked, roles: ['user'] },
  { to: '/reservations', label: 'Reservations', icon: BookMarked, roles: ['admin', 'librarian', 'user'] },
  { to: '/members', label: 'Members', icon: Users, roles: ['admin', 'librarian'] },
  { to: '/users', label: 'User Management', icon: UserSquare2, roles: ['admin', 'librarian'] },
  { to: '/catalog-settings', label: 'Catalog Data', icon: Tags, roles: ['admin', 'librarian'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'librarian'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] }
];

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const role = user?.role;
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed z-40 inset-y-4 left-4 flex flex-col rounded-3xl text-white shadow-2xl transition-all duration-300 overflow-hidden
          bg-[#0071ce] dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
          dark:border dark:border-white/10
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-[280px]'}
          ${mobileOpen ? 'w-[280px] translate-x-0' : '-translate-x-[120%] lg:translate-x-0 w-[280px]'}`}
      >
        {/* Decorative glow strip — visible in dark mode only */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent hidden dark:block" />
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-brand-400 via-cyan-400 to-brand-600 rounded-l-3xl hidden dark:block" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 dark:bg-brand-500/30 font-bold text-lg shadow-inner">
              B
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight min-w-0">
                <p className="text-base font-bold font-display tracking-wide truncate">BMVEI</p>
                <p className="text-[11px] text-white/50 truncate">Library System</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Collapse toggle — desktop */}
            <button
              className="hidden lg:flex items-center justify-center h-7 w-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            {/* Close on mobile */}
            <button className="lg:hidden text-white/70 hover:text-white" onClick={onCloseMobile}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                 ${isActive
                   ? 'bg-white/20 dark:bg-brand-600/60 text-white shadow-sm dark:shadow-brand-500/20'
                   : 'text-white/65 hover:bg-white/10 dark:hover:bg-white/8 hover:text-white'}`
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="px-5 py-4 border-t border-white/10">
            <p className="text-[11px] text-white/35 leading-relaxed">Bishoftu Motor Vehicle<br />Engineering Industry</p>
          </div>
        )}
      </aside>
    </>
  );
}
