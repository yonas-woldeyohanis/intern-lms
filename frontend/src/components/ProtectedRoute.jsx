import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useStore } from 'zustand';

/**
 * Route guard: requires authentication, and optionally restricts to a set
 * of roles. Unauthenticated users are bounced to /login; authenticated
 * users lacking the required role are bounced to /403.
 *
 * Includes a rehydration guard: Zustand's `persist` middleware rehydrates
 * from localStorage asynchronously. Without this guard, the brief window
 * where `isAuthenticated` is still `false` causes a spurious redirect to
 * /login (with state.from set), which then shows /403 after re-auth.
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Wait for Zustand persist to finish rehydrating before making decisions.
  // `_hasHydrated` is set by the onRehydrateStorage callback below.
  // We check it via the raw store to avoid re-renders.
  const hasHydrated = useAuthStore.persist?.hasHydrated?.() ?? true;

  // While store is rehydrating, render nothing (avoids flash redirect)
  if (!hasHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    const userRole = (user?.role || '').toLowerCase();
    if (!roles.includes(userRole)) {
      return <Navigate to="/403" replace />;
    }
  }

  return <Outlet />;
}
