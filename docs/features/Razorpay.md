💳
RAZORPAY INTEGRATION
Complete Payment System — Where, How & All Phases
ZF Solution — Multi-Tenant Coaching ERP Platform
Project	ZF Solution (MD-Muddabir/zf-solution)
Razorpay SDK	razorpay ^2.9.x (already installed)
Use Cases Covered	3 — Subscription, Fees, In-App Purchases
Payment Modes	UPI, Cards, Net Banking, Wallets, EMI
Total Phases	15 Implementation Phases
Security	Webhook signature verification (HMAC-SHA256)
Indian Tax	GST-ready invoice generation
Environment	Test + Production keys separation
 
1. Where Razorpay Is Used in Your Project
Since you already have Razorpay installed, the first thing to understand is that Razorpay is NOT used in just one place in your SaaS. It covers three completely different payment workflows. Each workflow has its own flow, database tables, API endpoints, and frontend pages.

#	Payment Use Case	What It Pays For	Who Pays	When
1	Institute Subscription	Monthly/yearly SaaS plan (Basic/Pro/Premium)	Institute Owner	When signing up or upgrading plan
2	Student Fee Payment	Tuition fees, lab fees, exam fees	Student or Parent	When admin records fee payment
3	In-App Purchases (Future)	Premium features, extra storage, add-ons	Institute Owner	On-demand feature unlock


Most Important Rule
Use Case 1 (Subscription) is the PRIMARY Razorpay integration — this is how YOU earn money.
Use Case 2 (Fees) is a SECONDARY integration — institutes collect from their students.
Both use completely different flows, tables, and webhook handling.
NEVER mix subscription payments with student fee payments in the same code.

2. How Razorpay Works — Core Payment Flow
Before writing any code, understand the standard 3-step Razorpay payment flow. Both use cases follow this same pattern.

Universal Razorpay Payment Flow (3 Steps)
STEP 1 — YOUR BACKEND CREATES AN ORDER
   Your Node.js server calls Razorpay API → creates an order with amount + currency
   Razorpay returns: { order_id, amount, currency, receipt }
   You save this order_id in your database with status = 'pending'

STEP 2 — FRONTEND OPENS RAZORPAY CHECKOUT
   Your React frontend receives the order_id from your backend
   Opens the Razorpay popup modal using the Razorpay JS library
   User selects payment method (UPI, card, net banking, wallet, EMI)
   User completes payment on Razorpay's secure page
   Razorpay returns to your frontend: { razorpay_order_id, razorpay_payment_id, razorpay_signature }

STEP 3 — YOUR BACKEND VERIFIES PAYMENT
   Frontend sends those 3 values to your backend verification endpoint
   Backend verifies signature using HMAC-SHA256 with your KEY_SECRET
   If signature matches → payment is genuine → update database → activate service
   If signature does NOT match → payment tampered → reject → log fraud attempt

ADDITIONALLY — WEBHOOK (Backup Verification)
   Razorpay also sends a POST request to your webhook URL for every payment event
   This catches cases where the user closed the browser before verification completed
   Webhook must also verify the X-Razorpay-Signature header


2.1 Visual Architecture
[Institute Owner / Student]
        |  clicks 'Pay Now'
        ↓
[React Frontend]
        |  POST /api/payments/create-order  { amount, type: 'subscription' }
        ↓
[Node.js Backend — PaymentController]
        |  razorpay.orders.create({ amount: 200000, currency: 'INR' })
        |  saves order to DB with status = 'pending'
        ↓
[Razorpay API]  ←→  returns order_id
        ↓
[React Frontend opens Razorpay Checkout Popup]
        |  user pays
        ↓
[Razorpay returns payment_id + order_id + signature]
        ↓
[React Frontend]
        |  POST /api/payments/verify  { payment_id, order_id, signature }
        ↓
[Node.js Backend — Verify signature with HMAC-SHA256]
        |  ✅ VALID → activate subscription / update fee record → return success
        |  ❌ INVALID → reject → log fraud attempt
        ↓
[Webhook — parallel path — POST /api/payments/webhook]
        |  catches browser-close edge case
        |  re-verifies + updates DB if not already done

