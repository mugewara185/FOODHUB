import puppeteer from 'puppeteer';

const API_URL = 'http://localhost:1000/api';
const WEB_URL = 'http://localhost:5173';

const CUSTOMER_ID = '64e8e50f3c5f4a1b8c1a9901';
const OWNER_ID = '64e8e50f3c5f4a1b8c1a9902';
const PARTNER_ID = '64e8e50f3c5f4a1b8c1a9903';
const ADMIN_ID = '64e8e50f3c5f4a1b8c1a9904';
const RESTAURANT_ID = '64e8e50f3c5f4a1b8c1a9905';
const MENU_ITEM_ID = '64e8e50f3c5f4a1b8c1a9906';
const DELIVERY_PARTNER_DOC_ID = '64e8e50f3c5f4a1b8c1a9907';

/**
 * P0 Safety Guard:
 * Asserts connected database is a verified dedicated test/e2e database before performing any operations.
 */
async function assertDedicatedTestDatabase() {
  console.log('Verifying connected database safety guard via /api/dev/db-info...');
  const res = await fetch(`${API_URL}/dev/db-info`);
  if (!res.ok) {
    throw new Error(`Failed to query dev db-info: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as any;
  const dbInfo = body.data;
  console.log(`Connected database: "${dbInfo.databaseName}" (isDedicatedTestDb: ${dbInfo.isDedicatedTestDb}, readyState: ${dbInfo.readyState})`);

  if (!dbInfo.isDedicatedTestDb) {
    throw new Error(
      `CRITICAL SAFETY GUARD VIOLATION: Database "${dbInfo.databaseName}" is NOT a dedicated test database! Aborting to prevent data corruption.`
    );
  }
  if (dbInfo.readyState !== 1) {
    throw new Error(`Database connection not ready (readyState: ${dbInfo.readyState})`);
  }
  console.log('✅ Safety guard passed: confirmed dedicated test database.');
}

/**
 * P0 Data Protection:
 * Scoped seed using deleteIds / deleteFilter instead of destructive clearFirst: true.
 */
async function seedScopedData() {
  console.log('Seeding scoped test fixtures via /api/dev/seed-factory-data...');
  const res = await fetch(`${API_URL}/dev/seed-factory-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-allow-destructive-seed': 'true'
    },
    body: JSON.stringify({
      collections: [
        {
          modelName: 'User',
          deleteIds: [CUSTOMER_ID, OWNER_ID, PARTNER_ID, ADMIN_ID],
          documents: [
            { _id: CUSTOMER_ID, name: 'E2E Customer', email: 'cust@e2e.com', password: 'password', roles: ['user'], phone: '111111' },
            { _id: OWNER_ID, name: 'E2E Owner', email: 'owner@e2e.com', password: 'password', roles: ['owner'], phone: '222222' },
            { _id: PARTNER_ID, name: 'E2E Partner', email: 'partner@e2e.com', password: 'password', roles: ['partner'], phone: '333333' },
            { _id: ADMIN_ID, name: 'E2E Admin', email: 'admin@e2e.com', password: 'password', roles: ['admin'], phone: '444444' }
          ]
        },
        {
          modelName: 'Restaurant',
          deleteIds: [RESTAURANT_ID],
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
          deleteIds: [DELIVERY_PARTNER_DOC_ID],
          documents: [
            {
              _id: DELIVERY_PARTNER_DOC_ID,
              userId: PARTNER_ID,
              name: 'E2E Partner',
              phone: '333333',
              vehicle: 'Bike',
              status: 'available',
              completedDeliveries: 0,
              currentLocation: { type: 'Point', coordinates: [77.5946, 12.9716] }
            }
          ]
        },
        {
          modelName: 'Order',
          deleteFilter: { restaurantId: RESTAURANT_ID },
          documents: []
        },
        {
          modelName: 'Delivery',
          deleteFilter: { partnerId: DELIVERY_PARTNER_DOC_ID },
          documents: []
        }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Scoped seed failed: ${await res.text()}`);
  }
  console.log('✅ Scoped seed complete.');
}

/**
 * Scoped Cleanup:
 * Removes only test documents created by this E2E run without touching any other data.
 */
async function cleanupScopedData() {
  console.log('Cleaning up scoped test fixtures...');
  const res = await fetch(`${API_URL}/dev/seed-factory-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-allow-destructive-seed': 'true'
    },
    body: JSON.stringify({
      collections: [
        { modelName: 'User', deleteIds: [CUSTOMER_ID, OWNER_ID, PARTNER_ID, ADMIN_ID] },
        { modelName: 'Restaurant', deleteIds: [RESTAURANT_ID] },
        { modelName: 'DeliveryPartner', deleteIds: [DELIVERY_PARTNER_DOC_ID] },
        { modelName: 'Order', deleteFilter: { restaurantId: RESTAURANT_ID } },
        { modelName: 'Delivery', deleteFilter: { partnerId: DELIVERY_PARTNER_DOC_ID } }
      ]
    })
  });
  if (!res.ok) {
    console.warn(`Scoped cleanup warning: ${await res.text()}`);
  } else {
    console.log('✅ Scoped cleanup complete.');
  }
}

async function setupPage(browser: any, role: string, userId: string, label: string) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  page.on('console', (msg: any) => {
    const txt = msg.text();
    if (txt.includes('Socket') || txt.includes('error') || txt.includes('Error')) {
      console.log(`[${label} CONSOLE]:`, txt);
    }
  });
  page.on('pageerror', (err: any) => console.error(`[${label} ERROR]:`, err.message));

  await page.setExtraHTTPHeaders({
    'x-dev-bypass-auth': 'true',
    'x-dev-bypass-user-id': userId,
    'x-dev-bypass-role': role
  });

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

/**
 * P1 Order-Scoped Action Helper:
 * Clicks a button inside the specific ListItem matching order shortId
 */
async function clickOrderActionButton(ownerPage: any, orderId: string, buttonText: string, timeout = 25000) {
  const shortId = orderId.slice(0, 6).toLowerCase();
  await ownerPage.waitForFunction((sId: string, bText: string) => {
    const listItems = Array.from(document.querySelectorAll('li'));
    const targetItem = listItems.find(li => li.textContent?.toLowerCase().includes(sId));
    if (!targetItem) return false;
    const btns = Array.from(targetItem.querySelectorAll('button'));
    return btns.some(b => b.textContent?.trim().toLowerCase() === bText.toLowerCase() && !b.disabled);
  }, { timeout }, shortId, buttonText);

  await ownerPage.evaluate((sId: string, bText: string) => {
    const listItems = Array.from(document.querySelectorAll('li'));
    const targetItem = listItems.find(li => li.textContent?.toLowerCase().includes(sId));
    if (!targetItem) throw new Error(`Could not find list item for order #${sId}`);
    const btns = Array.from(targetItem.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent?.trim().toLowerCase() === bText.toLowerCase() && !b.disabled);
    if (!btn) throw new Error(`Could not find button "${bText}" in order #${sId}`);
    btn.click();
  }, shortId, buttonText);
}

async function getBackendOrderStatus(orderId: string): Promise<string> {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: {
      'x-dev-bypass-auth': 'true',
      'x-dev-bypass-user-id': ADMIN_ID,
      'x-dev-bypass-role': 'admin'
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch backend order: ${res.status}`);
  const data = (await res.json()) as any;
  return data.data?.status || '';
}

async function waitForCustomerStatusChip(page: any, orderId: string, expectedStatusSubstring: string, timeout = 20000) {
  const shortId = orderId.substring(0, 8);
  await page.waitForFunction((sId: string, exp: string) => {
    const headers = Array.from(document.querySelectorAll('h5'));
    const orderHeader = headers.find(h => h.textContent?.includes(sId));
    if (!orderHeader) return false;
    const parentBox = orderHeader.parentElement;
    const chip = parentBox?.querySelector('.MuiChip-label');
    const txt = chip?.textContent?.trim().toUpperCase() || '';
    return txt.includes(exp.toUpperCase());
  }, { timeout }, shortId, expectedStatusSubstring);
}

async function runBrowserE2E() {
  console.log('===============================================================');
  console.log('🚀 Starting Puppeteer Hardened Multi-Actor E2E Verification...');
  console.log('===============================================================');
  
  // P0 Database Guard Check
  await assertDedicatedTestDatabase();

  // P0 Scoped Seed
  await seedScopedData();

  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    // ---------------------------------------------------------
    // 1. CUSTOMER FLOW: ADD TO CART & CHECKOUT
    // ---------------------------------------------------------
    console.log('\n[1/7] Customer ordering flow...');
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

    // Verify initial Customer state
    await waitForCustomerStatusChip(customerPage, orderId, 'PENDING OWNER');
    const initialApiStatus = await getBackendOrderStatus(orderId);
    console.log(`Initial status: UI chip="PENDING OWNER", Backend="${initialApiStatus}"`);
    if (initialApiStatus !== 'pending_owner') {
      throw new Error(`Expected initial backend status pending_owner, got ${initialApiStatus}`);
    }

    // ---------------------------------------------------------
    // 2. PARTNER PRE-LOGIN (Connect socket before order is ready)
    // ---------------------------------------------------------
    console.log('\n[2/7] Partner connecting to socket at /partner/orders...');
    const { page: partnerPage } = await setupPage(browser, 'partner', PARTNER_ID, 'PARTNER');
    await partnerPage.goto(`${WEB_URL}/partner/orders`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));
    console.log('Partner socket active and awaiting assignments.');

    // ---------------------------------------------------------
    // 3. OWNER FLOW: ACCEPT -> PREPARING -> READY (Order-Scoped)
    // ---------------------------------------------------------
    console.log('\n[3/7] Owner managing order lifecycle at /owner with strict order scoping...');
    const { page: ownerPage } = await setupPage(browser, 'owner', OWNER_ID, 'OWNER');
    await ownerPage.goto(`${WEB_URL}/owner`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));

    // Step 3a: Accept Order
    console.log(`Owner clicking Accept for order #${orderId.slice(0, 6)}...`);
    await clickOrderActionButton(ownerPage, orderId, 'Accept');
    await new Promise(r => setTimeout(r, 800));
    await waitForCustomerStatusChip(customerPage, orderId, 'CONFIRMED');
    const confirmedApiStatus = await getBackendOrderStatus(orderId);
    console.log(`✅ State 1 Verified: Customer UI="CONFIRMED" (via Socket.IO), Backend="${confirmedApiStatus}"`);
    if (confirmedApiStatus !== 'confirmed') {
      throw new Error(`Expected confirmed, got ${confirmedApiStatus}`);
    }

    // Step 3b: Mark Preparing
    console.log(`Owner clicking Mark Preparing for order #${orderId.slice(0, 6)}...`);
    await clickOrderActionButton(ownerPage, orderId, 'Mark Preparing');
    await new Promise(r => setTimeout(r, 800));
    await waitForCustomerStatusChip(customerPage, orderId, 'PREPARING');
    const preparingApiStatus = await getBackendOrderStatus(orderId);
    console.log(`✅ State 2 Verified: Customer UI="PREPARING" (via Socket.IO), Backend="${preparingApiStatus}"`);
    if (preparingApiStatus !== 'preparing') {
      throw new Error(`Expected preparing, got ${preparingApiStatus}`);
    }

    // Step 3c: Mark Ready
    console.log(`Owner clicking Mark Ready for order #${orderId.slice(0, 6)}...`);
    await clickOrderActionButton(ownerPage, orderId, 'Mark Ready');
    await waitForCustomerStatusChip(customerPage, orderId, 'AWAITING PARTNER');
    const awaitingApiStatus = await getBackendOrderStatus(orderId);
    console.log(`✅ State 3 Verified: Customer UI="AWAITING PARTNER" (via Socket.IO), Backend="${awaitingApiStatus}"`);
    if (awaitingApiStatus !== 'awaiting_partner') {
      throw new Error(`Expected awaiting_partner, got ${awaitingApiStatus}`);
    }

    // ---------------------------------------------------------
    // 4. REAL CROSS-DOMAIN SOCKET.IO CHAT VERIFICATION (Phase 9)
    // ---------------------------------------------------------
    console.log('\n[4/7] Real Socket.IO Cross-Domain Chat Exchange Verification...');
    
    // 4a. Customer sends chat message to Restaurant
    console.log('Customer opening chat with restaurant...');
    await clickButtonWithText(customerPage, 'Chat with Restaurant');
    await customerPage.waitForSelector('input[placeholder="Type a message..."]', { timeout: 10000 });
    
    const customerMsg = 'E2E Customer message: Extra ketchup and napkins please!';
    await customerPage.type('input[placeholder="Type a message..."]', customerMsg);
    await customerPage.keyboard.press('Enter');
    
    await customerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 10000 }, customerMsg);
    console.log(`Customer sent message: "${customerMsg}"`);

    // 4b. Owner opens chat for this order and receives Customer message
    console.log(`Owner opening chat for order #${orderId.slice(0, 6)}...`);
    await clickOrderActionButton(ownerPage, orderId, 'Chat');
    await ownerPage.waitForSelector('input[placeholder="Type a message..."]', { timeout: 10000 });
    
    await ownerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 15000 }, customerMsg);
    console.log(`✅ Owner received customer message via Socket.IO: "${customerMsg}"`);

    // 4c. Owner sends reply back to Customer
    const ownerReply = 'E2E Owner reply: Confirmed! Extra ketchup and napkins included.';
    await ownerPage.type('input[placeholder="Type a message..."]', ownerReply);
    await ownerPage.keyboard.press('Enter');

    await ownerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 10000 }, ownerReply);
    console.log(`Owner sent reply: "${ownerReply}"`);

    // 4d. Customer receives Owner reply live via Socket.IO
    await customerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 15000 }, ownerReply);
    console.log(`✅ Customer received owner reply via Socket.IO: "${ownerReply}"`);

    // Close chat dialogs
    await customerPage.keyboard.press('Escape');
    await ownerPage.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
    console.log('✅ Real two-way Socket.IO chat exchange verified successfully!');

    // ---------------------------------------------------------
    // 5. PARTNER ACCEPTS & OWNER HANDOFF CONFIRMATION
    // ---------------------------------------------------------
    console.log('\n[5/7] Partner accepting assignment and starting simulation...');
    await partnerPage.bringToFront();
    await partnerPage.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent?.trim() === 'Accept');
    }, { timeout: 20000 });

    console.log('Partner clicking Accept...');
    await clickButtonWithText(partnerPage, 'Accept');

    await partnerPage.waitForFunction(() => {
      return window.location.href.includes('/partner/active');
    }, { timeout: 15000 });
    console.log('Partner navigated to /partner/active.');

    // Wait for Partner to arrive at restaurant -> Owner sees "Confirm Handoff"
    console.log('Waiting for Partner Arrived / Confirm Handoff button on Owner Dashboard...');
    await ownerPage.bringToFront();
    await clickOrderActionButton(ownerPage, orderId, 'Confirm Handoff', 40000);
    console.log('✅ Owner confirmed handoff! Food picked up by partner.');

    // Customer tracking updates to Picked Up / Out for delivery
    await customerPage.bringToFront();
    await waitForCustomerStatusChip(customerPage, orderId, 'PICKED UP');
    const pickedUpApiStatus = await getBackendOrderStatus(orderId);
    console.log(`✅ State 4 Verified: Customer UI="PICKED UP" (via Socket.IO), Backend="${pickedUpApiStatus}"`);

    // ---------------------------------------------------------
    // 6. STRICT PARTNER MARKER MOVEMENT ASSERTION (Flaticon 3209865)
    // ---------------------------------------------------------
    console.log('\n[6/7] Strict Delivery Partner Leaflet Marker Movement Assertion...');
    
    // Assert marker renders specifically with icon 3209865
    await customerPage.waitForFunction(() => {
      return !!document.querySelector('.leaflet-marker-pane img[src*="3209865"]');
    }, { timeout: 30000 }).catch(() => {
      throw new Error('CRITICAL ASSERTION FAILED: Delivery partner marker (.leaflet-marker-pane img[src*="3209865"]) was NOT found in Leaflet DOM!');
    });

    console.log('Partner marker located in Leaflet DOM. Tracking position changes...');
    const markerPositions: string[] = [];
    const markerCheckStart = Date.now();

    while (Date.now() - markerCheckStart < 60000 && markerPositions.length < 2) {
      const currentPos = await customerPage.evaluate(() => {
        const partnerMarker = document.querySelector('.leaflet-marker-pane img[src*="3209865"]') as HTMLElement;
        return partnerMarker ? partnerMarker.style.transform : null;
      });

      if (currentPos && !markerPositions.includes(currentPos)) {
        markerPositions.push(currentPos);
        console.log(`📍 Detected partner marker position #${markerPositions.length}: ${currentPos}`);
      }

      const isDelivered = await customerPage.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('enjoy your food') || text.includes('rate your experience');
      });
      if (isDelivered && markerPositions.length >= 2) break;

      await new Promise(r => setTimeout(r, 2000));
    }

    if (markerPositions.length < 2) {
      if (markerPositions.length === 1) {
        throw new Error(
          `CRITICAL ASSERTION FAILED: Delivery partner marker rendered but stayed static at position ${markerPositions[0]} across simulation ticks.`
        );
      } else {
        throw new Error('CRITICAL ASSERTION FAILED: Delivery partner marker position could not be read.');
      }
    }
    console.log(`✅ SUCCESS: Partner marker moved across ${markerPositions.length} distinct positions!`);

    // ---------------------------------------------------------
    // 7. TERMINAL STATE SYNCHRONIZATION ACROSS ALL ACTORS
    // ---------------------------------------------------------
    console.log('\n[7/7] Verifying terminal states across Customer, Partner, Admin, and Database...');

    // 7a. Customer Terminal Assertion
    console.log('Waiting for Customer tracking page to reach DELIVERED state...');
    await customerPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('enjoy your food') || text.includes('rate your experience');
    }, { timeout: 120000 });
    await waitForCustomerStatusChip(customerPage, orderId, 'DELIVERED');
    console.log('✅ 7a Customer browser reflects DELIVERED chip and "Enjoy your food" banner!');

    // 7b. Partner Terminal Assertion
    console.log('Verifying Partner view and API release status...');
    await partnerPage.bringToFront();
    await partnerPage.waitForFunction(() => {
      return document.body.innerText.toLowerCase().includes('no active delivery');
    }, { timeout: 30000 });
    console.log('✅ 7b.1 Partner UI accurately displays "No active delivery"');

    const partnerMeRes = await fetch(`${API_URL}/delivery/partner/me`, {
      headers: {
        'x-dev-bypass-auth': 'true',
        'x-dev-bypass-user-id': PARTNER_ID,
        'x-dev-bypass-role': 'partner'
      }
    });
    if (!partnerMeRes.ok) throw new Error(`Partner /me fetch failed: ${partnerMeRes.status}`);
    const partnerMeData = (await partnerMeRes.json()) as any;
    console.log(`Partner /me: status="${partnerMeData.data?.status}", activeAssignment=${JSON.stringify(partnerMeData.data?.activeAssignment)}`);
    if (partnerMeData.data?.status !== 'available') {
      throw new Error(`Expected partner status 'available', got '${partnerMeData.data?.status}'`);
    }
    if (partnerMeData.data?.activeAssignment !== null && partnerMeData.data?.activeAssignment !== undefined) {
      throw new Error(`Expected partner activeAssignment null, got ${JSON.stringify(partnerMeData.data?.activeAssignment)}`);
    }
    console.log('✅ 7b.2 Partner API confirmed released (activeAssignment: null, status: "available")');

    // 7c. Admin Isolated Row Assertion
    console.log('Admin initializing auth session at /admin...');
    const { page: adminPage } = await setupPage(browser, 'admin', ADMIN_ID, 'ADMIN');
    await adminPage.goto(`${WEB_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('dashboard') || text.includes('recent orders') || text.includes('admin');
    }, { timeout: 20000 });

    console.log('Admin navigating to /admin/orders...');
    await adminPage.goto(`${WEB_URL}/admin/orders`, { waitUntil: 'domcontentloaded' });

    await adminPage.waitForFunction((targetId: string) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find(r => {
        const text = r.textContent?.toLowerCase() || '';
        return text.includes(targetId.toLowerCase()) ||
               text.includes(targetId.slice(0, 6).toLowerCase()) ||
               text.includes(targetId.slice(-6).toLowerCase());
      });
      return !!targetRow && targetRow.textContent?.toLowerCase().includes('delivered');
    }, { timeout: 30000 }, orderId);

    const isolatedRowText = await adminPage.evaluate((targetId: string) => {
      const rows = Array.from(document.querySelectorAll('tr'));
      const targetRow = rows.find(r => {
        const text = r.textContent?.toLowerCase() || '';
        return text.includes(targetId.toLowerCase()) ||
               text.includes(targetId.slice(0, 6).toLowerCase()) ||
               text.includes(targetId.slice(-6).toLowerCase());
      });
      return targetRow ? targetRow.innerText : null;
    }, orderId);

    if (!isolatedRowText || !isolatedRowText.toLowerCase().includes('delivered')) {
      throw new Error(`Admin row for order ${orderId} does not show delivered: "${isolatedRowText}"`);
    }
    console.log(`✅ 7c Admin table isolated row confirmed Delivered: "${isolatedRowText.replace(/\n/g, ' ')}"`);

    // 7d. Database Document Consistency
    const finalApiStatus = await getBackendOrderStatus(orderId);
    console.log(`Final Database Order status: ${finalApiStatus}`);
    if (finalApiStatus !== 'delivered') {
      throw new Error(`Expected order document status 'delivered', got '${finalApiStatus}'`);
    }
    console.log('✅ 7d Backend Order document confirmed in terminal status: delivered');

    console.log('\n===============================================================');
    console.log('🎉🎉🎉 HARDENED FULL MULTI-ACTOR E2E VERIFIED SUCCESSFULLY 🎉🎉🎉');
    console.log('===============================================================');

  } finally {
    await browser.close();
    // P0 Scoped Cleanup
    await cleanupScopedData();
  }
}

runBrowserE2E().catch(err => {
  console.error('\n❌ Browser E2E Verification failed:', err);
  process.exit(1);
});
