import { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';

/**
 * ComboboxField — type to filter existing options OR type a custom free-text value.
 * 
 * Props:
 *   label, error      – same as Input component
 *   options           – [{ value: number, label: string }]
 *   value             – { id: number|null, text: string }
 *   onChange          – called with { id, text } whenever selection changes
 *   placeholder
 *   creatable         – if true, show "Create …" hint when no match found
 */
const ComboboxField = forwardRef(({
  label,
  error,
  options = [],
  value = { id: null, text: '' },
  onChange,
  placeholder = 'Type or select…',
  creatable = true,
  name,
  id
}, ref) => {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(value.text || '');
  const containerRef = useRef(null);

  // Sync external value text into input when value.text changes (e.g. form reset)
  useEffect(() => {
    setInputText(value.text || '');
  }, [value.text]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(inputText.toLowerCase())
  );

  const exactMatch = options.find(
    (o) => o.label.toLowerCase() === inputText.toLowerCase()
  );

  function handleInputChange(e) {
    const text = e.target.value;
    setInputText(text);
    setOpen(true);
    // Clear the id since user is now typing freely
    onChange({ id: null, text });
  }

  function handleSelect(option) {
    setInputText(option.label);
    setOpen(false);
    onChange({ id: option.value, text: option.label });
  }

  function handleCreateNew() {
    setOpen(false);
    onChange({ id: null, text: inputText });
  }

  function handleFocus() {
    setOpen(true);
  }

  const showCreateHint = creatable && inputText.trim() && !exactMatch;

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {value.id === null && value.text && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              New — will be created
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type="text"
          autoComplete="off"
          value={inputText}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`input pr-9 ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        {open && (filtered.length > 0 || showCreateHint) && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 max-h-52 overflow-y-auto">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(option); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Check
                  className={`h-3.5 w-3.5 shrink-0 ${value.id === option.value ? 'text-brand-500' : 'opacity-0'}`}
                />
                {option.label}
              </button>
            ))}

            {showCreateHint && (
              <>
                {filtered.length > 0 && <div className="mx-3 border-t border-slate-100 dark:border-slate-800" />}
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleCreateNew(); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  Use "<span className="font-semibold">{inputText}</span>" as new entry
                </button>
              </>
            )}

            {filtered.length === 0 && !showCreateHint && (
              <div className="px-3 py-3 text-sm text-slate-400">No results found.</div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
});

ComboboxField.displayName = 'ComboboxField';
export default ComboboxField;
