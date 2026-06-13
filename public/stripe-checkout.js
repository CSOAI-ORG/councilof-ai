/**
 * Stripe Checkout Integration for AI Safety Empire
 * Integrates with all 11 platforms
 */

// Stripe publishable key (replace with your actual key)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_YOUR_KEY_HERE';

// Product Price IDs from Stripe
const PRICE_IDS = {
  professional_monthly: 'price_1QVkTYBqQ3n9Ug8OOqbVGnXN',
  professional_yearly: 'price_1QVkTYBqQ3n9Ug8OEVuCQlGg',
  business_monthly: 'price_1QVkTYBqQ3n9Ug8OXGzLdWGZ',
  business_yearly: 'price_1QVkTYBqQ3n9Ug8OYgzGXGGG',
  enterprise_monthly: 'price_1QVkTYBqQ3n9Ug8OzGGGGGGG',
  enterprise_yearly: 'price_1QVkTYBqQ3n9Ug8OzGGGGGGH'
};

// Initialize Stripe
const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);

/**
 * Create checkout session and redirect to Stripe
 */
async function createCheckoutSession(tier, billing = 'monthly') {
  try {
    // Get price ID
    const priceKey = `${tier}_${billing}`;
    const priceId = PRICE_IDS[priceKey];
    
    if (!priceId) {
      throw new Error(`Invalid tier or billing period: ${tier}, ${billing}`);
    }
    
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    // Create checkout session via your backend
    const response = await fetch('https://your-api.railway.app/api/v1/stripe/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: priceId,
        tier: tier,
        billing: billing,
        success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/pricing`
      })
    });
    
    const session = await response.json();
    
    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id
    });
    
    if (result.error) {
      alert(result.error.message);
      button.textContent = originalText;
      button.disabled = false;
    }
    
  } catch (error) {
    console.error('Checkout error:', error);
    alert('An error occurred. Please try again.');
    button.textContent = originalText;
    button.disabled = false;
  }
}

/**
 * Handle billing toggle (monthly/yearly)
 */
function toggleBilling() {
  const toggle = document.getElementById('billing-toggle');
  const isYearly = toggle.checked;
  
  // Update all pricing displays
  document.querySelectorAll('[data-monthly-price]').forEach(el => {
    const monthlyPrice = el.dataset.monthlyPrice;
    const yearlyPrice = el.dataset.yearlyPrice;
    el.textContent = isYearly ? yearlyPrice : monthlyPrice;
  });
  
  // Update all buttons
  document.querySelectorAll('[data-checkout-button]').forEach(btn => {
    btn.dataset.billing = isYearly ? 'yearly' : 'monthly';
  });
  
  // Update savings badges
  document.querySelectorAll('[data-savings]').forEach(badge => {
    badge.style.display = isYearly ? 'block' : 'none';
  });
}

/**
 * Initialize checkout buttons
 */
function initializeCheckout() {
  // Add click handlers to all checkout buttons
  document.querySelectorAll('[data-checkout-button]').forEach(button => {
    button.addEventListener('click', (event) => {
      const tier = button.dataset.tier;
      const billing = button.dataset.billing || 'monthly';
      createCheckoutSession(tier, billing);
    });
  });
  
  // Add billing toggle handler
  const billingToggle = document.getElementById('billing-toggle');
  if (billingToggle) {
    billingToggle.addEventListener('change', toggleBilling);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCheckout);
} else {
  initializeCheckout();
}

/**
 * Success page - verify session and show confirmation
 */
async function verifyCheckoutSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');
  
  if (!sessionId) return;
  
  try {
    const response = await fetch(`https://your-api.railway.app/api/v1/stripe/verify-session/${sessionId}`);
    const session = await response.json();
    
    // Display success message
    document.getElementById('customer-email').textContent = session.customer_email;
    document.getElementById('subscription-tier').textContent = session.metadata.tier;
    document.getElementById('jabl-tokens').textContent = session.metadata.jabl_tokens;
    
  } catch (error) {
    console.error('Verification error:', error);
  }
}

// Run verification on success page
if (window.location.pathname.includes('/success')) {
  verifyCheckoutSession();
}