3. Environment Setup — Keys & Configuration
3.1 Get Your Razorpay Keys
1.	Go to https://dashboard.razorpay.com
2.	Sign up / Login with your business details
3.	Go to Settings → API Keys → Generate Test Key
4.	You get two keys: Key ID (starts with rzp_test_) and Key Secret
5.	For production: complete KYC verification, then generate Live keys (rzp_live_)

3.2 Backend .env Configuration
Add these to your backend/.env file:

# ─── RAZORPAY ──────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Set to 'test' or 'live'
RAZORPAY_ENV=test

Critical Rule — Never Expose KEY_SECRET
RAZORPAY_KEY_ID → Safe to send to frontend (needed to open checkout popup)
RAZORPAY_KEY_SECRET → NEVER send to frontend. Backend only. Used for signature verification.
RAZORPAY_WEBHOOK_SECRET → NEVER send to frontend. Used to verify webhook calls.
If KEY_SECRET is exposed → anyone can fake payment verifications → major fraud risk.


3.3 Initialize Razorpay Instance
Create a shared Razorpay instance in your config folder:

// config/razorpay.js
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;

Import this anywhere you need it:
const razorpay = require('../config/razorpay');

4. Database Design — All Payment Tables
4.1 Table: razorpay_orders
Stores every order created with Razorpay — before payment happens. This is your pre-payment record.
Column	Type	Description
id	INT PK AI	Primary key
institute_id	INT FK → institutes	Which institute this order belongs to
order_type	ENUM('subscription','student_fee','addon')	What this payment is for
reference_id	INT	FK to subscriptions.id OR student_fees.id depending on order_type
razorpay_order_id	VARCHAR(100) UNIQUE	Order ID returned by Razorpay e.g. order_XXXXXXXX
amount	INT NOT NULL	Amount in PAISE (₹2000 = 200000 paise) — Razorpay uses paise
amount_display	DECIMAL(10,2)	Amount in rupees for display e.g. 2000.00
currency	VARCHAR(10) DEFAULT 'INR'	Currency code
receipt	VARCHAR(100) UNIQUE	Your internal receipt ID for tracking
status	ENUM('pending','paid','failed','cancelled') DEFAULT 'pending'	Order payment status
notes	JSON	Optional metadata sent to Razorpay
created_at / updated_at	DATETIME	Timestamps


4.2 Table: razorpay_payments
Stores verified payment details AFTER successful payment. This is your financial record.
Column	Type	Description
id	INT PK AI	Primary key
institute_id	INT FK	Multi-tenant scope
order_id	INT FK → razorpay_orders	Links to the pre-payment order
razorpay_payment_id	VARCHAR(100) UNIQUE	Payment ID from Razorpay e.g. pay_XXXXXXXX
razorpay_order_id	VARCHAR(100)	Razorpay order ID (for easy lookup)
razorpay_signature	VARCHAR(500)	The HMAC signature received from Razorpay
signature_verified	BOOLEAN DEFAULT false	Set to true after HMAC verification passes
amount_paid	INT	Actual amount paid in paise
payment_method	VARCHAR(50)	upi / card / netbanking / wallet / emi
bank	VARCHAR(100)	Bank name if netbanking/card
wallet	VARCHAR(50)	Wallet name if wallet payment
vpa	VARCHAR(100)	UPI VPA e.g. user@upi
email	VARCHAR(255)	Payer email from Razorpay
contact	VARCHAR(20)	Payer phone number from Razorpay
paid_at	DATETIME	When payment was completed
created_at	DATETIME	When record was created


4.3 Table: subscriptions (Updated)
Your existing subscriptions table needs these Razorpay-specific columns added:
New Column	Type	Description
razorpay_order_id	VARCHAR(100)	The order created for this subscription payment
razorpay_payment_id	VARCHAR(100)	The payment ID after successful payment
payment_status	ENUM('pending','paid','failed') DEFAULT 'pending'	Payment state
amount_paid	DECIMAL(10,2)	Actual rupees paid (store this — NEVER derive from plan.price)
discount_amount	DECIMAL(10,2) DEFAULT 0	Any coupon/offer discount applied
coupon_code	VARCHAR(50)	Coupon code used if any
invoice_number	VARCHAR(50) UNIQUE	Auto-generated invoice number for GST
tax_amount	DECIMAL(10,2) DEFAULT 0	GST amount (18% of plan price)
paid_at	DATETIME	When subscription payment was confirmed


