const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const { data: testimonies, error } = await supabase
      .from('testimonies')
      .select('submitter_name, location, testimony_text, category')
      .eq('is_featured', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testimonies })
    };

  } catch (error) {
    console.error('Get testimonies error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load testimonies' })
    };
  }
};
