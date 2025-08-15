"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

interface AuthRedirectProps {
  children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session } = await authClient.getSession();
        
        if (session?.user?.role) {
          const currentPath = window.location.pathname;
          
          // Only redirect if user is on login/signup pages
          if (currentPath === '/login' || currentPath === '/signup') {
            switch (session.user.role) {
              case 'admin':
                router.push('/admin');
                break;
              case 'facility_owner':
                router.push('/owner');
                break;
              default:
                router.push('/');
                break;
            }
          }
        }
      } catch (error) {
        // Ignore auth errors on public pages
        console.log('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
