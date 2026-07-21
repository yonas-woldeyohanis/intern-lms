import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { usersApi } from '../../api/endpoints';

export default function ResetPasswordModal({ open, onClose, user }) {
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () => usersApi.resetPassword(user.id, { newPassword: password }),
    onSuccess: () => { toast.success('Password reset successfully.'); setPassword(''); onClose(); },
    onError: (err) => {
      const details = err.response?.data?.error?.details;
      if (details?.length) details.forEach((d) => toast.error(d.message));
      else toast.error(err.response?.data?.error?.message || 'Failed to reset password.');
    }
  });

  return (
    <Modal open={open} onClose={onClose} title={`Reset Password for ${user?.username || ''}`} size="sm">
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
        <Input
          label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          hint="Min 8 chars, upper, lower, number, special char." required
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Reset Password</Button>
        </div>
      </form>
    </Modal>
  );
}
