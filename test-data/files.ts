import path from 'node:path';

const dir = path.resolve(__dirname, 'files');

/** Upload fixtures stored on disk. */
export const files = {
  pdf: path.join(dir, 'id-document.pdf'),
  png: path.join(dir, 'profile-photo.png'), // 120 x 80 px
  jpeg: path.join(dir, 'profile-photo.jpg'), // 200 x 150 px
  gif: path.join(dir, 'animated.gif'),
  corruptedPng: path.join(dir, 'corrupted-photo.png'),
  text: path.join(dir, 'meeting-notes.txt'),
};

export const imageSizes = {
  png: { width: 120, height: 80 },
  jpeg: { width: 200, height: 150 },
};

/** In-memory payload for size-limit tests, so no large files live in the repo. */
export function oversizedFile(name: string, mimeType: string, bytes: number) {
  return { name, mimeType, buffer: Buffer.alloc(bytes, 0x41) };
}

export const MB = 1024 * 1024;