4.4 Table: student_fee_payments (New)
Tracks Razorpay payments made for student fees. Separate from subscriptions.
Column	Type	Description
id	INT PK AI	Primary key
institute_id	INT FK	Multi-tenant scope
student_fee_id	INT FK → student_fees	Which fee record this pays for
student_id	INT FK → users	Which student
razorpay_order_id	VARCHAR(100)	Razorpay order for this payment
razorpay_payment_id	VARCHAR(100)	Payment ID after success
amount_paid	DECIMAL(10,2)	Amount paid in this transaction
payment_method	VARCHAR(50)	upi / card / netbanking / wallet
payment_status	ENUM('pending','paid','failed')	Status
receipt_number	VARCHAR(50) UNIQUE	Receipt number for student
paid_at	DATETIME	Payment timestamp
collected_by	INT FK → users	Admin/manager who triggered this


4.5 Table: invoices
GST-ready invoice generated after every successful payment.
Column	Type	Description
id	INT PK AI	Primary key
institute_id	INT FK	Which institute
payment_id	INT FK → razorpay_payments	Links to payment
invoice_type	ENUM('subscription','student_fee')	Invoice category
invoice_number	VARCHAR(50) UNIQUE	e.g. INV-2025-001
invoice_date	DATE	Date of invoice
subtotal	DECIMAL(10,2)	Amount before tax
tax_percent	DECIMAL(5,2) DEFAULT 18.00	GST percentage
tax_amount	DECIMAL(10,2)	GST amount
total_amount	DECIMAL(10,2)	Final total including tax
pdf_url	VARCHAR(500)	Path to generated PDF invoice
created_at	DATETIME	Timestamp

5. Implementation Phases — Step by Step
Phase 1 — Database Migrations
Create all payment-related tables and update existing ones.

6.	Create razorpay_orders table
7.	Create razorpay_payments table
8.	ALTER subscriptions table — add 9 new Razorpay columns
9.	Create student_fee_payments table
10.	Create invoices table
11.	Add indexes:
○	INDEX on razorpay_orders(institute_id, status, order_type)
○	INDEX on razorpay_payments(razorpay_payment_id)
○	INDEX on student_fee_payments(student_fee_id)
12.	Create invoice_number auto-increment sequence or trigger

Amount Storage Rule
Razorpay works in PAISE (smallest currency unit).
₹2,000 → send 200000 to Razorpay API
₹500.50 → send 50050 to Razorpay API
In your database store DECIMAL(10,2) in RUPEES for display.
Convert: rupees_to_paise = Math.round(amount * 100)
Convert: paise_to_rupees = amount / 100


Phase 2 — Payment Service Layer
Create a dedicated service that handles all Razorpay SDK calls. This keeps payment logic out of controllers.

// services/payment.service.js
const razorpay   = require('../config/razorpay');
const crypto     = require('crypto');
const { RazorpayOrder, RazorpayPayment } = require('../models');

// ── 1. Create Order ─────────────────────────────────────
async function createOrder({ institute_id, amount_rupees, order_type,
                             reference_id, notes = {} }) {
  const amount_paise = Math.round(amount_rupees * 100);
  const receipt = `rcpt_${order_type}_${Date.now()}`;

  // Call Razorpay API
  const rzpOrder = await razorpay.orders.create({
    amount:   amount_paise,
    currency: 'INR',
    receipt,
    notes:    { institute_id, order_type, reference_id, ...notes },
  });

  // Save order to your DB
  const order = await RazorpayOrder.create({
    institute_id, order_type, reference_id,
    razorpay_order_id: rzpOrder.id,
    amount:            amount_paise,
    amount_display:    amount_rupees,
    currency:          'INR',
    receipt,
    status:            'pending',
    notes,
  });

  return { order_db_id: order.id, razorpay_order_id: rzpOrder.id,
           amount_paise, amount_rupees, receipt };
}

