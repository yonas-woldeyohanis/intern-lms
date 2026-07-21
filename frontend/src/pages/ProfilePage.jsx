import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { KeyRound, User } from 'lucide-react';
import { authApi, usersApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phone: z.string().optional()
});

const passwordPolicy = z.string()
  .min(8, 'At least 8 characters.')
  .regex(/[a-z]/, 'At least one lowercase letter.')
  .regex(/[A-Z]/, 'At least one uppercase letter.')
  .regex(/[0-9]/, 'At least one number.')
  .regex(/[^A-Za-z0-9]/, 'At least one special character.');

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordPolicy,
  confirmPassword: z.string()
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone || '' }
  });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  async function onProfileSubmit(values) {
    try {
      await usersApi.update(user.id, values);
      updateUser({ ...user, firstName: values.firstName, lastName: values.lastName });
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile.');
    }
  }

  async function onPasswordSubmit(values) {
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed successfully.');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password.');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-400">Manage your personal details and account security.</p>
      </div>

      <Card title="Personal Information" action={<User className="h-5 w-5 text-slate-300" />}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First Name" error={profileForm.formState.errors.firstName?.message} {...profileForm.register('firstName')} />
            <Input label="Last Name" error={profileForm.formState.errors.lastName?.message} {...profileForm.register('lastName')} />
          </div>
          <Input label="Phone" {...profileForm.register('phone')} />
          <Input label="Email" value={user?.email || ''} disabled className="opacity-60" />
          <Button type="submit" loading={profileForm.formState.isSubmitting}>Save Changes</Button>
        </form>
      </Card>

      <Card title="Change Password" action={<KeyRound className="h-5 w-5 text-slate-300" />}>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input label="Current Password" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
          <Input label="New Password" type="password" hint="Min 8 chars, upper, lower, number, special char." error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
          <Input label="Confirm New Password" type="password" error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
          <Button type="submit" loading={passwordForm.formState.isSubmitting}>Change Password</Button>
        </form>
      </Card>
    </div>
  );
}
