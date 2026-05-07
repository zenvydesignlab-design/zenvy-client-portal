import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCurrentProfile, getProfileByUserId, signInWithEmail, signOut as signOutService } from '../services/auth';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadedProfileId = useRef('');

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getCurrentProfile();
      loadedProfileId.current = profile?.id || '';
      setUser(profile);
      return profile;
    } catch (error) {
      if (isSupabaseConfigured) toast.error(error.message || 'Unable to load profile');
      loadedProfileId.current = '';
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessionUser = useCallback(async (session) => {
    try {
      if (!session?.user) {
        loadedProfileId.current = '';
        setUser(null);
        return null;
      }
      if (loadedProfileId.current === session.user.id) return null;
      const profile = await getProfileByUserId(session.user.id);
      loadedProfileId.current = profile.id;
      setUser(profile);
      return profile;
    } catch (error) {
      if (isSupabaseConfigured) toast.error(error.message || 'Unable to load profile');
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    
    const init = async () => {
      setLoading(true);
      await refreshUser();
      if (active) setLoading(false);
    };
    
    init();
    
    if (!isSupabaseConfigured) return undefined;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (active) loadSessionUser(session);
      } else if (event === 'SIGNED_OUT') {
        if (active) {
          loadedProfileId.current = '';
          setUser(null);
        }
      }
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe();
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
