import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const schema = z.object({ email: z.string().email('Enter a valid email address.') });

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    try {
      const { data } = await authApi.forgotPassword(values);
      setSubmitted(true);
      if (data.data.devResetToken) setDevToken(data.data.devResetToken);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Something went wrong.');
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

        {submitted ? (
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Check your instructions</h2>
            <p className="mt-2 text-sm text-slate-500">
              If an account with that email exists, password reset instructions have been generated.
            </p>
            {devToken && (
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-slate-800 p-3 text-left text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold mb-1">Dev mode only — no email provider configured:</p>
                <Link to={`/reset-password?token=${devToken}`} className="break-all text-brand-600 underline">
                  Click here to reset your password
                </Link>
              </div>
            )}
            <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reset your password</h2>
            <p className="mt-1 text-sm text-slate-400">Enter your email and we'll generate reset instructions.</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <Input label="Email address" type="email" placeholder="you@bmvei.local" error={errors.email?.message} {...register('email')} />
              <Button type="submit" className="w-full" loading={isSubmitting}>Send reset instructions</Button>
            </form>
            <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
