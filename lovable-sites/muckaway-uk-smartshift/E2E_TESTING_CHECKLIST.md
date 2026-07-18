# MuckAway.ai End-to-End Testing Checklist

**Test Date:** _______________  
**Tester:** _______________  
**Environment:** Production Preview  

---

## 1. AUTHENTICATION TESTING

### 1.1 New User Signup
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 1.1.1 | Navigate to signup | Go to `/auth` → Click "Sign Up" tab | Sign up form displays | ☐ |
| 1.1.2 | Weak password rejected | Enter password "abc123" | Error: "Password must be at least 8 characters" | ☐ |
| 1.1.3 | Password strength indicator | Enter progressively stronger passwords | Strength bar updates (Weak → Medium → Strong) | ☐ |
| 1.1.4 | Terms checkbox required | Fill form, leave checkbox unchecked, submit | Error: "You must accept Terms of Service" | ☐ |
| 1.1.5 | Successful signup | Fill valid email, strong password, check terms, submit | Account created, redirected to dashboard | ☐ |
| 1.1.6 | Profile auto-created | After signup, check Profile page | Profile exists with user_id | ☐ |

### 1.2 User Sign In
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 1.2.1 | Invalid credentials | Enter wrong email/password | Error: "Invalid login credentials" | ☐ |
| 1.2.2 | Valid credentials | Enter correct email/password | Login successful, redirected to dashboard | ☐ |
| 1.2.3 | Session persistence | Close browser, reopen, go to `/dashboard` | Still logged in | ☐ |

### 1.3 Password Reset
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 1.3.1 | Forgot password link | Click "Forgot Password?" on login | Password reset form displays | ☐ |
| 1.3.2 | Reset email sent | Enter valid email, submit | Success message: "Check your email" | ☐ |

### 1.4 MFA (Multi-Factor Authentication)
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 1.4.1 | MFA enrollment | Go to Profile → Enable MFA | QR code displays for authenticator app | ☐ |
| 1.4.2 | MFA verification | Scan QR, enter 6-digit code | MFA successfully enabled | ☐ |
| 1.4.3 | Login with MFA | Sign out, sign in again | Prompted for MFA code after password | ☐ |

### 1.5 Sign Out
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 1.5.1 | Sign out | Click user menu → Sign Out | Redirected to homepage, session cleared | ☐ |

---

## 2. SUBSCRIPTION & PAYMENTS

### 2.1 Pricing Page
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 2.1.1 | View pricing | Go to `/subscribe` | Three tiers display: Starter (£29), Professional (£79), Enterprise (£199) | ☐ |
| 2.1.2 | Currency display | Check prices | Shows correct currency for detected region | ☐ |

### 2.2 Checkout Flow
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 2.2.1 | Unauthenticated checkout | Click "Get Starter" without login | Redirected to `/auth` first | ☐ |
| 2.2.2 | Start checkout | Login, click "Get Professional" | Stripe checkout page opens | ☐ |
| 2.2.3 | Test payment | Use card `4242 4242 4242 4242`, any future date, any CVC | Payment succeeds | ☐ |
| 2.2.4 | Success redirect | Complete payment | Redirected to `/payment-success` | ☐ |
| 2.2.5 | Subscription active | Go to Dashboard | Shows subscription status as active | ☐ |

### 2.3 Feature Gating
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 2.3.1 | Starter restrictions | With Starter subscription, try Voice AI | Shows upgrade prompt (Voice AI requires Professional) | ☐ |
| 2.3.2 | Professional access | With Professional subscription, try Voice AI | Voice AI accessible | ☐ |
| 2.3.3 | Usage limits | Check usage metrics on Dashboard | Shows jobs/AI requests used vs limit | ☐ |

### 2.4 Customer Portal
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 2.4.1 | Manage subscription | Click "Manage Subscription" on Dashboard | Stripe Customer Portal opens | ☐ |
| 2.4.2 | Cancel subscription | In portal, click Cancel | Subscription marked for cancellation | ☐ |

---

## 3. AI FEATURES

