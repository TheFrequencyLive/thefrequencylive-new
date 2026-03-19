import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const PAYPAL_API = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { orderID } = await req.json();
    
    const token = await getPayPalAccessToken();
    
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const captureData = await response.json();
    
    if (!response.ok || captureData.status !== 'COMPLETED') {
      console.error('Capture failed:', captureData);
      return new Response(JSON.stringify({ error: 'Payment capture failed' }), { status: 400 });
    }

    const { data: orderDetails, error: orderError } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('order_id', orderID)
      .single();

    if (orderError || !orderDetails) {
      console.error('Order not found in database:', orderError);
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    const downloadToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const { error: tokenError } = await supabase
      .from('download_tokens')
      .insert([{
        token: downloadToken,
        order_id: orderID,
        file_name: orderDetails.file_name,
        email: orderDetails.buyer_email,
        used: false,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      }]);

    if (tokenError) {
      console.error('Failed to store token:', tokenError);
    }

    await supabase
      .from('pending_orders')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('order_id', orderID);

    await sendDownloadEmail(orderDetails.buyer_email, orderDetails.product_name, downloadToken);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment captured and email sent' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Capture error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  
  const data = await response.json();
  return data.access_token;
}

function generateSecureToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

async function sendDownloadEmail(email, productName, token) {
  const downloadLink = `https://thefrequencylive.org/download?token=${token}`;
  
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: 'admin@thefrequencylive.org',
      subject: `Your ${productName} Download - The Frequency Live`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E40AF;">Thank You for Your Purchase!</h2>
          <p>You've purchased: <strong>${productName}</strong></p>
          <p>Click the button below to download your file:</p>
          <a href="${downloadLink}" 
             style="display: inline-block; padding: 16px 32px; background: #1E40AF; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
             📥 Download Now
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            This link expires in 24 hours and can be used once.<br>
            If you have any issues, contact admin@thefrequencylive.org
          </p>
        </div>
      `
    };
    
    await sgMail.send(msg);
  } else {
    console.log(`📧 DOWNLOAD EMAIL for ${email}: ${downloadLink}`);
  }
}