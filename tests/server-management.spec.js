const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');

test.describe('Server Management', () => {
  let electronApp;
  let page;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({ 
      args: ['main.js'],
      cwd: process.cwd()
    });
    
    // Get the first window
    page = await electronApp.firstWindow();
    
    // Wait for app to load
    await page.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should add a new server', async () => {
    // Click Add Server button
    await page.click('button:has-text("Add Server")');
    
    // Wait for modal to appear
    await page.waitForSelector('#add-server-modal', { state: 'visible' });
    
    // Fill server form
    await page.fill('#server-name', 'Test Server');
    await page.fill('#server-command', 'node test-server.js');
    
    // Save server
    await page.click('button:has-text("Save")');
    
    // Wait for modal to close
    await page.waitForSelector('#add-server-modal', { state: 'hidden' });
    
    // Verify server appears in list
    await expect(page.locator('text=Test Server')).toBeVisible();
  });

  test('should edit an existing server', async () => {
    // Find and click edit button for Test Server
    const serverRow = page.locator('tr:has-text("Test Server")');
    await serverRow.locator('button:has-text("Edit")').click();
    
    // Wait for edit modal
    await page.waitForSelector('#add-server-modal', { state: 'visible' });
    
    // Update server name
    await page.fill('#server-name', 'Updated Test Server');
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Wait for modal to close
    await page.waitForSelector('#add-server-modal', { state: 'hidden' });
    
    // Verify updated name appears
    await expect(page.locator('text=Updated Test Server')).toBeVisible();
  });

  test('should delete a server', async () => {
    // Find and click delete button for Updated Test Server
    const serverRow = page.locator('tr:has-text("Updated Test Server")');
    await serverRow.locator('button:has-text("Delete")').click();
    
    // Handle confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Delete');
      await dialog.accept();
    });
    
    // Wait a moment for deletion to process
    await page.waitForTimeout(1000);
    
    // Verify server is removed from list
    await expect(page.locator('text=Updated Test Server')).not.toBeVisible();
  });

  test('should show empty state when no servers', async () => {
    // Check if empty state is visible (assuming all servers are deleted)
    const serverList = page.locator('#server-list tr');
    const count = await serverList.count();
    
    if (count === 0) {
      // Should show some empty state message or placeholder
      await expect(page.locator('text=No servers')).toBeVisible();
    }
  });
});
