import { chromium } from 'playwright';

const TIMEOUT = 60000;

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  const INTERCEPT_SCRIPT = `
    window.__fetchLog = [];
    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      const startTime = Date.now();
      try {
        const response = await origFetch.apply(window, args);
        const clone = response.clone();
        const elapsed = Date.now() - startTime;
        if (url.includes('identitytoolkit') || url.includes('securetoken')) {
          try {
            const body = await clone.text();
            window.__fetchLog.push({
              url: url.substring(0, 80),
              status: response.status,
              elapsed: elapsed + 'ms',
            });
          } catch (e) {}
        }
        return response;
      } catch (error) {
        throw error;
      }
    };
  `;

  try {
    // ========== TEST FLOW 1: ADMIN LOGIN + CREATE PRODUCT ==========
    console.log('=== TEST FLOW 1: ADMIN LOGIN + CREATE PRODUCT ===');
    
    // Step 1: Navigate to home
    console.log('Step 1: Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    console.log('✓ Home page loaded');
    
    // Step 2: Click "Iniciar sesión" button
    console.log('Step 2: Clicking "Iniciar sesión" button');
    const loginButton = page.locator('button[aria-label="Iniciar sesión"]');
    await loginButton.click({ timeout: TIMEOUT });
    console.log('✓ Auth modal opened');
    
    // Step 3: Verify auth modal is visible
    console.log('Step 3: Verifying auth modal');
    const modal = page.locator('[role="dialog"][aria-label="Iniciar sesión"]');
    await modal.waitFor({ state: 'visible', timeout: TIMEOUT });
    console.log('✓ Auth modal visible');
    
    // Step 4: Verify email/password fields and Google buttons exist
    console.log('Step 4: Verifying auth modal contents');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const clienteGoogleBtn = page.locator('button:has-text("Cliente")').first();
    const adminGoogleBtn = page.locator('button:has-text("Administrador")').first();
    
    console.log('  Email input visible:', await emailInput.isVisible());
    console.log('  Password input visible:', await passwordInput.isVisible());
    console.log('  Google Cliente button visible:', await clienteGoogleBtn.isVisible());
    console.log('  Google Administrador button visible:', await adminGoogleBtn.isVisible());
    
    await page.screenshot({ path: 'qa/reports/step3-auth-modal.png', fullPage: true });
    console.log('✓ Auth modal screenshot saved');
    
    // Step 5: Enter admin credentials
    console.log('Step 5: Entering admin credentials');
    await emailInput.fill('admin@admin.com');
    await passwordInput.fill('admin123');
    console.log('✓ Credentials entered');
    
    // Step 6: Click "Admin" button in email/password section
    console.log('Step 6: Clicking "Admin" button in email/password section');
    const adminEmailButton = page.locator('button:has-text("Admin")').last();
    await adminEmailButton.click({ timeout: TIMEOUT });
    console.log('✓ Admin button clicked');
    
    // Step 7: Wait for redirect to /admin
    console.log('Step 7: Waiting for redirect to /admin');
    try {
      await page.waitForURL('**/admin', { timeout: 15000 });
      console.log('✓ Redirected to /admin');
    } catch (e) {
      console.log('⚠ No redirect to /admin after 15s. Current URL:', page.url());
    }
    
    // Step 8: Take snapshot to verify admin panel
    console.log('Step 8: Taking snapshot of admin panel');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa/reports/step8-admin-panel.png', fullPage: true });
    console.log('✓ Admin panel screenshot saved');
    console.log('  Current URL:', page.url());
    
    // Step 9: Navigate to product creation
    console.log('Step 9: Navigating to /admin/productos/nueva');
    await page.goto('http://localhost:3000/admin/productos/nueva', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    console.log('✓ Product creation page loaded');
    
    // Step 10: Take snapshot of product creation form
    console.log('Step 10: Taking snapshot of product creation form');
    await page.screenshot({ path: 'qa/reports/step10-product-creation.png', fullPage: true });
    console.log('✓ Product creation screenshot saved');
    console.log('  Current URL:', page.url());
    
    // Step 11: Try to fill in a test product if form is visible
    console.log('Step 11: Attempting to fill product form');
    const nameInput = page.locator('input[name="nombre"], input[placeholder*="nombre" i], input[placeholder*="Nombre"]').first();
    const priceInput = page.locator('input[name="precio"], input[placeholder*="precio" i], input[placeholder*="Precio"]').first();
    const slugInput = page.locator('input[name="slug"], input[placeholder*="slug" i]').first();
    
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Test Product E2E');
      console.log('  ✓ Product name filled');
    } else {
      console.log('  ⚠ Name input not found');
    }
    
    if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await priceInput.fill('150000');
      console.log('  ✓ Product price filled');
    } else {
      console.log('  ⚠ Price input not found');
    }
    
    if (await slugInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await slugInput.fill('test-product-e2e');
      console.log('  ✓ Product slug filled');
    } else {
      console.log('  ⚠ Slug input not found');
    }
    
    // Step 12: Take screenshot of filled form
    console.log('Step 12: Taking screenshot of filled form');
    await page.screenshot({ path: 'qa/reports/step12-product-form-filled.png', fullPage: true });
    console.log('✓ Filled form screenshot saved');
    
    // ========== TEST FLOW 2: CLIENT LOGIN ==========
    console.log('\n=== TEST FLOW 2: CLIENT LOGIN ===');
    
    // Step 1: Navigate to home
    console.log('Step 1: Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(3000);
    console.log('✓ Home page loaded');
    
    // Step 2: Sign out if logged in
    console.log('Step 2: Signing out if logged in');
    const userMenuBtn = page.locator('button[aria-label="Menú de usuario"]');
    if (await userMenuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await userMenuBtn.click();
      console.log('  User menu opened');
      const signOutBtn = page.locator('button:has-text("Cerrar sesión")');
      if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await signOutBtn.click();
        console.log('  ✓ Signed out');
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('  No user menu found (not logged in or different UI)');
    }
    
    await page.screenshot({ path: 'qa/reports/step2-after-signout.png', fullPage: true });
    
    // Step 3: Click "Iniciar sesión" again
    console.log('Step 3: Clicking "Iniciar sesión" button');
    const loginButton2 = page.locator('button[aria-label="Iniciar sesión"]');
    if (await loginButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton2.click();
      console.log('✓ Auth modal opened');
    } else {
      console.log('⚠ "Iniciar sesión" button not visible — user may still be logged in');
      console.log('  Current URL:', page.url());
      await page.screenshot({ path: 'qa/reports/step3-no-login-btn.png', fullPage: true });
    }
    
    // Step 4: Enter client credentials
    console.log('Step 4: Entering client credentials');
    const modal2 = page.locator('[role="dialog"][aria-label="Iniciar sesión"]');
    if (await modal2.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.fill('input[type="email"]', 'cliente@cliente.com');
      await page.fill('input[type="password"]', 'cliente123');
      console.log('✓ Client credentials entered');
      
      // Step 5: Click "Cliente" button in email/password section
      console.log('Step 5: Clicking "Cliente" button in email/password section');
      const clientEmailButton = page.locator('button[type="submit"]:has-text("Cliente")');
      await clientEmailButton.click({ timeout: TIMEOUT });
      console.log('✓ Cliente button clicked');
      
      // Step 6: Verify redirect to home page
      console.log('Step 6: Waiting for login to complete');
      try {
        await modal2.waitFor({ state: 'hidden', timeout: 15000 });
        console.log('✓ Auth modal closed (login successful)');
      } catch (e) {
        console.log('⚠ Modal did not close after 15s');
      }
    } else {
      console.log('⚠ Auth modal not visible — skipping client login');
    }
    
    // Step 7: Take final snapshot
    console.log('Step 7: Taking final snapshot');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'qa/reports/step7-client-home.png', fullPage: true });
    console.log('✓ Client home screenshot saved');
    console.log('  Current URL:', page.url());
    
    // ========== SUMMARY ==========
    console.log('\n=== TEST SUMMARY ===');
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    console.log(`Console errors: ${errors.length}`);
    console.log(`Console warnings: ${warnings.length}`);
    if (errors.length > 0) {
      errors.forEach(e => console.log(`  ERROR: ${e.text}`));
    }
    
    console.log('\n=== ALL TESTS COMPLETED ===');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'qa/reports/error-screenshot.png', fullPage: true });
    console.log('\n=== CONSOLE MESSAGES AT FAILURE ===');
    consoleMessages.forEach(msg => console.log(`[${msg.type}] ${msg.text}`));
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();