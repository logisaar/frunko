import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Global error handler for Supabase queries
 * Handles JWT expiration and redirects to login
 */
export const handleSupabaseError = async (error: any, customMessage?: string) => {
  console.error('Supabase error:', error);

  // Check for JWT expiration or authentication errors
  if (
    error?.code === 'PGRST301' || 
    error?.code === 'PGRST303' ||
    error?.message?.toLowerCase().includes('jwt') ||
    error?.message?.toLowerCase().includes('expired') ||
    error?.message?.toLowerCase().includes('invalid')
  ) {
    toast.error('Your session has expired. Please sign in again.');
    
    // Sign out and redirect
    await supabase.auth.signOut();
    setTimeout(() => {
      window.location.href = '/auth';
    }, 1500);
    
    return true; // Handled
  }

  // Show custom or generic error message
  if (customMessage) {
    toast.error(customMessage);
  } else {
    toast.error(error?.message || 'An error occurred');
  }

  return false; // Not handled
};

/**
 * Wrapper for Supabase queries with automatic error handling
 */
export const withErrorHandling = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      await handleSupabaseError(error, errorMessage);
      return null;
    }
    
    return data;
  } catch (err) {
    await handleSupabaseError(err, errorMessage);
    return null;
  }
};
