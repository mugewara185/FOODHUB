const puppeteer = require('puppeteer-core');
const fs = require('fs');

// Path to Edge on Windows
const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // We will simulate logging in via setting localStorage
    await page.goto('http://localhost:5173/login');
    
    // Evaluate to set auth state in localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'mock_token');
      // If the app relies on Redux Persist or something, we can mock it:
      localStorage.setItem('persist:root', JSON.stringify({
        auth: JSON.stringify({ user: { role: 'owner', name: 'Test Owner' }, isAuthenticated: true, token: 'mock' })
      }));
    });
    
    // Go to owner menu
    await page.goto('http://localhost:5173/owner/menu', { waitUntil: 'networkidle0' });
    
    // Screenshot
    await page.screenshot({ path: 'C:\\Users\\aansi\\.gemini\\antigravity\\brain\\48831d40-970e-41cc-aebe-9f875f971189\\scratch\\sidebar-test-1.png' });
    
    // Assert Dashboard is NOT selected
    const isDashboardSelected = await page.evaluate(() => {
      const db = Array.from(document.querySelectorAll('.MuiListItemText-root')).find(el => el.textContent === 'Dashboard');
      return db ? db.closest('.MuiListItemButton-root').classList.contains('Mui-selected') : false;
    });
    
    // Assert Menu Management IS selected
    const isMenuSelected = await page.evaluate(() => {
      const menu = Array.from(document.querySelectorAll('.MuiListItemText-root')).find(el => el.textContent === 'Menu Management');
      return menu ? menu.closest('.MuiListItemButton-root').classList.contains('Mui-selected') : false;
    });
    
    // Assert Coming Soon renders
    const isComingSoon = await page.evaluate(() => {
      return document.body.innerText.includes('Coming Soon') && document.body.innerText.includes('Menu Management');
    });

    console.log('--- TEST RESULTS ---');
    console.log('Dashboard selected:', isDashboardSelected);
    console.log('Menu selected:', isMenuSelected);
    console.log('ComingSoon rendered:', isComingSoon);
    console.log('--- END ---');
    
  } catch (error) {
    console.error('Puppeteer error:', error);
  } finally {
    if (browser) await browser.close();
  }
})();
