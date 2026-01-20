#!/usr/bin/env node
/**
 * Screenshot capture script for Provider Guide documentation
 * Usage: node scripts/capture-screenshots.mjs [--email EMAIL --password PASSWORD]
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'docs');

// Parse command line arguments
const args = process.argv.slice(2);
let email = null;
let password = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) {
    email = args[i + 1];
    i++;
  } else if (args[i] === '--password' && args[i + 1]) {
    password = args[i + 1];
    i++;
  }
}

const BASE_URL = 'http://localhost:5173';

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

async function captureScreenshots() {
  console.log('Starting dev server...');

  // Start the dev server
  const server = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  });

  // Wait for server to be ready
  console.log('Waiting for server...');
  const serverReady = await waitForServer(BASE_URL);
  if (!serverReady) {
    console.error('Server failed to start');
    server.kill();
    process.exit(1);
  }
  console.log('Server ready!');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. Public listings page
    console.log('Capturing: Public listings...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.bg-white', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000)); // Let animations settle
    await page.screenshot({
      path: path.join(docsDir, 'screenshot-1-public-listings.png'),
      fullPage: false
    });
    console.log('  Saved: screenshot-1-public-listings.png');

    // 2. Expand a listing to show details
    console.log('Capturing: Listing detail...');
    const listingCards = await page.$$('[class*="cursor-pointer"]');
    if (listingCards.length > 0) {
      await listingCards[0].click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({
        path: path.join(docsDir, 'screenshot-2-listing-detail.png'),
        fullPage: false
      });
      console.log('  Saved: screenshot-2-listing-detail.png');
    }

    // 3. Show filters (scroll to filter area)
    console.log('Capturing: Filters...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    // Take a screenshot focused on the filter section
    await page.screenshot({
      path: path.join(docsDir, 'screenshot-3-filters.png'),
      fullPage: false
    });
    console.log('  Saved: screenshot-3-filters.png');

    // 4. Sign in page
    console.log('Capturing: Sign in page...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Report') || b.textContent?.includes('報告'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({
      path: path.join(docsDir, 'screenshot-4-signin.png'),
      fullPage: false
    });
    console.log('  Saved: screenshot-4-signin.png');

    // If credentials provided, capture authenticated pages
    if (email && password) {
      console.log('\nLogging in with provided credentials...');

      // Fill in email
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        await emailInput.type(email);
      }

      // Fill in password
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type(password);
      }

      // Click sign in button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Sign In') || b.textContent?.includes('登入'));
        if (btn) btn.click();
      });

      await new Promise(r => setTimeout(r, 3000)); // Wait for auth

      // Check if we're logged in by looking for dashboard elements
      const loggedIn = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const hasSignOut = buttons.some(b => b.textContent?.includes('Sign Out') || b.textContent?.includes('登出'));
        const hasVacancy = document.body.textContent?.includes('Vacancy') || document.body.textContent?.includes('空缺');
        return hasSignOut || hasVacancy;
      });

      if (loggedIn) {
        console.log('Login successful!');

        // 5. Vacancy form
        console.log('Capturing: Vacancy form...');
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({
          path: path.join(docsDir, 'screenshot-5-vacancy-form.png'),
          fullPage: false
        });
        console.log('  Saved: screenshot-5-vacancy-form.png');

        // 6. Scroll to embed widget section
        console.log('Capturing: Embed widget...');
        await page.evaluate(() => {
          // Find embed section by looking for text content
          const allElements = document.querySelectorAll('h3, h4, div');
          for (const el of allElements) {
            if (el.textContent?.includes('Embed') || el.textContent?.includes('嵌入')) {
              el.scrollIntoView({ behavior: 'instant', block: 'center' });
              break;
            }
          }
        });
        await new Promise(r => setTimeout(r, 500));
        // Scroll down to find embed section
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({
          path: path.join(docsDir, 'screenshot-6-embed-widget.png'),
          fullPage: false
        });
        console.log('  Saved: screenshot-6-embed-widget.png');

        // 7. Organization dashboard (if user is org owner)
        console.log('Capturing: Organization dashboard...');
        const orgDashboardBtn = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent?.includes('Organization') || b.textContent?.includes('機構'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (orgDashboardBtn) {
          await new Promise(r => setTimeout(r, 1000));
          await page.screenshot({
            path: path.join(docsDir, 'screenshot-7-organization-dashboard.png'),
            fullPage: false
          });
          console.log('  Saved: screenshot-7-organization-dashboard.png');
        } else {
          console.log('  Skipped: User is not an organization owner');
        }

        // 8. Roster page
        console.log('Capturing: Roster...');
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent?.includes('Roster') || b.textContent?.includes('名冊'));
          if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({
          path: path.join(docsDir, 'screenshot-8-roster.png'),
          fullPage: false
        });
        console.log('  Saved: screenshot-8-roster.png');

        // 9. Projections/Timeline
        console.log('Capturing: Timeline...');
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent?.includes('Projection') || b.textContent?.includes('預測') || b.textContent?.includes('Timeline'));
          if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({
          path: path.join(docsDir, 'screenshot-9-timeline.png'),
          fullPage: false
        });
        console.log('  Saved: screenshot-9-timeline.png');

      } else {
        console.log('Login failed - could not capture authenticated pages');
      }
    } else {
      console.log('\nNo credentials provided. Skipping authenticated page screenshots.');
      console.log('To capture all screenshots, run:');
      console.log('  node scripts/capture-screenshots.mjs --email YOUR_EMAIL --password YOUR_PASSWORD');
    }

    console.log('\nDone!');

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
    server.kill();
  }
}

captureScreenshots();
