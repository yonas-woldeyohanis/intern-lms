import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TypeaheadSearch from '../common/TypeaheadSearch';
import { booksApi, usersApi, borrowApi } from '../../api/endpoints';
import { fullName } from '../../utils/format';

export default function IssueBookModal({ open, onClose, onSuccess }) {
  const [book, setBook] = useState(null);
  const [member, setMember] = useState(null);

  const issueMutation = useMutation({
    mutationFn: () => borrowApi.issue({ bookId: book.id, userId: member.id }),
    onSuccess: () => {
      toast.success(`"${book.title}" issued to ${fullName(member)}.`);
      onSuccess?.();
      handleClose();
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Failed to issue book.')
  });

  function handleClose() {
    setBook(null);
    setMember(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Issue a Book" size="md">
      <div className="space-y-4">
        <TypeaheadSearch
          label="Book"
          placeholder="Search by title or ISBN..."
          queryKey="issue-book-search"
          searchFn={(q) => booksApi.list({ q, limit: 8, status: 'available' }).then((r) => r.data.data.rows.filter((b) => b.available_copies > 0))}
          renderOption={(b) => (
            <div>
              <p className="font-medium">{b.title}</p>
              <p className="text-xs text-slate-400">{b.isbn} • {b.available_copies} available</p>
            </div>
          )}
          getLabel={(b) => `${b.title} (${b.isbn})`}
          value={book}
          onChange={setBook}
        />
        <TypeaheadSearch
          label="Member"
          placeholder="Search by name, email, or employee ID..."
          queryKey="issue-member-search"
          searchFn={(q) => usersApi.list({ search: q, limit: 8, status: 'active' }).then((r) => r.data.data.rows)}
          renderOption={(u) => (
            <div>
              <p className="font-medium">{fullName(u)}</p>
              <p className="text-xs text-slate-400">{u.employee_id || u.email}</p>
            </div>
          )}
          getLabel={(u) => `${fullName(u)} (${u.employee_id || u.email})`}
          value={member}
          onChange={setMember}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button
            disabled={!book || !member}
            loading={issueMutation.isPending}
            onClick={() => issueMutation.mutate()}
          >
            Issue Book
          </Button>
        </div>
      </div>
    </Modal>
  );
}
