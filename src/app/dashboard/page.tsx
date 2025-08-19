'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { employees } from '@/lib/data';
import type { Employee } from '@/lib/types';

// Assume current user is 'Alex Johnson' who is a Manager
const CURRENT_USER_ID = '1';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const currentUser = employees.find(e => e.id === CURRENT_USER_ID);
    
    if (currentUser?.role === 'Manager') {
      router.replace('/dashboard/admin');
    } else {
      router.replace('/dashboard/user');
    }
  }, [router]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>Loading your dashboard...</p>
    </div>
  );
}
