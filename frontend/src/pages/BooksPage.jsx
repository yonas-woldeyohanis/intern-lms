import { useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Plus, Search, QrCode, Pencil, Archive, BookOpen,
  CalendarPlus, Filter, LayoutGrid, LayoutList, Tag, User,
  FileUp, FileDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { booksApi, reservationsApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import useDebounce from '../hooks/useDebounce';
import { useAuthorsOptions, useCategoriesOptions } from '../hooks/useLookups';
import BookFormModal from '../components/books/BookFormModal';
import BookQrModal from '../components/books/BookQrModal';
import BookBulkImportModal from '../components/books/BookBulkImportModal';
import BookDetailsModal from '../components/books/BookDetailsModal';
import { usePublishersOptions, useShelvesOptions } from '../hooks/useLookups';
import axiosClient from '../api/axiosClient';

const STATUS_VARIANT = { available: 'success', unavailable: 'warning', archived: 'neutral' };

// ─── Book Card for user grid view ───────────────────────────────────────────
function BookCard({ book, onReserve, isReserving, isUser, onClick }) {
  const hasImage = !!book.cover_image_url;

  // Generate a pleasant gradient based on book ID
  const gradients = [
    'from-blue-400 to-indigo-600',
    'from-emerald-400 to-teal-600',
    'from-orange-400 to-rose-500',
    'from-violet-400 to-purple-600',
    'from-sky-400 to-blue-500',
    'from-amber-400 to-orange-500',
  ];
  const gradient = gradients[book.id % gradients.length];

  const isAvailable = book.available_copies > 0 && book.status === 'available';

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
      }}
      className="group flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-pointer"
      onClick={() => onClick(book)}
    >
      {/* Cover */}
      <div className="relative h-44 w-full overflow-hidden">
        {hasImage ? (
          <img
            src={book.cover_image_url}
            alt={book.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-white`}>
            <BookOpen className="h-10 w-10 mb-2 opacity-80" />
            <p className="text-xs font-medium opacity-80 text-center line-clamp-2">{book.title}</p>
          </div>
        )}
        {/* Availability badge */}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isAvailable
            ? 'bg-emerald-500 text-white'
            : 'bg-slate-800/70 text-white'
        }`}>
          {isAvailable ? `${book.available_copies} Available` : 'Unavailable'}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2">
          {book.title}
        </h3>

        {book.author_name && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs truncate">{book.author_name}</span>
          </div>
        )}

        {book.category_name && (
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{book.category_name}</span>
          </div>
        )}

        {/* Reserve button — only shown to regular users when book is unavailable */}
        {isUser && !isAvailable && book.status !== 'archived' && (
          <div className="mt-auto pt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onReserve(book); }}
              disabled={isReserving}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-xl transition-all bg-brand-600 hover:bg-brand-700 text-white shadow-sm disabled:opacity-50"
            >
              <CalendarPlus className="h-4 w-4" />
              Reserve
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main BooksPage ─────────────────────────────────────────────────────────
export default function BooksPage() {
  const { user } = useAuthStore();
  const canManage = user?.role === 'admin' || user?.role === 'librarian';
  const isUser = user?.role === 'user';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // Default to grid for all users

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [qrBook, setQrBook] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [reservingId, setReservingId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [detailsBook, setDetailsBook] = useState(null);

  const categoryOptions = useCategoriesOptions();
  const authorOptions = useAuthorsOptions();
  usePublishersOptions();
  useShelvesOptions();

  const { data, isLoading } = useQuery({
    queryKey: ['books', { page, debouncedSearch, categoryId, authorId, sortBy, sortDir }],
    queryFn: () => booksApi.list({
      page, limit: isUser && viewMode === 'grid' ? 12 : 10,
      q: debouncedSearch || undefined,
      categoryId: categoryId || undefined,
      authorId: authorId || undefined,
      sortBy, sortDir
    }).then((r) => r.data.data)
  });

  const reserveMutation = useMutation({
    mutationFn: (bookId) => reservationsApi.create({ bookId }),
    onSuccess: () => {
      toast.success('Book reserved successfully! Check your Reservations page.');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setReservingId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to reserve book.');
      setReservingId(null);
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => booksApi.archive(id),
    onSuccess: () => {
      toast.success('Book archived successfully.');
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setArchiveTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to archive book.')
  });

  function handleSortChange(key) {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  }

  async function handleExportCsv() {
    try {
      setIsExporting(true);
      const response = await axiosClient.get('/books/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'library_catalog.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Catalog exported successfully');
    } catch (err) {
      toast.error('Failed to export catalog');
    } finally {
      setIsExporting(false);
    }
  }

  function handleReserve(book) {
    setReservingId(book.id);
    reserveMutation.mutate(book.id);
  }

  const columns = useMemo(() => [
    {
      header: 'Title', sortKey: 'title',
      cell: ({ row }) => (
        <div className="flex items-center gap-3 max-w-xs">
          <div className="h-10 w-8 shrink-0 rounded bg-brand-50 dark:bg-slate-800 grid place-items-center overflow-hidden">
            {row.original.cover_image_url
              ? <img src={row.original.cover_image_url} alt="" className="h-full w-full object-cover" />
              : <BookOpen className="h-4 w-4 text-brand-400" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-800 dark:text-slate-100">{row.original.title}</p>
            <p className="truncate text-xs text-slate-400">{row.original.author_name || 'Unknown author'}</p>
          </div>
        </div>
      )
    },
    { header: 'ISBN', cell: ({ row }) => <span className="font-mono text-xs">{row.original.isbn}</span> },
    { header: 'Category', cell: ({ row }) => row.original.category_name || '—' },
    { header: 'Shelf', cell: ({ row }) => row.original.shelf_code || '—' },
    {
      header: 'Availability', sortKey: 'available_copies',
      cell: ({ row }) => (
        <span className={row.original.available_copies > 0 ? 'text-success-600 font-medium' : 'text-danger-500'}>
          {row.original.available_copies}/{row.original.total_copies}
        </span>
      )
    },
    { header: 'Status', cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge> },
    {
      header: '', id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {isUser && row.original.available_copies === 0 && row.original.status !== 'archived' && (
            <button
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-300 font-medium disabled:opacity-50"
              onClick={() => handleReserve(row.original)}
              disabled={reservingId === row.original.id}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Reserve
            </button>
          )}
          <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="View QR" onClick={() => setQrBook(row.original)}>
            <QrCode className="h-4 w-4" />
          </button>
          {canManage && (
            <>
              <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit" onClick={() => { setEditingBook(row.original); setFormOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </button>
              <button className="rounded p-1.5 text-slate-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-slate-800" title="Archive" onClick={() => setArchiveTarget(row.original)}>
                <Archive className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ], [canManage, isUser, reservingId]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Book Catalog</h1>
          <p className="page-subtitle">
            {isUser ? 'Discover and reserve books from our collection.' : 'Search, filter, and manage the library\'s collection.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Table view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
          {canManage && (
            <>
              <Button variant="secondary" icon={FileDown} onClick={handleExportCsv} loading={isExporting} title="Export CSV">
                Export
              </Button>
              <Button variant="secondary" icon={FileUp} onClick={() => setImportOpen(true)} title="Bulk Import">
                Import
              </Button>
              <Button icon={Plus} onClick={() => { setEditingBook(null); setFormOpen(true); }}>Add Book</Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by title, ISBN, author..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select
            placeholder="All categories"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          />
          <Select
            placeholder="All authors"
            options={authorOptions}
            value={authorId}
            onChange={(e) => { setAuthorId(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Grid view */}
      {viewMode === 'grid' && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (data?.rows || []).length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="font-medium text-slate-500">No books found</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } }
              }}
              initial="hidden"
              animate="show"
            >
              {(data?.rows || []).map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isUser={isUser}
                  onReserve={handleReserve}
                  isReserving={reservingId === book.id}
                  onClick={setDetailsBook}
                />
              ))}
            </motion.div>
          )}
          {data && data.total > 0 && (
            <div className="mt-4">
              <Pagination page={page} limit={data.limit} total={data.total} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="card p-4">
          <DataTable
            columns={columns}
            data={data?.rows}
            isLoading={isLoading}
            emptyTitle="No books found"
            emptyDescription="Try adjusting your search or filters, or add a new book to the catalog."
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            onRowClick={setDetailsBook}
          />
          {data && data.total > 0 && (
            <Pagination page={page} limit={data.limit} total={data.total} onPageChange={setPage} />
          )}
        </div>
      )}

      <BookFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        book={editingBook}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['books'] })}
      />
      <BookQrModal open={!!qrBook} onClose={() => setQrBook(null)} book={qrBook} />
      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
        loading={archiveMutation.isPending}
        title="Archive this book?"
        description={`"${archiveTarget?.title}" will be archived and hidden from active search results. This cannot be undone from here.`}
        confirmLabel="Archive"
      />
      <BookBulkImportModal 
        open={importOpen} 
        onClose={() => setImportOpen(false)} 
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['books'] })}
      />
      <BookDetailsModal
        open={!!detailsBook}
        onClose={() => setDetailsBook(null)}
        book={detailsBook}
        isUser={isUser}
        onReserve={handleReserve}
        isReserving={reservingId === detailsBook?.id}
      />
    </div>
  );
}
