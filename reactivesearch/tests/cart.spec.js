import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Functionality', () => {

  test('cart updates via React state rather than direct DOM mutation', async ({ page }) => {
    await page.goto('http://localhost:3000'); 

    const cartButton = page.locator('#cart');
    const firstAddToCartButton = page.locator('button', { hasText: 'Add to' }).first();

    // Inject spy to listen for the exact event name used in the patch
    await page.evaluate(() => {
      window.reactStateUpdated = false;
      window.addEventListener('cart_updated', () => {
        window.reactStateUpdated = true;
      });
    });

    await expect(cartButton).toHaveText(/No items in cart/);

    await firstAddToCartButton.click();
    await expect(cartButton).toHaveText(/1/);

    // Verify the event was dispatched to React
    const eventFired = await page.evaluate(() => window.reactStateUpdated);
    expect(eventFired).toBe(true);
  });

  test('displays cart items in an alert when clicked (Stretch Goal)', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const cartButton = page.locator('#cart');
    const firstAddToCartButton = page.locator('button', { hasText: 'Add to' }).first();

    // Set up a listener to capture and auto-accept browser alert messages
    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await cartButton.click();
    expect(dialogMessage).toBe('Your cart is empty!');

    await firstAddToCartButton.click();
    
    await expect(cartButton).toHaveText(/1/);

    await cartButton.click();
    expect(dialogMessage).toContain('🛒 Items in your cart:');
    
    expect(dialogMessage).toContain('1.'); 
  });

});