### 3.1 AI Spoil Classifier
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 3.1.1 | Navigate to classifier | Go to `/ai-tools` → AI Spoil Classifier tab | Classifier form displays | ☐ |
| 3.1.2 | Upload image | Upload photo of soil/spoil | Image preview displays | ☐ |
| 3.1.3 | Get classification | Click "Analyze" | Returns material type, EWC code, confidence %, disposal recommendation | ☐ |
| 3.1.4 | Generate quote | After classification, click "Get Quote" | Quote generated with pricing | ☐ |
| 3.1.5 | Usage tracked | Check Dashboard usage widget | AI requests count incremented | ☐ |

### 3.2 Smart Chatbot
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 3.2.1 | Open chatbot | Go to `/ai-tools` → AI Chatbot tab | Chat interface displays | ☐ |
| 3.2.2 | Send message | Type "How much to dispose 10 tonnes of clay?" | AI responds with pricing info | ☐ |
| 3.2.3 | Streaming response | Send another message | Response streams token-by-token | ☐ |
| 3.2.4 | Feedback buttons | After AI response | Thumbs up/down buttons appear | ☐ |
| 3.2.5 | Submit feedback | Click thumbs up | Feedback recorded (no error) | ☐ |

### 3.3 Voice AI (MuckBot Pro)
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 3.3.1 | Access Voice AI | Go to `/ai-tools` → Voice AI tab | Voice interface displays | ☐ |
| 3.3.2 | Feature gate check | Without Professional subscription | Shows upgrade prompt | ☐ |
| 3.3.3 | Start recording | With Professional sub, click microphone | Recording indicator shows | ☐ |
| 3.3.4 | Voice command | Say "I need to dispose 20 tonnes of topsoil from London" | AI processes and responds with quote | ☐ |

### 3.4 Revolutionary Image Analyzer
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 3.4.1 | Access analyzer | Go to `/ai-tools` → Advanced Image Analysis tab | Upload interface displays | ☐ |
| 3.4.2 | Multi-image upload | Upload 3-5 different soil images | All images display in grid | ☐ |
| 3.4.3 | Batch analysis | Click "Analyze All" | Each image analyzed with results | ☐ |
| 3.4.4 | Risk assessment | Check results | Shows contamination risk level | ☐ |

### 3.5 Weighbridge OCR
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 3.5.1 | Access OCR | Go to `/ai-tools` → Weighbridge OCR tab | OCR upload interface displays | ☐ |
| 3.5.2 | Upload ticket | Upload weighbridge ticket image | Image displays | ☐ |
| 3.5.3 | Extract data | Click "Extract Data" | Weight, date, vehicle reg extracted | ☐ |

---

## 4. STOCK MANAGEMENT (NEW)

### 4.1 Depots
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 4.1.1 | View depots | Go to `/depots` | List of depots displays | ☐ |
| 4.1.2 | Create depot | Click "Add Depot", fill form, save | New depot appears in list | ☐ |
| 4.1.3 | Edit depot | Click edit on depot, change name, save | Name updated | ☐ |
| 4.1.4 | Delete depot | Click delete on depot | Depot removed (if no stock) | ☐ |

### 4.2 Material Types
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 4.2.1 | View materials | Go to `/materials` | Material catalog displays | ☐ |
| 4.2.2 | Create material | Click "Add Material", enter name, code, EWC, prices | Material created | ☐ |
| 4.2.3 | Set pricing | Edit material, set buy/sell prices | Prices saved | ☐ |

### 4.3 Stock Levels
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 4.3.1 | View stock | Go to `/stock` | Stock levels by depot display | ☐ |
| 4.3.2 | Filter by depot | Select depot from dropdown | Shows only that depot's stock | ☐ |
| 4.3.3 | Low stock warning | Check material below min level | Warning indicator shows | ☐ |

### 4.4 Stock Movements
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 4.4.1 | View movements | Go to `/stock-movements` | Movement history displays | ☐ |
| 4.4.2 | Record stock in | Click "Add Movement" → Stock In | Stock level increases | ☐ |
| 4.4.3 | Record stock out | Click "Add Movement" → Stock Out | Stock level decreases | ☐ |
| 4.4.4 | Transfer stock | Click "Transfer" between depots | Source decreases, destination increases | ☐ |

