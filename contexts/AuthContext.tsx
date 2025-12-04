import { useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Store persistent login state
      if (session) {
        await AsyncStorage.setItem('isLoggedIn', 'true');
      } else {
        await AsyncStorage.removeItem('isLoggedIn');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setSession(data.session);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || 'Innlogging feilet');
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, companyName: string) => {
    try {
      setError(null);
      console.log('Starting signup process...', { email, fullName, companyName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Ingen bruker returnert fra registrering');
      }
      
      console.log('User created successfully:', data.user.id);
      
      setSession(data.session);
      setUser(data.user);
    } catch (err: any) {
      console.error('SignUp error details:', err);
      const errorMessage = err.message || 'Registrering feilet';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      
      // Clear local storage and remove persistent login
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.clear();
    } catch (err: any) {
      setError(err.message || 'Utlogging feilet');
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('Ingen bruker er logget inn');
      }

      console.log('[Auth] Attempting to delete account:', user.id);

      const { error: rpcError } = await supabase.rpc('delete_user_account');
      
      if (rpcError) {
        console.error('[Auth] RPC error:', rpcError);
        throw rpcError;
      }

      console.log('[Auth] Account deleted successfully');
      
      setSession(null);
      setUser(null);
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.clear();
    } catch (err: any) {
      console.error('[Auth] Delete account error:', err);
      setError(err.message || 'Kunne ikke slette konto');
      throw err;
    }
  }, [user]);

  return useMemo(
    () => ({
      session,
      user,
      loading,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      error,
    }),
    [session, user, loading, signIn, signUp, signOut, deleteAccount, error]
  );
});