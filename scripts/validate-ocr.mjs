import { createWorker, OEM } from 'tesseract.js';
import { detectWithRegex } from '@doccloak/core';
import { buildTextFromBlocks, selectRedactionBoxes } from '@doccloak/core/dom';
import { resolve } from 'node:path';

const imagePath = process.argv[2];
if (!imagePath) throw new Error('Usage: node scripts/validate-ocr.mjs <synthetic-image>');

const worker = await createWorker('eng', OEM.LSTM_ONLY, {
  langPath: resolve('public/tesseract/lang'),
  cacheMethod: 'none',
});

try {
  const { data } = await worker.recognize(resolve(imagePath), {}, { text: true, blocks: true });
  const extraction = buildTextFromBlocks(data.blocks ?? []);
  const entities = detectWithRegex(extraction.text, 'all');
  const sensitive = entities.filter(({ type }) => type === 'EMAIL' || type === 'PHONE');
  const boxes = selectRedactionBoxes(extraction.words, sensitive);
  if (!sensitive.some(({ type }) => type === 'EMAIL')) throw new Error(`OCR email detection failed: ${extraction.text}`);
  if (!sensitive.some(({ type }) => type === 'PHONE')) throw new Error(`OCR phone detection failed: ${extraction.text}`);
  if (boxes.length < 2) throw new Error('OCR redaction boxes were not produced.');
  console.log(JSON.stringify({ text: extraction.text, entityTypes: sensitive.map(({ type }) => type), redactionBoxes: boxes.length }, null, 2));
} finally {
  await worker.terminate();
}
