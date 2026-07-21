import { Component } from 'react';
import { AlertOctagon } from 'lucide-react';
import Button from './ui/Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this could forward to a logging endpoint.
    console.error('UI ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
          <div className="rounded-full bg-danger-500/10 p-4 mb-4">
            <AlertOctagon className="h-8 w-8 text-danger-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Something went wrong</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            An unexpected error occurred while rendering this page. Try reloading — if the problem persists, contact IT support.
          </p>
          <Button className="mt-5" onClick={() => window.location.reload()}>Reload page</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
