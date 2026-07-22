import { BookOpen, User, Tag, Calendar, Globe, AlignLeft, Barcode, LayoutGrid } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate } from '../../utils/format';

export default function BookDetailsModal({ open, onClose, book, isUser, onReserve, isReserving }) {
  if (!book) return null;

  const isAvailable = book.available_copies > 0 && book.status === 'available';

  return (
    <Modal open={open} onClose={onClose} title="Book Details" size="lg">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left column - Image & Actions */}
        <div className="flex flex-col items-center shrink-0 w-full md:w-48">
          <div className="h-64 w-full rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            )}
          </div>
          
          <div className="mt-4 w-full space-y-2">
            <div className="flex justify-between text-sm px-1">
              <span className="text-slate-500">Available</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{book.available_copies} / {book.total_copies}</span>
            </div>
            {isUser && !isAvailable && book.status !== 'archived' && (
              <Button 
                className="w-full" 
                onClick={() => onReserve(book)} 
                disabled={isReserving}
                loading={isReserving}
              >
                Reserve Book
              </Button>
            )}
          </div>
        </div>

        {/* Right column - Details */}
        <div className="flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{book.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={isAvailable ? 'success' : book.status === 'archived' ? 'neutral' : 'warning'}>
                {isAvailable ? 'Available' : book.status === 'archived' ? 'Archived' : 'Unavailable'}
              </Badge>
              {book.edition && <Badge variant="neutral">{book.edition} Edition</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
            {book.author_name && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Author:</span> {book.author_name}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Barcode className="h-4 w-4 text-slate-400" />
              <span className="font-medium">ISBN:</span> {book.isbn}
            </div>
            {book.category_name && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Tag className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Category:</span> {book.category_name}
              </div>
            )}
            {book.publisher_name && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Publisher:</span> {book.publisher_name}
              </div>
            )}
            {book.publication_year && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Year:</span> {book.publication_year}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="font-medium">Language:</span> {book.language || 'English'}
            </div>
            {book.shelf_code && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <LayoutGrid className="h-4 w-4 text-slate-400" />
                <span className="font-medium">Shelf:</span> {book.shelf_code}
              </div>
            )}
          </div>

          {book.description && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 mb-2">
                <AlignLeft className="h-4 w-4" /> Description
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {book.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
