import { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, LogOut, User, ChevronDown, PanelLeftClose, PanelLeftOpen, AlertTriangle, Clock, BookMarked, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { authApi, notificationsApi } from '../../api/endpoints';
import { fullName, formatRelativeTime } from '../../utils/format';

const SEVERITY_ICON = {
  danger: AlertTriangle,
  warning: Clock,
  info: BookMarked,
};
const SEVERITY_COLOR = {
  danger: 'text-danger-500',
  warning: 'text-warning-600',
  info: 'text-brand-600',
};
const SEVERITY_BG = {
  danger: 'bg-danger-500/10',
  warning: 'bg-warning-500/10',
  info: 'bg-brand-500/10',
};

// Map notification types to the page they relate to
function getNotificationRoute(notification) {
  switch (notification.type) {
    case 'overdue':       return '/borrow-records';
    case 'due_soon':      return '/borrow-records';
    case 'reservation':   return '/reservations';
    case 'reservation_fulfilled': return '/borrow-records';
    case 'broadcast':     return null;
    default:              return null;
  }
}

export default function Topbar({ onOpenMobile, breadcrumb }) {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useUiStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Poll notifications every 60 seconds
  const queryClient = useQueryClient();
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data.data),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const dismissMutation = useMutation({
    mutationFn: (notificationId) => notificationsApi.dismiss({ notificationId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Failed to dismiss notification')
  });

  const notifications = notifData?.notifications || [];
  const count = notifData?.count || 0;

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // proceed with client-side logout regardless of API result
    } finally {
      clearSession();
      toast.success('Logged out successfully.');
      navigate('/login');
    }
  }

  function handleDismissAll() {
    if (notifications.length === 0) return;
    const allIds = notifications.map(n => n.id);
    dismissMutation.mutate(allIds);
  }

  return (
    <header className="sticky top-0 z-20 mx-4 lg:mx-6 mt-4 flex h-16 items-center justify-between gap-4 rounded-3xl border border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-4 lg:px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
      <div className="flex items-center gap-3 min-w-0">
        <button className="lg:hidden text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onOpenMobile}>
          <Menu className="h-5 w-5" />
        </button>
        <button className="hidden lg:block text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleSidebar}>
          {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <nav className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{breadcrumb}</nav>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white leading-none">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
                  {count > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-danger-500/10 text-danger-600 text-xs font-semibold px-2 py-0.5">
                      {count} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={handleDismissAll}
                      disabled={dismissMutation.isPending}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <ul className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <li className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                    <Bell className="h-8 w-8 opacity-30" />
                    <p className="text-sm">You're all caught up!</p>
                  </li>
                ) : (
                  notifications.map((n) => {
                    const Icon = SEVERITY_ICON[n.severity] || Bell;
                    const route = getNotificationRoute(n);
                    return (
                      <li
                        key={n.id}
                        className={`relative flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${route ? 'cursor-pointer' : ''}`}
                        onClick={route ? () => { setNotifOpen(false); navigate(route); } : undefined}
                        title={route ? 'Click to view' : undefined}
                      >
                        <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${SEVERITY_BG[n.severity]}`}>
                          <Icon className={`h-4 w-4 ${SEVERITY_COLOR[n.severity]}`} />
                        </div>
                        <div className="min-w-0 flex-1 pr-6">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${SEVERITY_COLOR[n.severity]}`}>{n.title}</p>
                          <p className={`text-sm text-slate-700 dark:text-slate-200 leading-snug mt-0.5 ${route ? 'group-hover:underline' : ''}`}>{n.message}</p>
                          {route && (
                            <p className="text-[10px] text-brand-500 dark:text-brand-400 mt-1 font-medium">Click to view →</p>
                          )}
                          {n.createdAt && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                              {formatRelativeTime(n.createdAt)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismissMutation.mutate(n.id); }}
                          disabled={dismissMutation.isPending}
                          className="absolute right-4 top-4 rounded p-1 text-slate-300 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              {notifications.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400 text-center">
                  Refreshes automatically every minute
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ml-1">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-800 text-xs font-bold text-white shrink-0">
              {(user?.first_name || 'U')[0]}{(user?.last_name || '')[0]}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-tight text-slate-700 dark:text-slate-200">{fullName({ first_name: user?.first_name, last_name: user?.last_name })}</p>
              <p className="text-xs capitalize leading-tight text-slate-400">{user?.role}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-white/20 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <div className="px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{fullName({ first_name: user?.first_name, last_name: user?.last_name })}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role} · {user?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="h-4 w-4" /> My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
