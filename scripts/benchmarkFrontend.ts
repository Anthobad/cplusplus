/** Local frontend + real Vercel execution; explicitly NOT production verification. */
import { config } from 'dotenv';
import express from 'express';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
config({ path: '.env.local', quiet: true });
process.env.VERCEL = '1'; process.env.CODE_RUNNER_MODE = 'vercel-sandbox';
const { default: app } = await import('../server.js');
app.use(express.static('dist')); app.get('*', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const address = server.address(); if (!address || typeof address === 'string') throw new Error('Local API not available');
// Browser tooling is intentionally temporary, outside the app's dependency graph.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let browser;
const results: any[] = [];
try {
  browser = await chromium.launch({ headless: true });
  for (const label of ['first-frontend-submission', 'warm-frontend-submission']) {
    const context = await browser.newContext(); const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Resume Curriculum' }).click();
    await page.getByRole('button', { name: 'C++ Coding Challenge' }).click();
    await page.getByRole('button', { name: 'Assessment', exact: true }).click();
    await page.locator('textarea').fill('#include <iostream>\nconsteval int cpp20(){return 42;}\nint main(){static_assert(cpp20()==42);std::cout<<"Hello, modern C++!";}');
    const start = performance.now();
    const pending = page.waitForResponse(r => r.url().endsWith('/api/evaluate-code') && r.request().method() === 'POST', { timeout: 240000 });
    await page.getByRole('button', { name: 'Submit Assessment', exact: true }).click();
    const response = await pending; const body = await response.json();
    await page.getByText('Verified Assessment Passed!', { exact: true }).waitFor();
    const result = { label, clickToDisplayedResultMs: performance.now() - start, status: response.status(), verified: body.verified, testsPassed: body.testsPassed };
    results.push(result); console.log(JSON.stringify(result));
    if (!body.verified || body.testsPassed !== 5) throw new Error('Local frontend verification failed');
    await context.close();
  }
} finally { if (browser) await browser.close(); server.close(); }
await writeFile('sandbox-quickstart/latency-frontend-local.json', JSON.stringify({ location: 'local frontend with real Vercel Sandbox execution; NOT production', results }, null, 2) + '\n');
