import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, ArrowLeftRight, BookMarked, Tags,
  UserSquare2, Building2, Warehouse, FileBarChart, ShieldCheck, Settings, X, Library
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
  const { sidebarCollapsed } = useUiStore();
  const role = user?.role;
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onCloseMobile} />
      )}
      <aside
        className={`fixed z-40 inset-y-4 left-4 flex flex-col rounded-3xl bg-brand-950/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl transition-all duration-300
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-[260px]'}
          ${mobileOpen ? 'w-[260px] translate-x-0' : '-translate-x-[120%] lg:translate-x-0 w-[260px]'}`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-400 text-brand-950 font-bold">
              <Library className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight">
                <p className="text-sm font-semibold">BMVEI</p>
                <p className="text-[11px] text-white/50">Library System</p>
              </div>
            )}
          </div>
          <button className="lg:hidden text-white/70" onClick={onCloseMobile}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-all duration-200
                 ${isActive ? 'bg-accent-400 text-brand-950 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'text-white/60 hover:bg-white/10 hover:text-white hover:scale-[1.02]'}`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/40">
            Bishoftu Motor Vehicle
            <br />Engineering Industry
          </div>
        )}
      </aside>
    </>
  );
}
