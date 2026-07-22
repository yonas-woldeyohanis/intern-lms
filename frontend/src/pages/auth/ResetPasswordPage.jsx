import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/endpoints';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const passwordPolicy = z.string()
  .min(8, 'At least 8 characters.')
  .regex(/[a-z]/, 'At least one lowercase letter.')
  .regex(/[A-Z]/, 'At least one uppercase letter.')
  .regex(/[0-9]/, 'At least one number.')
  .regex(/[^A-Za-z0-9]/, 'At least one special character.');

const schema = z.object({
  newPassword: passwordPolicy,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword']
});

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    if (!token) {
      toast.error('Missing or invalid reset link.');
      return;
    }
    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword });
      toast.success('Password reset. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'This reset link is invalid or has expired.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3 justify-center">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-800 text-accent-400 font-bold text-xl">
            B
          </div>
          <span className="text-lg font-semibold text-brand-900 dark:text-white">BMVEI Library</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Set a new password</h2>
        <p className="mt-1 text-sm text-slate-400">Choose a strong password you haven't used before.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input label="New password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
          <Input label="Confirm new password" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
          <Button type="submit" className="w-full" loading={isSubmitting}>Reset password</Button>
        </form>
        <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">Back to login</Link>
      </div>
    </div>
  );
}
