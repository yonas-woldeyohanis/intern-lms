import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { FileUp, FileDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { booksApi } from '../../api/endpoints';

export default function BookBulkImportModal({ open, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);

  const importMutation = useMutation({
    mutationFn: (payload) => booksApi.bulkCreate(payload),
    onSuccess: (res) => {
      const { successCount, errors } = res.data.data;
      setImportResult({ successCount, errors });
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} books!`);
        onSuccess?.();
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Failed to import books.');
    }
  });

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setParsedData(null);
    setErrors([]);
    setImportResult(null);

    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map(row => ({
          title: row.Title?.trim(),
          isbn: row.ISBN?.trim(),
          author: row.Author?.trim(),
          category: row.Category?.trim(),
          publisher: row.Publisher?.trim(),
          shelf: row.Shelf?.trim(),
          publicationYear: row.Year ? parseInt(row.Year, 10) : null,
          totalCopies: row.Copies ? parseInt(row.Copies, 10) : 1,
          edition: row.Edition?.trim(),
          language: row.Language?.trim(),
          description: row.Description?.trim()
        }));

        // Basic frontend validation
        const rowErrors = [];
        data.forEach((row, idx) => {
          if (!row.title) rowErrors.push(`Row ${idx + 2}: Missing Title`);
          if (!row.isbn) rowErrors.push(`Row ${idx + 2}: Missing ISBN`);
        });

        if (rowErrors.length > 0) {
          setErrors(rowErrors);
        } else {
          setParsedData(data);
        }
      },
      error: (error) => {
        setErrors([`Failed to parse CSV: ${error.message}`]);
      }
    });
  }

  function handleImport() {
    if (parsedData && parsedData.length > 0) {
      importMutation.mutate(parsedData);
    }
  }

  function downloadTemplate() {
    const headers = ['Title', 'ISBN', 'Author', 'Category', 'Publisher', 'Shelf', 'Year', 'Copies', 'Edition', 'Language', 'Description'];
    const csvContent = headers.join(',') + '\n' + 
      'Sample Book,978-0132350884,Robert C. Martin,Programming,Prentice Hall,A1-CS,2008,5,1st,English,A Handbook of Agile Software Craftsmanship';
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'book_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleClose() {
    setFile(null);
    setParsedData(null);
    setErrors([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Import Books" size="lg">
      <div className="space-y-6">
        {importResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-success-50 dark:bg-success-500/10 text-success-700 dark:text-success-400 rounded-lg">
              <CheckCircle2 className="h-6 w-6" />
              <div>
                <p className="font-semibold">Import Complete</p>
                <p className="text-sm">Successfully imported {importResult.successCount} books.</p>
              </div>
            </div>
            {importResult.errors?.length > 0 && (
              <div className="p-4 bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-400 rounded-lg max-h-48 overflow-y-auto">
                <p className="font-semibold flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4" /> Import Errors ({importResult.errors.length})</p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>Row {err.row} ({err.title}): {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <FileUp className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-1">
                {file ? file.name : 'Upload a CSV file'}
              </p>
              <p className="text-xs text-slate-400 mb-4 text-center max-w-xs">
                File must be a valid CSV matching the template format.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
                <Button variant="ghost" size="sm" icon={FileDown} onClick={downloadTemplate}>
                  Template
                </Button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="p-4 bg-danger-50 dark:bg-danger-500/10 text-danger-700 dark:text-danger-400 rounded-lg max-h-48 overflow-y-auto text-sm">
                <p className="font-semibold flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4" /> Validation Errors</p>
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            {parsedData && errors.length === 0 && (
              <div className="p-4 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg text-sm flex items-center justify-between">
                <div>
                  <p className="font-semibold">Ready to Import</p>
                  <p>Found {parsedData.length} valid books to import.</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button 
                type="button" 
                onClick={handleImport} 
                disabled={!parsedData || errors.length > 0}
                loading={importMutation.isPending}
              >
                Start Import
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
