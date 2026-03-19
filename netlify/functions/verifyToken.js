import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (req, context) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response(JSON.stringify({ valid: false, error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { data: tokenData, error } = await supabase
      .from('download_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !tokenData) {
      return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      valid: true, 
      filename: tokenData.file_name,
      email: tokenData.email
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verify token error:', error);
    return new Response(JSON.stringify({ valid: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};