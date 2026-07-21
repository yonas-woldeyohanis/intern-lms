import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Download } from 'lucide-react';

export default function BookQrModal({ open, onClose, book }) {
  if (!book) return null;
  return (
    <Modal open={open} onClose={onClose} title="Book QR Code" size="sm">
      <div className="flex flex-col items-center text-center">
        <p className="font-semibold text-slate-800 dark:text-white">{book.title}</p>
        <p className="text-xs text-slate-400 mb-4">{book.isbn}</p>
        {book.qr_code_path ? (
          <img src={book.qr_code_path} alt="QR Code" className="h-48 w-48 rounded-lg border border-slate-100 dark:border-slate-800" />
        ) : (
          <p className="text-sm text-slate-400">No QR code generated for this book.</p>
        )}
        {book.qr_code_path && (
          <a href={book.qr_code_path} download={`book-${book.id}-qr.png`} className="mt-4">
            <Button icon={Download} variant="secondary">Download QR</Button>
          </a>
        )}
      </div>
    </Modal>
  );
}
