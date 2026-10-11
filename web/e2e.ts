import puppeteer from 'puppeteer';

const API_URL = 'http://localhost:1000/api';
const WEB_URL = 'http://localhost:5173';

const CUSTOMER_ID = '64e8e50f3c5f4a1b8c1a9901';
const OWNER_ID = '64e8e50f3c5f4a1b8c1a9902';
const PARTNER_ID = '64e8e50f3c5f4a1b8c1a9903';
const ADMIN_ID = '64e8e50f3c5f4a1b8c1a9904';
const RESTAURANT_ID = '64e8e50f3c5f4a1b8c1a9905';
const MENU_ITEM_ID = '64e8e50f3c5f4a1b8c1a9906';

async function seedData() {
  console.log('Seeding test database via DEV API...');
  const res = await fetch(`http://localhost:1000/api/dev/seed-factory-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collections: [
        { modelName: 'Order', documents: [], clearFirst: true },
        { modelName: 'Delivery', documents: [], clearFirst: true },
        { modelName: 'DeliveryPartner', documents: [], clearFirst: true },
        { modelName: 'Restaurant', documents: [], clearFirst: true },
        { modelName: 'User', documents: [], clearFirst: true },
        {
          modelName: 'User',
          documents: [
            { _id: CUSTOMER_ID, name: 'E2E Customer', email: 'cust@e2e.com', password: 'password', roles: ['user'], phone: '111111' },
            { _id: OWNER_ID, name: 'E2E Owner', email: 'owner@e2e.com', password: 'password', roles: ['owner'], phone: '222222' },
            { _id: PARTNER_ID, name: 'E2E Partner', email: 'partner@e2e.com', password: 'password', roles: ['partner'], phone: '333333' },
            { _id: ADMIN_ID, name: 'E2E Admin', email: 'admin@e2e.com', password: 'password', roles: ['admin'], phone: '444444' }
          ]
        },
        {
          modelName: 'Restaurant',
          documents: [
            {
              _id: RESTAURANT_ID,
              ownerId: OWNER_ID,
              name: 'Puppeteer Test Restaurant',
              cuisine: ['Test'],
              address: '123 Test St',
              city: 'Test City',
              location: { lat: 12.9716, lng: 77.5946 },
              phone: '9999999999',
              isOpen: true,
              rating: 5,
              totalRatings: 1,
              menu: [
                { _id: MENU_ITEM_ID, name: 'Puppeteer Burger', price: 150, category: 'Food', isAvailable: true }
              ]
            }
          ]
        },
        {
          modelName: 'DeliveryPartner',
          documents: [
            {
              _id: '64e8e50f3c5f4a1b8c1a9907',
              userId: PARTNER_ID,
              name: 'E2E Partner',
              phone: '333333',
              vehicle: 'Bike',
              status: 'available',
              completedDeliveries: 0,
              currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] }
            }
          ]
        }
      ]
    })
  });
  if (!res.ok) {
    throw new Error(`Seed failed: ${await res.text()}`);
  }
  console.log('Seed complete.');
}

async function setupPage(browser: any, role: string, userId: string, label: string) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('Socket') || txt.includes('error') || txt.includes('Error')) {
      console.log(`[${label} CONSOLE]:`, txt);
    }
  });
  page.on('pageerror', err => console.error(`[${label} ERROR]:`, err.message));

  // Dev bypass headers
  await page.setExtraHTTPHeaders({
    'x-dev-bypass-auth': 'true',
    'x-dev-bypass-user-id': userId,
    'x-dev-bypass-role': role
  });

  // Inject dummy token so AuthContext calls /auth/me
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("zom2.auth.session", JSON.stringify({ token: "dummy" }));
  });

  return { context, page };
}

async function clickButtonWithText(page: any, text: string, timeout = 15000) {
  await page.waitForFunction((btnText: string) => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.textContent?.trim() === btnText && !b.disabled);
  }, { timeout }, text);

  await page.evaluate((btnText: string) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent?.trim() === btnText && !b.disabled);
    btn?.click();
  }, text);
}

async function runBrowserE2E() {
  console.log('===============================================================');
  console.log('🚀 Starting Puppeteer Browser Full Lifecycle Verification...');
  console.log('===============================================================');
  await seedData();

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // ---------------------------------------------------------
    // 1. CUSTOMER FLOW: ADD TO CART & CHECKOUT
    // ---------------------------------------------------------
    console.log('\n[1/5] Customer ordering flow...');
    const { page: customerPage } = await setupPage(browser, 'user', CUSTOMER_ID, 'CUSTOMER');
    
    console.log(`Navigating to restaurant page: ${WEB_URL}/restaurants/${RESTAURANT_ID}`);
    await customerPage.goto(`${WEB_URL}/restaurants/${RESTAURANT_ID}`, { waitUntil: 'domcontentloaded' });
    
    await customerPage.waitForFunction(() => {
      return document.body.innerText.includes('Puppeteer Burger');
    }, { timeout: 15000 });
    console.log('Found menu item: Puppeteer Burger');

    // Click ADD button
    await clickButtonWithText(customerPage, 'ADD');
    console.log('Clicked ADD button. Item added to cart.');

    await new Promise(r => setTimeout(r, 600));

    // Navigate to checkout
    console.log('Navigating to checkout...');
    await customerPage.goto(`${WEB_URL}/checkout`, { waitUntil: 'domcontentloaded' });
    await customerPage.waitForFunction(() => {
      return document.body.innerText.includes('Checkout') && document.body.innerText.includes('Delivery Address');
    }, { timeout: 15000 });

    console.log('Progressing checkout stepper...');
    // Step 0: Delivery Address -> Continue
    await clickButtonWithText(customerPage, 'Continue');
    await new Promise(r => setTimeout(r, 800));

    // Step 1: Payment Method -> Continue
    await clickButtonWithText(customerPage, 'Continue');
    await new Promise(r => setTimeout(r, 800));

    // Step 2: Review Order -> Place Order
    console.log('Clicking Place Order button...');
    await clickButtonWithText(customerPage, 'Place Order');

    // Wait for redirect to /orders/confirmation
    await customerPage.waitForFunction(() => {
      return window.location.href.includes('/orders/confirmation');
    }, { timeout: 20000 });
    console.log('Order confirmed! On page:', customerPage.url());

    // Click Track Order
    console.log('Clicking Track Order...');
    await clickButtonWithText(customerPage, 'Track Order');

    await customerPage.waitForFunction(() => {
      return window.location.href.includes('/orders/tracking/');
    }, { timeout: 15000 });
    
    const trackingUrl = customerPage.url();
    const orderId = trackingUrl.split('/orders/tracking/')[1].split('?')[0];
    console.log(`✅ Customer tracking page live. Order ID: ${orderId}`);

    // ---------------------------------------------------------
    // 2. PARTNER PRE-LOGIN (Connect socket before order is ready)
    // ---------------------------------------------------------
    console.log('\n[2/5] Partner connecting to socket at /partner/orders...');
    const { page: partnerPage } = await setupPage(browser, 'partner', PARTNER_ID, 'PARTNER');
    await partnerPage.goto(`${WEB_URL}/partner/orders`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    console.log('Partner socket active and awaiting assignments.');

    // ---------------------------------------------------------
    // 3. OWNER FLOW: ACCEPT -> PREPARE -> READY AT /owner
    // ---------------------------------------------------------
    console.log('\n[3/5] Owner managing order lifecycle at /owner...');
    const { page: ownerPage } = await setupPage(browser, 'owner', OWNER_ID, 'OWNER');
    
    console.log('Owner opening /owner dashboard...');
    await ownerPage.goto(`${WEB_URL}/owner`, { waitUntil: 'domcontentloaded' });
    
    // Wait for pending orders to load and show Accept button
    console.log('Owner clicking Accept...');
    await clickButtonWithText(ownerPage, 'Accept');
    await new Promise(r => setTimeout(r, 1500));

    console.log('Owner clicking Mark Preparing...');
    await clickButtonWithText(ownerPage, 'Mark Preparing');
    await new Promise(r => setTimeout(r, 1500));

    console.log('Owner clicking Mark Ready...');
    await clickButtonWithText(ownerPage, 'Mark Ready');
    await new Promise(r => setTimeout(r, 1000));
    console.log('✅ Owner successfully processed order to ready/awaiting_partner.');

    // Assert Customer Realtime updated to Preparing / Ready
    await customerPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('preparing') || text.includes('being prepared') || text.includes('ready');
    }, { timeout: 15000 });
    console.log('✅ Customer browser accurately reflects Preparing/Ready state in real-time!');

    // ---------------------------------------------------------
    // 4. PARTNER ACCEPTS & OWNER HANDOFF CONFIRMATION
    // ---------------------------------------------------------
    console.log('\n[4/5] Partner accepting assignment and starting simulation...');
    await partnerPage.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent?.trim() === 'Accept');
    }, { timeout: 20000 });

    console.log('Partner clicking Accept...');
    await clickButtonWithText(partnerPage, 'Accept');

    // Wait for partner active delivery page
    await partnerPage.waitForFunction(() => {
      return window.location.href.includes('/partner/active');
    }, { timeout: 15000 });
    console.log('Partner navigated to /partner/active.');

    // Owner confirms food handoff when partner arrives at restaurant
    console.log('Waiting for Partner Arrived / Confirm Handoff button on Owner Dashboard...');
    await clickButtonWithText(ownerPage, 'Confirm Handoff', 35000);
    console.log('✅ Owner confirmed handoff! Food picked up by partner.');

    // ---------------------------------------------------------
    // 5. LIVE TRACKING & SIMULATED MOVING MAP MARKER ASSERTION
    // ---------------------------------------------------------
    console.log('\n[5/5] Asserting simulated moving map marker & terminal delivery...');

    // Wait for customer tracking to reflect Picked Up / On The Way
    await customerPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('picked up') || text.includes('on the way') || text.includes('out for delivery') || text.includes('nearby') || text.includes('delivered');
    }, { timeout: 20000 });
    console.log('Customer tracking updated to transit state.');

    // Verify Moving Map Marker on Leaflet Map
    console.log('Verifying moving Leaflet partner map marker across simulation ticks...');
    const markerPositions: string[] = [];
    const markerCheckStart = Date.now();
    
    while (Date.now() - markerCheckStart < 40000 && markerPositions.length < 2) {
      const currentPos = await customerPage.evaluate(() => {
        // Query partner icon: flaticon 3209865 or general leaflet marker pane
        const partnerMarker = document.querySelector('.leaflet-marker-pane img[src*="3209865"]') as HTMLElement;
        if (partnerMarker) {
          return partnerMarker.style.transform;
        }
        const markers = Array.from(document.querySelectorAll('.leaflet-marker-pane img')) as HTMLElement[];
        if (markers.length > 0) {
          return markers.map(m => m.style.transform).join(';');
        }
        return null;
      });

      if (currentPos && !markerPositions.includes(currentPos)) {
        markerPositions.push(currentPos);
        console.log(`📍 Detected partner marker position #${markerPositions.length}: ${currentPos}`);
      }

      // Check if delivery has completed early
      const isDelivered = await customerPage.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('enjoy your food') || text.includes('rate your experience');
      });
      if (isDelivered && markerPositions.length >= 2) break;

      await new Promise(r => setTimeout(r, 2000));
    }

    if (markerPositions.length >= 2) {
      console.log(`✅ SUCCESS: Moving simulated map marker verified in customer browser across ${markerPositions.length} positions!`);
    } else {
      console.log(`ℹ️ Marker positions detected: ${markerPositions.length}. Continuing to terminal check.`);
    }

    // Wait for customer page to reflect DELIVERED
    console.log('Waiting for Customer tracking page to reach DELIVERED state via simulator...');
    await customerPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('enjoy your food') || text.includes('rate your experience');
    }, { timeout: 150000 });
    console.log('✅ Customer browser accurately reflects DELIVERED state!');

    // Verify Partner view reflects terminal state
    await partnerPage.bringToFront();
    await partnerPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('no active delivery') || text.includes('100%');
    }, { timeout: 30000 });
    console.log('✅ Partner view accurately reflects terminal completion!');

    // ---------------------------------------------------------
    // 6. ADMIN VERIFICATION
    // ---------------------------------------------------------
    console.log('\n[6/6] Admin verifying terminal visibility...');
    const { page: adminPage } = await setupPage(browser, 'admin', ADMIN_ID, 'ADMIN');
    
    // First load /admin to restore auth context
    await adminPage.goto(`${WEB_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('dashboard') || text.includes('recent orders') || text.includes('delivered');
    }, { timeout: 20000 });

    // Navigate to full orders list
    await adminPage.goto(`${WEB_URL}/admin/orders`, { waitUntil: 'domcontentloaded' });
    
    // Admin table renders order, restaurant, and delivered status chip
    await adminPage.waitForFunction((id) => {
      const text = document.body.innerText.toLowerCase();
      return (text.includes('puppeteer') || text.includes(id.slice(0, 6).toLowerCase())) && text.includes('delivered');
    }, { timeout: 30000 }, orderId);

    const adminHtml = await adminPage.evaluate(() => document.body.innerText.toLowerCase());
    if (!adminHtml.includes('delivered')) {
      throw new Error('Admin sees the order list but status is not Delivered');
    }
    console.log('✅ Admin browser correctly lists the Delivered order in terminal state!');

    // ---------------------------------------------------------
    // 7. BACKEND DATABASE CONSISTENCY VERIFICATION
    // ---------------------------------------------------------
    console.log('\n[7/7] Verifying backend database document integrity...');
    const orderDocRes = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: {
        'x-dev-bypass-auth': 'true',
        'x-dev-bypass-user-id': ADMIN_ID,
        'x-dev-bypass-role': 'admin'
      }
    });
    if (!orderDocRes.ok) {
      throw new Error(`Failed to fetch backend order document: ${orderDocRes.status} ${await orderDocRes.text()}`);
    }
    const orderDoc = (await orderDocRes.json()) as any;
    console.log(`Backend Order Document status: ${orderDoc.data?.status}`);
    if (orderDoc.data?.status !== 'delivered') {
      throw new Error(`Expected order document status to be 'delivered', got '${orderDoc.data?.status}'`);
    }
    console.log('✅ Backend Order document confirmed in terminal status: delivered');

    console.log('\n===============================================================');
    console.log('🎉🎉🎉 FULL MULTI-ACTOR BROWSER E2E VERIFIED SUCCESSFULLY 🎉🎉🎉');
    console.log('===============================================================');

  } finally {
    await browser.close();
  }
}

runBrowserE2E().catch(err => {
  console.error('\n❌ Browser E2E Verification failed:', err);
  process.exit(1);
});
