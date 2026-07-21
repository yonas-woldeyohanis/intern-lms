import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import Pagination from '../ui/Pagination';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useAuthStore } from '../../store/authStore';
import useDebounce from '../../hooks/useDebounce';

/**
 * Generic list+CRUD page for simple lookup entities (categories, authors,
 * publishers, shelves, departments). `fields` describes the form inputs;
 * `columns` describes the extra table columns beyond the primary label.
 */
export default function LookupCrudPage({
  title, description, api, queryKey, primaryField, fields, columns = [], canDelete = true
}) {
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'librarian';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formValues, setFormValues] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, { page, debouncedSearch }],
    queryFn: () => api.list({ page, limit: 10, search: debouncedSearch || undefined }).then((r) => r.data.data)
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => editing ? api.update(editing.id, payload) : api.create(payload),
    onSuccess: () => {
      toast.success(`${title.replace(/s$/, '')} saved successfully.`);
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setFormOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to save.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.remove(id),
    onSuccess: () => {
      toast.success('Deleted successfully.');
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to delete. It may be referenced by other records.')
  });

  function openCreate() {
    setEditing(null);
    setFormValues({});
    setFormOpen(true);
  }
  function openEdit(item) {
    setEditing(item);
    setFormValues(item);
    setFormOpen(true);
  }
  function handleSubmit(e) {
    e.preventDefault();
    saveMutation.mutate(formValues);
  }

  const tableColumns = useMemo(() => [
    { header: title.replace(/s$/, ''), cell: ({ row }) => <span className="font-medium">{row.original[primaryField]}</span> },
    ...columns,
    ...(canManage ? [{
      header: '', id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </button>
          {canDelete && user?.role === 'admin' && (
            <button className="rounded p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-slate-800" onClick={() => setDeleteTarget(row.original)}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }] : [])
  ], [columns, canManage, user, title, primaryField, canDelete]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        {canManage && <Button icon={Plus} onClick={openCreate}>Add {title.replace(/s$/, '')}</Button>}
      </div>

      <div className="card p-4">
        <Input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="card p-4">
        <DataTable columns={tableColumns} data={data?.rows} isLoading={isLoading} emptyTitle={`No ${title.toLowerCase()} found`} />
        {data && data.total > 0 && <Pagination page={page} limit={data.limit} total={data.total} onPageChange={setPage} />}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit ${title.replace(/s$/, '')}` : `Add ${title.replace(/s$/, '')}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((f) => (
            <Input
              key={f.name}
              label={f.label}
              type={f.type || 'text'}
              value={formValues[f.name] ?? ''}
              onChange={(e) => setFormValues((v) => ({ ...v, [f.name]: e.target.value }))}
              required={f.required}
            />
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title={`Delete this ${title.toLowerCase().replace(/s$/, '')}?`}
        description={`"${deleteTarget?.[primaryField]}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