### 4.5 Aggregate Sales
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 4.5.1 | View sales | Go to `/sales` | Sales list displays | ☐ |
| 4.5.2 | Create sale | Click "New Sale", add customer, items | Sale created with total | ☐ |
| 4.5.3 | Confirm sale | Change status to Confirmed | Stock levels updated | ☐ |

### 4.6 Purchase Orders
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 4.6.1 | View POs | Go to `/purchases` | Purchase orders list displays | ☐ |
| 4.6.2 | Create PO | Click "New PO", select supplier, add items | PO created | ☐ |
| 4.6.3 | Receive goods | Mark items as received | Stock levels increase | ☐ |

### 4.7 Suppliers
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 4.7.1 | View suppliers | Go to `/suppliers` | Supplier list displays | ☐ |
| 4.7.2 | Add supplier | Click "Add Supplier", fill form | Supplier created | ☐ |

---

## 5. OPERATIONS

### 5.1 Schedule (Gantt)
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 5.1.1 | View schedule | Go to `/schedule` | Gantt chart displays | ☐ |
| 5.1.2 | Create block | Click on timeline, add job block | Block appears on timeline | ☐ |
| 5.1.3 | Assign driver | Drag job to driver row | Job assigned to driver | ☐ |
| 5.1.4 | Change date | Drag block to different date | Date updated | ☐ |

### 5.2 Live Tracking
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 5.2.1 | View map | Go to `/live-tracking` | Mapbox map displays | ☐ |
| 5.2.2 | See vehicles | Check map | Vehicle markers visible | ☐ |
| 5.2.3 | Vehicle details | Click vehicle marker | Popup shows vehicle info | ☐ |
| 5.2.4 | Route optimization | Go to Route tab, select jobs, click Optimize | Optimized route displays | ☐ |

### 5.3 Subcontractors
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 5.3.1 | View directory | Go to `/subcontractors` | Subcontractor list displays | ☐ |
| 5.3.2 | Add subcontractor | Click "Add", fill form | Subcontractor created | ☐ |
| 5.3.3 | Assign job | Select job, assign to subcontractor | Assignment recorded | ☐ |
| 5.3.4 | Rate subcontractor | After job, add rating | Rating saved | ☐ |

### 5.4 Credit Management
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 5.4.1 | View credit | Go to `/credit-management` | Customer credit list displays | ☐ |
| 5.4.2 | Set credit limit | Edit customer, set limit to £5000 | Limit saved | ☐ |
| 5.4.3 | Credit warning | Customer near limit | Warning indicator shows | ☐ |
| 5.4.4 | Credit blocked | Try to create quote for over-limit customer | Quote blocked with warning | ☐ |

### 5.5 Environmental Reports
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 5.5.1 | View dashboard | Go to `/environmental` | Environmental metrics display | ☐ |
| 5.5.2 | CO2 savings | Check CO2 widget | Shows calculated savings | ☐ |
| 5.5.3 | Recycling rate | Check recycling widget | Shows percentage recycled | ☐ |
| 5.5.4 | Generate report | Click "Generate Report" | PDF/report created | ☐ |

### 5.6 Fleet Management
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 5.6.1 | View fleet | Go to `/fleet` | Vehicle list displays | ☐ |
| 5.6.2 | Add vehicle | Click "Add Vehicle", fill form | Vehicle created | ☐ |
| 5.6.3 | MOT warning | Vehicle with expiring MOT | Warning indicator shows | ☐ |

### 5.7 Driver Checks
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 5.7.1 | View checks | Go to `/driver-checks` | Daily check list displays | ☐ |
| 5.7.2 | Complete check | Fill daily check form, submit | Check recorded | ☐ |
| 5.7.3 | Report defect | Mark defect on check | Defect flagged | ☐ |

---

## 6. ADMIN DASHBOARD

### 6.1 Admin Access
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 6.1.1 | Non-admin blocked | Login as regular user, go to `/admin` | Access denied or redirect | ☐ |
| 6.1.2 | Admin access | Login as admin user, go to `/admin` | Admin dashboard displays | ☐ |

