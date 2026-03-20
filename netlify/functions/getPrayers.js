const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const { data: prayers, error } = await supabase
      .from('prayer_requests')
      .select('name, prayer_text, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(2);

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prayers })
    };

  } catch (error) {
    console.error('Get prayers error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to load prayers' })
    };
  }
};
