import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export function useAuthRedirect() {
  const router = useRouter();

  const redirectToLogin = (returnUrl?: string) => {
    const currentUrl = returnUrl || window.location.pathname + window.location.search;
    const loginUrl = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;
    router.push(loginUrl);
  };

  const requireAuth = async (action: () => void | Promise<void>, returnUrl?: string) => {
    try {
      const { data: session } = await authClient.getSession();
      
      if (!session?.user) {
        toast.error('Please sign in to continue');
        redirectToLogin(returnUrl);
        return false;
      }
      
      await action();
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      toast.error('Please sign in to continue');
      redirectToLogin(returnUrl);
      return false;
    }
  };

  const checkAuthForBooking = async (venueId: number | string, returnUrl?: string) => {
    const bookingUrl = returnUrl || `/venues/${venueId}/book`;
    
    return requireAuth(() => {
      router.push(bookingUrl);
    }, bookingUrl);
  };

  return {
    redirectToLogin,
    requireAuth,
    checkAuthForBooking,
  };
}
