import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (req, context) => {
  try {
    const { data: testimonies, error } = await supabase
      .from('testimonies')
      .select('submitter_name, location, testimony_text, category')
      .eq('is_featured', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    return new Response(JSON.stringify({ testimonies }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get testimonies error:', error);
    return new Response(JSON.stringify({ error: 'Failed to load testimonies' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};