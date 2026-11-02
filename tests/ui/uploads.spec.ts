import { test, expect } from '../../fixtures/test-fixtures';
import { files, imageSizes, oversizedFile, MB } from '../../test-data/files';
import type { Locator } from '@playwright/test';

/** A rejected file must not stay selected in the input. */
async function expectNoFileSelected(input: Locator) {
  expect(await input.evaluate((el: HTMLInputElement) => el.files?.length ?? 0)).toBe(0);
}

test.describe('Registration form - uploads', () => {
  // UI-05 (Amira): the ID document must be a PDF of 1 MB or less.
  test('UI-05 ID document upload accepts PDFs up to 1 MB and rejects other files @file @validation', async ({ registrationPage: ui }) => {
    // A real PDF is accepted, and its name and size are shown.
    await test.step('a PDF is accepted and its name and size are shown', async () => {
      await ui.uploadDocument(files.pdf);
      await expect(ui.documentStatus).toHaveText(/^Uploaded: id-document\.pdf \(0\.\d KB\)$/);
      await expect(ui.fieldError('document')).toBeHidden();
    });

    // A .txt file is refused and removed from the input.
    await test.step('a text file is rejected', async () => {
      await ui.uploadDocument(files.text);
      await expect(ui.fieldError('document')).toHaveText('Only PDF documents are accepted');
      await expect(ui.documentStatus).toBeEmpty();
      await expectNoFileSelected(ui.documentInput);
    });

    // Boundary: exactly 1 MB is still allowed (the file is created in memory).
    await test.step('a PDF of exactly 1 MB is accepted (boundary)', async () => {
      await ui.uploadDocument(oversizedFile('exactly-1mb.pdf', 'application/pdf', 1 * MB));
      await expect(ui.documentStatus).toHaveText('Uploaded: exactly-1mb.pdf (1.00 MB)');
    });

    // Boundary: 1 MB + 1 byte is refused.
    await test.step('a PDF one byte over 1 MB is rejected (boundary)', async () => {
      await ui.uploadDocument(oversizedFile('too-big.pdf', 'application/pdf', 1 * MB + 1));
      await expect(ui.fieldError('document')).toHaveText('Document must be 1 MB or smaller');
      await expectNoFileSelected(ui.documentInput);
    });
  });

  // UI-06 (Amira): the photo must be a real PNG or JPEG image of 2 MB or less.
  test('UI-06 profile photo accepts real PNG/JPEG images and rejects invalid ones @file @validation', async ({ registrationPage: ui }) => {
    // A PNG is accepted: a preview is shown with its real size in pixels.
    await test.step('PNG is accepted with a preview and its real dimensions', async () => {
      await ui.uploadPhoto(files.png);
      await expect(ui.photoPreview).toBeVisible();
      await expect(ui.photoStatus).toHaveText(`profile-photo.png · ${imageSizes.png.width}×${imageSizes.png.height} px`);
      expect(await ui.photoPreview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(imageSizes.png.width);
    });

    // A JPEG is accepted too.
    await test.step('JPEG is accepted', async () => {
      await ui.uploadPhoto(files.jpeg);
      await expect(ui.photoStatus).toHaveText(`profile-photo.jpg · ${imageSizes.jpeg.width}×${imageSizes.jpeg.height} px`);
      await expect(ui.fieldError('photo')).toBeHidden();
    });

    // A GIF is refused because of its file type.
    await test.step('GIF is rejected by type', async () => {
      await ui.uploadPhoto(files.gif);
      await expect(ui.fieldError('photo')).toHaveText('Only PNG or JPEG images are accepted');
      await expect(ui.photoPreview).toBeHidden();
      await expectNoFileSelected(ui.photoInput);
    });

    // A text file renamed to .png is refused: the app really tries to open the image.
    await test.step('a text file renamed to .png is rejected after decoding', async () => {
      await ui.uploadPhoto(files.corruptedPng);
      await expect(ui.fieldError('photo')).toHaveText('The file is not a valid image');
      await expect(ui.photoPreview).toBeHidden();
    });

    // An image bigger than 2 MB is refused.
    await test.step('an image over 2 MB is rejected', async () => {
      await ui.uploadPhoto(oversizedFile('huge.png', 'image/png', 2 * MB + 1));
      await expect(ui.fieldError('photo')).toHaveText('Image must be 2 MB or smaller');
    });
  });
});
