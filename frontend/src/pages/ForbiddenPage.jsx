import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import Button from '../components/ui/Button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-6">
      <div className="rounded-full bg-danger-500/10 p-5 mb-4">
        <ShieldOff className="h-10 w-10 text-danger-500" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Access Denied</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        You don't have permission to view this page. If you believe this is an error, contact your library administrator.
      </p>
      <Link to="/"><Button className="mt-6">Return home</Button></Link>
    </div>
  );
}
