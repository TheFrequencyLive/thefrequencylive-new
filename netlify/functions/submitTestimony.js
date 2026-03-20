const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Log incoming request
  console.log('Event:', event.httpMethod, event.body);
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('Parsed data:', data);
    
    // Build insert object dynamically (only include fields that exist)
    const insertData = {
      submitter_name: data.submitter_name,
      testimony_text: data.testimony_text,
      is_featured: false,
      is_approved: false,
      created_at: new Date().toISOString()
    };
    
    // Only add location if provided
    if (data.location) insertData.location = data.location;
    
    // Only add category if column exists (check first)
    // Skip category for now to avoid error
    
    console.log('Inserting:', insertData);
    
    const { data: result, error } = await supabase
      .from('testimonies')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }

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
      body: JSON.stringify({ error: error.message || 'Failed to submit testimony' })
    };
  }
};
