# FoodHub Local Testing Manual

This guide explains exactly how to manually test the FoodHub customer domain locally.

## 1. Environment Setup

**Start Backend (API)**
\\\ash
cd API
npm install
npm run dev
\\\
Ensure MongoDB is running locally or your \MONGO_URI\ in \API/.env\ is valid.

**Start Frontend (Web)**
\\\ash
cd web
npm install
npm run dev
\\\

**Environment Variables (\web/.env\)**
Ensure these are set to test the REAL backend:
\\\env
VITE_DATA_SOURCE=api
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_DEV_BYPASS_AUTH=false
\\\

## 2. Authentication Tests

1. Open \http://localhost:3000\ (or Vite's given URL).
2. Click **Login** in the top-right menu.
3. Use a test account (e.g., \user@example.com\ / \password123\) or sign up for a new account.
4. Verify you are redirected to the Home page and the avatar shows your initial.
5. **Refresh the browser.** Verify you remain logged in and your user session is instantly restored.
6. Click the profile avatar and select **Logout**. Verify the session is cleared.
7. Login again to proceed with the next tests.

## 3. Restaurant & Cart Tests

1. From the Home page, click on any restaurant.
2. Verify the restaurant's menu loads.
3. Click **Add** on an item. Verify the mini-cart pops up and the cart badge increments.
4. Increase the quantity. Verify subtotal/total updates.
5. Go back to Home and try adding an item from a *different* restaurant. You should see a warning about clearing your existing cart.

## 4. Checkout Tests

1. Go to the Cart and click **Checkout**.
2. Ensure you are redirected to the Checkout page (if not logged in, you will be redirected to Login first).
3. Enter a delivery address.
4. Select a payment method (e.g., Cash on Delivery).
5. Click **Place Order**.
6. Verify you are redirected to the Order Confirmation page, displaying your Order ID.

## 5. Real-Time Tracking Tests

1. From the Order Confirmation page, click **Track Order**.
2. **Observe:** Because we do not have an Owner app yet, the backend automatically simulates order progress.
3. Watch the UI closely: Every 10 seconds, the backend pushes a Socket.IO event.
4. You should see the progress bar jump from **Confirmed -> Preparing -> Out for Delivery -> Delivered**.
5. You should hear/see a Toast notification popup for each transition.
6. Click the **Notification Bell** in the top navigation bar. Verify the unread badge clears and all past order lifecycle notifications are preserved in the popover.

## 6. Failure Tests

1. **API Failure:** Stop the Node.js backend. Try to browse restaurants. You should see a polite error state or skeleton loaders that eventually timeout.
2. **Invalid Token:** Manually alter \zom2.auth.session\ in localStorage via DevTools. Refresh the page. You should be cleanly logged out.
3. **Socket Disconnect:** While tracking an order, stop the backend. The tracking UI will stop receiving updates without crashing. Restart the backend, and the socket should automatically reconnect.
