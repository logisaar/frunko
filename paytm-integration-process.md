# Paytm Payment Gateway Integration Guide

This guide documents the complete implementation of Paytm JS Checkout payment gateway for a React application (and backend).

## Prerequisites
1. **Paytm Merchant Account**: Active account with KYC verified
2. **Paytm Dashboard Access**: https://dashboard.paytm.com/ or https://dashboard.paytmpayments.com/
3. **Frontend**: React Project (or any web frontend)
4. **Backend**: Node.js (Version 14+)

## Step 1: Get Paytm Credentials
1. Log into Paytm Dashboard → **Developer Settings** → **API Keys**
2. Get the following credentials:
   - **Merchant ID (MID)**: 20 characters (e.g., `bnFRXI03661934553961`)
   - **Merchant Key**: 16 characters (secret, never expose to frontend)
   - **Website Name**: Usually `DEFAULT` (or `WEBSTAGING` for testing)
   - **Industry Type**: Usually `Retail`
   - **Channel ID**: `WEB` for websites

## Step 2: Set Up Environment Variables

**Backend `.env`:**
```env
PAYTM_MID=your_merchant_id
PAYTM_MERCHANT_KEY=your_secret_key
PAYTM_WEBSITE=DEFAULT
PAYTM_INDUSTRY_TYPE=Retail
PAYTM_CHANNEL_ID=WEB
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

> **Important**: Use staging credentials for testing (`WEBSTAGING`), production credentials for live (`DEFAULT`). Host domain should be `secure.paytmpayments.com` (Production) or `securestage.paytmpayments.com` (Staging).

## Step 3: Install Dependencies (Backend)
```bash
npm install paytmchecksum
```

## Step 4: Create Backend APIs

You need two endpoints:
1. `/api/paytm/initiate` - Generates transaction token
2. `/api/paytm/callback` - Handles the payment response callback from Paytm

### 1. Initiate API (`initiate.js/ts`)

```javascript
const PaytmChecksum = require('paytmchecksum');

// Ensure you have body parsing setup (e.g. express.json)
async function initiatePayment(req, res) {
    const { amount, customerId, email, phone } = req.body;
    const orderId = `ORD${Date.now()}`;

    const paytmBody = {
        requestType: 'Payment',
        mid: process.env.PAYTM_MID,
        websiteName: process.env.PAYTM_WEBSITE,
        orderId: orderId,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paytm/callback`,
        txnAmount: { value: parseFloat(amount).toFixed(2), currency: 'INR' },
        userInfo: { custId: customerId, mobile: phone, email: email }
    };

    const checksum = await PaytmChecksum.generateSignature(
        JSON.stringify(paytmBody),
        process.env.PAYTM_MERCHANT_KEY
    );

    const paytmParams = {
        body: paytmBody,
        head: { signature: checksum }
    };

    const paytmUrl = `https://secure.paytmpayments.com/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${orderId}`;

    const response = await fetch(paytmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paytmParams)
    });

    const data = await response.json();
    res.json({ orderId, txnToken: data.body.txnToken, mid: process.env.PAYTM_MID, amount });
}
```

### 2. Callback API (`callback.js/ts`)

```javascript
const PaytmChecksum = require('paytmchecksum');

async function handleCallback(req, res) {
    const paytmResponse = req.body; // Ensure form-urlencoded parser is used
    
    // Verify checksum
    const paramsForVerification = { ...paytmResponse };
    let checksumReceived = paramsForVerification.CHECKSUMHASH;
    delete paramsForVerification.CHECKSUMHASH;

    const isValidSignature = PaytmChecksum.verifySignature(
        paramsForVerification,
        process.env.PAYTM_MERCHANT_KEY,
        checksumReceived
    );

    if (isValidSignature && paytmResponse.STATUS === 'TXN_SUCCESS') {
        // Payment successful
        res.redirect(`/payment?status=success&orderId=${paytmResponse.ORDERID}`);
    } else {
        // Payment failed or signature invalid
        res.redirect(`/payment?status=failed`);
    }
}
```

## Step 5: Frontend Integration

### Add JS SDK to `index.html`
Place this in your `<head>` or `<body>`:
```html
<script type="application/javascript"
    src="https://secure.paytmpayments.com/merchantpgpui/checkoutjs/merchants/YOUR_PAYTM_MID.js"
    crossorigin="anonymous"></script>
```

### Call Initiate API and open Checkout
In your React Checkout Component:

```javascript
const handlePayment = async () => {
    // 1. Call your own backend
    const res = await fetch('/api/paytm/initiate', {
        method: 'POST', body: JSON.stringify({ amount: 499, customerId: "C123", email: "x@x.com", phone: "9999999999" })
    });
    const data = await res.json();

    // 2. Open Paytm Checkout
    if (window.Paytm && window.Paytm.CheckoutJS) {
        const config = {
            root: "",
            flow: "DEFAULT",
            data: {
                orderId: data.orderId,
                token: data.txnToken,
                tokenType: "TXN_TOKEN",
                amount: data.amount
            },
            merchant: {
                mid: data.mid,
                redirect: true
            },
            handler: {
                notifyMerchant: (eventName, data) => console.log(eventName, data)
            }
        };

        await window.Paytm.CheckoutJS.init(config);
        window.Paytm.CheckoutJS.invoke();
    }
};
```

## Step 6: Configure Paytm Dashboard
1. Go to **Developer Settings** → **Webhook URL**
2. Add your callback URL: `https://your-domain.com/api/paytm/callback`
3. Whitelist your frontend URL (if required in settings).
