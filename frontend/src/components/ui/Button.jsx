import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
};

export default function Button({
  children, variant = 'primary', loading = false, disabled = false, icon: Icon, type = 'button', className = '', ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
