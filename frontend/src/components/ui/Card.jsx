export default function Card({ children, className = '', title, action }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