// ── 2. Verify Signature ─────────────────────────────────
function verifySignature({ order_id, payment_id, signature }) {
  const body = order_id + '|' + payment_id;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;  // returns true/false
}

// ── 3. Verify Webhook Signature ─────────────────────────
function verifyWebhookSignature(rawBody, receivedSignature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === receivedSignature;
}

module.exports = { createOrder, verifySignature, verifyWebhookSignature };


Phase 3 — Use Case 1: Subscription Payment APIs
This is how institutes pay you for using your SaaS. Three endpoints needed.

Endpoint A — Create Subscription Order
POST /api/subscriptions/create-order
Auth: verifyToken + allowRoles('owner')
Body: { plan_id, coupon_code (optional) }

Flow:
1. Find plan by plan_id → get price
2. If coupon_code → validate coupon → apply discount
3. Calculate: amount = plan.price - discount + GST(18%)
4. Call paymentService.createOrder({ amount, order_type:'subscription' })
5. Return: { razorpay_order_id, amount_paise, key_id, institute_name, plan_name }

Endpoint B — Verify Subscription Payment
POST /api/subscriptions/verify-payment
Auth: verifyToken + allowRoles('owner')
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id }

Flow:
1. paymentService.verifySignature(order_id, payment_id, signature)
2. If FALSE → return 400 'Payment verification failed — possible fraud'
3. If TRUE:
   a. Fetch payment details from Razorpay API (razorpay.payments.fetch)
   b. Save to razorpay_payments table with signature_verified = true
   c. Update razorpay_orders status → 'paid'
   d. Create/update subscription record:
      - plan_id, institute_id
      - subscription_start = TODAY
      - subscription_end = TODAY + plan.duration_days
      - amount_paid = actual amount (NOT plan.price)
      - payment_status = 'paid'
   e. Generate invoice → save to invoices table
   f. Send confirmation email to owner
   g. Return: { success, subscription_end, invoice_url }

Endpoint C — Subscription Webhook (Backup)
POST /api/subscriptions/webhook
Auth: NONE (public — but must verify signature)
Headers: X-Razorpay-Signature

// CRITICAL: Use raw body for webhook — NOT parsed JSON
// In app.js for this route ONLY:
app.use('/api/subscriptions/webhook',
  express.raw({ type: 'application/json' })  // raw buffer
);

Flow:
1. verifyWebhookSignature(req.body, req.headers['x-razorpay-signature'])
2. If INVALID → return 400
3. Parse event: const event = JSON.parse(req.body.toString())
4. Handle event.event:
   'payment.captured' → same as verify flow above (idempotent check)
   'payment.failed'   → update order status = 'failed', notify owner
   'order.paid'       → confirm subscription activation
5. Always return 200 quickly — process async if needed


Phase 4 — Use Case 2: Student Fee Payment APIs
This is how institutes collect fees from students online via your platform. The money goes to the INSTITUTE, not to you.

Important Concept — Fee Payment Flow
For student fee payments, the institute owner links their own Razorpay account.
Payments go DIRECTLY to the institute's bank account via Razorpay.
Your SaaS platform just facilitates the payment collection — you can optionally charge a platform fee.
Each institute needs to add their own Razorpay API keys in their Settings page.
OR: Use Razorpay Route (marketplace feature) to split payments automatically.

Simple approach for now: Institute uses your platform's Razorpay keys,
then you transfer collected amount to institute minus your 2-3% platform fee.

Endpoint A — Create Fee Payment Order
POST /api/fees/payment/create-order
Auth: verifyToken + allowRoles('owner','manager')
Body: { student_fee_id, amount }

Flow:
1. Fetch student_fee record → verify institute_id matches
2. amount must be ≤ student_fee.due_amount
3. Create Razorpay order with order_type = 'student_fee'
4. Return order details to frontend

Endpoint B — Verify Fee Payment
POST /api/fees/payment/verify
Auth: verifyToken + allowRoles('owner','manager')
Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, student_fee_id }

