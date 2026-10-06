import puppeteer from 'puppeteer';

const API_URL = 'http://localhost:1000/api/v1';
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

async function setupPage(browser: any, role: string, userId: string) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  // Dev bypass headers
  await page.setExtraHTTPHeaders({
    'x-dev-bypass-auth': 'true',
    'x-dev-bypass-user-id': userId,
    'x-dev-bypass-role': role
  });

  // Inject dummy token so AuthContext calls /auth/me
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("zom2.auth.session", JSON.stringify({ token: "dummy" }));
    // Disable any actual dev bypass UI logic if it interferes, though the backend will handle the headers
  });

  return { context, page };
}

async function runBrowserE2E() {
  console.log('Starting Puppeteer Browser E2E Verification...');
  await seedData();

  const browser = await puppeteer.launch({ headless: 'new' });

  try {
    // ---------------------------------------------------------
    // 1. CUSTOMER FLOW
    // ---------------------------------------------------------
    console.log('1. Customer placing order...');
    const { page: customerPage } = await setupPage(browser, 'user', CUSTOMER_ID);
    
    customerPage.on('console', msg => console.log('PAGE LOG:', msg.text()));
    customerPage.on('pageerror', err => console.error('PAGE ERROR:', err.message));
    
    await customerPage.goto(`${WEB_URL}/restaurants/${RESTAURANT_ID}`, { waitUntil: 'networkidle0' });
    try {
      await customerPage.waitForSelector('text/Puppeteer Burger', { timeout: 10000 });
    } catch (err) {
      throw err;
    }
    
    // Add to cart (look for Add or + button)
    // Wait, since we don't know the exact button, let's just make the API call for the cart?
    // No, the prompt says "Do not substitute direct API calls for UI actions."
    // We must find the button. Let's dump the HTML if we fail.
    
    console.log('Found menu item. Clicking add to cart...');
    const added = await customerPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button'));
      const addBtn = items.find(b => b.textContent?.toLowerCase().includes('add') || b.textContent?.includes('+'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      console.log('Available buttons:', items.map(b => b.textContent));
      return false;
    });

    if (!added) throw new Error('Could not find Add to Cart button');
    
    // Go to checkout
    await customerPage.goto(`${WEB_URL}/checkout`);
    
    console.log('Proceeding through checkout stepper...');
    for (let i = 0; i < 3; i++) {
      await customerPage.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const continueBtn = btns.find(b => b.textContent?.includes('Continue') || b.textContent?.includes('Next'));
        continueBtn?.click();
      });
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log('Clicking Place Order...');
    await customerPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const placeBtn = btns.find(b => b.textContent?.includes('Place Order') || b.textContent?.includes('Checkout'));
      placeBtn?.click();
    });

    await customerPage.waitForNavigation({ timeout: 15000 }); // Wait for redirect to /orders/confirmation
    console.log(`✅ Placed order! URL: ${customerPage.url()}`);
    
    console.log('Clicking Track Order...');
    const tracked = await customerPage.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const trackBtn = btns.find(b => b.textContent?.toLowerCase().includes('track'));
      if (trackBtn && !trackBtn.disabled) {
        trackBtn.click();
        return true;
      }
      return false;
    }, { timeout: 15000 });
    if (!tracked) {
      console.log(await customerPage.content());
      throw new Error('Track button not found');
    }

    try {
      await customerPage.waitForFunction(() => window.location.href.includes('track'), { timeout: 15000 });
    } catch (e) {
      console.log(await customerPage.content());
      throw e;
    }
    const trackingUrl = customerPage.url();
    console.log(`✅ Tracking URL: ${trackingUrl}`);
    
    // ---------------------------------------------------------
    // 3. PARTNER PRE-LOGIN (MUST CONNECT TO SOCKET BEFORE OWNER CLICKS READY)
    // ---------------------------------------------------------
    console.log('3. Partner logging in to receive socket assignment...');
    const { page: partnerPage } = await setupPage(browser, 'partner', PARTNER_ID);
    partnerPage.on('console', msg => console.log('PARTNER LOG:', msg.text()));
    await partnerPage.goto(`${WEB_URL}/partner/orders`, { waitUntil: 'networkidle0' });
    
    // ---------------------------------------------------------
    // 2. OWNER FLOW
    // ---------------------------------------------------------
    console.log('2. Owner accepting order...');
    const { page: ownerPage } = await setupPage(browser, 'owner', OWNER_ID);
    
    ownerPage.on('console', msg => console.log('OWNER LOG:', msg.text()));
    await ownerPage.goto(`${WEB_URL}/owner/queue`, { waitUntil: 'networkidle0' });
    try {
      await ownerPage.waitForSelector('text/Puppeteer Burger', { timeout: 10000 }); // The order should appear
    } catch (err) {
      console.error(await ownerPage.content());
      throw err;
    }

    // Click Accept in Queue
    const ownerAction = async (text: string) => {
      await ownerPage.waitForFunction((btnText) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent?.toLowerCase().includes(btnText.toLowerCase()));
        if (btn && !btn.disabled) {
          btn.click();
          return true;
        }
        return false;
      }, { timeout: 15000 }, text);
      await new Promise(r => setTimeout(r, 1500));
    };

    await ownerAction('Accept');
    console.log('Owner clicked Accept');
    
    // Switch to Active page
    await ownerPage.goto(`${WEB_URL}/owner/active`, { waitUntil: 'networkidle0' });

    // Click Start Preparing
    await ownerAction('Start');
    console.log('Owner clicked Prepare');

    await ownerPage.reload({ waitUntil: 'networkidle0' });

    // Click Mark Ready (Triggers delivery:available socket event)
    await ownerAction('Ready');
    console.log('Owner clicked Ready');
    await new Promise(r => setTimeout(r, 2000));
    console.log('✅ Owner successfully processed order.');

    // Assert Customer Realtime
    try {
      await customerPage.waitForFunction(() => {
        const text = document.body.textContent?.toLowerCase() || '';
        return text.includes('preparing') || text.includes('being prepared');
      }, { timeout: 15000 });
    } catch (e) {
      console.log(await customerPage.content());
      throw new Error('Customer tracking did not update to Preparing via Socket');
    }
    console.log('✅ Customer browser realtime updated to Preparing');

    // ---------------------------------------------------------
    // 4. PARTNER FLOW (Already on /partner/orders)
    // ---------------------------------------------------------
    console.log('4. Partner lifecycle...');
    
    // Wait for the assignment to appear
    try {
      await partnerPage.waitForSelector('text/Puppeteer', { timeout: 10000 });
    } catch (e) {
      console.log(await partnerPage.content());
      throw e;
    }

    const partnerAction = async (text: string) => {
      await partnerPage.waitForFunction((btnText) => {
        const btns = Array.from(document.querySelectorAll('button'));
        // Try exact match first, otherwise fallback to includes. If multiple, pick the last one (usually in a dialog overlay)
        let matches = btns.filter(b => b.textContent?.trim().toLowerCase() === btnText.toLowerCase());
        if (matches.length === 0) {
          matches = btns.filter(b => b.textContent?.toLowerCase().includes(btnText.toLowerCase()));
        }
        const btn = matches[matches.length - 1]; // Pick the last matching button (dialogs are appended at the end of DOM)
        if (btn && !btn.disabled) {
          btn.click();
          return true;
        }
        return false;
      }, { timeout: 15000 }, text);
      await new Promise(r => setTimeout(r, 1500));
    };

    await partnerAction('Accept');
    console.log('Partner Accepted');
    
    // Switch to active delivery
    await partnerPage.goto(`${WEB_URL}/partner/active`, { waitUntil: 'networkidle0' });
    
    await partnerAction('Arrived'); // "Arrived at Pickup"
    console.log('Partner Arrived');
    
    await partnerAction('Pickup'); // "Confirm Pickup" (opens dialog)
    await new Promise(r => setTimeout(r, 1000)); // Wait for dialog transition
    await partnerAction('Confirm'); // Dialog "Confirm"
    console.log('Partner Picked Up');
    
    await partnerAction('Start Delivery'); // "Start Delivery"
    console.log('Partner Out for Delivery');
    
    await partnerAction('Delivered'); // "Mark Delivered" (opens dialog)
    // Wait for dialog to open before clicking the second 'Delivered' button
    await new Promise(r => setTimeout(r, 1000));
    await partnerAction('Delivered'); // Dialog "Delivered"
    console.log('Partner Delivered');

    console.log('✅ Partner successfully delivered order.');

    // ---------------------------------------------------------
    // 4. CUSTOMER TERMINAL VERIFICATION
    // ---------------------------------------------------------
    console.log('4. Verifying Customer terminal state...');
    try {
      await customerPage.waitForFunction(() => {
        return document.body.textContent?.toLowerCase().includes('delivered');
      }, { timeout: 15000 });
    } catch (e) {
      console.log(await customerPage.content());
      throw new Error('Customer tracking did not reach Delivered state via Socket');
    }
    console.log('✅ Customer browser accurately reflects Delivered state');

    // ---------------------------------------------------------
    // 5. ADMIN FLOW
    // ---------------------------------------------------------
    console.log('5. Admin verifying visibility...');
    const { page: adminPage } = await setupPage(browser, 'admin', ADMIN_ID);
    await adminPage.goto(`${WEB_URL}/admin/orders`);
    await adminPage.waitForSelector('text/Puppeteer Test Restaurant', { timeout: 10000 });
    
    const adminHtml = await adminPage.content();
    if (!adminHtml.toLowerCase().includes('delivered')) {
      throw new Error('Admin sees the order but it is not marked Delivered');
    }
    console.log('✅ Admin browser correctly lists the Delivered order');

    console.log('\n✅✅✅ FULL BROWSER APPLICATION LIFECYCLE VERIFIED SUCCESSFULLY ✅✅✅');

  } finally {
    await browser.close();
  }
}

runBrowserE2E().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
