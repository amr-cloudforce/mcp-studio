# Test info

- Name: Server Management >> should delete a server
- Location: /Users/amr/src/mcp-studio/tests/server-management.spec.js:68:3

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('tr:has-text("Updated Test Server")').locator('button:has-text("Delete")')

    at /Users/amr/src/mcp-studio/tests/server-management.spec.js:71:58
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 | const { _electron: electron } = require('playwright');
   3 |
   4 | test.describe('Server Management', () => {
   5 |   let electronApp;
   6 |   let page;
   7 |
   8 |   test.beforeAll(async () => {
   9 |     // Launch Electron app
  10 |     electronApp = await electron.launch({ 
  11 |       args: ['main.js'],
  12 |       cwd: process.cwd()
  13 |     });
  14 |     
  15 |     // Get the first window
  16 |     page = await electronApp.firstWindow();
  17 |     
  18 |     // Wait for app to load
  19 |     await page.waitForLoadState('domcontentloaded');
  20 |   });
  21 |
  22 |   test.afterAll(async () => {
  23 |     await electronApp.close();
  24 |   });
  25 |
  26 |   test('should add a new server', async () => {
  27 |     // Click Add Server button
  28 |     await page.click('button:has-text("Add Server")');
  29 |     
  30 |     // Wait for modal to appear
  31 |     await page.waitForSelector('#add-server-modal', { state: 'visible' });
  32 |     
  33 |     // Fill server form
  34 |     await page.fill('#server-name', 'Test Server');
  35 |     await page.fill('#server-command', 'node test-server.js');
  36 |     
  37 |     // Save server
  38 |     await page.click('button:has-text("Save")');
  39 |     
  40 |     // Wait for modal to close
  41 |     await page.waitForSelector('#add-server-modal', { state: 'hidden' });
  42 |     
  43 |     // Verify server appears in list
  44 |     await expect(page.locator('text=Test Server')).toBeVisible();
  45 |   });
  46 |
  47 |   test('should edit an existing server', async () => {
  48 |     // Find and click edit button for Test Server
  49 |     const serverRow = page.locator('tr:has-text("Test Server")');
  50 |     await serverRow.locator('button:has-text("Edit")').click();
  51 |     
  52 |     // Wait for edit modal
  53 |     await page.waitForSelector('#add-server-modal', { state: 'visible' });
  54 |     
  55 |     // Update server name
  56 |     await page.fill('#server-name', 'Updated Test Server');
  57 |     
  58 |     // Save changes
  59 |     await page.click('button:has-text("Save")');
  60 |     
  61 |     // Wait for modal to close
  62 |     await page.waitForSelector('#add-server-modal', { state: 'hidden' });
  63 |     
  64 |     // Verify updated name appears
  65 |     await expect(page.locator('text=Updated Test Server')).toBeVisible();
  66 |   });
  67 |
  68 |   test('should delete a server', async () => {
  69 |     // Find and click delete button for Updated Test Server
  70 |     const serverRow = page.locator('tr:has-text("Updated Test Server")');
> 71 |     await serverRow.locator('button:has-text("Delete")').click();
     |                                                          ^ Error: locator.click: Target page, context or browser has been closed
  72 |     
  73 |     // Handle confirmation dialog
  74 |     page.on('dialog', async dialog => {
  75 |       expect(dialog.message()).toContain('Delete');
  76 |       await dialog.accept();
  77 |     });
  78 |     
  79 |     // Wait a moment for deletion to process
  80 |     await page.waitForTimeout(1000);
  81 |     
  82 |     // Verify server is removed from list
  83 |     await expect(page.locator('text=Updated Test Server')).not.toBeVisible();
  84 |   });
  85 |
  86 |   test('should show empty state when no servers', async () => {
  87 |     // Check if empty state is visible (assuming all servers are deleted)
  88 |     const serverList = page.locator('#server-list tr');
  89 |     const count = await serverList.count();
  90 |     
  91 |     if (count === 0) {
  92 |       // Should show some empty state message or placeholder
  93 |       await expect(page.locator('text=No servers')).toBeVisible();
  94 |     }
  95 |   });
  96 | });
  97 |
```