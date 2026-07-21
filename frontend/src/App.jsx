import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { useUiStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import BorrowReturnPage from './pages/BorrowReturnPage';
import MyLoansPage from './pages/MyLoansPage';
import ReservationsPage from './pages/ReservationsPage';
import MembersPage from './pages/MembersPage';
import CatalogSettingsPage from './pages/CatalogSettingsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 }
  }
});

function ThemeSync() {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}

function RootRedirect() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();
  if (role === 'user') return <Navigate to="/books" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/403" element={<ForbiddenPage />} />

            {/* Protected routes (any authenticated user) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/books" element={<BooksPage />} />
                <Route path="/reservations" element={<ReservationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* User-only */}
                <Route element={<ProtectedRoute roles={['user']} />}>
                  <Route path="/my-loans" element={<MyLoansPage />} />
                </Route>

                {/* Admin + librarian */}
                <Route element={<ProtectedRoute roles={['admin', 'librarian']} />}>
                  <Route path="/borrow-return" element={<BorrowReturnPage />} />
                  <Route path="/members" element={<MembersPage />} />
                  <Route path="/catalog-settings" element={<CatalogSettingsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>

                {/* Admin only */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
