// helpers/selectStudent.ts
import { Page } from '@playwright/test';

/**
 * Finds the "MOCAP 2025-26 Application" student row and opens it in eSchool.
 * @param page The main Playwright page instance
 * @param foundStudent If the MOCAP student is found
 * @param studentCount Number of students that have been successfully updated
 */
export async function selectStudent(page: Page, foundStudent: boolean, studentCount: number): Promise<[boolean, number]> {
  // Find all rows in the table body
  const tableRows = page.locator('#staffTable tbody tr'); //Locator for all rows in the staff table
  const rowCount = await tableRows.count(); //The total number of rows in the table
  console.log(`Found ${rowCount} rows to search`);

  for (let i = 0; i < rowCount; i++) {
    const row = tableRows.nth(i);
    const divText = row.locator('div.fst-italic small');
    const divCount = await divText.count();

    for (let k = 0; k < divCount; k++) {
      const formText = await divText.nth(k).textContent();

      if (formText?.includes(': MOCAP 2025-26 Application')) {
        console.log('Found MOCAP 2025-26 Application student!');

        const studentNameDiv = row.locator('div.mb-1 b');
        const studentName = await studentNameDiv.textContent();

        const eSchoolButton = row.locator('a.btn-view[href*="EO_Registrar"]');

        if (await eSchoolButton.count() > 0) {
          //console.log('Clicking eSchool button...');
          await eSchoolButton.click();
        } else {
          console.log('eSchool button not found in this row');
          continue;
        }

        // Handle eSchool popup login
        const page1 = await page.waitForEvent('popup');
        if (!page1.url().includes('eschoolplus.sps.org/EO_Registrar/User/Login.aspx')) {

          console.log(`✅ Successfully found and opened the MOCAP student page: ${studentName?.trim()}`);
          await page1.locator('#ctl00_ContentPlaceHolder1_BuildingInfoUC_drpPreferredBuilding').selectOption('8000');
          //await page1.locator('#ctl00_ContentPlaceHolder1_BuildingInfoUC_btnSaveBuildingInformation').click();
          foundStudent = true;
          studentCount++; //Add 1 student
          console.log('Saved information!');
          console.log(studentCount)
          await page.waitForTimeout(500);
          await page1.close();
        } else {
          console.log("Login pop up detected, logging in now...")
          await page1.getByRole('textbox', { name: 'User Name' }).fill(process.env.USERNAME!);
          await page1.getByRole('textbox', { name: 'Password' }).fill(process.env.PASSWORD!);
          await page1.getByRole('button', { name: 'Sign In' }).click();
          await page1.locator('#ctl00_ContentPlaceHolder1_ddlDatabase').selectOption('10');
          await page1.getByRole('button', { name: 'Go' }).click();

          await page1.goto('https://eschoolplus.sps.org/EO_Registrar/Pages/RegistrarDefault.aspx');
          await page.waitForTimeout(500);
          await page1.close();
          console.log("Login pop up page closed.")

          await eSchoolButton.click();
          const page2 = await page.waitForEvent('popup');

          console.log(`✅ Successfully found and opened the MOCAP student page: ${studentName?.trim()}`);
          await page2.locator('#ctl00_ContentPlaceHolder1_BuildingInfoUC_drpPreferredBuilding').selectOption('8000');
          //await page2.locator('#ctl00_ContentPlaceHolder1_BuildingInfoUC_btnSaveBuildingInformation').click();
          foundStudent = true;
          studentCount++; //Add 1 student
          console.log('Saved information!');
          console.log(studentCount)
          await page.waitForTimeout(500);
          await page2.close();
        }

        break; //Restart loop on page to look for MOCAP students
      }
    }
  }
    if (foundStudent) {
      console.log('Found MOCAP students on this page.');
    }  else {
      console.log('Did not find MOCAP students on this page.');
    }

    return [foundStudent, studentCount]; // Returns false if a student was never found on this page, true if there was. Second value returns number of students found so far.
}
