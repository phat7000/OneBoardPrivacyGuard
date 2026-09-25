import { describe, expect, it, vi } from 'vitest';
import { buildTextFromBlocks, renderRedactedImage, selectRedactionBoxes } from '@doccloak/core/dom';
import { detectWithRegex } from '@doccloak/core';

describe('local OCR redaction pipeline', () => {
  it('maps OCR text through detection to rendered black pixel regions', async () => {
    const extraction = buildTextFromBlocks([{ paragraphs: [{ lines: [{ words: [
      { text: 'Alice', bbox: { x0: 5, y0: 5, x1: 45, y1: 20 } },
      { text: 'Example', bbox: { x0: 50, y0: 5, x1: 105, y1: 20 } },
      { text: 'alice@example.com', bbox: { x0: 5, y0: 28, x1: 145, y1: 45 } },
      { text: '+1', bbox: { x0: 5, y0: 52, x1: 22, y1: 68 } },
      { text: '202-555-0100', bbox: { x0: 26, y0: 52, x1: 125, y1: 68 } },
    ] }] }] }]);
    expect(extraction.text).toContain('alice@example.com');
    const detected = detectWithRegex(extraction.text, 'all');
    const ranges = detected.filter((item) => item.type === 'EMAIL' || item.type === 'PHONE').map(({ start, end }) => ({ start, end }));
    const boxes = selectRedactionBoxes(extraction.words, ranges);
    expect(boxes.length).toBeGreaterThanOrEqual(2);

    const fills: unknown[][] = [];
    class TestCanvas {
      width = 160; height = 80;
      getContext() { return { drawImage() {}, set fillStyle(_: string) {}, fillRect(...args: unknown[]) { fills.push(args); } }; }
      convertToBlob() { return Promise.resolve(new Blob(['rendered-black-pixels'], { type: 'image/png' })); }
    }
    const createElement = document.createElement.bind(document);
    const canvasSpy = vi.spyOn(document, 'createElement').mockImplementation(((tag: string, options?: ElementCreationOptions) => tag === 'canvas' ? new TestCanvas() : createElement(tag, options)) as typeof document.createElement);
    try {
      const blob = await renderRedactedImage(new TestCanvas() as never, extraction.words, ranges);
      expect(blob.type).toBe('image/png');
      expect(fills).toHaveLength(boxes.length);
    } finally {
      canvasSpy.mockRestore();
    }
  });
});
