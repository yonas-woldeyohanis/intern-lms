import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/endpoints';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import useDebounce from '../hooks/useDebounce';
import { useDepartmentsOptions } from '../hooks/useLookups';
import { fullName } from '../utils/format';

const STATUS_VARIANT = { active: 'success', inactive: 'neutral', suspended: 'danger' };

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);
  const departmentOptions = useDepartmentsOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['members', { page, debouncedSearch, departmentId }],
    queryFn: () => usersApi.list({ page, limit: 10, search: debouncedSearch || undefined, departmentId: departmentId || undefined, role: 'user' }).then((r) => r.data.data)
  });

  const columns = useMemo(() => [
    { header: 'Name', cell: ({ row }) => <span className="font-medium">{fullName(row.original)}</span> },
    { header: 'Employee ID', cell: ({ row }) => row.original.employee_id || '—' },
    { header: 'Email', cell: ({ row }) => row.original.email },
    { header: 'Department', cell: ({ row }) => row.original.department_name || '—' },
    { header: 'Status', cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge> }
  ], []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Members</h1>
        <p className="text-sm text-slate-400">Browse registered employees eligible to borrow books.</p>
      </div>

      <div className="card p-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input placeholder="Search by name, email, or employee ID..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select placeholder="All departments" options={departmentOptions} value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1); }} />
      </div>

      <div className="card p-4">
        <DataTable columns={columns} data={data?.rows} isLoading={isLoading} emptyTitle="No members found" />
        {data && data.total > 0 && <Pagination page={page} limit={data.limit} total={data.total} onPageChange={setPage} />}
      </div>
    </div>
  );
}
