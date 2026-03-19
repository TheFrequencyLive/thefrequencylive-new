import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const event = JSON.parse(body);
    
    console.log('PayPal Webhook:', event.event_type, event.resource?.id);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event.resource);
        break;
      case 'CHECKOUT.ORDER.APPROVED':
        console.log('Order approved:', event.resource.id);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        console.error('Payment denied:', event.resource.id);
        break;
      default:
        console.log('Unhandled event:', event.event_type);
    }

    return new Response('Webhook processed', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Error logged', { status: 200 });
  }
};

async function handlePaymentCompleted(resource) {
  const orderId = resource.id;
  
  const { data: existing } = await supabase
    .from('pending_orders')
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'completed')
    .single();
    
  if (existing) {
    console.log('Order already processed:', orderId);
    return;
  }
  
  console.log('Processing completed payment:', orderId);
}