Flow:
1. Verify signature (same as subscription)
2. If valid:
   a. Save to student_fee_payments table
   b. Update student_fees:
      paid_amount += amount_paid
      due_amount   = final_amount - paid_amount
      status = due_amount === 0 ? 'paid' : 'partial'
   c. Generate receipt → save to invoices
   d. Notify student + parent: 'Fee payment received'
3. Return: { success, new_due_amount, receipt_url }

Endpoint C — Fee Payment Webhook
POST /api/fees/payment/webhook
Handles: payment.captured, payment.failed events for fee payments


Phase 5 — Frontend: Razorpay Checkout Integration
Install the Razorpay JS library in your React frontend.

Step 1 — Load Razorpay Script
// utils/loadRazorpay.js
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

Step 2 — Payment Hook
// hooks/useRazorpayPayment.js
import { loadRazorpayScript } from '../utils/loadRazorpay';
import api from '../services/api';

export function useRazorpayPayment() {
  const initiatePayment = async ({
    createOrderEndpoint,  // '/api/subscriptions/create-order'
    verifyEndpoint,       // '/api/subscriptions/verify-payment'
    orderPayload,         // { plan_id } or { student_fee_id, amount }
    description,          // shown in popup
    onSuccess,            // callback on success
    onFailure,            // callback on failure
  }) => {
    // 1. Load script
    const loaded = await loadRazorpayScript();
    if (!loaded) { onFailure('Razorpay SDK failed to load'); return; }

    // 2. Create order
    const { data } = await api.post(createOrderEndpoint, orderPayload);
    const { razorpay_order_id, amount_paise, key_id, name } = data;

    // 3. Open Razorpay popup
    const options = {
      key:      key_id,  // RAZORPAY_KEY_ID from backend
      amount:   amount_paise,
      currency: 'INR',
      name:     'ZF Solution',
      description,
      order_id: razorpay_order_id,
      handler: async (response) => {
        // 4. Verify payment
        try {
          const verify = await api.post(verifyEndpoint, {
            razorpay_order_id:  response.razorpay_order_id,
            razorpay_payment_id:response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            ...orderPayload,
          });
          onSuccess(verify.data);
        } catch(e) { onFailure(e.message); }
      },
      prefill: { name, email: user.email, contact: user.phone },
      theme:   { color: '#1565C0' },
      modal:   { ondismiss: () => onFailure('Payment cancelled') },
    };
    new window.Razorpay(options).open();
  };
  return { initiatePayment };
}


Phase 6 — Frontend: Subscription Payment Page
The page where institute owners choose and pay for their plan.

pages/admin/Subscription.jsx — Key Sections:
●	Plans comparison table (Basic / Pro / Premium) with feature checklist
●	Current plan card showing: plan name, expiry date, days remaining
●	'Upgrade' button on each plan card — triggers payment
●	Coupon code input field with 'Apply' button
●	Price summary showing: base price, discount, GST (18%), total
●	Payment history table: date, plan, amount paid, invoice download

Upgrade Plan flow on frontend:
13.	User clicks 'Upgrade to Pro'
14.	If coupon exists — apply it, update price summary
15.	User clicks 'Pay ₹2,360 (incl. GST)'
16.	useRazorpayPayment hook fires — creates order → opens popup
17.	User pays via UPI/card → Razorpay calls handler
18.	Frontend sends to /api/subscriptions/verify-payment
19.	On success: toast 'Subscription activated!', refresh page, show new expiry date


Phase 7 — Frontend: Fee Collection Payment
The admin/manager uses this to collect fees from students online.

pages/admin/Fees.jsx — Payment Button Logic:
●	Each student row in the fees table has a 'Collect Online' button
●	Clicking opens a modal: 'Collect Fee — Student Name'
●	Modal shows: Total Fee, Already Paid, Pending Amount
●	Input field: 'Amount to collect now' (pre-filled with due amount)
●	'Pay via Razorpay' button → opens checkout
●	After success: row updates in real-time (due amount decreases, status changes)

