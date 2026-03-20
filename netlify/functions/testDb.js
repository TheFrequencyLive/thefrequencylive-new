const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    // Test 1: Check if we can connect
    const { data: tables, error: tablesError } = await supabase
      .from('testimonies')
      .select('count(*)', { count: 'exact', head: true });
    
    if (tablesError) throw tablesError;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Database connection OK',
        testimoniesCount: tables
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        code: error.code 
      })
    };
  }
};