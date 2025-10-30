import * as dotenv from 'dotenv';
dotenv.config({ path: './creds.env' });  // default is `.env` if no path is given

if (!process.env.USERNAME || !process.env.PASSWORD) {
  throw new Error("Missing USERNAME or PASSWORD in creds.env");
}

console.log('dotenv parsed:', {
  USERNAME: process.env.USERNAME,
  PASSWORD: process.env.PASSWORD
});

import { test, expect } from '@playwright/test';
import { selectStudent } from '../helpers/selectStudent';
import { getPage } from '../helpers/getPage';

test.use({
  httpCredentials: {
    username: process.env.USERNAME!,
    password: process.env.PASSWORD!,
  },
});

test.skip(!!process.env.CI, 'Skip on CI environment, github Actions');

test('EnrollmentApplications loads', async ({ page }) => {
  await page.goto('https://sistools.sps.org/EnrollmentApplications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000); // Small delay for page to load
  console.log('Geocoding page loaded!');


  const info = page.locator('#staffTable_info');
  await expect(info).toBeVisible();

  const maxIterations = 200;
  const changeTimeout = 5000;

  let activePage = 0; // Current page that we're on
  let studentCount = 0; // Number of students that we've processed

  for (let i = 0; i < maxIterations; i++) {
    // Get all page number buttons (excluding Previous/Next)
    const pageButtons = page.locator('#staffTable_paginate .paginate_button.page-item:not(.previous):not(.next) a.page-link');
    const buttonCount = await pageButtons.count();
    
    if (buttonCount === 0) {
      console.log('No page buttons found — stopping.');
      break;
    }

    // Find the highest page number
    let maxPageNum = -1;
    let maxPageLocator = null;
    
    for (let j = 0; j < buttonCount; j++) {
      const buttonText = await pageButtons.nth(j).textContent();
      const pageNum = parseInt(buttonText?.trim() ?? '0', 10);
      
      if (pageNum > maxPageNum) {
        maxPageNum = pageNum;
        maxPageLocator = pageButtons.nth(j);
      }
    }

    if (!maxPageLocator) {
      console.log('Could not find a valid page button — stopping.');
      break;
    }

    // Check if we're already on the highest page
    activePage = await getPage(page, activePage);
    console.log('Page: ' + activePage)
    
    if (activePage === maxPageNum) {
      console.log(`Already on the highest page (${maxPageNum}) — stopping pagination loop.`);
      await page.waitForTimeout(500);
      break;
    }

    const prevText = (await info.textContent())?.trim() ?? '';
    console.log(`Previous text: ${prevText}`);
    console.log(`Clicking page ${maxPageNum}... (iteration ${i + 1})`);
    
    await maxPageLocator.click();

    // WAIT and POLL for the info text to change to make sure we're on a different page
    let changed = false;
    for (let t = 0; t < changeTimeout / 200; t++) {
      const currentText = (await info.textContent())?.trim() ?? '';
      console.log(`Current text: ${currentText}`);
      if (currentText !== prevText) {
        changed = true;
        console.log('Text is different from prev text');
        break;
      }
      await page.waitForTimeout(200);
    }

    if (!changed) {
      console.log('Info text did not change after clicking. Stopping pagination.');
      break;
    }
  }

  // After the pagination loop finishes, search for the MOCAP application
  console.log('Searching for MOCAP 2025-26 Application...');

  let foundStudent = false;
  let updatedStudents = 0;

  [foundStudent, studentCount] = await selectStudent(page, foundStudent, studentCount); //Returns foundStudent's boolean value and amount of successfully updated MOCAP students


  if (foundStudent) {
    updatedStudents++;
    console.log(updatedStudents + ' students have been updated so far.');
  }

  activePage = await getPage(page, activePage);
  console.log('Current Page: ' + activePage)
  while (!foundStudent && (activePage != 1)) {
    console.log('❌ No MOCAP 2025-26 Application student found on this page.');
    await page.waitForTimeout(200);

    await page.getByRole('link', { name: 'Previous' }).click();
    activePage = await getPage(page, activePage);
    console.log('Went back a page. Currently page: ' + activePage);

    [foundStudent, studentCount] = await selectStudent(page, foundStudent, studentCount); //Returns foundStudent's boolean value on the previous page
    if (foundStudent && (activePage != 1)) {
      console.log('Found MOCAP students, not last page, checking for others...');
      await page.getByRole('link', { name: 'Previous' }).click();
      console.log('Went back a page. Currently page: ' + activePage);
      [foundStudent, studentCount] = await selectStudent(page, foundStudent, studentCount); //Returns foundStudent's boolean value on the previous page

    } else if (foundStudent && (activePage == 1)) {
      console.log('Breaking, foundStudent is true and on last page');
      break;
    }
  
  }
  console.log('Last page reached, no more MOCAP students found.')
  console.log('Finished processing geocoding for MOCAP students. Updated students: ' + studentCount)
});