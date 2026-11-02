// Captures screenshots of the app and the HTML report for the presentation (evidence/screenshots).
import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from '@playwright/test';
import 'dotenv/config';

const out = path.resolve('evidence/screenshots');
const base = 'http://localhost:3000';
const server = spawn(process.execPath, ['app/server.js'], { stdio: 'ignore' });
const wait = async () => { for (let i = 0; i < 50; i++) { try { if ((await fetch(base + '/api/health')).ok) return; } catch {} await new Promise((r) => setTimeout(r, 200)); } throw new Error('server did not start'); };
try {
  await wait();
  const env = (await import('dotenv')).config({ path: '.env.example' }).parsed;
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(base);
  await page.screenshot({ path: `${out}/01-sign-in.png` });
  await page.getByLabel('Username').fill(env.APP_USERNAME);
  await page.getByLabel('Password').fill(env.APP_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/register.html');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.screenshot({ path: `${out}/02-validation-errors.png`, fullPage: true });
  await page.reload();
  const d = new Date(); d.setDate(d.getDate() + 30); if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email', { exact: true }).fill('ada.demo@eventhub.test');
  await page.getByLabel('Age').fill('36');
  await page.getByLabel('Number of tickets').fill('2');
  await page.getByLabel('Ticket type').selectOption('vip');
  await page.getByLabel('Event date').fill(iso);
  await page.getByLabel('Notes').fill('Vegetarian meal\nWheelchair access needed');
  await page.getByLabel('ID document (PDF)').setInputFiles('test-data/files/id-document.pdf');
  await page.getByLabel('Profile photo (PNG or JPEG)').setInputFiles('test-data/files/profile-photo.png');
  await page.getByRole('img', { name: 'Profile photo preview' }).waitFor();
  await page.screenshot({ path: `${out}/03-form-filled.png`, fullPage: true });
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: `${out}/04-confirm-dialog.png` });
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('status').filter({ hasText: 'Registration confirmed' }).waitFor();
  await page.screenshot({ path: `${out}/05-registered-toast-and-list.png`, fullPage: true });
  await page.goto('file://' + path.resolve('reports/html/index.html'));
  await page.waitForTimeout(1500); // static report renders client-side; screenshot only, not a test
  await page.screenshot({ path: `${out}/06-html-report.png` });
  await browser.close();
  console.log('screenshots written to', out);
} finally {
  server.kill();
}
