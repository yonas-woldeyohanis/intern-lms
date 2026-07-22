import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const schema = z.object({
  identifier: z.string().min(1, 'Username or email is required.'),
  password: z.string().min(1, 'Password is required.')
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      const { data } = await authApi.login(values);
      const loggedInUser = data.data.user;
      setSession(loggedInUser, data.data.accessToken);
      toast.success(`Welcome back, ${loggedInUser.first_name || loggedInUser.username}!`);

      const role = (loggedInUser.role || '').toLowerCase();
      const defaultHome = role === 'user' ? '/books' : '/dashboard';

      // Paths that non-admin/librarian roles must not be redirected to
      const staffPaths = ['/borrow-return', '/members', '/catalog-settings', '/reports', '/users'];
      const adminOnlyPaths = ['/audit-logs', '/settings'];
      
      // Paths that should never be used as a redirect target
      const ignoredPaths = ['/login', '/', '/403', '/forbidden'];
      
      if (role === 'user') {
        ignoredPaths.push(...staffPaths, ...adminOnlyPaths);
      } else if (role === 'librarian') {
        ignoredPaths.push(...adminOnlyPaths);
      }

      let redirectTo = location.state?.from?.pathname;
      if (!redirectTo || ignoredPaths.includes(redirectTo)) {
        redirectTo = defaultHome;
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/ENGINEERING-CORP.png")' }}
      >
        {/* Gradient overlay - transparent top, dark bottom for text readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(10,30,50,0.35) 0%, rgba(10,30,50,0.55) 50%, rgba(10,30,50,0.88) 100%)' }} />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-400 text-brand-950 font-bold text-xl">
            B
          </div>
          <span className="text-lg font-bold drop-shadow-lg">BMVEI Library Management System</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold leading-tight drop-shadow-lg">
            Bishoftu Motor Vehicle<br />Engineering Industry
          </h1>
          {/* <p className="mt-4 max-w-md text-white/90 drop-shadow text-sm leading-relaxed">
            A modern digital library platform replacing paper-based records — search, borrow,
            reserve, and track books across the organization from any workstation on the network.
          </p> */}
        </div>
        <p className="relative z-10 text-xs text-white/60 drop-shadow">&copy; {new Date().getFullYear()} BMVEI. Internal use only.</p>
      </div>

      <div className="flex w-full items-center justify-center lg:w-1/2 px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-3 justify-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-800 text-accent-400 font-bold text-xl">
              B
            </div>
            <span className="text-lg font-semibold text-brand-900 dark:text-white">BMVEI Library</span>
          </div>

          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sign in to your account</h2>
          <p className="mt-1 text-sm text-slate-400">Enter your credentials to access the library system.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <Input
              label="Username or Email"
              placeholder="e.g. ayele or ayele@bmvei.local"
              error={errors.identifier?.message}
              {...register('identifier')}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-[34px] text-slate-400"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <span className="text-xs text-slate-400">
                Forgot password? Contact an administrator.
              </span>
            </div>

            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Access is restricted to authorized BMVEI employees. Contact your administrator for an account.
          </p>
        </div>
      </div>
    </div>
  );
}
