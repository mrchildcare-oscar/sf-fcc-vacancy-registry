import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'docs');

const email = process.argv[2] || 'oscar@moderneducationfamilychildcare.com';
const password = process.argv[3] || 'Test123';

async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log('Starting dev server...');
  const server = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  });

  console.log('Waiting for server...');
  await waitForServer('http://localhost:5173');
  console.log('Server ready!');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Click Report button
    console.log('Clicking Report button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Report'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Fill login form
    console.log('Filling login form...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');

    if (emailInput && passwordInput) {
      await emailInput.type(email);
      await passwordInput.type(password);

      // Click sign in
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
        if (btn) btn.click();
      });

      console.log('Waiting for login...');
      await new Promise(r => setTimeout(r, 4000));

      // Debug: check page content
      const pageText = await page.evaluate(() => document.body.innerText.substring(0, 300));
      console.log('Page content:', pageText.replace(/\n/g, ' ').substring(0, 200));

      // Check if we're on org dashboard (shows "locations")
      const isOrgDashboard = await page.evaluate(() => {
        return document.body.innerText.includes('locations') || document.body.innerText.includes('Program Availability');
      });

      if (isOrgDashboard) {
        console.log('On org dashboard - capturing screenshot...');
        await page.screenshot({ path: path.join(docsDir, 'screenshot-7-organization-dashboard.png') });
        console.log('Saved: screenshot-7-organization-dashboard.png');
      } else {
        // Try clicking org button
        const hasOrgButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some(b => b.textContent && (b.textContent.includes('Organization') || b.textContent.includes('All Locations')));
        });

        if (hasOrgButton) {
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find(b => b.textContent && (b.textContent.includes('Organization') || b.textContent.includes('All Locations')));
            if (btn) btn.click();
          });
          await new Promise(r => setTimeout(r, 1500));
          await page.screenshot({ path: path.join(docsDir, 'screenshot-7-organization-dashboard.png') });
          console.log('Saved: screenshot-7-organization-dashboard.png');
        } else {
          console.log('Not on org dashboard and no org button found');
          await page.screenshot({ path: path.join(docsDir, 'debug-page.png') });
        }
      }
    } else {
      console.log('Login form not found');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
    server.kill();
  }
}

main();
