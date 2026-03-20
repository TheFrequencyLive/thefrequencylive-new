const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: result[0].id })
    };

  } catch (error) {
    console.error('Submit testimony error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to submit testimony' })
    };
  }
};
