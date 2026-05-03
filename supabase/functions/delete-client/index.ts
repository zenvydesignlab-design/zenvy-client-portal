import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error('Missing Supabase function environment variables.');

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: requesterAuth, error: requesterAuthError } = await userClient.auth.getUser();
    if (requesterAuthError || !requesterAuth.user) throw new Error('Unauthorized.');

    const { data: requester, error: requesterError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', requesterAuth.user.id)
      .single();
    if (requesterError || requester?.role !== 'admin') throw new Error('Only admins can delete clients.');

    const { userId } = await req.json();
    if (!userId) throw new Error('userId is required.');

    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;
    if (profile.role !== 'client') throw new Error('Only client accounts can be deleted here.');

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
