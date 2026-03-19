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
    const { product, buyerEmail } = await req.json();
    
    if (!product || !buyerEmail) {
      return new Response(JSON.stringify({ error: 'Missing product or email' }), { status: 400 });
    }

    const token = await getPayPalAccessToken();
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: product.price
        },
        description: product.name,
        custom_id: product.sku,
        invoice_id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }],
      application_context: {
        brand_name: 'The Frequency Live',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: 'https://thefrequencylive.org/download-success',
        cancel_url: 'https://thefrequencylive.org/#resources'
      },
      payer: {
        email_address: buyerEmail
      }
    };

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const order = await response.json();
    
    if (!response.ok) {
      console.error('PayPal order creation failed:', order);
      return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500 });
    }

    const { error: dbError } = await supabase
      .from('pending_orders')
      .insert([{
        order_id: order.id,
        product_sku: product.sku,
        product_name: product.name,
        buyer_email: buyerEmail,
        file_name: product.file,
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

    if (dbError) {
      console.error('Failed to store pending order:', dbError);
    }

    return new Response(JSON.stringify({ id: order.id, status: order.status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create order error:', error);
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