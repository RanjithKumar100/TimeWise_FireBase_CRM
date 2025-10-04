'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait until user data is loaded

    if (!user) {
      router.replace('/login');
    } else if (user.role === 'Admin') {
      router.replace('/dashboard/admin');
    } else if (user.role === 'Inspection') {
      router.replace('/dashboard/inspection');
    } else {
      router.replace('/dashboard/user');
    }
  }, [router, user, loading]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>Loading your dashboard...</p>
    </div>
  );
}
