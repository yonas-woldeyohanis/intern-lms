import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCw, Undo2, AlertOctagon, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { borrowApi } from '../api/endpoints';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatDate, fullName } from '../utils/format';
import IssueBookModal from '../components/borrow/IssueBookModal';

const STATUS_VARIANT = { borrowed: 'info', returned: 'success', overdue: 'danger', lost: 'neutral' };

export default function BorrowReturnPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [issueOpen, setIssueOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type, record }

  const { data, isLoading } = useQuery({
    queryKey: ['borrow-records', { page, status }],
    queryFn: () => borrowApi.list({ page, limit: 10, status: status || undefined }).then((r) => r.data.data)
  });

  const actionMutation = useMutation({
    mutationFn: ({ type, id }) => {
      if (type === 'return') return borrowApi.returnBook(id);
      if (type === 'renew') return borrowApi.renew(id);
      if (type === 'lost') return borrowApi.markLost(id);
      return Promise.reject(new Error('Unknown action'));
    },
    onSuccess: (_, vars) => {
      const messages = { return: 'Book marked as returned.', renew: 'Loan renewed successfully.', lost: 'Book marked as lost.' };
      toast.success(messages[vars.type]);
      queryClient.invalidateQueries({ queryKey: ['borrow-records'] });
      setConfirmAction(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Action failed.')
  });

  const columns = useMemo(() => [
    { header: 'Book', cell: ({ row }) => <span className="font-medium">{row.original.book_title}</span> },
    { header: 'Borrower', cell: ({ row }) => fullName(row.original) },
    { header: 'Borrowed', cell: ({ row }) => formatDate(row.original.borrow_date) },
    {
      header: 'Due Date',
      cell: ({ row }) => {
        const overdue = row.original.status !== 'returned' && new Date(row.original.due_date) < new Date();
        return <span className={overdue ? 'text-danger-500 font-medium' : ''}>{formatDate(row.original.due_date)}</span>;
      }
    },
    { header: 'Returned', cell: ({ row }) => formatDate(row.original.return_date) },
    { header: 'Renewals', cell: ({ row }) => row.original.renewal_count },
    { header: 'Status', cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge> },
    {
      header: '', id: 'actions',
      cell: ({ row }) => {
        const r = row.original;
        if (r.status === 'returned' || r.status === 'lost') return null;
        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Return" onClick={() => setConfirmAction({ type: 'return', record: r })}>
              <Undo2 className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Renew" onClick={() => setConfirmAction({ type: 'renew', record: r })}>
              <RotateCw className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-slate-800" title="Mark Lost" onClick={() => setConfirmAction({ type: 'lost', record: r })}>
              <AlertOctagon className="h-4 w-4" />
            </button>
          </div>
        );
      }
    }
  ], []);

  const confirmCopy = {
    return: { title: 'Confirm return', description: 'Mark this book as returned and restore an available copy?', label: 'Confirm Return', variant: 'primary' },
    renew: { title: 'Renew this loan?', description: 'Extend the due date by the standard loan period.', label: 'Confirm Renewal', variant: 'primary' },
    lost: { title: 'Mark this book as lost?', description: 'This permanently reduces the total copy count and cannot be undone from here.', label: 'Mark as Lost', variant: 'danger' }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Borrow & Return</h1>
          <p className="text-sm text-slate-400">Issue new loans and process returns, renewals, and lost items.</p>
        </div>
        <Button icon={PlusCircle} onClick={() => setIssueOpen(true)}>Issue Book</Button>
      </div>

      <div className="card p-4">
        <Select
          placeholder="All statuses"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={[
            { value: 'borrowed', label: 'Borrowed' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'returned', label: 'Returned' },
            { value: 'lost', label: 'Lost' }
          ]}
          className="max-w-xs"
        />
      </div>

      <div className="card p-4">
        <DataTable columns={columns} data={data?.rows} isLoading={isLoading} emptyTitle="No borrow records found" />
        {data && data.total > 0 && <Pagination page={page} limit={data.limit} total={data.total} onPageChange={setPage} />}
      </div>

      <IssueBookModal open={issueOpen} onClose={() => setIssueOpen(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['borrow-records'] })} />

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => actionMutation.mutate({ type: confirmAction.type, id: confirmAction.record.id })}
        loading={actionMutation.isPending}
        variant={confirmAction ? confirmCopy[confirmAction.type].variant : 'primary'}
        title={confirmAction ? confirmCopy[confirmAction.type].title : ''}
        description={confirmAction ? confirmCopy[confirmAction.type].description : ''}
        confirmLabel={confirmAction ? confirmCopy[confirmAction.type].label : 'Confirm'}
      />
    </div>
  );
}
