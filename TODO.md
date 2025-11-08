# Coupon Implementation in Cart and Payment Flow

## Current Status
- Database schema exists with coupon_codes, coupon_usage tables
- Orders table has coupon_code and discount_amount fields
- Profile page has basic coupon application UI
- Cart and PaymentDemo components need coupon integration

## Tasks

### 1. Cart Component Updates
- [ ] Add coupon input field to Cart.tsx
- [ ] Implement coupon validation logic
- [ ] Calculate and display discount amounts
- [ ] Update total price with discount
- [ ] Store applied coupon in cart state

### 2. Payment Component Updates
- [ ] Update PaymentDemo.tsx to show discounted prices
- [ ] Display coupon code and discount amount
- [ ] Ensure discount is carried through to order creation

### 3. Order Creation Logic
- [ ] Update Cart.tsx order placement to include coupon data
- [ ] Create coupon_usage record when order is placed
- [ ] Update coupon used_count

### 4. Coupon Validation
- [ ] Check coupon validity (active, within date range, usage limits)
- [ ] Validate minimum order value requirements
- [ ] Check if user has already used the coupon (if single-use)

### 5. UI/UX Improvements
- [ ] Show coupon discount breakdown in cart
- [ ] Add remove coupon functionality
- [ ] Display coupon expiry/warnings
- [ ] Handle invalid coupon codes gracefully

## Files to Modify
- src/pages/Cart.tsx
- src/pages/PaymentDemo.tsx
- src/hooks/useCart.tsx (if exists)
- src/integrations/supabase/client.ts (add coupon functions)

## Testing
- [ ] Test valid coupon application
- [ ] Test invalid coupon handling
- [ ] Test discount calculation
- [ ] Test order creation with coupon
- [ ] Test coupon usage tracking