Student/Parent side (optional online payment):
●	Student sees their fee card with 'Pay Online' button
●	Same flow — opens Razorpay, pays, confirmation shown
●	Receipt download button appears after payment


Phase 8 — Webhook Configuration (Razorpay Dashboard)
Setting up webhooks so Razorpay notifies your backend about payment events.

20.	Go to Razorpay Dashboard → Settings → Webhooks
21.	Click 'Add New Webhook'
22.	Webhook URL: https://yourapp.com/api/payments/webhook
23.	Secret: enter the same value as RAZORPAY_WEBHOOK_SECRET in your .env
24.	Active Events — check these:
○	payment.captured
○	payment.failed
○	order.paid
○	refund.created (optional)
25.	Save — Razorpay will now POST to your URL on every payment event

Webhook Raw Body Rule — Very Important
Webhook signature verification requires the RAW request body (Buffer/string).
If you parse the body with express.json() BEFORE verifying — signature fails.
Solution: Mount webhook route BEFORE the global express.json() middleware,
         OR use express.raw({ type: 'application/json' }) for webhook routes only.

// In app.js — ORDER MATTERS:
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());  // global — must come AFTER webhook route


Phase 9 — Invoice Generation
Generate a professional GST-compliant PDF invoice after every successful payment.

Invoice number format:
// Auto-generate invoice number
// Format: INV-{YEAR}-{INSTITUTE_ID}-{SEQUENCE}
// Example: INV-2025-42-001

async function generateInvoiceNumber(institute_id) {
  const count = await Invoice.count({ where: { institute_id } });
  const year  = new Date().getFullYear();
  return `INV-${year}-${institute_id}-${String(count+1).padStart(3,'0')}`;
}

Invoice PDF content (using pdfkit):
●	Your SaaS company name + logo + GST number
●	Invoice number, invoice date
●	Bill To: Institute name, address, GSTIN
●	Item description: Plan name OR Fee description
●	Subtotal, CGST (9%), SGST (9%), Total
●	Payment method: UPI / Card / Net Banking
●	Razorpay Payment ID (for reference)
●	Paid stamp

Invoice API endpoints:
GET /api/invoices/:id/download   → stream PDF to browser
GET /api/invoices                → list all invoices for institute
GET /api/admin/invoices          → Super Admin sees all invoices


Phase 10 — Subscription Expiry Middleware
This middleware checks if an institute's subscription is active on every API call. If expired, it blocks access.

// middlewares/subscription.middleware.js
async function checkSubscription(req, res, next) {
  // Super admin bypasses this check
  if (req.user.role === 'super_admin') return next();

  const sub = await Subscription.findOne({
    where: {
      institute_id:   req.user.institute_id,
      payment_status: 'paid',
      subscription_end: { [Op.gte]: new Date() },  // not expired
    }
  });

  if (!sub) {
    return res.status(402).json({   // 402 = Payment Required
      success: false,
      code:    'SUBSCRIPTION_EXPIRED',
      message: 'Your subscription has expired. Please renew to continue.',
      renew_url: '/subscription'
    });
  }

  req.subscription = sub;  // available in controllers
  next();
}

Apply this middleware to all protected routes except auth and payment routes:
// routes/student.routes.js
router.use(verifyToken, checkSubscription);  // applied to entire router
router.get('/', studentController.list);


Phase 11 — Cron Jobs for Subscription Lifecycle
Automated jobs to handle subscription reminders and expiry.

Cron Schedule	Job Name	What It Does
Every day 9:00 AM	Expiry Warning — 7 days	Find subscriptions expiring in 7 days → email owner 'Renew soon'
Every day 9:00 AM	Expiry Warning — 3 days	Subscriptions expiring in 3 days → urgent email + in-app alert
Every day 9:00 AM	Expiry Warning — 1 day	Subscriptions expiring tomorrow → critical email + phone SMS
Every hour	Mark Expired	Find subscriptions past end_date → update status + block API
Every day 10:00 AM	Revenue Report	Super Admin receives daily revenue summary email
1st of every month	Monthly Report	Per-institute subscription report to Super Admin


