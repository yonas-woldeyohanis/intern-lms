import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, options = [], placeholder = 'Select...', className = '', id, ...rest }, ref) => {
  const selectId = id || rest.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="label">{label}</label>}
      <select id={selectId} ref={ref} className={`input ${error ? 'border-danger-500 focus:ring-danger-500' : ''} ${className}`} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;

