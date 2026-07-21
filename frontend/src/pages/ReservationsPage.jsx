import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDateTime, fullName } from '../utils/format';

const STATUS_VARIANT = { pending: 'warning', fulfilled: 'success', cancelled: 'neutral', expired: 'danger' };

export default function ReservationsPage() {
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'librarian';
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationsApi.list({ limit: 50 }).then((r) => r.data.data)
  });

  const actionMutation = useMutation({
    mutationFn: ({ type, id }) => (type === 'cancel' ? reservationsApi.cancel(id) : reservationsApi.fulfill(id)),
    onSuccess: () => {
      toast.success('Reservation updated.');
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setConfirmAction(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Action failed.')
  });

  const columns = useMemo(() => {
    const base = [
      { header: 'Book', cell: ({ row }) => <span className="font-medium">{row.original.book_title}</span> }
    ];
    if (canManage) base.push({ header: 'Member', cell: ({ row }) => fullName(row.original) });
    base.push(
      { header: 'Reserved At', cell: ({ row }) => formatDateTime(row.original.reserved_at) },
      { header: 'Expires', cell: ({ row }) => formatDateTime(row.original.expires_at) },
      { header: 'Status', cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge> },
      {
        header: '', id: 'actions',
        cell: ({ row }) => {
          if (row.original.status !== 'pending') return null;
          return (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {canManage && (
                <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Fulfill" onClick={() => setConfirmAction({ type: 'fulfill', row: row.original })}>
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              <button className="rounded p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-slate-800" title="Cancel" onClick={() => setConfirmAction({ type: 'cancel', row: row.original })}>
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          );
        }
      }
    );
    return base;
  }, [canManage]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Reservations</h1>
        <p className="text-sm text-slate-400">
          {canManage ? 'Manage reservation holds for currently unavailable books.' : 'Your active and past book reservations.'}
        </p>
      </div>
      <div className="card p-4">
        <DataTable columns={columns} data={data?.rows} isLoading={isLoading} emptyTitle="No reservations found" />
      </div>
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => actionMutation.mutate({ type: confirmAction.type, id: confirmAction.row.id })}
        loading={actionMutation.isPending}
        variant={confirmAction?.type === 'cancel' ? 'danger' : 'primary'}
        title={confirmAction?.type === 'cancel' ? 'Cancel this reservation?' : 'Fulfill this reservation?'}
        description={confirmAction?.type === 'cancel' ? 'The member will need to reserve again if they still want this book.' : 'This marks the hold as fulfilled once the member picks up the book.'}
        confirmLabel={confirmAction?.type === 'cancel' ? 'Cancel Reservation' : 'Mark Fulfilled'}
      />
    </div>
  );
}
