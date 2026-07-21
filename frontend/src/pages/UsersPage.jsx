import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, KeyRound, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import useDebounce from '../hooks/useDebounce';
import UserFormModal from '../components/users/UserFormModal';
import ResetPasswordModal from '../components/users/ResetPasswordModal';
import { fullName } from '../utils/format';

const STATUS_VARIANT = { active: 'success', inactive: 'neutral', suspended: 'danger' };
const ROLE_VARIANT = { admin: 'danger', librarian: 'info', user: 'neutral' };

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';
  const isLibrarian = currentUser?.role === 'librarian';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, debouncedSearch, role }],
    queryFn: () => usersApi.list({ page, limit: 10, search: debouncedSearch || undefined, role: role || undefined }).then((r) => r.data.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: () => {
      toast.success('User deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to delete user.')
  });

  const columns = useMemo(() => [
    { header: 'Name', cell: ({ row }) => <span className="font-medium">{fullName(row.original)}</span> },
    { header: 'Username', cell: ({ row }) => row.original.username },
    { header: 'Email', cell: ({ row }) => row.original.email },
    { header: 'Role', cell: ({ row }) => <Badge variant={ROLE_VARIANT[row.original.role_name]}>{row.original.role_name}</Badge> },
    { header: 'Department', cell: ({ row }) => row.original.department_name || '—' },
    { header: 'Status', cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge> },
    {
      header: '', id: 'actions',
      cell: ({ row }) => {
        const targetRole = row.original.role_name;
        // Librarians can only manage regular user (member) accounts
        const canManage = isAdmin || targetRole === 'user';
        if (!canManage) return null;
        return (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit" onClick={() => { setEditing(row.original); setFormOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </button>
            {isAdmin && (
              <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Reset Password" onClick={() => setResetTarget(row.original)}>
                <KeyRound className="h-4 w-4" />
              </button>
            )}
            {isAdmin && row.original.id !== currentUser?.id && (
              <button className="rounded p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-slate-800" title="Delete" onClick={() => setDeleteTarget(row.original)}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ], [currentUser, isAdmin, isLibrarian]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-400">Manage system accounts, roles, and access.</p>
        </div>
        <Button icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>Add Member</Button>
      </div>

      <div className="card p-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input placeholder="Search by name, email, username..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select
          placeholder="All roles"
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          options={[{ value: 'admin', label: 'Admin' }, { value: 'librarian', label: 'Librarian' }, { value: 'user', label: 'User' }]}
        />
      </div>

      <div className="card p-4">
        <DataTable columns={columns} data={data?.rows} isLoading={isLoading} emptyTitle="No users found" />
        {data && data.total > 0 && <Pagination page={page} limit={data.limit} total={data.total} onPageChange={setPage} />}
      </div>

      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} user={editing} isLibrarian={isLibrarian} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })} />
      <ResetPasswordModal open={!!resetTarget} onClose={() => setResetTarget(null)} user={resetTarget} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Delete this user?"
        description={`"${deleteTarget?.username}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
