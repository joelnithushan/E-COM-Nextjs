'use client';

import { useEffect } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Alert variant="error" title="Something went wrong!">
          <p className="mb-4">{error.message || 'An unexpected error occurred'}</p>
          <Button onClick={reset} variant="primary">
            Try again
          </Button>
        </Alert>
      </div>
    </div>
  );
}