### 6.2 Platform Stats
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 6.2.1 | User count | Check admin dashboard | Shows total users | ☐ |
| 6.2.2 | Subscription breakdown | Check subscriptions widget | Shows count by tier | ☐ |
| 6.2.3 | Revenue metrics | Check revenue widget | Shows MRR/ARR | ☐ |

---

## 7. INTEGRATIONS

### 7.1 Accounting
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 7.1.1 | View integrations | Go to `/integrations` | QuickBooks/Xero options display | ☐ |
| 7.1.2 | Connect QuickBooks | Click "Connect QuickBooks" | OAuth flow starts | ☐ |
| 7.1.3 | Sync invoices | After connection, click "Sync" | Invoices synced | ☐ |

---

## 8. UI/UX & RESPONSIVE

### 8.1 Theme
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 8.1.1 | Dark mode default | Load site | Dark theme displays | ☐ |
| 8.1.2 | Toggle to light | Click theme toggle | Light theme applies | ☐ |
| 8.1.3 | Theme persistence | Refresh page | Selected theme persists | ☐ |

### 8.2 Mobile Responsive
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 8.2.1 | Mobile menu | View on mobile, click hamburger | Mobile menu opens | ☐ |
| 8.2.2 | Sidebar collapse | On tablet, view dashboard | Sidebar collapsible | ☐ |
| 8.2.3 | Forms usable | Fill forms on mobile | All inputs accessible | ☐ |
| 8.2.4 | Touch targets | Tap buttons on mobile | Buttons easily tappable (44px+) | ☐ |

### 8.3 PWA
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 8.3.1 | Install prompt | Visit on mobile Chrome | "Add to Home Screen" prompt | ☐ |
| 8.3.2 | Install app | Click install | App icon on home screen | ☐ |
| 8.3.3 | Offline access | Turn off wifi, open app | Cached content displays | ☐ |
| 8.3.4 | App shortcuts | Long-press app icon | Shows Voice AI, Image Analysis shortcuts | ☐ |

---

## 9. SECURITY

### 9.1 Authentication Security
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 9.1.1 | SQL injection | Try `'; DROP TABLE users;--` in login | Input sanitized, no error | ☐ |
| 9.1.2 | XSS prevention | Try `<script>alert('xss')</script>` in form | Script not executed | ☐ |
| 9.1.3 | Protected routes | Without login, go to `/dashboard` | Redirected to `/auth` | ☐ |

### 9.2 Data Isolation
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 9.2.1 | User A data | Login as User A, create job | Job visible to User A | ☐ |
| 9.2.2 | User B isolation | Login as User B | Cannot see User A's job | ☐ |

---

## 10. EDGE FUNCTIONS

### 10.1 Health Check
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 10.1.1 | Health endpoint | Call `/functions/v1/health-check` | Returns { status: 'healthy', database: 'ok', stripe: 'live' } | ☐ |

### 10.2 Rate Limiting
| # | Test Case | Steps | Expected Result | ✓/✗ |
|---|-----------|-------|-----------------|-----|
| 10.2.1 | AI rate limit | Make 25 rapid AI requests | Rate limit error after 20 | ☐ |

---

## TEST SUMMARY

| Category | Total Tests | Passed | Failed | Blocked |
|----------|-------------|--------|--------|---------|
| Authentication | 11 | | | |
| Payments | 9 | | | |
| AI Features | 16 | | | |
| Stock Management | 17 | | | |
| Operations | 20 | | | |
| Admin | 4 | | | |
| Integrations | 3 | | | |
| UI/UX | 8 | | | |
| Security | 4 | | | |
| Edge Functions | 2 | | | |
| **TOTAL** | **94** | | | |

---

## ISSUES FOUND

| # | Test ID | Issue Description | Severity | Status |
|---|---------|-------------------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## SIGN-OFF

**Testing Completed:** ☐ Yes  ☐ No

**Ready for Production:** ☐ Yes  ☐ No  ☐ With Issues

**Tester Signature:** _______________

**Date:** _______________

---

## NOTES

_Additional observations, recommendations, or concerns:_

