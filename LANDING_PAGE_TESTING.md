# 🌱 Donation Landing Page Testing Guide

## 🚀 Quick Start

### 1. Start the Backend

```bash
# Install dependencies
npm install

# Start the donation backend
node donation-backend.js
```

The backend will run on `http://localhost:3001`

### 2. Test the Extension Flow

1. **Reload the extension** in Chrome (`chrome://extensions/`)
2. **Go to ChatGPT** and use it to generate some AI impact
3. **Click the extension icon** to open the popup
4. **Click "🌱 Donate to Plant Trees"** button
5. **A new tab will open** with the donation landing page

## 🎯 What You'll See

### **Landing Page Features:**

1. **Personalized Impact Display**
   - Shows your actual AI usage from the extension
   - "Your AI usage today: 15 Wh"

2. **Social Proof**
   - Real-time donor counters
   - Trees planted this week

3. **Donation Options**
   - $5 (Most Popular) - Plant 2 trees
   - $10 - Plant 5 trees + 1m² forest
   - $25 - Plant 15 trees + 5m² forest
   - Custom amount

4. **Urgency Banner**
   - "🔥 Double your impact this week"

5. **Payment Form**
   - Stripe Elements integration
   - Secure payment processing
   - Trust indicators

6. **Success State**
   - Confetti animation
   - Thank you message
   - Trees planted confirmation

## 🧪 Test Scenarios

### **Scenario 1: Basic Donation**
1. Click $5 option
2. Use test card: `4242424242424242`
3. Any future expiry date
4. Any 3-digit CVC
5. Click "Pay Securely"

### **Scenario 2: Custom Amount**
1. Click "Custom" option
2. Enter amount: $15
3. Complete payment flow
4. Verify success message shows correct trees

### **Scenario 3: Error Handling**
1. Use invalid card: `4000000000000002`
2. Should show payment error
3. Try again with valid card

## 📊 Backend Logs

When testing, you should see logs like:
```
🚀 Donation backend running on http://localhost:3001
🌱 Creating payment intent: { amount: 500, currency: 'usd', metadata: {...} }
```

## 🔧 Customization

### **Update Stripe Key**
In `donation-landing.html`, replace:
```javascript
publishableKey: 'pk_test_YOUR_ACTUAL_TEST_KEY'
```

### **Modify Donation Amounts**
In `donation-landing.html`, update the amount options:
```html
<div class="amount-option" data-amount="5">
  <div class="amount-value">$5</div>
  <div class="amount-impact">Plant 2 trees</div>
</div>
```

### **Change Impact Calculation**
In `donation-landing.html`, modify:
```javascript
const treesToPlant = Math.floor(selectedAmount * 0.4); // $5 = 2 trees
```

## 🎨 Design Features

### **Psychological Optimization:**
- **Social proof**: Real-time counters
- **Urgency**: Limited-time matching
- **Personalization**: User's impact display
- **Trust indicators**: SSL, Stripe, guarantees
- **Anchoring**: "Most Popular" badge on $5

### **UX Features:**
- **Responsive design**: Works on mobile
- **Smooth animations**: Hover effects, transitions
- **Loading states**: Processing indicators
- **Error handling**: Graceful failure modes
- **Success celebration**: Confetti animation

## 🐛 Troubleshooting

### **Extension Button Not Working:**
1. Check console for errors
2. Ensure extension is reloaded
3. Verify manifest.json includes web_accessible_resources

### **Landing Page Not Loading:**
1. Check if donation-landing.html exists
2. Verify manifest.json configuration
3. Check Chrome DevTools for errors

### **Payment Form Not Appearing:**
1. Ensure backend is running on localhost:3001
2. Check network tab for failed requests
3. Verify Stripe SDK is loaded

### **Backend Not Responding:**
1. Check if Node.js is installed
2. Ensure dependencies are installed
3. Check if port 3001 is available

## 📈 Analytics Ready

The landing page includes hooks for:
- **Conversion tracking**: Track donation funnel
- **A/B testing**: Test different amounts
- **User behavior**: Track interactions
- **Payment analytics**: Success/failure rates

## 🔄 Next Steps

1. **Test thoroughly** with various scenarios
2. **Get real Stripe account** for production
3. **Deploy backend** to hosting service
4. **Add analytics** tracking
5. **Implement webhooks** for payment confirmation
6. **Add email receipts** and follow-ups

## 🎯 Success Metrics

Track these key metrics:
- **Click-through rate**: Extension button → Landing page
- **Conversion rate**: Landing page → Successful payment
- **Average donation**: Amount per successful transaction
- **Bounce rate**: Users who leave without donating
- **Mobile conversion**: Mobile vs desktop performance

The landing page is now ready for testing! Try the complete flow and let me know how it works. 