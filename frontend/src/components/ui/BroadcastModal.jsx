import { useState } from 'react';
import { Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { notificationsApi } from '../../api/endpoints';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import Select from './Select';

export default function BroadcastModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [severity, setSeverity] = useState('info');

  const mutation = useMutation({
    mutationFn: (data) => notificationsApi.broadcast(data),
    onSuccess: () => {
      toast.success('Broadcast sent successfully!');
      setTitle('');
      setMessage('');
      setTargetRole('all');
      setSeverity('info');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to send broadcast');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    mutation.mutate({ title, message, targetRole, severity });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Broadcast"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={mutation.isPending}
            icon={Send}
          >
            Send Broadcast
          </Button>
        </>
      }
    >
      <form id="broadcast-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g., Staff Meeting at 3 PM"
        />

        <Select
          label="Target Audience"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          options={[
            { value: 'all', label: 'Everyone (All Users & Staff)' },
            { value: 'librarian', label: 'Librarians Only' },
            { value: 'user', label: 'Regular Users Only' }
          ]}
        />

        <Select
          label="Severity (Color)"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          options={[
            { value: 'info', label: 'Info (Blue)' },
            { value: 'warning', label: 'Warning (Yellow)' },
            { value: 'danger', label: 'Urgent (Red)' }
          ]}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder="Enter your message here..."
          />
        </div>
      </form>
    </Modal>
  );
}
