import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, hint, className = '', id, ...rest }, ref) => {
  const inputId = id || rest.name;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="label">{label}</label>}
      <input id={inputId} ref={ref} className={`input ${error ? 'border-danger-500 focus:ring-danger-500' : ''} ${className}`} {...rest} />
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
