# Rewardful Tracking Code for FishKeeper.ai

## API Key
`5192b4`

## Step 1: JavaScript Snippet (Add to <head> tag)

```html
<script>(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');</script>
<script async src='https://r.wdfl.co/rw.js' data-rewardful='5192b4'></script>
```

## Step 2: Pass referral ID to Stripe Checkout

```javascript
var checkoutParams = {
  lineItems: [{ price: price, quantity: 1 }],
  mode: mode,
  successUrl: 'https://www.example.com/checkout?result=success',
  cancelUrl: 'https://www.example.com/checkout/?result=cancel'
}

if (window.Rewardful && window.Rewardful.referral) {
  checkoutParams.clientReferenceId = window.Rewardful.referral;
}

stripe.redirectToCheckout(checkoutParams);
```

## Campaign Details
- **Campaign Name:** Friends of FishKeeper.ai
- **Commission:** 30% recurring for 12 months
- **Affiliate Signup URL:** https://hydra-agent.getrewardful.com/signup
