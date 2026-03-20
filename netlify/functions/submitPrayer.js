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
    if (!data.prayer_text) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Prayer request is required' })
      };
    }
    
    const { data: result, error } = await supabase
      .from('prayer_requests')
      .insert([{
        name: data.name || 'Anonymous',
        email: data.email,
        phone: data.phone,           // NEW: Phone number
        location: data.location || 'Unknown',
        category: data.category,
        prayer_text: data.prayer_text,
        is_public: data.is_public,
        status: 'new',
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // Optional: Send notification email to admin
    await notifyAdmin('New Prayer Request', {
      name: data.name || 'Anonymous',
      email: data.email,
      phone: data.phone,
      category: data.category,
      prayer: data.prayer_text.substring(0, 100) + '...'
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: result[0].id })
    };

  } catch (error) {
    console.error('Submit prayer error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Failed to submit prayer' })
    };
  }
};

// Admin notification helper
async function notifyAdmin(subject, details) {
  // Optional: Send email to admin@thefrequencylive.org
  // Implementation depends on your email service
  console.log(`📧 ADMIN NOTIFICATION: ${subject}`, details);
}
