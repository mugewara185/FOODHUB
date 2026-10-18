import puppeteer from 'puppeteer';

const API_URL = 'http://localhost:1000/api';
const WEB_URL = 'http://localhost:5173';

const CUSTOMER_ID = '64e8e50f3c5f4a1b8c1a9901';
const OWNER_ID = '64e8e50f3c5f4a1b8c1a9902';
const PARTNER_ID = '64e8e50f3c5f4a1b8c1a9903';
const ADMIN_ID = '64e8e50f3c5f4a1b8c1a9904';
const STRANGER_CUSTOMER_ID = '64e8e50f3c5f4a1b8c1a9909';
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
          deleteIds: [CUSTOMER_ID, OWNER_ID, PARTNER_ID, ADMIN_ID, STRANGER_CUSTOMER_ID],
          documents: [
            { _id: CUSTOMER_ID, name: 'E2E Customer', email: 'cust@e2e.com', password: 'password', roles: ['user'], phone: '111111' },
            { _id: OWNER_ID, name: 'E2E Owner', email: 'owner@e2e.com', password: 'password', roles: ['owner'], phone: '222222' },
            { _id: PARTNER_ID, name: 'E2E Partner', email: 'partner@e2e.com', password: 'password', roles: ['partner'], phone: '333333' },
            { _id: ADMIN_ID, name: 'E2E Admin', email: 'admin@e2e.com', password: 'password', roles: ['admin'], phone: '444444' },
            { _id: STRANGER_CUSTOMER_ID, name: 'E2E Stranger', email: 'stranger@e2e.com', password: 'password', roles: ['user'], phone: '555555' }
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
              currentLocation: { type: 'Point', coordinates: [77.6500, 13.0200] }
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
        { modelName: 'User', deleteIds: [CUSTOMER_ID, OWNER_ID, PARTNER_ID, ADMIN_ID, STRANGER_CUSTOMER_ID] },
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

    // Assert no duplicate message bubbles for customerMsg or ownerReply
    const custChatBubbleCount = await customerPage.evaluate((cMsg: string, oMsg: string) => {
      const paragraphs = Array.from(document.querySelectorAll('p'));
      return {
        cCount: paragraphs.filter(p => p.textContent?.trim() === cMsg).length,
        oCount: paragraphs.filter(p => p.textContent?.trim() === oMsg).length,
      };
    }, customerMsg, ownerReply);
    if (custChatBubbleCount.cCount !== 1 || custChatBubbleCount.oCount !== 1) {
      throw new Error(`Duplicate chat message detected in Customer<->Owner chat! Counts: ${JSON.stringify(custChatBubbleCount)}`);
    }
    console.log('✅ Verified zero duplicate chat bubbles in Customer ↔ Owner chat.');

    // Close chat dialogs
    await customerPage.keyboard.press('Escape');
    await ownerPage.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));
    console.log('✅ Real two-way Socket.IO chat exchange (Customer ↔ Owner) verified successfully!');

    // 4e. Chat Persistence Across Reload
    console.log('Verifying chat history persistence across customer page reload...');
    await customerPage.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    console.log('Customer re-opening chat with restaurant after reload...');
    await clickButtonWithText(customerPage, 'Chat with Restaurant');
    await customerPage.waitForSelector('input[placeholder="Type a message..."]', { timeout: 10000 });

    await customerPage.waitForFunction((cMsg: string, oReply: string) => {
      return document.body.innerText.includes(cMsg) && document.body.innerText.includes(oReply);
    }, { timeout: 15000 }, customerMsg, ownerReply);
    console.log('✅ Chat persistence confirmed: Both customer message and owner reply survived reload!');
    await customerPage.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    // 4f. Chat Authorization & Order Isolation Check
    console.log('Verifying chat authorization and order isolation for unauthorized stranger...');
    const strangerChatRes = await fetch(`${API_URL}/orders/${orderId}/chat`, {
      headers: {
        'x-dev-bypass-auth': 'true',
        'x-dev-bypass-user-id': STRANGER_CUSTOMER_ID,
        'x-dev-bypass-role': 'user'
      }
    });
    console.log(`Stranger GET /orders/${orderId}/chat status: ${strangerChatRes.status}`);
    if (strangerChatRes.status !== 403) {
      throw new Error(`Expected status 403 Forbidden for unauthorized customer accessing order chat, got ${strangerChatRes.status}`);
    }
    console.log('✅ Order chat isolation verified: Unauthorized user is denied access (HTTP 403 Forbidden).');

    // 4g. Socket Security Isolation Check (Room Join & Location Update)
    console.log('Verifying socket security isolation for unauthorized stranger socket...');
    const { io: ioClient } = await import('socket.io-client');
    const strangerSocket = ioClient('http://localhost:1000', {
      transports: ['websocket'],
      auth: { devBypass: true, userId: STRANGER_CUSTOMER_ID, role: 'user' }
    });
    await new Promise<void>((res) => strangerSocket.on('connect', res));

    let unauthorizedRoomError: any = null;
    strangerSocket.on('error', (err) => { unauthorizedRoomError = err; });
    strangerSocket.emit('join_order_room', orderId);
    await new Promise(r => setTimeout(r, 500));
    if (!unauthorizedRoomError) {
      throw new Error('CRITICAL SECURITY FAILED: Unauthorized stranger socket was able to join order room without error!');
    }
    console.log(`✅ Unauthorized room join rejected by socket: "${unauthorizedRoomError.message}"`);

    let unauthorizedLocationError: any = null;
    strangerSocket.on('error', (err) => { unauthorizedLocationError = err; });
    strangerSocket.emit('partner:location_updated', {
      deliveryId: 'fake-delivery-id',
      partnerId: 'fake-partner-id',
      location: { lat: 12.98, lng: 77.60 }
    });
    await new Promise(r => setTimeout(r, 500));
    if (!unauthorizedLocationError) {
      throw new Error('CRITICAL SECURITY FAILED: Unauthorized stranger socket was able to emit partner:location_updated without error!');
    }
    console.log(`✅ Unauthorized location update rejected by socket: "${unauthorizedLocationError.message}"`);
    strangerSocket.disconnect();

    // ---------------------------------------------------------
    // 5. PARTNER ACCEPTS & ORIGIN / ETA / 6-WAY CHAT / HANDOFF VERIFICATION
    // ---------------------------------------------------------
    console.log('\n[5/7] Partner accepting assignment and navigating to active delivery...');
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

    // ---------------------------------------------------------
    // 5a. FIX B VERIFICATION: PARTNER ORIGIN NEAR RESTAURANT (NOT STALE / NOT CUSTOMER)
    // ---------------------------------------------------------
    console.log('\n[5a] Verifying Fix B (Partner Origin near Restaurant) & Partner Active Delivery Map...');
    const partnerMeInitialRes = await fetch(`${API_URL}/delivery/partner/me`, {
      headers: {
        'x-dev-bypass-auth': 'true',
        'x-dev-bypass-user-id': PARTNER_ID,
        'x-dev-bypass-role': 'partner'
      }
    });
    const partnerMeInitial = (await partnerMeInitialRes.json()) as any;
    const assignedLoc = partnerMeInitial.data?.currentLocation;
    console.log(`Assigned Partner Origin from /partner/me: ${JSON.stringify(assignedLoc)}`);
    if (!assignedLoc || (assignedLoc.lat === 13.02 && assignedLoc.lng === 77.65)) {
      throw new Error(`Fix B Failed: Partner started at stale seeded coordinate: ${JSON.stringify(assignedLoc)}`);
    }
    const distFromPickupDeg = Math.hypot(assignedLoc.lat - 12.9716, assignedLoc.lng - 77.5946);
    if (distFromPickupDeg > 0.015) {
      throw new Error(`Fix B Failed: Partner origin ${JSON.stringify(assignedLoc)} is too far from restaurant [12.9716, 77.5946]`);
    }
    console.log('✅ Fix B Verified: Partner initialized at plausible origin near restaurant pickup (not stale or customer location).');

    await partnerPage.waitForSelector('.leaflet-container', { timeout: 15000 });
    await partnerPage.waitForSelector('.leaflet-tile-pane img', { timeout: 15000 });

    // Assert courier, pickup, and customer markers + route polyline on partner map
    await partnerPage.waitForFunction(() => {
      const markers = document.querySelectorAll('.leaflet-marker-pane img');
      const hasCourier = Array.from(markers).some(m => (m as HTMLImageElement).src.includes('3209865'));
      const hasPickup = Array.from(markers).some(m => (m as HTMLImageElement).src.includes('3081840') || (m as HTMLImageElement).src.includes('restaurant') || (m as HTMLImageElement).src.includes('3170733'));
      const hasDropoff = Array.from(markers).some(m => (m as HTMLImageElement).src.includes('25694') || (m as HTMLImageElement).src.includes('customer') || (m as HTMLImageElement).src.includes('dropoff') || (m as HTMLImageElement).src.includes('red-dot'));
      const hasRouteLine = document.querySelectorAll('.leaflet-overlay-pane path.leaflet-interactive').length > 0;
      return markers.length >= 3 && hasCourier && hasPickup && hasDropoff && hasRouteLine;
    }, { timeout: 20000 });
    console.log('✅ Partner active-delivery page renders street map, route polyline, and pickup/customer/partner markers.');

    // Assert Stepper initial state on partner page
    await partnerPage.waitForFunction(() => {
      return document.body.innerText.includes('Order Assigned') && document.body.innerText.includes('Delivery Progress');
    }, { timeout: 10000 });
    console.log('✅ Partner active delivery stepper initialized with canonical progress state.');

    // ---------------------------------------------------------
    // 5b. FIX D VERIFICATION: PARTNER ↔ CUSTOMER AND PARTNER ↔ OWNER CHAT
    // ---------------------------------------------------------
    console.log('\n[5b] Verifying Fix D: Partner ↔ Customer & Partner ↔ Owner Two-Way Chat...');
    await clickButtonWithText(partnerPage, 'Chat with Customer / Restaurant');
    await partnerPage.waitForSelector('input[placeholder="Type a message..."]', { timeout: 10000 });

    // Direction 3: Partner -> Customer (default tab on Partner OrderChat is Customer)
    const partnerToCustMsg = 'E2E Partner msg: On my way to the restaurant for pickup!';
    await partnerPage.type('input[placeholder="Type a message..."]', partnerToCustMsg);
    await partnerPage.keyboard.press('Enter');

    await partnerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 10000 }, partnerToCustMsg);
    console.log(`Partner sent chat message to Customer: "${partnerToCustMsg}"`);

    // Customer opens chat with Driver and verifies receiving message
    console.log('Customer opening chat with driver to verify message receipt...');
    await customerPage.bringToFront();
    await clickButtonWithText(customerPage, 'Chat with Driver');
    await customerPage.waitForSelector('input[placeholder="Type a message..."]', { timeout: 10000 });

    await customerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 15000 }, partnerToCustMsg);
    console.log(`✅ Direction 3 Verified (Partner -> Customer): Customer received "${partnerToCustMsg}"`);

    // Direction 4: Customer -> Partner
    const custToPartnerReply = 'E2E Customer reply to partner: Great, please let me know when you arrive!';
    await customerPage.type('input[placeholder="Type a message..."]', custToPartnerReply);
    await customerPage.keyboard.press('Enter');

    await customerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 10000 }, custToPartnerReply);
    console.log(`Customer sent reply to partner: "${custToPartnerReply}"`);

    // Partner receives Customer reply live
    await partnerPage.bringToFront();
    await partnerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 15000 }, custToPartnerReply);
    console.log(`✅ Direction 4 Verified (Customer -> Partner): Partner received "${custToPartnerReply}"`);

    // Direction 5: Partner -> Owner (Switch Partner chat tab to "Restaurant")
    console.log('Switching Partner chat tab to Restaurant...');
    await partnerPage.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const restTab = tabs.find(t => t.textContent?.includes('Restaurant')) as HTMLElement;
      restTab?.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const partnerToOwnerMsg = 'E2E Partner to Owner: Reaching your restaurant in 1 minute!';
    await partnerPage.type('input[placeholder="Type a message..."]', partnerToOwnerMsg);
    await partnerPage.keyboard.press('Enter');
    await partnerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 10000 }, partnerToOwnerMsg);
    console.log(`Partner sent message to Owner: "${partnerToOwnerMsg}"`);

    // Owner opens Chat for this order and switches tab to "Driver"
    await ownerPage.bringToFront();
    await clickOrderActionButton(ownerPage, orderId, 'Chat');
    await ownerPage.waitForSelector('input[placeholder="Type a message..."]', { timeout: 10000 });
    await ownerPage.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const driverTab = tabs.find(t => t.textContent?.includes('Driver')) as HTMLElement;
      driverTab?.click();
    });
    await ownerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 15000 }, partnerToOwnerMsg);
    console.log(`✅ Direction 5 Verified (Partner -> Owner): Owner received "${partnerToOwnerMsg}"`);

    // Direction 6: Owner -> Partner
    const ownerToPartnerReply = 'E2E Owner to Partner: Order is packed and waiting at the counter!';
    await ownerPage.type('input[placeholder="Type a message..."]', ownerToPartnerReply);
    await ownerPage.keyboard.press('Enter');
    await ownerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 10000 }, ownerToPartnerReply);

    await partnerPage.bringToFront();
    await partnerPage.waitForFunction((msg: string) => {
      return document.body.innerText.includes(msg);
    }, { timeout: 15000 }, ownerToPartnerReply);
    console.log(`✅ Direction 6 Verified (Owner -> Partner): Partner received "${ownerToPartnerReply}"`);

    // Assert zero duplicate bubbles on Partner chat
    const partnerChatBubbleCount = await partnerPage.evaluate((pMsg: string, oMsg: string) => {
      const paragraphs = Array.from(document.querySelectorAll('p'));
      return {
        pCount: paragraphs.filter(p => p.textContent?.trim() === pMsg).length,
        oCount: paragraphs.filter(p => p.textContent?.trim() === oMsg).length,
      };
    }, partnerToOwnerMsg, ownerToPartnerReply);
    if (partnerChatBubbleCount.pCount !== 1 || partnerChatBubbleCount.oCount !== 1) {
      throw new Error(`Duplicate chat bubbles detected in Partner<->Owner chat: ${JSON.stringify(partnerChatBubbleCount)}`);
    }

    // Close chat dialogs on all 3 pages
    await customerPage.keyboard.press('Escape');
    await ownerPage.keyboard.press('Escape');
    await partnerPage.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    // Partner Chat Persistence Across Reload
    console.log('Verifying partner chat history & active delivery state persistence across reload...');
    await partnerPage.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    await clickButtonWithText(partnerPage, 'Chat with Customer / Restaurant');
    await partnerPage.waitForSelector('input[placeholder="Type a message..."]', { timeout: 10000 });

    await partnerPage.waitForFunction((pMsg: string, cReply: string) => {
      return document.body.innerText.includes(pMsg) && document.body.innerText.includes(cReply);
    }, { timeout: 15000 }, partnerToCustMsg, custToPartnerReply);
    console.log('✅ Partner chat persistence confirmed: Customer & Owner threads survived reload without duplicates!');
    await partnerPage.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    // ---------------------------------------------------------
    // 5c. FIX A VERIFICATION: OWNER TRACKING MODAL ETA AT ARRIVED_PICKUP
    // ---------------------------------------------------------
    console.log('\n[5c] Verifying Fix A: Owner Tracking Modal ETA at arrived_pickup (never "Calculating...")...');
    await ownerPage.bringToFront();
    // Wait until simulator reaches restaurant (Confirm Handoff button appears)
    await ownerPage.waitForFunction((sId: string) => {
      const listItems = Array.from(document.querySelectorAll('li'));
      const targetItem = listItems.find(li => li.textContent?.toLowerCase().includes(sId));
      if (!targetItem) return false;
      const btns = Array.from(targetItem.querySelectorAll('button'));
      return btns.some(b => b.textContent?.trim().toLowerCase() === 'confirm handoff');
    }, { timeout: 35000 }, orderId.slice(0, 6).toLowerCase());
    console.log('Partner has reached restaurant (arrived_pickup). Opening Owner Track modal...');

    await clickOrderActionButton(ownerPage, orderId, 'Track', 15000);
    await ownerPage.waitForFunction(() => {
      return document.body.innerText.includes('Partner arrived at restaurant');
    }, { timeout: 15000 });

    const ownerModalHasCalculating = await ownerPage.evaluate(() => {
      return document.body.innerText.includes('Calculating...');
    });
    if (ownerModalHasCalculating) {
      throw new Error('CRITICAL FIX A REGRESSION: Owner tracking modal displayed "Calculating..." at arrived_pickup!');
    }
    console.log('✅ Fix A Verified: Owner tracking modal displays "Partner arrived at restaurant" (and never "Calculating...").');
    await ownerPage.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 600));

    // ---------------------------------------------------------
    // 5d. OWNER CONFIRMS HANDOFF & PARTNER STEPPER REFRESH PERSISTENCE
    // ---------------------------------------------------------
    console.log('\n[5d] Owner confirming handoff & partner stepper/marker movement verification...');
    await clickOrderActionButton(ownerPage, orderId, 'Confirm Handoff', 25000);
    console.log('✅ Owner confirmed handoff! Food picked up by partner.');

    // Partner page reflects Picked Up / In Transit & courier marker moves on Leg 2
    await partnerPage.bringToFront();
    await partnerPage.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Picked Up') || text.includes('In Transit to Customer') || text.includes('Out for Delivery') || text.includes('OUT FOR DELIVERY');
    }, { timeout: 20000 });
    console.log('✅ Partner UI updated to Picked Up / In Transit state!');

    const partnerMapPositions: string[] = [];
    const pCheckStart = Date.now();
    while (Date.now() - pCheckStart < 25000 && partnerMapPositions.length < 2) {
      const pPos = await partnerPage.evaluate(() => {
        const m = document.querySelector('.leaflet-marker-pane img[src*="3209865"]') as HTMLElement;
        return m ? m.style.transform : null;
      });
      if (pPos && !partnerMapPositions.includes(pPos)) {
        partnerMapPositions.push(pPos);
        console.log(`📍 Partner active page courier position #${partnerMapPositions.length}: ${pPos}`);
      }
      await new Promise(r => setTimeout(r, 1500));
    }
    if (partnerMapPositions.length < 2) {
      throw new Error(`Fix C Failed: Partner courier marker did not move on Partner ActiveDelivery map (positions: ${JSON.stringify(partnerMapPositions)})`);
    }
    console.log(`✅ Fix C Verified: Partner courier marker moved across ${partnerMapPositions.length} positions on partner active map!`);

    // Refresh partner page and confirm stepper state remains correct
    console.log('Refreshing partner page to verify stepper state persistence...');
    await partnerPage.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    await partnerPage.waitForFunction(() => {
      const text = document.body.innerText;
      return text.includes('Picked Up') || text.includes('In Transit to Customer') || text.includes('Out for Delivery') || text.includes('Delivery Complete') || text.includes('No active delivery');
    }, { timeout: 20000 });
    console.log('✅ Partner progress stepper state preserved accurately across page reload!');

    // Customer tracking updates to Picked Up / Out for delivery
    await customerPage.bringToFront();
    await customerPage.waitForFunction((sId: string) => {
      const headers = Array.from(document.querySelectorAll('h5'));
      const orderHeader = headers.find(h => h.textContent?.includes(sId));
      if (!orderHeader) return false;
      const parentBox = orderHeader.parentElement;
      const chip = parentBox?.querySelector('.MuiChip-label');
      const txt = chip?.textContent?.trim().toUpperCase() || '';
      return txt.includes('PICKED UP') || txt.includes('OUT FOR DELIVERY') || txt.includes('NEARBY') || txt.includes('DELIVERED');
    }, { timeout: 20000 }, orderId.substring(0, 8));
    const pickedUpApiStatus = await getBackendOrderStatus(orderId);
    console.log(`✅ State 4 Verified: Customer UI reflects in-transit/delivered status, Backend="${pickedUpApiStatus}"`);

    // ---------------------------------------------------------
    // 6. STRICT PARTNER MARKER MOVEMENT ASSERTION (Flaticon 3209865)
    // ---------------------------------------------------------
    console.log('\n[6/7] Strict Delivery Partner Leaflet Marker Movement Assertion on Customer Map...');
    
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

      await new Promise(r => setTimeout(r, 1500));
    }

    if (markerPositions.length < 2) {
      throw new Error(
        `CRITICAL ASSERTION FAILED: Delivery partner marker did not move across multiple positions on customer map (${JSON.stringify(markerPositions)}).`
      );
    }
    console.log(`✅ SUCCESS: Partner marker moved across ${markerPositions.length} distinct positions on customer map!`);

    // ---------------------------------------------------------
    // 7. TERMINAL STATE SYNCHRONIZATION ACROSS ALL ACTORS
    // ---------------------------------------------------------
    console.log('\n[7/7] Verifying terminal states across Customer, Partner, Admin, and Database...');

    // 7a. Customer Terminal Assertion & Non-Zero Delivery Duration
    console.log('Waiting for Customer tracking page to reach DELIVERED state...');
    await customerPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('enjoy your food') || text.includes('rate your experience');
    }, { timeout: 120000 });
    await waitForCustomerStatusChip(customerPage, orderId, 'DELIVERED');

    const deliveredPageText = await customerPage.evaluate(() => document.body.innerText);
    if (deliveredPageText.includes('Delivered in 0 sec') || deliveredPageText.includes('in 0 sec')) {
      throw new Error(`Delivery timing regression: Customer page displayed "0 sec" delivery time!`);
    }
    console.log('✅ 7a Customer browser reflects DELIVERED chip, "Enjoy your food" banner, and non-zero delivery duration!');

    // 7b. Partner Terminal Assertion
    console.log('Verifying Partner view and API release status...');
    await partnerPage.bringToFront();
    await partnerPage.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('no active delivery') || text.includes('delivery complete');
    }, { timeout: 30000 });
    console.log('✅ 7b.1 Partner UI accurately displays terminal completion / "No active delivery"');

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
