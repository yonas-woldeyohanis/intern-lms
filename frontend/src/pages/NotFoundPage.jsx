import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-6">
      <div className="rounded-full bg-brand-500/10 p-5 mb-4">
        <SearchX className="h-10 w-10 text-brand-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/"><Button className="mt-6">Return home</Button></Link>
    </div>
  );
}
