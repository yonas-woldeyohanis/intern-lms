import {
  useReactTable, getCoreRowModel, flexRender
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

/**
 * Enterprise-style data table. Sorting/pagination are server-driven (the
 * caller passes already-paginated `data` and handles page/sort state), so
 * this component focuses purely on rendering + row interaction.
 */
export default function DataTable({
  columns, data, isLoading, emptyTitle = 'No records found', emptyDescription,
  sortBy, sortDir, onSortChange, onRowClick
}) {
  const table = useReactTable({ data: data || [], columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="p-4"><TableSkeleton cols={columns.length} /></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortKey = header.column.columnDef.sortKey;
                const isSorted = sortKey && sortBy === sortKey;
                return (
                  <th
                    key={header.id}
                    className={`px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${sortKey ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''}`}
                    onClick={() => sortKey && onSortChange?.(sortKey)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortKey && isSorted && (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''} transition-colors`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3.5 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