Phase 12 — Refund Handling
Handle cases where an institute requests a refund.

Refund API (Super Admin only):
POST /api/admin/payments/:paymentId/refund
Auth: super_admin only
Body: { amount (optional — partial refund), reason }

Flow:
1. Fetch payment from razorpay_payments
2. Call: razorpay.payments.refund(razorpay_payment_id, { amount })
3. Razorpay processes refund (3-7 business days)
4. Update subscription status → 'refunded'
5. Send email to institute owner
6. Log to invoices table with type = 'refund'

Webhook handles refund confirmation:
●	Event: refund.created → update database → notify institute


Phase 13 — Super Admin Revenue Dashboard
The Super Admin (you — the SaaS owner) needs a complete financial view.

Revenue Dashboard Cards:

Metric Card	Value	API Endpoint
Total Revenue (All Time)	Sum of all paid subscriptions	GET /api/superadmin/revenue/total
Monthly Revenue (Current)	This month's subscription payments	GET /api/superadmin/revenue/monthly
Active Subscriptions	Count of non-expired paid subscriptions	GET /api/superadmin/subscriptions/active
Expiring This Week	Subscriptions expiring in 7 days	GET /api/superadmin/subscriptions/expiring
Failed Payments	Orders with status='failed'	GET /api/superadmin/payments/failed
Monthly Growth %	Compare this month vs last month	Calculated from monthly data


Revenue Query (Correct Way — uses amount_paid):
// CORRECT — uses stored amount_paid (not plan.price)
const revenue = await Subscription.sum('amount_paid', {
  where: {
    payment_status: 'paid',
    paid_at: {
      [Op.between]: [startOfMonth, endOfMonth]
    }
  }
});

Charts on Super Admin Dashboard:
●	Monthly Revenue Bar Chart (last 12 months)
●	Plan Distribution Pie Chart (Basic vs Pro vs Premium)
●	New Institutes Line Chart (growth trend)
●	Payment Method Breakdown (UPI vs Card vs Net Banking)


Phase 14 — Test Mode vs Production Mode
Your project currently runs in TEST mode. Here is the complete testing and go-live checklist.

Test Mode — Use These Test Credentials:
Payment Method	Test Card/Details	Expected Result
Card — Success	4111 1111 1111 1111, any future expiry, CVV 123	Payment succeeds
Card — Failure	4000 0000 0000 0002, any future expiry, CVV 123	Payment fails
UPI — Success	success@razorpay	Payment succeeds instantly
UPI — Failure	failure@razorpay	Payment fails
Net Banking	Select any bank → Test Credentials shown	Simulates bank redirect
Wallet — Paytm	Use test number 9999999999	Wallet payment simulation


Go-Live Checklist (Production):
26.	Complete Razorpay KYC — Business verification
27.	Add bank account for settlements
28.	Get Live API keys from Razorpay Dashboard
29.	Update .env: RAZORPAY_KEY_ID=rzp_live_XXX, RAZORPAY_ENV=live
30.	Update webhook URL to production domain
31.	Test one real ₹1 payment end-to-end
32.	Enable HTTPS — Razorpay requires HTTPS in production
33.	Set up settlement schedule (daily/weekly)
34.	Add GST number to invoices


Phase 15 — Security Hardening
Final security measures before going live.

Security Rule	Implementation	Why
Always verify signature	HMAC-SHA256 check on EVERY payment verification call	Prevents fake payment confirmations
Idempotency check	Check if razorpay_payment_id already in DB before processing	Prevents duplicate activations
Amount validation	Re-verify amount_paid matches expected amount	Prevents underpayment attacks
Webhook raw body	Use express.raw() before express.json()	Signature verification fails on parsed body
Never trust frontend	Re-fetch payment from Razorpay API after verification	Frontend can be manipulated
Rate limit payment routes	Max 10 payment attempts per IP per hour	Prevents brute force
Log all payment events	Log every create-order, verify, webhook event	Audit trail for disputes
Encrypt KEY_SECRET in env	Use .env — never hardcode, never commit to Git	Key exposure = fraud risk
Test failed payments	Handle failure gracefully — no partial activation	Incomplete payments must not activate
Timeout handling	Set 30s timeout on Razorpay API calls	Network failures should not hang server

