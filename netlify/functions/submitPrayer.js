import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const data = await req.json();
    
    const { data: result, error } = await supabase
      .from('prayer_requests')
      .insert([{
        name: data.name || 'Anonymous',
        email: data.email,
        location: data.location || 'Unknown',
        category: data.category,
        prayer_text: data.prayer_text,
        is_public: data.is_public,
        status: 'new',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: result[0].id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Submit prayer error:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit prayer' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};