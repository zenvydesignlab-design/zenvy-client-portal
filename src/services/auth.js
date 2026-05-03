import { requireSupabase } from './supabaseClient';

export async function getProfileByUserId(userId) {
  const supabase = requireSupabase();
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('User profile not found. Add this auth user to the public.users table.');
    throw error;
  }
  return profile;
}

export async function getCurrentProfile() {
  const supabase = requireSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const authUser = sessionData.session?.user;
  if (!authUser) return null;
  return getProfileByUserId(authUser.id);
}

export async function signInWithEmail({ email, password }) {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  try {
    return await getProfileByUserId(data.user.id);
  } catch (error) {
    if (error.message.includes('User profile not found')) {
      throw new Error('Login succeeded, but no role profile exists for this user.');
    }
    throw error;
  }
}

export async function signOut() {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
