import puppeteer from 'puppeteer';

(async () => {
  console.log('--- FORME P0-4 LIVE E2E VERIFICATION ---');
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 375, height: 812 });

    const getQueueSize = async () => {
      return page.evaluate(() => {
        const qStr = localStorage.getItem('forme-sync-queue');
        if (!qStr) return 0;
        try {
          return JSON.parse(qStr).state?.queue?.length || 0;
        } catch { return 0; }
      });
    };

    console.log('[1/7] Loading application...');
    await page.goto('http://localhost:5174/eat', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Handle Demo Profile if redirected to landing
    try {
      const demoBtn = await page.$('::-p-text(Explore with Demo Profile)');
      if (demoBtn) {
        await demoBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
    } catch (e) { }

    console.log('[1.5/7] Clicking Fuel tab...');
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const fuel = spans.find(s => s.textContent === 'Fuel');
      if (fuel) {
        const btn = fuel.closest('button') || fuel.closest('a') || fuel.parentElement;
        if (btn) btn.click();
      }
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('[2/7] Navigating to Add Food UI...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Click "Type" button on dashboard
    await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const typeSpan = spans.find(s => s.textContent === 'Type');
      if (typeSpan) {
        const btn = typeSpan.closest('button') || typeSpan.parentElement;
        if (btn) btn.click();
      }
    });
    
    await new Promise(r => setTimeout(r, 2000)); // wait for sheet animation

    // Click "Type it out" inside the sheet
    await page.evaluate(() => {
      const ps = Array.from(document.querySelectorAll('p'));
      const typeItOut = ps.find(p => p.textContent === 'Type it out');
      if (typeItOut) {
        const btn = typeItOut.closest('button') || typeItOut.parentElement;
        if (btn) btn.click();
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    console.log('[3/7] Simulating NLP typing: "1 apple"');
    await page.waitForSelector('textarea', { timeout: 10000 });
    await page.type('textarea', '1 apple');
    await new Promise(r => setTimeout(r, 2000));

    // Click Parse Food
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const parseBtn = btns.find(b => b.textContent.includes('Parse Food'));
      if (parseBtn) parseBtn.click();
    });

    // Wait for "Log 1 item" button to appear
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Log 1 item'));
    }, { timeout: 10000 });
    
    // OFFLINE MODE
    console.log('[4/7] Disconnecting network (OFFLINE MODE)...');
    await page.setOfflineMode(true);
    await new Promise(r => setTimeout(r, 2000));

    // Initial queue size
    const initialSize = await getQueueSize();
    console.log(`Initial pending sync queue size: ${initialSize}`);

    // Commit the mutation offline
    console.log('[5/7] Committing mutation offline...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const logBtn = btns.find(b => b.textContent.includes('Log 1 item'));
      if (logBtn) logBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    const offlineSize = await getQueueSize();
    console.log(`Pending sync queue size after offline commit: ${offlineSize}`);
    if (offlineSize <= initialSize) {
      throw new Error('Queue did not increase after offline mutation. Persistence failed.');
    }

    // RESTART RESILIENCE
    console.log('[6/7] Simulating restart (Reloading page while offline)...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    const restartedSize = await getQueueSize();
    console.log(`Pending sync queue size after reload: ${restartedSize}`);
    if (restartedSize !== offlineSize) {
      throw new Error('Queue did not survive reload. Restart resilience failed.');
    }

    // RECONNECT
    console.log('[7/7] Restoring network (ONLINE MODE)...');
    await page.setOfflineMode(false);
    
    // Wait for sync worker to process
    let syncedSize = restartedSize;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      syncedSize = await getQueueSize();
      if (syncedSize === 0) break;
    }
    
    console.log(`Pending sync queue size after reconnect: ${syncedSize}`);
    if (syncedSize > 0) {
      throw new Error('Queue did not clear after reconnect. Sync failed.');
    }

    console.log('--- ALL E2E PHASES SUCCESSFUL ---');
  } catch (e) {
    console.error('--- E2E VERIFICATION FAILED ---');
    if (page) await page.screenshot({ path: 'C:\\Users\\cmann\\.gemini\\antigravity-ide\\brain\\6c7b47b0-49e9-413a-b8a1-8a6e4dd3966e\\debug.png' });
    console.error(e);
    if (browser) await browser.close();
    process.exit(1);
  }

  if (browser) await browser.close();
  process.exit(0);
})();
