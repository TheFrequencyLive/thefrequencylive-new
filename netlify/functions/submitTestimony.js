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
      .from('testimonies')
      .insert([{
        submitter_name: data.submitter_name,
        location: data.location || 'Unknown',
        testimony_text: data.testimony_text,
        category: data.category,
        is_featured: false,
        is_approved: false,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, id: result[0].id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Submit testimony error:', error);
    return new Response(JSON.stringify({ error: 'Failed to submit testimony' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};