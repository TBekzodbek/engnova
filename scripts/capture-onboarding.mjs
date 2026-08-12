#!/usr/bin/env node
/**
 * capture-onboarding.mjs — walk through the new 10-screen onboarding via
 * headless Chrome, drop a screenshot at each step. Owner-only debug tool.
 */
import puppeteer from 'puppeteer-core';
import { promises as fs } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT    = 'D:/tmp/onb-shots';

await fs.mkdir(OUT, { recursive: true });

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
await p.goto('http://localhost:5174', { waitUntil: 'networkidle0' });

await p.evaluate(() => {
    Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('engnova.lang', 'uz');
});
await p.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));

async function shoot(name) {
    await new Promise((r) => setTimeout(r, 600));   // let entrance anim settle
    await p.screenshot({ path: `${OUT}/${name}.png`, type: 'png' });
    console.log('  ✓', name);
}
async function clickPrimary() {
    await p.click('.onb-btn-primary');
    await new Promise((r) => setTimeout(r, 500));
}
async function clickCardIdx(i /* 1-based */) {
    await p.click(`.onb-card:nth-child(${i})`);
    await new Promise((r) => setTimeout(r, 200));
}

await shoot('s1-language');           // Language
await clickPrimary();
await shoot('s2-welcome');            // Welcome
await clickPrimary();
await shoot('s3-goal-empty');         // Goal (empty)
await clickCardIdx(2);                // pick DTM
await shoot('s3-goal-picked');        // Goal (picked)
await clickPrimary();
await shoot('s4-deadline');           // Deadline
await clickCardIdx(2);                // 3 months
await clickPrimary();
await shoot('s5-level');              // Level
await clickCardIdx(5);                // "unsure" → mini-quiz
await clickPrimary();
await shoot('s6-quiz-q1');            // Quiz Q1
await clickCardIdx(2);                // correct
await clickPrimary();
await new Promise((r) => setTimeout(r, 400));
await clickCardIdx(2);                // Q2 correct
await clickPrimary();
await new Promise((r) => setTimeout(r, 400));
await clickCardIdx(3);                // Q3 correct
await clickPrimary();
await new Promise((r) => setTimeout(r, 1200));   // verdict anim
await shoot('s7-verdict');            // Verdict + level badge
await clickPrimary();
await shoot('s8-track');              // Track confirmation
await clickPrimary();
await shoot('s9-social');             // Social proof
await clickPrimary();
await shoot('s10-commitment');        // Commitment

await b.close();
console.log('\nDone. Shots at', OUT);
