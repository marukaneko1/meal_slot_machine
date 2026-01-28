import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slot-accent/50 mb-6">
          <Dices className="w-10 h-10 text-gray-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-xl text-gray-400 mb-6">Page not found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="gold">
            <Dices className="w-4 h-4" />
            Go to Spin
          </Button>
        </Link>
      </div>
    </div>
  );
}
