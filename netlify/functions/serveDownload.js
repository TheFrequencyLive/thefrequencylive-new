import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (req, context) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing download token' }), { status: 400 });
  }

  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from('download_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired download link' }), { status: 403 });
    }

    const filePath = path.join(process.cwd(), 'downloads', tokenData.file_name);
    
    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    await supabase
      .from('download_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${tokenData.file_name}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    return new Response(JSON.stringify({ error: 'Download failed' }), { status: 500 });
  }
};