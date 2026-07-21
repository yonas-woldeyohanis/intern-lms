const STYLES = {
  success: 'bg-success-500/10 text-success-600 dark:text-success-500',
  danger: 'bg-danger-500/10 text-danger-600 dark:text-danger-500',
  warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-500',
  info: 'bg-brand-500/10 text-brand-700 dark:text-brand-300',
  neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
};

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return <span className={`badge ${STYLES[variant] || STYLES.neutral} ${className}`}>{children}</span>;
}
