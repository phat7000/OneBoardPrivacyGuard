import { buildTextFromBlocks, recognizeCanvas, type OcrCanvas, type OcrExtraction, type TesseractAssetPaths } from '@doccloak/core/dom';
import { createWorker, OEM } from 'tesseract.js';

/**
 * DocCloak.Core 0.12.1 maps its built-in UI languages to Tesseract codes but
 * does not yet include Vietnamese. Keep the upstream helper for English and
 * use the same local Tesseract pipeline with bundled vie+eng data for vi.
 */
export async function recognizeLocal(
  canvas: OcrCanvas,
  language: 'en' | 'vi',
  assets: TesseractAssetPaths,
  onProgress?: (progress: number) => void,
): Promise<OcrExtraction> {
  if (language === 'en') return recognizeCanvas(canvas, 'en', assets, onProgress);

  onProgress?.(0);
  const worker = await createWorker(['vie', 'eng'], OEM.LSTM_ONLY, {
    workerPath: assets.workerPath,
    corePath: assets.corePath,
    langPath: assets.langPath,
    logger(message) {
      if (message.status === 'recognizing text' && typeof message.progress === 'number') onProgress?.(message.progress);
    },
  });
  try {
    const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
    onProgress?.(1);
    return buildTextFromBlocks(data.blocks ?? []);
  } finally {
    await worker.terminate();
  }
}
