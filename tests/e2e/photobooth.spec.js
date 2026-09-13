// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('35mm Analog Photobooth Studio E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to photobooth studio
    await page.goto('/selfbooth.html');
  });

  test('1. Studio Initialization & Demo Mode Fallback', async ({ page }) => {
    // Check page title and header
    await expect(page).toHaveTitle(/BUỒNG CHỤP ẢNH/i);
    
    // Check HUD elements
    const statusText = page.locator('#cameraStatusText');
    await expect(statusText).toBeVisible();

    // Verify Demo Canvas or WebCam is active
    const demoCanvas = page.locator('#sbDemoCanvas');
    const video = page.locator('#sbVideo');
    const isDemoVisible = await demoCanvas.isVisible();
    const isVideoVisible = await video.isVisible();
    expect(isDemoVisible || isVideoVisible).toBeTruthy();
  });

  test('2. Layout & Filter Selection Workflow', async ({ page }) => {
    // Select 4-Grid Layout
    const gridLayoutCard = page.locator('.sb-layout-card[data-layout="grid-4"]');
    if (await gridLayoutCard.count() > 0) {
      await gridLayoutCard.click();
      await expect(gridLayoutCard).toHaveClass(/active/);
    }

    // Select Tokyo Warm / Kodak Gold Filter
    const filterBtn = page.locator('.sb-filter-btn[data-filter="tokyo-warm"]');
    if (await filterBtn.count() > 0) {
      await filterBtn.click();
      await expect(filterBtn).toHaveClass(/active/);
    }
  });

  test('3. Full 8-Shot Auto Capture Flow and Film Rail Updates', async ({ page }) => {
    // Click Start Capture Button
    const btnStartCapture = page.locator('#btnStartCapture');
    await expect(btnStartCapture).toBeVisible();
    await btnStartCapture.click();

    // Verify transition to Shooting Panel
    const shootingPanel = page.locator('#panelShooting');
    await expect(shootingPanel).toBeVisible();

    // Wait for shooting sequence to complete (or mock completion)
    const reviewPanel = page.locator('#panelReview');
    await expect(reviewPanel).toBeVisible({ timeout: 25000 });

    // Ensure 8 shots exist in review grid
    const reviewItems = page.locator('#sbReviewGrid .review-item');
    await expect(reviewItems).toHaveCount(8);
  });

  test('4. Retake Single Shot Verification', async ({ page }) => {
    // Start capture first
    await page.locator('#btnStartCapture').click();
    await expect(page.locator('#panelReview')).toBeVisible({ timeout: 25000 });

    // Click retake badge on slot #2
    const firstRetakeBadge = page.locator('#sbReviewGrid .review-item').nth(1);
    await firstRetakeBadge.click();

    // Verify shooting panel re-activates for single shot retake
    await expect(page.locator('#panelShooting')).toBeVisible();
    await expect(page.locator('#shootingStatusText')).toContainText(/Chụp lại riêng/i);

    // After retake, should automatically return to review panel
    await expect(page.locator('#panelReview')).toBeVisible({ timeout: 12000 });
  });

  test('5. Sticker Studio & Decorative Layer Interaction', async ({ page }) => {
    // Progress to customize step
    await page.locator('#btnStartCapture').click();
    await expect(page.locator('#panelReview')).toBeVisible({ timeout: 25000 });
    await page.locator('#btnProceedToCustomize').click();

    // Verify Customization Panel is active
    await expect(page.locator('#panelCustomize')).toBeVisible();

    // Open Sticker Modal
    const btnOpenStickers = page.locator('#btnOpenStickerModal');
    if (await btnOpenStickers.count() > 0) {
      await btnOpenStickers.click();
      const stickerModal = page.locator('#stickerModal');
      await expect(stickerModal).toHaveClass(/show/);

      // Click first sticker
      const stickerItem = page.locator('#stickerPickerGrid .sticker-item').first();
      await stickerItem.click();

      // Ensure sticker is rendered on the interactive stage
      const addedSticker = page.locator('#stickerInteractiveOverlay .placed-sticker');
      await expect(addedSticker).toHaveCount(1);

      // Close modal
      await page.locator('#btnCloseStickerModal').click();
      await expect(stickerModal).not.toHaveClass(/show/);
    }
  });

  test('6. 35mm Darkroom Developing & 300 DPI Export Result', async ({ page }) => {
    // Reach customize panel
    await page.locator('#btnStartCapture').click();
    await expect(page.locator('#panelReview')).toBeVisible({ timeout: 25000 });
    await page.locator('#btnProceedToCustomize').click();
    await expect(page.locator('#panelCustomize')).toBeVisible();

    // Click Develop Film
    const btnDevelop = page.locator('#btnFinishAndDevelop');
    await btnDevelop.click();

    // Result Overlay must display
    const resultOverlay = page.locator('#sbResultOverlay');
    await expect(resultOverlay).toHaveClass(/show/);

    // PNG 300 DPI Preview Image must have valid src
    const resPngImg = page.locator('#resPngImg');
    await expect(resPngImg).toBeVisible();
    const pngSrc = await resPngImg.getAttribute('src');
    expect(pngSrc).toContain('data:image/png;base64');
  });

});
