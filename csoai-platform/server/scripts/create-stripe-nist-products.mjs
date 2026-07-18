import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createNISTProducts() {
  try {
    // Create product
    const product = await stripe.products.create({
      name: 'NIST AI RMF Fundamentals',
      description: 'Master the NIST AI Risk Management Framework with comprehensive training on the four core functions (Govern, Map, Measure, Manage) and seven trustworthy AI characteristics.',
      metadata: {
        course_id: 'nist-ai-rmf-fundamentals',
        framework: 'NIST AI RMF',
        level: 'fundamentals'
      }
    });

    console.log('Product created:', product.id);

    // Create one-time price
    const priceOneTime = await stripe.prices.create({
      product: product.id,
      unit_amount: 49900, // $499.00
      currency: 'usd',
      nickname: 'One-time payment',
      metadata: { payment_type: 'one_time' }
    });

    // Create 3-month subscription
    const price3Month = await stripe.prices.create({
      product: product.id,
      unit_amount: 19900, // $199/month
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1 },
      nickname: '3-month plan',
      metadata: { payment_type: '3_month', total_months: '3' }
    });

    // Create 6-month subscription
    const price6Month = await stripe.prices.create({
      product: product.id,
      unit_amount: 9900, // $99/month
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1 },
      nickname: '6-month plan',
      metadata: { payment_type: '6_month', total_months: '6' }
    });

    // Create 12-month subscription
    const price12Month = await stripe.prices.create({
      product: product.id,
      unit_amount: 5900, // $59/month
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1 },
      nickname: '12-month plan',
      metadata: { payment_type: '12_month', total_months: '12' }
    });

    console.log('\n=== NIST AI RMF Fundamentals Stripe Price IDs ===');
    console.log('Product ID:', product.id);
    console.log('One-time:', priceOneTime.id);
    console.log('3-month:', price3Month.id);
    console.log('6-month:', price6Month.id);
    console.log('12-month:', price12Month.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createNISTProducts();
