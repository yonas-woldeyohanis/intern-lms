import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUiStore } from '../../store/uiStore';
import ErrorBoundary from '../ErrorBoundary';
import { AnimatePresence, motion } from 'framer-motion';

function useBreadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  return segments
    .map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' / ') || 'Dashboard';
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarCollapsed } = useUiStore();
  const breadcrumb = useBreadcrumb();

  return (
    <div className="min-h-screen relative">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className={`flex min-h-screen flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <Topbar onOpenMobile={() => setMobileOpen(true)} breadcrumb={breadcrumb} />
        <main className="flex-1 p-4 lg:p-6 overflow-hidden">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
