# Playwright test automation

Playwright script written to speed up looking for a specific type of student in a database and editing their 'Building' to be MOCAP.

Before running the test locally, run these commands for the required packages in an integrated cmd

1. Run these
npm install -D @types/dotenv
npm install dotenv

2. Then ensure 'npm ls dotenv @types/dotenv' lists the 2 installed packages 

3. Uncomment out the 2 lines if you want it to actually save the students. //await page2.locator('#ctl00_ContentPlaceHolder1_BuildingInfoUC_btnSaveBuildingInformation').click();

4. Run the test in terminal with
 npx playwright test formsTest.spec.ts --project=firefox --headed
