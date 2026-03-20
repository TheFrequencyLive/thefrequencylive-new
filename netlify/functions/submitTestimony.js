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
    
    // Validate required fields
    if (!data.submitter_name || !data.testimony_text) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Name and testimony are required' })
      };
    }
    
    const { data: result, error } = await supabase
      .from('testimonies')
      .insert([{
        submitter_name: data.submitter_name,
        email: data.email,             // NEW: Email for testimony
        phone: data.phone,             // NEW: Phone number
        location: data.location || 'Unknown',
        testimony_text: data.testimony_text,
        category: data.category || 'Other',
        is_featured: false,
        is_approved: false,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // Notify admin of new testimony
    await notifyAdmin('New Testimony Submitted', {
      name: data.submitter_name,
      email: data.email,
      phone: data.phone,
      category: data.category,
      preview: data.testimony_text.substring(0, 100) + '...'
    });

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

async function notifyAdmin(subject, details) {
  console.log(`📧 ADMIN NOTIFICATION: ${subject}`, details);
}
