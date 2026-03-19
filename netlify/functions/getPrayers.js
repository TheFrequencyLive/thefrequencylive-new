import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (req, context) => {
  try {
    const { data: prayers, error } = await supabase
      .from('prayer_requests')
      .select('name, prayer_text, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(2);

    if (error) throw error;

    return new Response(JSON.stringify({ prayers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get prayers error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load prayers' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};