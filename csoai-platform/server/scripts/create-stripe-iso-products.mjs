import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createISOProducts() {
  try {
    // Create product
    const product = await stripe.products.create({
      name: 'ISO 42001 AI Management System Fundamentals',
      description: 'Comprehensive training on ISO/IEC 42001:2023 - the world\'s first international standard for AI management systems. Learn to implement an AIMS, manage AI risks, and prepare for certification.',
      metadata: {
        course_level: 'fundamentals',
        framework: 'iso_42001',
        duration_hours: '20',
        module_count: '8'
      }
    });

    console.log('Product created:', product.id);

    // Create prices
    const oneTime = await stripe.prices.create({
      product: product.id,
      unit_amount: 49900, // $499.00
      currency: 'usd',
      nickname: 'One-time payment'
    });

    const threeMonth = await stripe.prices.create({
      product: product.id,
      unit_amount: 19900, // $199.00/month
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1 },
      nickname: '3-month plan'
    });

    const sixMonth = await stripe.prices.create({
      product: product.id,
      unit_amount: 9900, // $99.00/month
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1 },
      nickname: '6-month plan'
    });

    const twelveMonth = await stripe.prices.create({
      product: product.id,
      unit_amount: 5900, // $59.00/month
      currency: 'usd',
      recurring: { interval: 'month', interval_count: 1 },
      nickname: '12-month plan'
    });

    console.log('\nPrice IDs created:');
    console.log('One-time:', oneTime.id);
    console.log('3-month:', threeMonth.id);
    console.log('6-month:', sixMonth.id);
    console.log('12-month:', twelveMonth.id);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createISOProducts();
