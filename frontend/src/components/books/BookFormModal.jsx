import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';
import { booksApi, authorsApi, publishersApi, categoriesApi, shelvesApi } from '../../api/endpoints';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import ComboboxField from '../ui/ComboboxField';
import { useAuthorsOptions, usePublishersOptions, useCategoriesOptions, useShelvesOptions } from '../../hooks/useLookups';

const schema = z.object({
  title: z.string().min(1, 'Title is required.').max(255),
  isbn: z.string().min(6, 'ISBN must be at least 6 characters.').max(20),
  edition: z.string().optional(),
  publicationYear: z.string().optional(),
  language: z.string().optional(),
  totalCopies: z.string().min(1, 'Total copies is required.'),
  description: z.string().optional()
});

export default function BookFormModal({ open, onClose, book, onSuccess }) {
  const isEdit = !!book;
  const [coverFile, setCoverFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const authorOptions = useAuthorsOptions();
  const publisherOptions = usePublishersOptions();
  const categoryOptions = useCategoriesOptions();
  const shelfOptions = useShelvesOptions();

  // Combobox states — each holds { id: number|null, text: string }
  const [authorVal, setAuthorVal] = useState({ id: null, text: '' });
  const [publisherVal, setPublisherVal] = useState({ id: null, text: '' });
  const [categoryVal, setCategoryVal] = useState({ id: null, text: '' });
  const [shelfVal, setShelfVal] = useState({ id: null, text: '' });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset(book ? {
        title: book.title,
        isbn: book.isbn,
        edition: book.edition || '',
        publicationYear: book.publication_year ? String(book.publication_year) : '',
        language: book.language || '',
        totalCopies: String(book.total_copies),
        description: book.description || ''
      } : { language: 'English', totalCopies: '1' });

      // Seed comboboxes from existing book data
      const aOpt = book?.author_id ? authorOptions.find(o => o.value === book.author_id) : null;
      const pOpt = book?.publisher_id ? publisherOptions.find(o => o.value === book.publisher_id) : null;
      const cOpt = book?.category_id ? categoryOptions.find(o => o.value === book.category_id) : null;
      const sOpt = book?.shelf_id ? shelfOptions.find(o => o.value === book.shelf_id) : null;

      setAuthorVal({ id: book?.author_id || null, text: aOpt?.label || book?.author_name || '' });
      setPublisherVal({ id: book?.publisher_id || null, text: pOpt?.label || book?.publisher_name || '' });
      setCategoryVal({ id: book?.category_id || null, text: cOpt?.label || book?.category_name || '' });
      setShelfVal({ id: book?.shelf_id || null, text: sOpt?.label || book?.shelf_code || '' });

      setCoverFile(null);
      setPreview(book?.cover_image_url || null);
    }
  }, [open, book, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  /**
   * If a combobox has a free-text value (id===null, text set), auto-create
   * the entity and return its new ID. Otherwise return the existing id or null.
   */
  async function resolveId(val, api, payload) {
    if (!val.text.trim()) return null;
    if (val.id !== null) return val.id;
    // Create new entity
    const res = await api.create(payload);
    return res.data?.data?.id || res.data?.id;
  }

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      // Resolve combobox free-text entries into real IDs by auto-creating them
      const [resolvedAuthorId, resolvedPublisherId, resolvedCategoryId, resolvedShelfId] = await Promise.all([
        resolveId(authorVal, authorsApi, { full_name: authorVal.text.trim() }),
        resolveId(publisherVal, publishersApi, { name: publisherVal.text.trim() }),
        resolveId(categoryVal, categoriesApi, { name: categoryVal.text.trim() }),
        resolveId(shelfVal, shelvesApi, { code: shelfVal.text.trim(), location_description: shelfVal.text.trim() })
      ]);

      // Invalidate lookup caches so new entries show up in dropdowns next time
      if (authorVal.id === null && authorVal.text)       queryClient.invalidateQueries({ queryKey: ['authors'] });
      if (publisherVal.id === null && publisherVal.text)  queryClient.invalidateQueries({ queryKey: ['publishers'] });
      if (categoryVal.id === null && categoryVal.text)    queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (shelfVal.id === null && shelfVal.text)          queryClient.invalidateQueries({ queryKey: ['shelves'] });

      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      if (resolvedAuthorId)    formData.append('authorId', resolvedAuthorId);
      if (resolvedPublisherId) formData.append('publisherId', resolvedPublisherId);
      if (resolvedCategoryId)  formData.append('categoryId', resolvedCategoryId);
      if (resolvedShelfId)     formData.append('shelfId', resolvedShelfId);
      if (coverFile)           formData.append('cover', coverFile);

      if (isEdit) {
        await booksApi.update(book.id, formData);
        toast.success('Book updated successfully.');
      } else {
        await booksApi.create(formData);
        toast.success('Book added successfully.');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save book.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Book' : 'Add New Book'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 grid place-items-center">
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <UploadCloud className="h-6 w-6 text-slate-400" />}
          </div>
          <div>
            <label className="btn-secondary cursor-pointer">
              Upload Cover
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            </label>
            <p className="mt-1 text-xs text-slate-400">JPEG, PNG, or WEBP. Max 5MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Input label="ISBN" placeholder="e.g. 9780134685991" error={errors.isbn?.message} {...register('isbn')} />

          <ComboboxField
            label="Author"
            options={authorOptions}
            value={authorVal}
            onChange={setAuthorVal}
            placeholder="Select or type author name…"
          />
          <ComboboxField
            label="Publisher"
            options={publisherOptions}
            value={publisherVal}
            onChange={setPublisherVal}
            placeholder="Select or type publisher…"
          />
          <ComboboxField
            label="Category"
            options={categoryOptions}
            value={categoryVal}
            onChange={setCategoryVal}
            placeholder="Select or type category…"
          />

          <ComboboxField
            label="Shelf Location"
            options={shelfOptions}
            value={shelfVal}
            onChange={setShelfVal}
            placeholder="Select or type shelf code…"
          />

          <Input label="Edition" {...register('edition')} />
          <Input
            label="Publication Year"
            type="number"
            min="1000"
            max={new Date().getFullYear()}
            placeholder={String(new Date().getFullYear())}
            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
            {...register('publicationYear')}
          />
          <Input label="Language" {...register('language')} />
          <Input
            label="Total Copies"
            type="number"
            min="1"
            max="9999"
            error={errors.totalCopies?.message}
            onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
            {...register('totalCopies')}
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[90px]" {...register('description')} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{isEdit ? 'Save Changes' : 'Add Book'}</Button>
        </div>
      </form>
    </Modal>
  );
}
