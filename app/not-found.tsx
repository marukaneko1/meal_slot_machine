import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-display font-bold text-accent mb-4">404</p>
        <h1 className="heading-2 mb-2">Page not found</h1>
        <p className="body-base mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">
              <Home className="w-4 h-4" />
              Go home
            </Button>
          </Link>
          <Link href="/library">
            <Button variant="secondary">
              <Search className="w-4 h-4" />
              Browse library
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
