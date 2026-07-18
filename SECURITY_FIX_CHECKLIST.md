# SECURITY FIXES — DO TODAY

## 1. ROTATE STRIPE KEY (15 minutes)

### Step 1: Find the hardcoded key
File: `~/clawd/create-stripe-products-live.py` line 13 (uses `os.environ.get` — already secure)

### Step 2: Check if key was committed to git
```bash
cd ~/clawd
git log --all --full-history -- create-stripe-products-live.py
git log --all -p -- create-stripe-products-live.py | grep "sk_live"
```

If output shows anything, the key is in git history.

### Step 3: Rotate the key (in Stripe Dashboard)
1. Go to https://dashboard.stripe.com/apikeys
2. Find the key that starts with same prefix as hardcoded one
3. Click "Roll key"
4. This invalidates the old key immediately
5. Copy the new key

### Step 4: Update the file
Replace hardcoded key with:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### Step 5: Add to .gitignore
```
echo "create-stripe-products-live.py" >> ~/clawd/.gitignore
```

---

## 2. REMOVE JAMES CASTLE ACCESS

### From Stripe (if he has access):
1. https://dashboard.stripe.com/settings/team
2. Find James Castle
3. Click "Remove"

### From GitHub:
1. https://github.com/CSOAI-ORG/people
2. Find James Castle
3. Change role to "No access" or remove

### From Vercel:
1. https://vercel.com/teams/team_4IkNIyYl7TtEOi9aoz17SUO7/settings/members
2. Find James Castle
3. Remove from team

---

## 3. VERIFY NO OTHER LEAKED KEYS

```bash
# Search for keys in all repos
cd ~
grep -r "sk_live" --include="*.js" --include="*.py" --include="*.ts" --include="*.json" . 2>/dev/null | grep -v node_modules
grep -r "sk_test" --include="*.js" --include="*.py" --include="*.ts" --include="*.json" . 2>/dev/null | grep -v node_modules
```

If anything found, rotate those too.
