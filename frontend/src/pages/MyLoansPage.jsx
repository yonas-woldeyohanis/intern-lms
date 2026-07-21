import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookMarked, RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { borrowApi } from '../api/endpoints';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/format';

const STATUS_VARIANT = { borrowed: 'info', returned: 'success', overdue: 'danger', lost: 'neutral' };

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-4 ${color}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs opacity-80 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function MyLoansPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => borrowApi.list({ limit: 50 }).then((r) => r.data.data)
  });

  const renewMutation = useMutation({
    mutationFn: (id) => borrowApi.renew(id),
    onSuccess: () => {
      toast.success('Book renewed successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to renew book.')
  });

  const loans = data?.rows || [];
  const active = loans.filter((l) => l.status === 'borrowed');
  const overdue = loans.filter((l) => l.status === 'overdue');
  const returned = loans.filter((l) => l.status === 'returned');

  const columns = useMemo(() => [
    {
      header: 'Book',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-7 shrink-0 rounded bg-brand-50 dark:bg-slate-800 grid place-items-center overflow-hidden">
            {row.original.cover_image_url
              ? <img src={row.original.cover_image_url} alt="" className="h-full w-full object-cover" />
              : <BookMarked className="h-4 w-4 text-brand-400" />}
          </div>
          <span className="font-medium text-slate-800 dark:text-white text-sm">{row.original.book_title}</span>
        </div>
      )
    },
    { header: 'Borrowed On', cell: ({ row }) => <span className="text-sm">{formatDate(row.original.borrow_date)}</span> },
    {
      header: 'Due Date',
      cell: ({ row }) => {
        const overdue = row.original.status !== 'returned' && new Date(row.original.due_date) < new Date();
        return (
          <span className={`text-sm font-medium ${overdue ? 'text-danger-500' : ''}`}>
            {overdue && <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />}
            {formatDate(row.original.due_date)}
          </span>
        );
      }
    },
    { header: 'Returned On', cell: ({ row }) => <span className="text-sm">{formatDate(row.original.return_date) || '—'}</span> },
    { header: 'Renewals', cell: ({ row }) => <span className="text-sm text-center">{row.original.renewal_count}</span> },
    { header: 'Status', cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge> },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => {
        if (row.original.status !== 'borrowed' && row.original.status !== 'overdue') return null;
        return (
          <button
            onClick={() => renewMutation.mutate(row.original.id)}
            disabled={renewMutation.isPending}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 font-medium transition-colors"
            title="Renew this loan"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Renew
          </button>
        );
      }
    }
  ], [renewMutation]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Borrowed Books</h1>
        <p className="page-subtitle">Your complete personal borrowing history.</p>
      </div>

      {/* Stats row */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          <StatPill
            icon={Clock} label="Active Loans" value={active.length}
            color="bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
          />
          <StatPill
            icon={AlertTriangle} label="Overdue" value={overdue.length}
            color={overdue.length > 0
              ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
              : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}
          />
          <StatPill
            icon={CheckCircle2} label="Returned" value={returned.length}
            color="bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300"
          />
        </div>
      )}

      <div className="card p-4">
        <DataTable
          columns={columns}
          data={data?.rows}
          isLoading={isLoading}
          emptyTitle="You haven't borrowed any books yet"
          emptyDescription="Browse the catalog to find your next read and make a reservation."
        />
      </div>
    </div>
  );
}
