import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing Supabase Edge Function environment variables.');
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized.');

    const { data: requester, error: requesterError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (requesterError || requester?.role !== 'admin') {
      throw new Error('Only admins can create clients.');
    }

    const { email, password, role = 'client' } = await req.json();
    if (!email || !password) throw new Error('Email and password are required.');
    if (!['admin', 'client'].includes(role)) throw new Error('Invalid role.');

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;

    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .upsert({
        id: created.user.id,
        email,
        role,
      })
      .select()
      .single();
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ user: profile }), {
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
