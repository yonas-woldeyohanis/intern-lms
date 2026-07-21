import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../api/endpoints';
import Input from '../components/ui/Input';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import { formatDateTime, fullName } from '../utils/format';
import useDebounce from '../hooks/useDebounce';

function actionVariant(action) {
  if (action.includes('DELETE') || action.includes('FAILED') || action.includes('LOST')) return 'danger';
  if (action.includes('CREATED')) return 'success';
  if (action.includes('UPDATED') || action.includes('RENEWED')) return 'info';
  return 'neutral';
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', { page, debouncedSearch }],
    queryFn: () => auditLogsApi.list({ page, limit: 15, search: debouncedSearch || undefined }).then((r) => r.data.data)
  });

  const columns = useMemo(() => [
    { header: 'Time', cell: ({ row }) => formatDateTime(row.original.created_at) },
    { header: 'User', cell: ({ row }) => row.original.username ? fullName({ first_name: row.original.first_name, last_name: row.original.last_name }) : 'System' },
    { header: 'Action', cell: ({ row }) => <Badge variant={actionVariant(row.original.action)}>{row.original.action.replace(/_/g, ' ')}</Badge> },
    { header: 'Details', cell: ({ row }) => <span className="text-slate-500">{row.original.description || '—'}</span> },
    { header: 'IP Address', cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip_address || '—'}</span> }
  ], []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Audit Logs</h1>
        <p className="text-sm text-slate-400">A complete, immutable trail of security-relevant actions across the system.</p>
      </div>
      <div className="card p-4">
        <Input
          placeholder="Search by action, user, or details..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <div className="card p-4">
        <DataTable columns={columns} data={data?.rows} isLoading={isLoading} emptyTitle="No audit log entries found" />
        {data && data.total > 0 && <Pagination page={page} limit={data.limit} total={data.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}
