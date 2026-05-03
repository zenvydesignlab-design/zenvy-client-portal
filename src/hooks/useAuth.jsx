import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCurrentProfile, getProfileByUserId, signInWithEmail, signOut as signOutService } from '../services/auth';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getCurrentProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      if (isSupabaseConfigured) toast.error(error.message || 'Unable to load profile');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessionUser = useCallback(async (session) => {
    setLoading(true);
    try {
      if (!session?.user) {
        setUser(null);
        return null;
      }
      const profile = await getProfileByUserId(session.user.id);
      setUser(profile);
      return profile;
    } catch (error) {
      toast.error(error.message || 'Unable to load profile');
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    refreshUser();
    if (!isSupabaseConfigured) return undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (active) loadSessionUser(session);
      }, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [loadSessionUser, refreshUser]);

  const signIn = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const profile = await signInWithEmail(credentials);
      setUser(profile);
      toast.success('Welcome back');
      return profile;
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutService();
    setUser(null);
    toast.success('Signed out');
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', signIn, signOut, refreshUser }),
    [user, loading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
