import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';

/**
 * Lightweight async search-select: types a query, shows matching results
 * in a dropdown, click to select. Used where a full component library
 * combobox isn't available (member/book pickers in Issue Book, etc).
 */
export default function TypeaheadSearch({ label, placeholder, queryKey, searchFn, renderOption, getLabel, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: [queryKey, debounced],
    queryFn: () => searchFn(debounced),
    enabled: open && debounced.length > 0
  });

  if (value) {
    return (
      <div>
        {label && <label className="label">{label}</label>}
        <div className="input flex items-center justify-between">
          <span className="truncate">{getLabel(value)}</span>
          <button type="button" onClick={() => onChange(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="input pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && query.length > 0 && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card-hover">
            {isFetching && <p className="px-3 py-2 text-sm text-slate-400">Searching...</p>}
            {!isFetching && (!data || data.length === 0) && <p className="px-3 py-2 text-sm text-slate-400">No results found.</p>}
            {(data || []).map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => { onChange(item); setOpen(false); setQuery(''); }}
              >
                {renderOption(item)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
