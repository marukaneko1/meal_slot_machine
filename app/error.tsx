'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/20 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Oops!</h1>
        <h2 className="text-xl text-gray-400 mb-6">Something went wrong</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          An unexpected error occurred. Please try again or go back to the home page.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" onClick={reset}>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="secondary">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-gray-600">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
