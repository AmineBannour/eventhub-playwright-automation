// Renders a small JPEG with headless Chromium (no image library needed).
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined });
const page = await browser.newPage({ viewport: { width: 200, height: 150 } });
await page.setContent('<body style="margin:0;background:linear-gradient(135deg,#c62f3a,#1d2433)"></body>');
await page.screenshot({ path: 'test-data/files/profile-photo.jpg', type: 'jpeg', quality: 80 });
await browser.close();
console.log('jpeg written');