6. Complete Razorpay API Endpoints Reference

Method	Endpoint	Auth	Use Case	Description
POST	/api/subscriptions/create-order	owner	Subscription	Create Razorpay order for plan payment
POST	/api/subscriptions/verify-payment	owner	Subscription	Verify + activate subscription
POST	/api/subscriptions/webhook	Public	Subscription	Handle Razorpay webhook events
GET	/api/subscriptions/plans	owner	Subscription	Get all available plans with pricing
GET	/api/subscriptions/current	owner	Subscription	Current subscription status + expiry
GET	/api/subscriptions/history	owner	Subscription	All past subscription payments
POST	/api/fees/payment/create-order	owner/manager	Student Fees	Create order for student fee
POST	/api/fees/payment/verify	owner/manager	Student Fees	Verify + record fee payment
POST	/api/fees/payment/webhook	Public	Student Fees	Webhook for fee payments
GET	/api/invoices	owner	Both	List all invoices for institute
GET	/api/invoices/:id/download	owner/student	Both	Download PDF invoice
GET	/api/payments/key	owner	Both	Get RAZORPAY_KEY_ID for frontend
POST	/api/admin/payments/:id/refund	super_admin	Both	Initiate refund
GET	/api/superadmin/revenue/total	super_admin	Analytics	All-time revenue
GET	/api/superadmin/revenue/monthly	super_admin	Analytics	Monthly revenue chart data
GET	/api/superadmin/subscriptions/active	super_admin	Analytics	Active subscription count
GET	/api/superadmin/subscriptions/expiring	super_admin	Analytics	Expiring in 7 days
GET	/api/superadmin/payments/failed	super_admin	Analytics	Failed payment list
GET	/api/superadmin/revenue/export	super_admin	Analytics	Export revenue to Excel

7. Phase Execution Order — Summary

#	Phase	What You Build	Result
1	Database Migrations	5 tables + alter subscriptions + indexes	Schema ready
2	Payment Service Layer	createOrder + verifySignature + verifyWebhook functions	Core logic ready
3	Subscription Payment APIs	create-order + verify + webhook endpoints	SaaS billing works
4	Fee Payment APIs	fee create-order + verify + webhook endpoints	Online fee collection works
5	Frontend Razorpay Script	loadRazorpay util + useRazorpayPayment hook	Reusable payment hook
6	Subscription Page UI	Plan cards + price summary + payment history	Owner can subscribe
7	Fee Collection UI	Collect Online button + modal + receipt	Admin can collect fees
8	Webhook Setup	Razorpay Dashboard config + raw body middleware	Backup payment capture
9	Invoice Generation	PDF invoice with GST using pdfkit	Professional invoices
10	Subscription Middleware	Block expired institutes from all APIs	Subscription enforcement
11	Cron Jobs	7-day / 3-day / 1-day expiry reminders	Auto lifecycle management
12	Refund Handling	Refund API + webhook handler	Admin can refund
13	Super Admin Dashboard	Revenue cards + charts + analytics	You see your earnings
14	Test → Production	Test credentials + go-live checklist	Ready for real money
15	Security Hardening	Signature verify + idempotency + rate limit	Fraud prevention


Final Result — After All 15 Phases
✅  Institutes pay you monthly via UPI / Card / Net Banking / Wallet / EMI
✅  Subscription auto-activates after verified payment
✅  Expired institutes are automatically blocked from all APIs
✅  Student fees collected online with Razorpay — receipts auto-generated
✅  Webhook handles edge cases (browser close, network drop)
✅  GST-compliant PDF invoices generated for every transaction
✅  Refund system for dispute handling
✅  Super Admin sees complete real-time revenue analytics
✅  Cron reminders reduce subscription churn
✅  HMAC-SHA256 signature verification prevents all payment fraud

Revenue Model Active:  ₹2,000–₹5,000 / institute / month
Target at 50 institutes:  ₹1 Lakh+ Monthly Recurring Revenue

